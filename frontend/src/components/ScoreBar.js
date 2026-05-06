import React from "react";

export default function ScoreBar({ score }) {
  const val = Math.min(100, Math.max(0, parseFloat(score) || 0));
  const color =
    val >= 70 ? "var(--success)" :
    val >= 40 ? "var(--warning)" :
                "var(--error)";

  return (
    <div className="score-bar-wrap">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Score</span>
        <span className="score-num" style={{ color }}>{val.toFixed(1)}%</span>
      </div>
      <div className="score-bar-bg">
        <div
          className="score-bar-fill"
          style={{ width: `${val}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)` }}
        />
      </div>
    </div>
  );
}
