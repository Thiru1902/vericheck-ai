import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ApplicationDetail from "./pages/ApplicationDetail";
import Alerts from "./pages/Alerts";
import AuditTrail from "./pages/AuditTrail";
import Metrics from "./pages/Metrics";

function ProtectedLayout({ children }) {
  const token = localStorage.getItem("aicte_officer_token");
  const userStr = localStorage.getItem("aicte_officer_user");

  if (!token && !userStr) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Navbar />
      <main className="flex-1 pb-12">{children}</main>
      <footer className="bg-white border-t border-slate-200 py-3.5 text-center text-xs text-slate-500">
        VeriCheck AI Scrutiny Console • Problem Statement 26261 (SIH) • Port 5174
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
          path="/application/:id"
          element={
            <ProtectedLayout>
              <ApplicationDetail />
            </ProtectedLayout>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedLayout>
              <Alerts />
            </ProtectedLayout>
          }
        />
        <Route
          path="/audit"
          element={
            <ProtectedLayout>
              <AuditTrail />
            </ProtectedLayout>
          }
        />
        <Route
          path="/metrics"
          element={
            <ProtectedLayout>
              <Metrics />
            </ProtectedLayout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
