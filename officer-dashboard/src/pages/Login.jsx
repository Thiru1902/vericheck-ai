import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, UserCheck, Lock, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import api from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("officer@aicte.gov.in");
  const [password, setPassword] = useState("Demo@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (loginEmail, loginPassword) => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        email: loginEmail || email,
        password: loginPassword || password,
      });

      if (res.data.role !== "officer") {
        setError("Access Denied: This dashboard is strictly restricted to AICTE Scrutiny Officers. College Applicants must use the Applicant Portal on port 5173.");
        setLoading(false);
        return;
      }

      localStorage.setItem("aicte_officer_token", res.data.access_token);
      localStorage.setItem("aicte_officer_user", JSON.stringify(res.data));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Please verify credentials or click the 1-Click Officer Login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a192f] via-[#0f2b48] to-[#1e3a5f] flex flex-col justify-center items-center px-4 py-8">
      {/* Top AICTE Header Banner */}
      <div className="w-full max-w-xl text-center mb-6">
        <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-blue-200 text-xs font-semibold mb-4 tracking-wider uppercase">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          AICTE Competent Regulatory Authority
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          VeriCheck AI Scrutiny Console
        </h1>
        <p className="mt-2 text-sm text-blue-200">
          AI-Assisted First-Level Decision Support System (SIH 26261)
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-blue-100 p-8">
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Officer Scrutiny Sign In</h2>
              <p className="text-xs text-gray-500">Authorized regulatory personnel only</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            Government Official
          </span>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
            <p>{error}</p>
          </div>
        )}

        {/* 1-Click Demo Profile for Officer */}
        <div className="mb-6 bg-blue-50/70 border border-blue-200/80 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              1-Click Demo Access
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleLogin("officer@aicte.gov.in", "Demo@123")}
            className="w-full text-left p-3.5 rounded-lg bg-white border border-blue-200 hover:border-blue-500 hover:shadow-md transition text-xs group flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-gray-900 group-hover:text-blue-700 text-sm">
                Dr. R. K. Sharma (Senior Scrutiny Officer)
              </div>
              <div className="text-gray-500 text-[11px] mt-0.5">officer@aicte.gov.in • AICTE HQ New Delhi</div>
            </div>
            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded font-bold text-[11px]">
              Instant Login
            </span>
          </button>
        </div>

        {/* Manual Login Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin(email, password);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Official Email ID
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="officer@aicte.gov.in"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Security Credential
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="Demo@123"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Verifying Credentials..." : "Enter Officer Scrutiny Console"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>AICTE Regulatory Verification System</span>
          <span className="font-medium text-blue-700">Port 5174</span>
        </div>
      </div>
    </div>
  );
}
