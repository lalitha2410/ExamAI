import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider, useAuth } from "./AuthContext";
import Navbar         from "./components/Navbar";
import Home           from "./pages/Home";
import Login          from "./pages/Login";
import Signup         from "./pages/Signup";
import StudentExams   from "./pages/StudentExams";
import StudentResults from "./pages/StudentResults";
import ProfDashboard  from "./pages/ProfDashboard";
import "./styles/global.css";

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"         element={<Home />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/signup"   element={<Signup />} />
        <Route path="/exams"    element={
          <ProtectedRoute role="student"><StudentExams /></ProtectedRoute>
        } />
        <Route path="/results"  element={
          <ProtectedRoute role="student"><StudentResults /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute role="professor"><ProfDashboard /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer
          theme="dark"
          position="bottom-right"
          autoClose={3500}
          hideProgressBar={false}
          closeOnClick
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
