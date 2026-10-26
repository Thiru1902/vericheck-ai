import React, { useState, useEffect } from "react";
import {
  BarChart3,
  FileCheck2,
  Clock,
  Sparkles,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Hourglass
} from "lucide-react";
import api from "../services/api";

export default function Metrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.get("/officer/metrics");
      setMetrics(res.data);
    } catch (err) {
      setError("Failed to load metrics data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
        <p className="text-sm">Calculating council operational KPIs...</p>
      </div>
    );
  }

  const dist = metrics?.status_distribution || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Scrutiny Performance & Impact Analytics
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            System throughput, automated checks executed, human hours conserved, and anomaly distributions.
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          className="self-start sm:self-center inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:border-blue-500 rounded-xl transition shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Documents Processed</span>
            <FileCheck2 className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {metrics.total_documents_processed}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Across {metrics.total_applications} institutions
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>AI Validation Speed</span>
            <Clock className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-700 mt-2">
            {metrics.average_validation_time_sec}s
          </div>
          <div className="text-xs text-emerald-600 mt-1">
            Avg per application (instant pre-check)
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Effort Saved</span>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-purple-700 mt-2">
            {metrics.estimated_manual_effort_saved_hours} hrs
          </div>
          <div className="text-xs text-purple-600 mt-1">
            Calculated at 35 mins / manual file review
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Flags Raised</span>
            <ShieldAlert className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-700 mt-2">
            {metrics.total_flags_raised}
          </div>
          <div className="text-xs text-amber-600 mt-1">
            {metrics.critical_deficiencies} Critical • {metrics.advisory_warnings} Advisory
          </div>
        </div>
      </div>

      {/* Distribution Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            First-Level AI Advisory Determination Breakdown
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Clear / Compliant ({dist.Clear || 0})
                </span>
                <span>
                  {Math.round(((dist.Clear || 0) / (metrics.total_applications || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-3 rounded-full"
                  style={{ width: `${((dist.Clear || 0) / (metrics.total_applications || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-amber-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Needs Manual Review ({dist["Needs Manual Review"] || 0})
                </span>
                <span>
                  {Math.round((((dist["Needs Manual Review"] || 0)) / (metrics.total_applications || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-amber-500 h-3 rounded-full"
                  style={{ width: `${(((dist["Needs Manual Review"] || 0)) / (metrics.total_applications || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-rose-700 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Deficient / Incomplete ({dist.Deficient || 0})
                </span>
                <span>
                  {Math.round(((dist.Deficient || 0) / (metrics.total_applications || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-rose-500 h-3 rounded-full"
                  style={{ width: `${((dist.Deficient || 0) / (metrics.total_applications || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Card */}
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/20 px-3 py-1 rounded-full text-blue-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Decision-Support System Value
            </div>
            <h2 className="text-lg font-bold">First-Level Scrutiny Automation Impact</h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              By automatically verifying SHA-256 duplicate hashes, Rs. 220 stamp paper values, university affiliation
              dates, and seat intake consistency, the AI engine pre-screens 100% of clerical and cross-reference tasks.
              AICTE officers focus human expertise strictly on edge cases, site inspections, and regulatory adjudication.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-700/60 mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>AICTE Approval Process Handbook (APH) 2026-27</span>
            <span className="font-bold text-white">Advisory Decision Support</span>
          </div>
        </div>
      </div>
    </div>
  );
}
