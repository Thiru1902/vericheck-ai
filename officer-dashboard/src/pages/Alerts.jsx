import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BellRing,
  AlertTriangle,
  Clock,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  FileX,
  FileQuestion,
  ShieldAlert
} from "lucide-react";
import api from "../services/api";

export default function Alerts() {
  const [alerts, setAlerts] = useState({
    missing_info: [],
    expired_docs: [],
    pending_source_verification: [],
    suspected_anomalies: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/officer/alerts");
      setAlerts(res.data);
    } catch (err) {
      setError("Failed to fetch pending action alerts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const totalCount =
    (alerts.missing_info?.length || 0) +
    (alerts.expired_docs?.length || 0) +
    (alerts.pending_source_verification?.length || 0) +
    (alerts.suspected_anomalies?.length || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <BellRing className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Regulatory Action Alerts Panel
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Prioritized queues requiring officer inspection: deficiencies, lapsed certificates, gateway delays, and anomalies.
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="self-start sm:self-center inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:border-blue-500 rounded-xl transition shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Alert Category Filter Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab("suspected_anomalies")}
          className={`p-4 rounded-xl border text-left transition ${
            activeTab === "suspected_anomalies"
              ? "bg-rose-50 border-rose-500 ring-2 ring-rose-500/20"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
              Suspected Anomalies
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1">
            {alerts.suspected_anomalies?.length || 0}
          </div>
          <div className="text-[11px] text-rose-600/80 mt-0.5">Duplicate SHA, stamp &lt; Rs.220</div>
        </button>

        <button
          onClick={() => setActiveTab("expired_docs")}
          className={`p-4 rounded-xl border text-left transition ${
            activeTab === "expired_docs"
              ? "bg-amber-50 border-amber-500 ring-2 ring-amber-500/20"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              Expired Certificates
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {alerts.expired_docs?.length || 0}
          </div>
          <div className="text-[11px] text-amber-600/80 mt-0.5">Lapsed NOCs / Validity</div>
        </button>

        <button
          onClick={() => setActiveTab("pending_source_verification")}
          className={`p-4 rounded-xl border text-left transition ${
            activeTab === "pending_source_verification"
              ? "bg-purple-50 border-purple-500 ring-2 ring-purple-500/20"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
              Source Unavailable
            </span>
            <FileQuestion className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700 mt-1">
            {alerts.pending_source_verification?.length || 0}
          </div>
          <div className="text-[11px] text-purple-600/80 mt-0.5">External Gateway Timeouts</div>
        </button>

        <button
          onClick={() => setActiveTab("missing_info")}
          className={`p-4 rounded-xl border text-left transition ${
            activeTab === "missing_info"
              ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500/20"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
              Missing Info
            </span>
            <FileX className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {alerts.missing_info?.length || 0}
          </div>
          <div className="text-[11px] text-blue-600/80 mt-0.5">Omitted Mandatory Docs</div>
        </button>
      </div>

      {/* Alerts Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Active Attention Items ({totalCount})
          </span>
          <button
            onClick={() => setActiveTab("all")}
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            Show All Categories
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
            <p className="text-sm">Scanning active alert streams...</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {[
              ...(activeTab === "all" || activeTab === "suspected_anomalies" ? alerts.suspected_anomalies : []),
              ...(activeTab === "all" || activeTab === "expired_docs" ? alerts.expired_docs : []),
              ...(activeTab === "all" || activeTab === "pending_source_verification" ? alerts.pending_source_verification : []),
              ...(activeTab === "all" || activeTab === "missing_info" ? alerts.missing_info : [])
            ].map((item, idx) => (
              <div key={idx} className="p-4 sm:p-5 hover:bg-slate-50/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{item.check_name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        item.severity === "HIGH"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.severity}
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      APP-{item.application_id.toString().padStart(4, "0")}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-semibold">{item.institution_name}</div>
                  <p className="text-xs text-slate-700 max-w-3xl leading-relaxed">{item.reason}</p>
                </div>

                <Link
                  to={`/application/${item.application_id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs transition self-start sm:self-center"
                >
                  <span>Scrutinize</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
