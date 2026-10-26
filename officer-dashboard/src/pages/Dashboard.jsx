import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  RefreshCw,
  ExternalLink,
  BellRing,
  AlertCircle,
  Building2,
  Layers
} from "lucide-react";
import api from "../services/api";

export default function Dashboard() {
  const [data, setData] = useState({ applications: [], status_counts: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [alertsSummary, setAlertsSummary] = useState(null);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (typeFilter !== "ALL") params.type = typeFilter;
      if (search) params.search = search;

      const res = await api.get("/officer/applications", { params });
      setData(res.data);

      // Also fetch alerts quick count
      const alertsRes = await api.get("/officer/alerts");
      setAlertsSummary(alertsRes.data);
    } catch (err) {
      setError("Failed to load scrutiny applications. Ensure backend is active.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApplications();
  };

  const getStatusBadge = (status, overall) => {
    if (status === "Rectification Requested") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
          <AlertCircle className="w-3.5 h-3.5" /> Rectification Requested
        </span>
      );
    }
    if (status === "Escalated for Inspection") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
          <AlertTriangle className="w-3.5 h-3.5" /> Escalated
        </span>
      );
    }
    if (status === "Reviewed") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> Reviewed
        </span>
      );
    }
    if (overall === "Clear") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> Clear
        </span>
      );
    }
    if (overall === "Deficient") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          <AlertTriangle className="w-3.5 h-3.5" /> Deficient
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
        <Clock className="w-3.5 h-3.5" /> Needs Manual Review
      </span>
    );
  };

  const counts = data.status_counts || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            AICTE Applications Scrutiny Console
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Advisory decision-support engine • First-level automated compliance and anomaly detection
          </p>
        </div>
        <button
          onClick={fetchApplications}
          className="self-start sm:self-center inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:border-blue-500 rounded-xl shadow-2xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`p-4 rounded-xl border text-left transition ${
            statusFilter === "ALL"
              ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500/20"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">All Applications</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{counts.ALL || 0}</div>
        </button>

        <button
          onClick={() => setStatusFilter("Clear")}
          className={`p-4 rounded-xl border text-left transition ${
            statusFilter === "Clear"
              ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Clear</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{counts.Clear || 0}</div>
        </button>

        <button
          onClick={() => setStatusFilter("Needs Manual Review")}
          className={`p-4 rounded-xl border text-left transition ${
            statusFilter === "Needs Manual Review"
              ? "bg-amber-50 border-amber-500 ring-2 ring-amber-500/20"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Manual Review</div>
          <div className="text-2xl font-black text-amber-700 mt-1">{counts["Needs Manual Review"] || 0}</div>
        </button>

        <button
          onClick={() => setStatusFilter("Deficient")}
          className={`p-4 rounded-xl border text-left transition ${
            statusFilter === "Deficient"
              ? "bg-rose-50 border-rose-500 ring-2 ring-rose-500/20"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">Deficient</div>
          <div className="text-2xl font-black text-rose-700 mt-1">{counts.Deficient || 0}</div>
        </button>

        <button
          onClick={() => setStatusFilter("Rectification Requested")}
          className={`p-4 rounded-xl border text-left transition ${
            statusFilter === "Rectification Requested"
              ? "bg-purple-50 border-purple-500 ring-2 ring-purple-500/20"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">Rectification</div>
          <div className="text-2xl font-black text-purple-700 mt-1">{counts["Rectification Requested"] || 0}</div>
        </button>

        <button
          onClick={() => setStatusFilter("Escalated")}
          className={`p-4 rounded-xl border text-left transition ${
            statusFilter === "Escalated"
              ? "bg-red-50 border-red-500 ring-2 ring-red-500/20"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="text-[11px] font-semibold text-red-700 uppercase tracking-wider">Escalated</div>
          <div className="text-2xl font-black text-red-700 mt-1">{counts.Escalated || 0}</div>
        </button>
      </div>

      {/* Pending Actions Quick Banner */}
      {alertsSummary && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-4 sm:p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-300">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold">Pending Actions Alert Stream</div>
              <div className="text-xs text-blue-200 mt-0.5 flex flex-wrap items-center gap-3">
                <span>{alertsSummary.missing_info?.length || 0} Missing Info</span> •
                <span>{alertsSummary.expired_docs?.length || 0} Expired Certificates</span> •
                <span>{alertsSummary.pending_source_verification?.length || 0} Gateway Timeouts</span> •
                <span>{alertsSummary.suspected_anomalies?.length || 0} Suspected Anomalies</span>
              </div>
            </div>
          </div>
          <Link
            to="/alerts"
            className="self-start md:self-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition"
          >
            Review All Alerts
          </Link>
        </div>
      )}

      {/* Applications Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filters Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Institution, Permanent ID, or App ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white outline-none"
            />
          </form>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Category:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-semibold text-slate-700 outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="Extension of Approval">Extension of Approval</option>
                <option value="Increase in Intake">Increase in Intake</option>
              </select>
            </div>

            <div className="text-slate-500">
              Showing <span className="font-bold text-slate-800">{data.applications.length}</span> records
            </div>
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
            <p className="text-sm">Fetching applications from registry...</p>
          </div>
        ) : data.applications.length === 0 ? (
          <div className="py-20 text-center">
            <div className="p-4 bg-slate-100 text-slate-500 rounded-2xl inline-block mb-3">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Applications Matched</h3>
            <p className="text-xs text-slate-500 mt-1">Try resetting the status or category filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">App ID</th>
                  <th className="py-3.5 px-4">Institution & Permanent ID</th>
                  <th className="py-3.5 px-4">State</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">AI Advisory Status</th>
                  <th className="py-3.5 px-4">Audit Flags</th>
                  <th className="py-3.5 px-4">Submitted</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Scrutiny</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.applications.map((app) => (
                  <tr key={app.id} className="hover:bg-blue-50/30 transition">
                    <td className="py-4 px-4 sm:px-6 font-mono font-bold text-slate-900">
                      APP-{app.id.toString().padStart(4, "0")}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{app.institution_name}</div>
                      <div className="text-[11px] font-mono text-blue-700">{app.permanent_id}</div>
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-medium">
                      {app.state}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      {app.type}
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(app.status, app.overall_status)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        {app.fails_count > 0 && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                            {app.fails_count} Critical
                          </span>
                        )}
                        {app.warnings_count > 0 && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                            {app.warnings_count} Advisory
                          </span>
                        )}
                        {app.fails_count === 0 && app.warnings_count === 0 && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            Clear
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-500 text-xs">
                      {app.submitted_at
                        ? new Date(app.submitted_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })
                        : "Draft"}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <Link
                        to={`/application/${app.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-2xs hover:shadow-xs transition"
                      >
                        <span>Scrutinize</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
