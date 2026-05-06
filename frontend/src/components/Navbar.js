import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          Exam<span>AI</span>
          <span style={{
            fontSize: "0.6rem", color: "var(--text-faint)",
            marginLeft: 4, fontFamily: "var(--font-mono)",
          }}>VIT-AP</span>
        </Link>

        <div className="navbar-links">
          {!user ? (
            <>
              <NavLink to="/login"  className={({ isActive }) => "navbar-link" + (isActive ? " active" : "")}>Login</NavLink>
              <NavLink to="/signup" className={() => ""}>
                <span className="btn btn-primary btn-sm">Sign Up</span>
              </NavLink>
            </>
          ) : (
            <>
              {user.role === "student" ? (
                <>
                  <NavLink to="/exams"   className={({ isActive }) => "navbar-link" + (isActive ? " active" : "")}>Exams</NavLink>
                  <NavLink to="/results" className={({ isActive }) => "navbar-link" + (isActive ? " active" : "")}>Results</NavLink>
                </>
              ) : (
                <NavLink to="/dashboard" className={({ isActive }) => "navbar-link" + (isActive ? " active" : "")}>Dashboard</NavLink>
              )}

              <div className="navbar-user">
                <div className="navbar-avatar">{user.username?.[0]?.toUpperCase()}</div>
                <span style={{ fontSize: "0.83rem" }}>{user.username}</span>
                <span className={`badge badge-${user.role === "professor" ? "orange" : "green"}`}>
                  {user.role}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}