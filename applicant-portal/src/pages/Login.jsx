import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, School, Lock, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import api from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("applicant1@aicte-demo.in");
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

      if (res.data.role !== "applicant") {
        setError("Access Denied: This portal is exclusively for Technical College Applicants. AICTE Officers must use the Officer Dashboard on port 5174.");
        setLoading(false);
        return;
      }

      localStorage.setItem("aicte_applicant_token", res.data.access_token);
      localStorage.setItem("aicte_applicant_user", JSON.stringify(res.data));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Please verify credentials or choose 1-Click Demo Login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 flex flex-col justify-center items-center px-4 py-8">
      {/* Top AICTE Header Banner */}
      <div className="w-full max-w-xl text-center mb-6">
        <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-emerald-100 text-xs font-semibold mb-4 tracking-wider uppercase">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Government of India • Ministry of Education
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          VeriCheck AI Approval Portal
        </h1>
        <p className="mt-2 text-sm text-emerald-200">
          Institution Applicant Gateway • Academic Cycle 2026-27
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-emerald-100 p-8">
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
              <School className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Institution Login</h2>
              <p className="text-xs text-gray-500">Sign in to submit and track EoA & Intake proposals</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Citizen / Applicant
          </span>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
            <p>{error}</p>
          </div>
        )}

        {/* 1-Click Demo Profiles */}
        <div className="mb-6 bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              1-Click Demo Profiles (Instant Login)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleLogin("applicant1@aicte-demo.in", "Demo@123")}
              className="text-left p-3 rounded-lg bg-white border border-emerald-200 hover:border-emerald-500 hover:shadow-md transition text-xs group"
            >
              <div className="font-semibold text-gray-900 group-hover:text-emerald-700">
                Apex Institute of Tech
              </div>
              <div className="text-gray-500 text-[11px]">applicant1@aicte-demo.in</div>
              <div className="text-emerald-600 font-medium text-[10px] mt-1">PID: 1-3324567891</div>
            </button>
            <button
              type="button"
              onClick={() => handleLogin("applicant2@aicte-demo.in", "Demo@123")}
              className="text-left p-3 rounded-lg bg-white border border-emerald-200 hover:border-emerald-500 hover:shadow-md transition text-xs group"
            >
              <div className="font-semibold text-gray-900 group-hover:text-emerald-700">
                Bharat Polytechnic
              </div>
              <div className="text-gray-500 text-[11px]">applicant2@aicte-demo.in</div>
              <div className="text-emerald-600 font-medium text-[10px] mt-1">PID: 1-4456789123</div>
            </button>
          </div>
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
              Registered College Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              placeholder="e.g. principal@college.ac.in"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Portal Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              placeholder="Demo@123"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg shadow hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In to Applicant Dashboard"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>AICTE National Portal v1.0 (SIH 26261)</span>
          <span className="font-medium text-emerald-700">Port 5173</span>
        </div>
      </div>
    </div>
  );
}
