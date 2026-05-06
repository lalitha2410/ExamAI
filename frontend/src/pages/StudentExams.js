import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { ClipLoader } from "react-spinners";

const BACKEND = "http://localhost:5000";

function ExamCard({ exam, onOpen }) {
  const now  = new Date();
  const from = new Date(exam.fromDate);
  const to   = new Date(exam.toDate);
  const isActive = now >= from && now <= to;

  return (
    <div className="card fade-up" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="card-title">{exam.subject}</div>
          <div style={{ fontSize: "0.83rem", color: "var(--text-muted)" }}>Semester: {exam.semester}</div>
        </div>
        <span className={`badge badge-${isActive ? "green" : "gray"}`}>
          {isActive ? "Active" : "Closed"}
        </span>
      </div>

      <div style={{ display: "flex", gap: 20, fontSize: "0.82rem", color: "var(--text-muted)" }}>
        <span>📅 From: {new Date(exam.fromDate).toLocaleString()}</span>
        <span>🕐 To: {new Date(exam.toDate).toLocaleString()}</span>
      </div>

      <div style={{ fontSize: "0.83rem", color: "var(--text-muted)" }}>
        {exam.questions?.length || 0} question{exam.questions?.length !== 1 ? "s" : ""}
      </div>

      <button
        className={`btn btn-sm ${isActive ? "btn-primary" : "btn-ghost"}`}
        style={{ alignSelf: "flex-start", marginTop: 4 }}
        onClick={() => isActive && onOpen(exam)}
        disabled={!isActive}
      >
        {isActive ? "Open Exam →" : "Exam Closed"}
      </button>
    </div>
  );
}

function UploadModal({ exam, onClose }) {
  const { user }  = useAuth();
  const [qIndex, setQIndex]             = useState(0);
  const [files, setFiles]               = useState([]);
  const [extractedText, setExtractedText] = useState("");
  const [uploading, setUploading]       = useState(false);
  const [ocrLoading, setOcrLoading]     = useState(false);
  const [dragOver, setDragOver]         = useState(false);

  const question = exam.questions[qIndex];

  async function handleFiles(selected) {
    const imgs = Array.from(selected).filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) { toast.warn("Only image files allowed"); return; }
    setFiles(imgs);
    setExtractedText("Extracting text from image...");
    setOcrLoading(true);

    try {
      const fd = new FormData();
      fd.append("image", imgs[0]);

      // Call OCR via backend proxy (avoids browser CORS)
      const r = await fetch(`${BACKEND}/ocr`, {
        method: "POST",
        body: fd,
      });
      const data = await r.json();

      if (data.error) throw new Error(data.error);

      // Handle different response shapes from OCR API
      const text =
        typeof data === "string"
          ? data
          : data.text || data.result || data.extracted_text || JSON.stringify(data);

      setExtractedText(text);
      toast.success("✅ Text extracted from image!");
    } catch (err) {
      console.error("OCR error:", err);
      setExtractedText("");
      toast.warn("OCR failed — please type your answer manually");
    }

    setOcrLoading(false);
  }

  async function handleUpload() {
    if (!extractedText.trim()) {
      toast.warn("Please upload an image or type your answer");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("scripts", f));
      fd.append("Examid",     exam._id);
      fd.append("questionno", String(qIndex));
      fd.append("answertext", extractedText);
      fd.append("username",   user.username);

      const res = await api.uploadAnswer(fd);
      if (res.status === "success") {
        toast.success(`Q${qIndex + 1} uploaded!`);
        setFiles([]);
        setExtractedText("");
        if (qIndex < exam.questions.length - 1) setQIndex(qIndex + 1);
        else { toast.success("All answers submitted! 🎉"); onClose(); }
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Upload failed");
    }
    setUploading(false);
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-title">{exam.subject}</div>

        {/* Question tabs */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {exam.questions.map((_, i) => (
            <button
              key={i}
              className={`btn btn-sm ${i === qIndex ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setQIndex(i)}
            >
              Q{i + 1}
            </button>
          ))}
        </div>

        {/* Question box */}
        <div className="card" style={{ background: "var(--bg3)", marginBottom: 20 }}>
          <div style={{ fontSize: "0.75rem", color: "var(--brand)", marginBottom: 6, fontFamily: "var(--font-mono)" }}>
            QUESTION {qIndex + 1}
          </div>
          <p style={{ fontWeight: 500 }}>{question}</p>
        </div>

        {/* Upload zone */}
        <div
          className={`upload-zone ${dragOver ? "drag-over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        >
          <div className="upload-zone-icon">{ocrLoading ? "⏳" : "📸"}</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            {ocrLoading ? "Extracting text via OCR..." : "Drag & drop your answer image"}
          </div>
          <div style={{ fontSize: "0.82rem", marginBottom: 16, color: "var(--text-faint)" }}>
            {ocrLoading ? "Please wait..." : "Supports JPG, PNG, handwritten scans"}
          </div>
          <input
            type="file" accept="image/*"
            style={{ display: "none" }} id="file-input"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={ocrLoading}
          />
          <label
            htmlFor="file-input"
            className="btn btn-outline btn-sm"
            style={{ cursor: ocrLoading ? "not-allowed" : "pointer", opacity: ocrLoading ? 0.5 : 1 }}
          >
            {ocrLoading ? <ClipLoader color="var(--brand)" size={12} /> : "Choose Image"}
          </label>
        </div>

        {/* File name tags */}
        {files.length > 0 && (
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {files.map((f, i) => (
              <div key={i} style={{
                padding: "4px 10px", background: "var(--brand-faint)",
                borderRadius: 6, fontSize: "0.78rem", color: "var(--brand)",
              }}>
                ✅ {f.name}
              </div>
            ))}
          </div>
        )}

        {/* Extracted text */}
        <div className="input-group" style={{ marginTop: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            Extracted / Typed Answer Text
            {ocrLoading && <ClipLoader color="var(--brand)" size={10} />}
          </label>
          <textarea
            className="input"
            style={{ minHeight: 100, resize: "vertical" }}
            placeholder="Text will be auto-extracted from your image via OCR, or type manually here"
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
            disabled={ocrLoading}
          />
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={uploading || ocrLoading}
          >
            {uploading ? <ClipLoader color="#fff" size={14} /> : `Upload Q${qIndex + 1} →`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentExams() {
  const [active, setActive]     = useState([]);
  const [previous, setPrevious] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [tab, setTab]           = useState("active");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== "student") { navigate("/login"); return; }
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [a, p] = await Promise.all([api.getActiveExams(), api.getPreviousExams()]);
      setActive(Array.isArray(a) ? a : []);
      setPrevious(Array.isArray(p) ? p : []);
    } catch {
      toast.error("Failed to load exams");
    }
    setLoading(false);
  }

  const shown = tab === "active" ? active : previous;

  return (
    <div className="page">
      <div className="container">
        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="page-title">My Exams</div>
            <div className="page-subtitle">Welcome, {user?.username}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
        </div>

        <div className="tabs" style={{ marginBottom: 24 }}>
          <button className={`tab${tab === "active"   ? " active" : ""}`} onClick={() => setTab("active")}>
            Active ({active.length})
          </button>
          <button className={`tab${tab === "previous" ? " active" : ""}`} onClick={() => setTab("previous")}>
            Previous ({previous.length})
          </button>
        </div>

        {loading ? (
          <div className="spinner-wrap"><ClipLoader color="var(--brand)" /></div>
        ) : shown.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">No {tab} exams</div>
            <div>Check back later or ask your professor.</div>
          </div>
        ) : (
          <div className="grid-2">
            {shown.map((e) => (
              <ExamCard key={e._id} exam={e} onOpen={setSelected} />
            ))}
          </div>
        )}
      </div>

      {selected && <UploadModal exam={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}