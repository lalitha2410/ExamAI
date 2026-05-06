import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import ScoreBar from "../components/ScoreBar";
import { ClipLoader } from "react-spinners";

export default function StudentResults() {
  const { user } = useAuth();
  const [graded, setGraded]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      // Fetch BOTH active and previous exams so results show even if exam is still active
      const [active, previous] = await Promise.all([
        api.getActiveExams(),
        api.getPreviousExams(),
      ]);

      const activeList   = Array.isArray(active)   ? active   : [];
      const previousList = Array.isArray(previous) ? previous : [];

      // Combine and deduplicate by _id
      const allExams = [...activeList, ...previousList].filter(
        (exam, idx, arr) => arr.findIndex((e) => e._id === exam._id) === idx
      );

      // Fetch results for each exam
      const results = [];
      for (const exam of allExams) {
        try {
          const r = await api.getUserResults({
            examid:   exam._id,
            username: user.username,
          });
          if (r.status === "success" && r.results?.[user.username]) {
            results.push({ exam, scores: r.results[user.username] });
          }
        } catch {
          // no results for this exam yet, skip
        }
      }

      setGraded(results);
    } catch {
      toast.error("Failed to load results");
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="page">
        <div className="spinner-wrap"><ClipLoader color="var(--brand)" /></div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="page-title">My Results</div>
            <div className="page-subtitle">
              {user?.username} · {graded.length} graded exam{graded.length !== 1 ? "s" : ""}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
        </div>

        {graded.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">No results published yet</div>
            <div>Your professor hasn't posted results yet. Check back later.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {graded.map(({ exam, scores }) => {
              const validScores = Object.values(scores)
                .map(Number)
                .filter((n) => !isNaN(n));
              const avg = validScores.length
                ? validScores.reduce((a, b) => a + b, 0) / validScores.length
                : 0;
              const passed = avg >= 50;

              return (
                <div className="card fade-up" key={exam._id}>
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div>
                      <div className="card-title">{exam.subject}</div>
                      <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{exam.semester}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{
                        fontFamily: "var(--font-mono)", fontSize: "1.8rem", fontWeight: 800,
                        color: passed ? "var(--success)" : "var(--error)",
                      }}>
                        {avg.toFixed(1)}%
                      </div>
                      <span className={`badge badge-${passed ? "green" : "red"}`}>
                        {passed ? "PASSED" : "FAILED"}
                      </span>
                    </div>
                  </div>

                  {/* Per-question scores */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {Object.entries(scores).map(([qKey, score]) => {
                      const numScore = Number(score);
                      if (isNaN(numScore)) return null;
                      return (
                        <div key={qKey} style={{ background: "var(--bg3)", borderRadius: 8, padding: 14 }}>
                          <div style={{
                            fontSize: "0.78rem", color: "var(--brand)",
                            marginBottom: 8, fontFamily: "var(--font-mono)",
                          }}>
                            QUESTION {parseInt(qKey) + 1}
                          </div>
                          {exam.questions?.[qKey] && (
                            <div style={{ fontSize: "0.83rem", color: "var(--text-muted)", marginBottom: 10 }}>
                              {exam.questions[qKey]}
                            </div>
                          )}
                          <ScoreBar score={numScore} />
                        </div>
                      );
                    })}
                  </div>

                  {/* Overall bar */}
                  <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                    <div style={{ fontSize: "0.83rem", fontWeight: 600, marginBottom: 8 }}>Overall</div>
                    <ScoreBar score={avg} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}