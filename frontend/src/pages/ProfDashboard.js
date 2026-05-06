import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import ScoreBar from "../components/ScoreBar";
import { ClipLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";

const BACKEND = "http://localhost:5000";

// ─── AddExam Modal ────────────────────────────────────────────────────────────
function AddExamModal({ onClose, onAdded }) {
  const { user } = useAuth();
  const [subject, setSubject]     = useState("");
  const [semester, setSemester]   = useState("");
  const [fromDate, setFromDate]   = useState(new Date().toISOString().slice(0, 16));
  const [toDate, setToDate]       = useState(new Date().toISOString().slice(0, 16));
  const [questions, setQuestions] = useState([""]);
  const [loading, setLoading]     = useState(false);

  function addQ()    { setQuestions((q) => [...q, ""]); }
  function removeQ(i){ if (questions.length > 1) setQuestions(questions.filter((_, idx) => idx !== i)); }
  function setQ(i,v) { setQuestions(questions.map((q, idx) => idx === i ? v : q)); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (new Date(fromDate) >= new Date(toDate)) { toast.warn("End date must be after start date"); return; }
    if (questions.some((q) => !q.trim()))        { toast.warn("Fill in all questions"); return; }
    setLoading(true);
    try {
      const res = await api.addExam({
        subject, semester, fromDate, toDate, questions,
        professorEmail: user.email, professorID: user.username,
      });
      if (res.status === "success") { toast.success("Exam posted!"); onAdded(); onClose(); }
      else toast.error(res.message);
    } catch { toast.error("Failed to post exam"); }
    setLoading(false);
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-title">📝 Post New Exam</div>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="input-group">
              <label>Subject</label>
              <input className="input" placeholder="e.g. Mathematics" value={subject} onChange={(e) => setSubject(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Semester</label>
              <input className="input" placeholder="e.g. Fall 2026" value={semester} onChange={(e) => setSemester(e.target.value)} required />
            </div>
          </div>
          <div className="grid-2">
            <div className="input-group">
              <label>From Date & Time</label>
              <input className="input" type="datetime-local" value={fromDate} onChange={(e) => setFromDate(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>To Date & Time</label>
              <input className="input" type="datetime-local" value={toDate} onChange={(e) => setToDate(e.target.value)} required />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-muted)" }}>Questions</label>
            <button type="button" className="btn btn-outline btn-sm" onClick={addQ}>+ Add Question</button>
          </div>
          {questions.map((q, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <span style={{ paddingTop: 10, color: "var(--text-faint)", fontSize: "0.82rem", minWidth: 20 }}>Q{i+1}</span>
              <input className="input" value={q} onChange={(e) => setQ(i, e.target.value)} placeholder={`Question ${i+1}`} required />
              {questions.length > 1 && (
                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeQ(i)}>🗑</button>
              )}
            </div>
          ))}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <ClipLoader color="#fff" size={14} /> : "Post Exam →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Exam Detail Modal ────────────────────────────────────────────────────────
function ExamDetailModal({ exam, onClose, onResultsPosted }) {
  const { user }  = useAuth();
  const [activeQ, setActiveQ]       = useState(0);
  const [profText, setProfText]     = useState("");
  const [profFile, setProfFile]     = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [uploadingQ, setUploadingQ] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  const [posting, setPosting]       = useState(false);
  const [dragOver, setDragOver]     = useState(false);

  // ── OCR for professor image ──
  async function handleProfImage(selected) {
    const imgs = Array.from(selected).filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) { toast.warn("Only image files allowed"); return; }
    setProfFile(imgs[0]);
    setProfText("Extracting text from image...");
    setOcrLoading(true);
    try {
      const fd = new FormData();
      fd.append("image", imgs[0]);
      const r    = await fetch(`${BACKEND}/ocr`, { method: "POST", body: fd });
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      const text =
        typeof data === "string"
          ? data
          : data.text || data.result || data.extracted_text || JSON.stringify(data);
      setProfText(text);
      toast.success("✅ Text extracted from answer image!");
    } catch (err) {
      setProfText("");
      toast.warn("OCR failed — please type the answer manually");
    }
    setOcrLoading(false);
  }

  // ── Save correct answer ──
  async function uploadCorrectAnswer() {
    if (!profText.trim()) { toast.warn("Enter or extract the correct answer first"); return; }
    setUploadingQ(true);
    try {
      const fd = new FormData();
      if (profFile) fd.append("scripts", profFile);
      fd.append("Examid",      exam._id);
      fd.append("questionno",  String(activeQ));
      fd.append("panswertext", profText);
      fd.append("username",    user.username);
      const res = await api.uploadProfAnswer(fd);
      if (res.status === "success") toast.success(`✅ Correct answer for Q${activeQ + 1} saved!`);
      else toast.error(res.message);
    } catch { toast.error("Upload failed"); }
    setUploadingQ(false);
  }

  // ── Evaluate ──
  async function handleEvaluate() {
    setEvaluating(true);
    try {
      const res = await api.evaluate({ examid: exam._id });
      if (res.status === "success") {
        // Remove non-score keys
        const cleaned = {};
        Object.keys(res).forEach((k) => {
          if (k !== "status" && k !== "message") cleaned[k] = res[k];
        });
        setEvalResult(cleaned);
        toast.success("✅ Evaluation complete!");
      } else {
        toast.error(res.message);
      }
    } catch { toast.error("Evaluation failed"); }
    setEvaluating(false);
  }

  // ── Publish ──
  async function handlePostResults() {
    if (!evalResult) { toast.warn("Evaluate first"); return; }
    setPosting(true);
    try {
      const res = await api.postResults({ examid: exam._id, results: evalResult });
      if (res.status === "success") { toast.success("📢 Results published!"); onResultsPosted(); onClose(); }
      else toast.error(res.message);
    } catch { toast.error("Failed to post"); }
    setPosting(false);
  }

  const submissions = exam.submissions || [];

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 700 }}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-title">{exam.subject} — {exam.semester}</div>

        <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          <span className="badge badge-orange">{submissions.length} submission{submissions.length !== 1 ? "s" : ""}</span>
          <span className="badge badge-gray">{exam.questions?.length} question{exam.questions?.length !== 1 ? "s" : ""}</span>
        </div>

        {/* ── Upload Correct Answers ── */}
        <div style={{ background: "var(--bg3)", borderRadius: 10, padding: 16, marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: "0.9rem" }}>
            📤 Upload Correct Answers
          </div>

          {/* Question selector */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {exam.questions?.map((_, i) => (
              <button key={i} className={`btn btn-sm ${i === activeQ ? "btn-primary" : "btn-ghost"}`} onClick={() => { setActiveQ(i); setProfText(""); setProfFile(null); }}>
                Q{i + 1}
              </button>
            ))}
          </div>

          <div style={{ fontSize: "0.83rem", color: "var(--text-muted)", marginBottom: 12 }}>
            {exam.questions?.[activeQ]}
          </div>

          {/* Image upload zone for professor */}
          <div
            className={`upload-zone ${dragOver ? "drag-over" : ""}`}
            style={{ padding: "20px 16px", marginBottom: 12 }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleProfImage(e.dataTransfer.files); }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>{ocrLoading ? "⏳" : "📷"}</div>
            <div style={{ fontWeight: 600, fontSize: "0.88rem", marginBottom: 4 }}>
              {ocrLoading ? "Extracting text via OCR..." : "Upload answer key image (optional)"}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-faint)", marginBottom: 10 }}>
              {ocrLoading ? "Please wait..." : "Drag & drop or click to choose"}
            </div>
            <input
              type="file" accept="image/*"
              style={{ display: "none" }} id="prof-file-input"
              onChange={(e) => handleProfImage(e.target.files)}
              disabled={ocrLoading}
            />
            <label
              htmlFor="prof-file-input"
              className="btn btn-outline btn-sm"
              style={{ cursor: ocrLoading ? "not-allowed" : "pointer", opacity: ocrLoading ? 0.5 : 1 }}
            >
              {ocrLoading ? <ClipLoader color="var(--brand)" size={12} /> : "Choose Image"}
            </label>
          </div>

          {/* Show selected file */}
          {profFile && (
            <div style={{ marginBottom: 10 }}>
              <span style={{ padding: "4px 10px", background: "var(--brand-faint)", borderRadius: 6, fontSize: "0.78rem", color: "var(--brand)" }}>
                ✅ {profFile.name}
              </span>
            </div>
          )}

          {/* Text area */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: "0.83rem", color: "var(--text-muted)" }}>
            Correct Answer Text
            {ocrLoading && <ClipLoader color="var(--brand)" size={10} />}
          </div>
          <textarea
            className="input"
            style={{ minHeight: 80, resize: "vertical", marginBottom: 10 }}
            placeholder="Text auto-extracted from image, or type the correct answer here..."
            value={profText}
            onChange={(e) => setProfText(e.target.value)}
            disabled={ocrLoading}
          />

          <button className="btn btn-outline btn-sm" onClick={uploadCorrectAnswer} disabled={uploadingQ || ocrLoading}>
            {uploadingQ ? <ClipLoader color="var(--brand)" size={12} /> : `💾 Save Q${activeQ + 1} Answer`}
          </button>
        </div>

        {/* ── Submissions table ── */}
        {submissions.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 10 }}>👥 Submissions</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Questions Answered</th>
                    {evalResult && <th>Score</th>}
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => {
                    const qCount = Object.keys(s.script || {}).length;
                    const scores = evalResult?.[s.username];
                    const validScores = scores
                      ? Object.values(scores).map(Number).filter((n) => !isNaN(n))
                      : [];
                    const avg = validScores.length
                      ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1)
                      : null;
                    return (
                      <tr key={s._id}>
                        <td><span className="mono" style={{ fontSize: "0.85rem" }}>{s.username}</span></td>
                        <td><span className="badge badge-gray">{qCount} / {exam.questions?.length}</span></td>
                        {evalResult && (
                          <td>
                            {avg !== null
                              ? <span style={{ color: Number(avg) >= 50 ? "var(--success)" : "var(--error)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{avg}%</span>
                              : <span style={{ color: "var(--text-faint)" }}>—</span>
                            }
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Action buttons ── */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={handleEvaluate} disabled={evaluating || submissions.length === 0}>
            {evaluating ? <><ClipLoader color="#fff" size={14} /> &nbsp;Evaluating…</> : "🧠 Evaluate Answers"}
          </button>
          {evalResult && (
            <button className="btn btn-success" onClick={handlePostResults} disabled={posting}>
              {posting ? <ClipLoader color="#fff" size={14} /> : "📢 Publish Results"}
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function ProfDashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [exams, setExams]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!user || user.role !== "professor") { navigate("/login"); return; }
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.getProfExams({ username: user.username });
      setExams(Array.isArray(res) ? res : []);
    } catch { toast.error("Failed to load exams"); }
    setLoading(false);
  }

  const totalSubmissions = exams.reduce((s, e) => s + (e.submissions?.length || 0), 0);

  return (
    <div className="page">
      <div className="container">

        {/* Header */}
        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="page-title">Professor Dashboard</div>
            <div className="page-subtitle">Welcome, {user?.username}</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Post Exam</button>
        </div>

        {/* Stats */}
        <div className="grid-3" style={{ marginBottom: 32 }}>
          {[
            ["📋", exams.length,       "Total Exams"],
            ["👥", totalSubmissions,    "Total Submissions"],
            ["📅", exams.filter((e) => { const n = new Date(); return new Date(e.fromDate) <= n && new Date(e.toDate) >= n; }).length, "Active Exams"],
          ].map(([icon, val, label]) => (
            <div className="card" key={label} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: "2rem" }}>{icon}</span>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.8rem", fontWeight: 800, color: "var(--brand)" }}>{val}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Exam cards */}
        {loading ? (
          <div className="spinner-wrap"><ClipLoader color="var(--brand)" /></div>
        ) : exams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <div className="empty-state-title">No exams posted yet</div>
            <div style={{ marginTop: 16 }}>
              <button className="btn btn-primary" onClick={() => setShowAdd(true)}>Post Your First Exam →</button>
            </div>
          </div>
        ) : (
          <div className="grid-2">
            {exams.map((exam) => {
              const now      = new Date();
              const isActive = new Date(exam.fromDate) <= now && new Date(exam.toDate) >= now;
              return (
                <div className="card fade-up" key={exam._id} style={{ cursor: "pointer" }} onClick={() => setSelected(exam)}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div className="card-title">{exam.subject}</div>
                    <span className={`badge badge-${isActive ? "green" : "gray"}`}>
                      {isActive ? "Active" : "Closed"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.83rem", color: "var(--text-muted)", marginBottom: 12 }}>
                    {exam.semester} · {exam.questions?.length} questions
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: "0.8rem", color: "var(--text-faint)" }}>
                    <span>📅 {new Date(exam.fromDate).toLocaleDateString()}</span>
                    <span>👥 {exam.submissions?.length || 0} submission{exam.submissions?.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setSelected(exam)}>
                      Manage Exam →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAdd  && <AddExamModal onClose={() => setShowAdd(false)} onAdded={load} />}
      {selected && <ExamDetailModal exam={selected} onClose={() => setSelected(null)} onResultsPosted={load} />}
    </div>
  );
}