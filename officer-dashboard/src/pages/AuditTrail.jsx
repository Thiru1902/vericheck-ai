import React, { useState, useEffect } from "react";
import { History, Search, RefreshCw, AlertCircle, ChevronDown, ChevronUp, User, ShieldCheck } from "lucide-react";
import api from "../services/api";

export default function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const res = await api.get("/officer/audit");
      setLogs(res.data);
    } catch (err) {
      setError("Failed to load audit trail.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actor.toLowerCase().includes(search.toLowerCase()) ||
      l.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Regulatory Audit Trail & Event Ledger
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Immutable log of every rule executed, issuing registry response, pre-check query, and officer determination.
          </p>
        </div>

        <button
          onClick={fetchAudit}
          className="self-start sm:self-center inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:border-blue-500 rounded-xl transition shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Audit Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by action, actor, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            />
          </div>
          <div className="text-xs text-slate-500">
            Total Logged Events: <span className="font-bold text-slate-800">{filteredLogs.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
            <p className="text-sm">Fetching ledger events...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">No audit events matched your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Timestamp (UTC)</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Action Event</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Details Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 sm:px-6 font-mono text-slate-600">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString("en-IN") : "N/A"}
                        </td>
                        <td className="py-3 px-4 text-slate-900 font-bold">{log.actor}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              log.role === "officer"
                                ? "bg-blue-100 text-blue-800"
                                : log.role === "applicant"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {log.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-800">{log.action}</td>
                        <td className="py-3 px-4 sm:px-6 text-right">
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            <span>{isExpanded ? "Collapse" : "Inspect"}</span>
                          </button>
                        </td>
                      </tr>
                      {isExpanded && log.details && (
                        <tr>
                          <td colSpan={5} className="bg-slate-50 p-4 px-6 border-b border-slate-200">
                            <pre className="text-[11px] font-mono text-slate-800 bg-white p-3 rounded-lg border border-slate-200 overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
