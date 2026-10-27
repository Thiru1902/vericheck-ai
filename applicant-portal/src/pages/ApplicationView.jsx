import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  UploadCloud,
  FileCheck2
} from "lucide-react";
import api, { API_BASE_URL } from "../services/api";

export default function ApplicationView() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reuploading, setReuploading] = useState(null);

  const fetchApplication = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/applications/${id}`);
      setApp(res.data);
    } catch (err) {
      setError("Failed to load application details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const handleReupload = async (docType, file) => {
    if (!file) return;
    setReuploading(docType);
    const form = new FormData();
    form.append("file", file);
    form.append("doc_type", docType);

    try {
      await api.post(`/applications/${id}/documents`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Re-run pre-check after upload
      await api.post(`/applications/${id}/precheck`);
      await fetchApplication();
    } catch (err) {
      alert(err.response?.data?.detail || "Re-upload failed.");
    } finally {
      setReuploading(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-gray-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-3" />
        <p className="text-sm">Loading application record...</p>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="p-4 bg-rose-50 text-rose-700 rounded-xl inline-block mb-3">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">{error || "Application not found"}</h2>
        <Link to="/" className="mt-4 inline-block text-emerald-600 font-semibold text-xs hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const formData = app.form_data || {};
  const isRectificationRequested = app.status === "Rectification Requested";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-emerald-700 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Applications
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Application #APP-{app.id.toString().padStart(4, "0")}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                app.overall_status === "Clear"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : app.overall_status === "Deficient"
                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                  : "bg-amber-100 text-amber-800 border border-amber-200"
              }`}
            >
              AI Advisory: {app.overall_status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Category: <span className="font-semibold text-gray-800">{app.type}</span> • Submitted:{" "}
            <span className="font-semibold text-gray-800">
              {app.submitted_at ? new Date(app.submitted_at).toLocaleString("en-IN") : "Draft"}
            </span>
          </p>
        </div>

        <button
          onClick={fetchApplication}
          className="self-start sm:self-center inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:border-emerald-400 rounded-xl shadow-2xs transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Officer Remarks / Rectification Alert Banner */}
      {isRectificationRequested && (
        <div className="p-5 bg-purple-50 border-2 border-purple-200 rounded-2xl text-purple-900 flex items-start gap-4 shadow-xs">
          <AlertCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-purple-900">
              Action Required: AICTE Scrutiny Officer Requested Rectification
            </h3>
            <p className="text-xs text-purple-800 mt-1">
              {app.officer_notes || "Please inspect the flagged document deficiencies below and re-upload verified files."}
            </p>
            <div className="mt-2 text-[11px] font-semibold text-purple-700">
              You may replace flagged documents directly using the upload buttons below.
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout: Application Info & Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Details */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <FileText className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-gray-900">Application Particulars</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-gray-400 block font-medium">Institution Name</span>
              <span className="font-bold text-gray-900">{formData.institution_name || app.institution?.name}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Permanent AICTE ID</span>
              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded inline-block mt-0.5">
                {formData.permanent_id || app.institution?.permanent_id}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Programme</span>
              <span className="font-semibold text-gray-800">{formData.programme || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Approved Current Intake</span>
              <span className="font-bold text-gray-900">{formData.current_intake || "N/A"} seats</span>
            </div>
            {formData.requested_intake && (
              <div>
                <span className="text-gray-400 block font-medium">Requested Expansion Intake</span>
                <span className="font-bold text-emerald-700">{formData.requested_intake} seats</span>
              </div>
            )}
            <div>
              <span className="text-gray-400 block font-medium">Trust / Society</span>
              <span className="font-semibold text-gray-800">{formData.trust_name || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Scrutiny State & Status</span>
              <span className="font-semibold text-gray-800">{app.status}</span>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Documents & Findings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Documents Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-gray-900">Attached Regulatory Documents</h2>
              </div>
              <span className="text-xs text-gray-500 font-semibold">{app.documents.length} Files</span>
            </div>

            <div className="divide-y divide-gray-100">
              {app.documents.map((doc) => (
                <div key={doc.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-gray-900">{doc.doc_type}</div>
                    <div className="text-gray-500 text-[11px] font-mono mt-0.5">{doc.file_name}</div>
                    {doc.extracted_fields?.document_number && (
                      <span className="inline-block mt-1 text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-mono">
                        Doc #{doc.extracted_fields.document_number}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`${API_BASE_URL}${doc.preview_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </a>

                    {isRectificationRequested && (
                      <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{reuploading === doc.doc_type ? "Uploading..." : "Replace"}</span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleReupload(doc.doc_type, e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validation Report Findings Table */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-gray-900">AI Advisory Pre-Check Findings</h2>
              </div>
              <span className="text-[11px] text-gray-500">Advisory Decision-Support</span>
            </div>

            <div className="space-y-3">
              {app.findings.map((f) => (
                <div
                  key={f.id}
                  className={`p-3.5 rounded-xl border text-xs ${
                    f.status === "FAIL"
                      ? "bg-rose-50/50 border-rose-200 text-rose-900"
                      : f.status === "PASS"
                      ? "bg-emerald-50/50 border-emerald-200 text-emerald-900"
                      : "bg-amber-50/50 border-amber-200 text-amber-900"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-bold text-gray-900 block">{f.check_name}</span>
                      <p className="text-gray-700 mt-1">{f.reason}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${
                        f.severity === "HIGH"
                          ? "bg-rose-100 text-rose-800"
                          : f.severity === "MEDIUM"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {f.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
