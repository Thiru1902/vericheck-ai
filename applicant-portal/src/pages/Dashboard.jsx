import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  PlusCircle,
  ExternalLink,
  RefreshCw,
  Search,
  AlertCircle
} from "lucide-react";
import api from "../services/api";

export default function Dashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/applications");
      setApplications(res.data);
    } catch (err) {
      setError("Failed to load your applications. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const filteredApps = applications.filter((app) =>
    app.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.id.toString().includes(searchTerm) ||
    app.overall_status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status, overall) => {
    if (status === "Rectification Requested") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
          <AlertCircle className="w-3.5 h-3.5" /> Rectification Requested
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

  const totalApps = applications.length;
  const clearApps = applications.filter((a) => a.overall_status === "Clear").length;
  const deficientApps = applications.filter((a) => a.overall_status === "Deficient").length;
  const reviewApps = applications.filter((a) => a.overall_status === "Needs Manual Review").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Call to Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Institutional Applications
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Submit, run pre-checks, and track status for AICTE annual approval & intake expansion cycles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchApplications}
            className="p-2.5 text-gray-600 hover:text-emerald-700 bg-white border border-gray-200 hover:border-emerald-300 rounded-xl transition shadow-xs"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          </button>
          <Link
            to="/new-application"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Application</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Total Applications
          </div>
          <div className="text-2xl font-extrabold text-gray-900">{totalApps}</div>
          <div className="text-xs text-gray-400 mt-1">Current Academic Cycle</div>
        </div>
        <div className="bg-white border border-emerald-200/80 rounded-2xl p-5 shadow-xs bg-gradient-to-br from-white to-emerald-50/40">
          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
            Clear / Pre-check Passed
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">{clearApps}</div>
          <div className="text-xs text-emerald-600 mt-1">Ready for Scrutiny</div>
        </div>
        <div className="bg-white border border-amber-200/80 rounded-2xl p-5 shadow-xs bg-gradient-to-br from-white to-amber-50/40">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            Needs Manual Review
          </div>
          <div className="text-2xl font-extrabold text-amber-700">{reviewApps}</div>
          <div className="text-xs text-amber-600 mt-1">Minor Anomalies / Warnings</div>
        </div>
        <div className="bg-white border border-rose-200/80 rounded-2xl p-5 shadow-xs bg-gradient-to-br from-white to-rose-50/40">
          <div className="text-xs font-semibold text-rose-700 uppercase tracking-wider mb-1">
            Deficient / Action Needed
          </div>
          <div className="text-2xl font-extrabold text-rose-700">{deficientApps}</div>
          <div className="text-xs text-rose-600 mt-1">Requires Rectification</div>
        </div>
      </div>

      {/* Applications Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/60">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search application by type, ID, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white outline-none transition"
            />
          </div>
          <div className="text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-700">{filteredApps.length}</span> of {totalApps} applications
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-3" />
            <p className="text-sm">Fetching applications from AICTE server...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="py-16 text-center">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl inline-block mb-3">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900">No Applications Found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Start by submitting an Extension of Approval (EoA) or Increase in Intake proposal.
            </p>
            <Link
              to="/new-application"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
            >
              <PlusCircle className="w-4 h-4" /> Start Application
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase font-bold text-[11px] tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">App ID</th>
                  <th className="py-3.5 px-4">Application Type</th>
                  <th className="py-3.5 px-4">AI Advisory Status</th>
                  <th className="py-3.5 px-4">Documents</th>
                  <th className="py-3.5 px-4">Pre-Check Findings</th>
                  <th className="py-3.5 px-4">Submitted At</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-emerald-50/30 transition">
                    <td className="py-4 px-4 sm:px-6 font-mono font-bold text-gray-900">
                      APP-{app.id.toString().padStart(4, "0")}
                    </td>
                    <td className="py-4 px-4 font-semibold text-gray-800">
                      {app.type}
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(app.status, app.overall_status)}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      <span className="font-semibold text-gray-900">{app.documents_count}</span> files
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {app.fails_count > 0 && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700">
                            {app.fails_count} Critical
                          </span>
                        )}
                        {app.warnings_count > 0 && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-700">
                            {app.warnings_count} Warnings
                          </span>
                        )}
                        {app.fails_count === 0 && app.warnings_count === 0 && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-700">
                            All Passed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-500 text-xs">
                      {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      }) : "Draft (Not submitted)"}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <Link
                        to={`/application/${app.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition"
                      >
                        <span>View & Rectify</span>
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
