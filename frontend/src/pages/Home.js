import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

const steps = [
  { n: "01", title: "Student Uploads",  desc: "Scanned handwritten answer scripts submitted per question via the portal" },
  { n: "02", title: "OCR Extraction",   desc: "Google Vision API reads the handwriting and converts it to clean text" },
  { n: "03", title: "NLP Scoring",      desc: "BERT + TF-IDF cosine similarity evaluates answers and assigns a fair score" },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <>
      {/* bg glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
          width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)",
        }} />
      </div>

      <section className="hero" style={{ position: "relative", zIndex: 1 }}>
        <div className="hero-eyebrow">VIT-AP University · SDP Project 2025–26</div>

        <h1 className="hero-title">
          AI Based Examination<br /><em>Script Evaluation</em> System
        </h1>

        <p className="hero-desc">
          Automated evaluation of handwritten answer scripts using OCR and NLP —
          instant, objective, and fair grading for every student.
        </p>

        <div className="hero-actions">
          {user ? (
            user.role === "professor" ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">Go to Dashboard →</Link>
            ) : (
              <Link to="/exams" className="btn btn-primary btn-lg">View My Exams →</Link>
            )
          ) : (
            <>
              <Link to="/signup" className="btn btn-primary btn-lg">Get Started →</Link>
              <Link to="/login"  className="btn btn-outline btn-lg">Login</Link>
            </>
          )}
        </div>

        <div className="hero-grid">
          {steps.map((s) => (
            <div className="hero-step fade-up" key={s.n}>
              <div className="hero-step-num mono">STEP {s.n}</div>
              <div className="hero-step-title">{s.title}</div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 6, lineHeight: 1.5 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ marginTop: 64, display: "flex", gap: 48, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            ["~80%", "Evaluation Accuracy"],
            ["4×",   "Faster Grading"],
            ["100%", "Objective Scoring"],
          ].map(([n, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--brand)", fontFamily: "var(--font-mono)" }}>{n}</div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Team credit */}
        <div style={{
          marginTop: 64, padding: "16px 28px",
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", fontSize: "0.82rem",
          color: "var(--text-muted)", textAlign: "center", maxWidth: 480,
        }}>
          👨‍💻 Developed by <span style={{ color: "var(--text)", fontWeight: 600 }}>Pushadapu Lalitha Sahithi , </span> 
          <span style={{ color: "var(--text)", fontWeight: 600 }}>Gurram Lakshmi Lasya</span> &amp;{" "}
          <span style={{ color: "var(--text)", fontWeight: 600 }}>Nadakurthy Yasasri</span>
          <br />
          <br />
          <span style={{ fontSize: "0.78rem" }}>Guided by  Bharathi V C · VIT-AP University</span>
        </div>
      </section>
    </>
  );
}