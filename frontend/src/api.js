// src/api.js — central API helper

const BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

function getToken() {
  const raw = localStorage.getItem("exameval_user");
  if (!raw) return null;
  try { return JSON.parse(raw).token; } catch { return null; }
}

async function req(method, path, body, multipart = false) {
  const token = getToken();
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!multipart) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: multipart ? body : body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export const api = {
  signup:           (d) => req("POST", "/signup",            d),
  login:            (d) => req("POST", "/login",             d),
  addExam:          (d) => req("POST", "/addexam",           d),
  getActiveExams:   ()  => req("GET",  "/examsSchedule"),
  getPreviousExams: ()  => req("GET",  "/previousExams"),
  getProfExams:     (d) => req("POST", "/getProfessorExams", d),
  uploadAnswer:     (f) => req("POST", "/upload",            f, true),
  uploadProfAnswer: (f) => req("POST", "/profupload",        f, true),
  evaluate:         (d) => req("POST", "/evaluate",          d),
  postResults:      (d) => req("POST", "/postResult",        d),
  getUserResults:   (d) => req("POST", "/getUserResults",    d),
};
