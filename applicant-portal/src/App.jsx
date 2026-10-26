import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewApplication from "./pages/NewApplication";
import ApplicationView from "./pages/ApplicationView";

function ProtectedLayout({ children }) {
  const token = localStorage.getItem("aicte_applicant_token");
  const userStr = localStorage.getItem("aicte_applicant_user");

  if (!token && !userStr) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Navbar />
      <main className="flex-1 pb-12">{children}</main>
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        VeriCheck AI • Problem Statement 26261 (SIH) • College Portal :5173
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />
        <Route
          path="/new-application"
          element={
            <ProtectedLayout>
              <NewApplication />
            </ProtectedLayout>
          }
        />
        <Route
          path="/application/:id"
          element={
            <ProtectedLayout>
              <ApplicationView />
            </ProtectedLayout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
