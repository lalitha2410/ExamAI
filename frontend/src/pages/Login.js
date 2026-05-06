import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { ClipLoader } from "react-spinners";

export default function Login() {
  const [role, setRole]         = useState("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const placeholder = role === "student"
    ? "Reg. No. (e.g. 22BCE9119)"
    : "Employee ID (5 digits)";

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.login({ username: username.toUpperCase(), password, role });
      if (res.status === "success") {
        toast.success(res.message);
        login(res);
        navigate(role === "professor" ? "/dashboard" : "/exams");
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Connection error. Is the backend running?");
    }
    setLoading(false);
  }

  return (
    <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="card fade-up" style={{ width: "100%", maxWidth: 440 }}>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "var(--brand-faint)", border: "2px solid var(--brand)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", fontSize: "1.6rem",
          }}>📋</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Welcome back</h1>
          <p style={{ color: "var(--text-muted)", marginTop: 6, fontSize: "0.9rem" }}>
            Log in to AIScrutiny — VIT-AP University
          </p>
        </div>

        {/* Role toggle */}
        <div className="tabs" style={{ margin: "0 auto 24px", display: "flex" }}>
          <button className={`tab${role === "student"   ? " active" : ""}`} onClick={() => setRole("student")}>
            🎓 Student
          </button>
          <button className={`tab${role === "professor" ? " active" : ""}`} onClick={() => setRole("professor")}>
            👨‍🏫 Professor
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>{role === "student" ? "Registration Number" : "Employee ID"}</label>
            <input
              className="input"
              placeholder={placeholder}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              className="input"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 8 }}
            disabled={loading}
          >
            {loading ? <ClipLoader color="#fff" size={16} /> : "Login →"}
          </button>
        </form>

        <hr className="divider" />
        <p style={{ textAlign: "center", fontSize: "0.88rem", color: "var(--text-muted)" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "var(--brand)", fontWeight: 600 }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}