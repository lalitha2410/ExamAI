require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { createServer } = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ExamEval";
const JWT_SECRET = process.env.JWT_SECRET || "exam_eval_secret_2024";
const FLASK_URL = process.env.FLASK_URL || "http://127.0.0.1:5001";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ["student", "professor"], required: true },
  createdAt: { type: Date, default: Date.now },
});

const examSchema = new mongoose.Schema({
  subject:       { type: String, required: true },
  semester:      { type: String, required: true },
  professorID:   { type: String, required: true },
  professorEmail:{ type: String, required: true },
  questions:     [String],
  fromDate:      { type: String, required: true },
  toDate:        { type: String, required: true },
  results:       { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt:     { type: Date, default: Date.now },
});

const submissionSchema = new mongoose.Schema({
  username:  { type: String, required: true },
  examid:    { type: String, required: true },
  script:    { type: mongoose.Schema.Types.Mixed, default: {} },
  answers:   { type: mongoose.Schema.Types.Mixed, default: {} },
  submittedAt: { type: Date, default: Date.now },
});

const profUploadSchema = new mongoose.Schema({
  username:  { type: String, required: true },
  examid:    { type: String, required: true },
  script:    { type: mongoose.Schema.Types.Mixed, default: {} },
  answers:   { type: mongoose.Schema.Types.Mixed, default: {} },
});

const User       = mongoose.model("User",        userSchema);
const Exam       = mongoose.model("Exam",        examSchema);
const Submission = mongoose.model("Submission",  submissionSchema);
const ProfUpload = mongoose.model("ProfUpload",  profUploadSchema);

mongoose
  .connect(MONGO_URI)
  .then(() => { console.log("✅ MongoDB connected"); })
  .catch((err) => console.error("MongoDB error:", err));

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ status: "error", message: "No token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ status: "error", message: "Invalid token" });
  }
}

app.get("/", (req, res) => res.json({ status: "ok", message: "ExamEval API running" }));

// ─── OCR PROXY ────────────────────────────────────────────────────────────────
app.post("/ocr", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.json({ error: "No image uploaded" });

    const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
    const CRLF = "\r\n";
    const header = Buffer.from(
      "--" + boundary + CRLF +
      `Content-Disposition: form-data; name="image"; filename="${req.file.originalname}"` + CRLF +
      `Content-Type: ${req.file.mimetype}` + CRLF + CRLF
    );
    const footer = Buffer.from(CRLF + "--" + boundary + "--" + CRLF);
    const body   = Buffer.concat([header, req.file.buffer, footer]);

    const response = await fetch("https://img-to-text-ten.vercel.app/text", {
      method: "POST",
      headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
      body,
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("OCR error:", err.message);
    res.json({ error: err.message });
  }
});

// ─── SIGNUP ───────────────────────────────────────────────────────────────────
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password || !role)
      return res.json({ status: "error", message: "All fields required" });
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing)
      return res.json({ status: "error", message: "User already exists. Please login." });
    const hash = await bcrypt.hash(password, 10);
    await User.create({ username, email, password: hash, role });
    res.json({ status: "success", message: "Signed up successfully. Please login." });
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
app.post("/login", async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const user = await User.findOne({ username, role });
    if (!user) return res.json({ status: "error", message: "User not found. Please sign up." });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ status: "error", message: "Incorrect password." });
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.json({ status: "success", message: "Logged in successfully.", token, username: user.username, email: user.email, role: user.role });
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
});

// ─── ADD EXAM ─────────────────────────────────────────────────────────────────
app.post("/addexam", authMiddleware, async (req, res) => {
  try {
    const exam = await Exam.create(req.body);
    res.json({ status: "success", message: "Exam posted successfully.", examId: exam._id });
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
});

// ─── GET ACTIVE EXAMS ─────────────────────────────────────────────────────────
app.get("/examsSchedule", async (req, res) => {
  try {
    const allExams = await Exam.find({});
    const now = new Date();
    const exams = allExams.filter(e => new Date(e.fromDate) <= now && new Date(e.toDate) >= now);
    if (exams.length === 0)
      return res.json({ status: "success", message: "No exams scheduled right now." });
    res.json(exams);
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
});

// ─── GET PREVIOUS EXAMS ───────────────────────────────────────────────────────
app.get("/previousExams", async (req, res) => {
  try {
    const allExams = await Exam.find({});
    const now = new Date();
    const exams = allExams.filter(e => new Date(e.toDate) < now);
    res.json(exams.length ? exams : { status: "success", message: "No previous exams." });
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
});

// ─── GET PROFESSOR EXAMS ──────────────────────────────────────────────────────
app.post("/getProfessorExams", authMiddleware, async (req, res) => {
  try {
    const exams = await Exam.find({ professorID: req.body.username });
    const enriched = await Promise.all(
      exams.map(async (exam) => {
        const submissions = await Submission.find({ examid: exam._id.toString() });
        return { ...exam.toObject(), submissions };
      })
    );
    res.json(enriched);
  } catch (err) {
    res.json([]);
  }
});

// ─── STUDENT UPLOAD ───────────────────────────────────────────────────────────
app.post("/upload", authMiddleware, upload.array("scripts"), async (req, res) => {
  try {
    await Submission.updateOne(
      { username: req.body.username, examid: req.body.Examid },
      { $set: { [`script.${req.body.questionno}`]: req.body.answertext, [`answers.${req.body.questionno}`]: req.files?.map((f) => f.originalname) || [] } },
      { upsert: true }
    );
    res.json({ status: "success", message: "Answer uploaded successfully." });
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
});

// ─── PROFESSOR UPLOAD ─────────────────────────────────────────────────────────
app.post("/profupload", authMiddleware, upload.array("scripts"), async (req, res) => {
  try {
    await ProfUpload.updateOne(
      { username: req.body.username, examid: req.body.Examid },
      { $set: { [`script.${req.body.questionno}`]: req.body.panswertext, [`answers.${req.body.questionno}`]: req.files?.map((f) => f.originalname) || [] } },
      { upsert: true }
    );
    res.json({ status: "success", message: "Correct answer uploaded." });
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
});

// ─── EVALUATE ─────────────────────────────────────────────────────────────────
app.post("/evaluate", authMiddleware, async (req, res) => {
  try {
    const exam       = await Exam.findById(req.body.examid);
    const profAnswer = await ProfUpload.findOne({ examid: req.body.examid });
    const stuAnswers = await Submission.find({ examid: req.body.examid });
    if (!profAnswer || Object.keys(profAnswer.script || {}).length < exam.questions.length)
      return res.json({ status: "error", message: "Please upload all correct answers before evaluating." });
    let result;
    try {
      const resp = await fetch(`${FLASK_URL}/evaluateScore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profanswers: profAnswer, useranswers: stuAnswers }),
      });
      result = await resp.json();
    } catch {
      result = localEvaluate(profAnswer, stuAnswers);
    }
    res.json({ status: "success", message: "Evaluation complete.", ...result });
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
});

function localEvaluate(profAnswer, stuAnswers) {
  const result = {};
  for (const stu of stuAnswers) {
    result[stu.username] = {};
    for (const key of Object.keys(stu.script || {})) {
      const stuText  = tokenize(stu.script[key] || "");
      const profText = tokenize((profAnswer.script || {})[key] || "");
      result[stu.username][key] = cosineSim(stuText, profText) * 100;
    }
  }
  return result;
}
function tokenize(text) {
  const stop = new Set(["the","a","an","is","are","was","were","and","or","but","in","on","at","to","for","of","with","by"]);
  return text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(w => w && !stop.has(w));
}
function cosineSim(a, b) {
  const setA = {}, setB = {};
  a.forEach(w => (setA[w] = (setA[w] || 0) + 1));
  b.forEach(w => (setB[w] = (setB[w] || 0) + 1));
  const all = new Set([...Object.keys(setA), ...Object.keys(setB)]);
  let dot = 0, magA = 0, magB = 0;
  for (const w of all) {
    const va = setA[w] || 0, vb = setB[w] || 0;
    dot += va * vb; magA += va * va; magB += vb * vb;
  }
  return (magA && magB) ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

// ─── POST RESULTS ─────────────────────────────────────────────────────────────
app.post("/postResult", authMiddleware, async (req, res) => {
  try {
    await Exam.updateOne({ _id: req.body.examid }, { $set: { results: req.body.results } });
    res.json({ status: "success", message: "Results posted." });
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
});

// ─── GET USER RESULTS ─────────────────────────────────────────────────────────
app.post("/getUserResults", authMiddleware, async (req, res) => {
  try {
    const exam = await Exam.findById(req.body.examid);
    const sub  = await Submission.findOne({ examid: req.body.examid, username: req.body.username });
    if (!exam?.results?.[req.body.username])
      return res.json({ status: "error", message: "Results not yet published." });
    res.json({ status: "success", message: "Results fetched.", results: exam.results, scripts: sub?.answers || {} });
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
});

// ─── START ────────────────────────────────────────────────────────────────────
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));