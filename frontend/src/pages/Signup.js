import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "../api";
import { ClipLoader } from "react-spinners";

export default function Signup() {
  const [role, setRole]         = useState("student");
  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const uPlaceholder = role === "student"
    ? "Reg. No. (e.g. 22BCE9119)"
    : "Employee ID (5 digits)";

  function validate() {
    if (role === "student") {
      // Reg number format: 22BCE9119
      if (!/^[0-9]{2}[a-zA-Z]{3}[0-9]{4}$/.test(username))
        return "Invalid VIT-AP registration number (e.g. 22BCE9119)";
      // Email must end with @vitapstudent.ac.in
      if (!email.toLowerCase().endsWith("@vitapstudent.ac.in"))
        return "Student email must end with @vitapstudent.ac.in";
      // Email must contain the reg number somewhere (name.22bce9119@vitapstudent.ac.in)
      if (!email.toLowerCase().includes(username.toLowerCase()))
        return `Email must contain your reg number (e.g. name.${username.toLowerCase()}@vitapstudent.ac.in)`;
    } else {
      if (!email.toLowerCase().endsWith("@vitap.ac.in"))
        return "Professor email must end with @vitap.ac.in";
    }
    if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*<>]).{9,}/.test(password))
      return "Password needs 9+ chars, uppercase, lowercase, number & special char";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) { toast.warn(err); return; }
    setLoading(true);
    try {
      const res = await api.signup({
        username: username.toUpperCase(),
        email: email.toLowerCase(),
        password,
        role,
      });
      if (res.status === "success") {
        toast.success(res.message);
        navigate("/login");
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
          }}>✏️</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Create account</h1>
          <p style={{ color: "var(--text-muted)", marginTop: 6, fontSize: "0.9rem" }}>
            Join AIScrutiny — VIT-AP University
          </p>
        </div>

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
              placeholder={uPlaceholder}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>VIT-AP Email</label>
            <input
              className="input"
              type="email"
              placeholder={
                role === "student"
                  ? "firstname.22bce9119@vitapstudent.ac.in"
                  : "firstname.lastname@vitap.ac.in"
              }
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <span style={{ fontSize: "0.75rem", color: "var(--text-faint)" }}>
              {role === "student"
                ? "Format: firstname.regno@vitapstudent.ac.in"
                : "Format: name@vitap.ac.in"}
            </span>
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              className="input"
              type="password"
              placeholder="Min 9 chars · upper · lower · number · special"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span style={{ fontSize: "0.75rem", color: "var(--text-faint)" }}>
              9+ chars · uppercase · lowercase · number · special (!@#$%^&amp;*&lt;&gt;)
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 8 }}
            disabled={loading}
          >
            {loading ? <ClipLoader color="#fff" size={16} /> : "Create Account →"}
          </button>
        </form>

        <hr className="divider" />
        <p style={{ textAlign: "center", fontSize: "0.88rem", color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--brand)", fontWeight: 600 }}>Login</Link>
        </p>
      </div>
    </div>
  );
}