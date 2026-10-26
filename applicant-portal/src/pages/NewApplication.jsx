import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Info,
  Check
} from "lucide-react";
import api from "../services/api";

export default function NewApplication() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem("aicte_applicant_user");
  const user = userStr ? JSON.parse(userStr) : null;

  const [step, setStep] = useState(1);
  const [appType, setAppType] = useState("Extension of Approval");
  const [applicationId, setApplicationId] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [formData, setFormData] = useState({
    institution_name: user?.institution_name || "Apex Institute of Technology",
    permanent_id: user?.institution_perm_id || "1-3324567891",
    application_year: "2026-2027",
    programme: "Engineering & Technology",
    current_intake: 120,
    requested_intake: 180,
    trust_name: "Apex Education & Research Trust",
    contact_details: user?.email || "principal@apextech.ac.in",
  });

  const [uploadedDocs, setUploadedDocs] = useState({});
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [precheckReport, setPrecheckReport] = useState(null);
  const [runningPrecheck, setRunningPrecheck] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch checklist when appType changes
  useEffect(() => {
    async function loadChecklist() {
      try {
        const res = await api.get(`/config/checklist/${encodeURIComponent(appType)}`);
        setChecklist(res.data.required_documents || []);
      } catch (err) {
        console.error("Error loading checklist:", err);
      }
    }
    loadChecklist();
  }, [appType]);

  const handleCreateDraft = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/applications", {
        type: appType,
        form_data: formData,
      });
      setApplicationId(res.data.application_id);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create application draft.");
    }
  };

  const handleFileUpload = async (docCode, file) => {
    if (!applicationId || !file) return;
    setUploadingDoc(docCode);
    setError("");
    const form = new FormData();
    form.append("file", file);
    form.append("doc_type", docCode);

    try {
      const res = await api.post(`/applications/${applicationId}/documents`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadedDocs((prev) => ({
        ...prev,
        [docCode]: {
          fileName: file.name,
          extracted: res.data.extracted_fields,
        },
      }));
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to upload ${docCode}`);
    } finally {
      setUploadingDoc(null);
    }
  };

  // Helper to create synthetic sample PDF directly in browser
  const handleSyntheticSampleUpload = async (doc) => {
    // Generates a mock text/pdf blob for quick instant testing
    const content = `ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
Document Title: ${doc.name}
Institution Name: ${formData.institution_name}
Permanent Institute ID: ${formData.permanent_id}
Document Type: ${doc.code}
NOC No: NOC/2026/VALID/${doc.code}
Rs. 220 (Rupees Two Hundred Twenty Only)
Date of Issue: 2026-02-15
Valid Upto: 2027-06-30
Approved Intake: ${formData.current_intake}
Requested Intake: ${formData.requested_intake}
Trust Name: ${formData.trust_name}
Issuing Authority: Savitribai Phule Pune University
Solemnly affirmed and verified under AICTE Regulations 2026.`;

    const blob = new Blob([content], { type: "application/pdf" });
    const file = new File([blob], `${doc.code}_sample_document.pdf`, { type: "application/pdf" });
    await handleFileUpload(doc.code, file);
  };

  const handleRunPrecheck = async () => {
    if (!applicationId) return;
    setRunningPrecheck(true);
    setError("");
    try {
      const res = await api.post(`/applications/${applicationId}/precheck`);
      setPrecheckReport(res.data);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.detail || "Pre-check failed.");
    } finally {
      setRunningPrecheck(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!applicationId) return;
    setSubmitting(true);
    try {
      await api.post(`/applications/${applicationId}/submit`);
      navigate(`/application/${applicationId}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Final submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Wizard Progress Stepper */}
      <div className="mb-8 bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 1 ? "text-emerald-700" : "text-gray-400"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500"}`}>
              1
            </span>
            <span>Application Details</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-200 hidden sm:block"></div>
          <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 2 ? "text-emerald-700" : "text-gray-400"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500"}`}>
              2
            </span>
            <span>Document Checklist & Upload</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-200 hidden sm:block"></div>
          <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 3 ? "text-emerald-700" : "text-gray-400"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500"}`}>
              3
            </span>
            <span>AI Pre-Check & Submit</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Application Form */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">New Approval Application</h2>
          <p className="text-xs text-gray-500 mb-6">
            Configure application category and institutional baseline figures for AI scrutiny.
          </p>

          <form onSubmit={handleCreateDraft} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Application Category / Purpose
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setAppType("Extension of Approval")}
                  className={`p-4 rounded-xl border text-left transition ${
                    appType === "Extension of Approval"
                      ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                      : "border-gray-200 hover:border-emerald-300"
                  }`}
                >
                  <div className="font-bold text-sm text-gray-900">Extension of Approval (EoA)</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Annual continuation for existing approved programmes and intake.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setAppType("Increase in Intake")}
                  className={`p-4 rounded-xl border text-left transition ${
                    appType === "Increase in Intake"
                      ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                      : "border-gray-200 hover:border-emerald-300"
                  }`}
                >
                  <div className="font-bold text-sm text-gray-900">Increase in Intake (III)</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Expansion of sanctioned seat intake in eligible accredited courses.
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Institution Name
                </label>
                <input
                  type="text"
                  value={formData.institution_name}
                  onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  AICTE Permanent Institute ID
                </label>
                <input
                  type="text"
                  value={formData.permanent_id}
                  onChange={(e) => setFormData({ ...formData, permanent_id: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Programme / Discipline
                </label>
                <input
                  type="text"
                  value={formData.programme}
                  onChange={(e) => setFormData({ ...formData, programme: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Trust / Sponsoring Society Name
                </label>
                <input
                  type="text"
                  value={formData.trust_name}
                  onChange={(e) => setFormData({ ...formData, trust_name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Current Approved Intake
                </label>
                <input
                  type="number"
                  value={formData.current_intake}
                  onChange={(e) => setFormData({ ...formData, current_intake: parseInt(e.target.value) || 0 })}
                  required
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {appType === "Increase in Intake" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Requested New Intake (Expansion)
                  </label>
                  <input
                    type="number"
                    value={formData.requested_intake}
                    onChange={(e) => setFormData({ ...formData, requested_intake: parseInt(e.target.value) || 0 })}
                    required
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-xs transition"
              >
                <span>Save & Continue to Document Checklist</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: Dynamic Document Checklist & Upload */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Application #APP-{applicationId?.toString().padStart(4, "0")}
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-0.5">Required Document Checklist</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Config-driven checklist for {appType}. Upload PDF/images. AI extracts fields instantly.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRunPrecheck}
                disabled={runningPrecheck}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow hover:shadow-md transition disabled:opacity-50"
              >
                {runningPrecheck ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Running AI Pre-Check...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run Pre-Check</span>
                  </>
                )}
              </button>
            </div>

            {/* Document slots */}
            <div className="mt-6 space-y-4">
              {checklist.map((doc) => {
                const isUploaded = !!uploadedDocs[doc.code];
                const docData = uploadedDocs[doc.code];
                const isUploading = uploadingDoc === doc.code;

                return (
                  <div
                    key={doc.code}
                    className={`p-4 rounded-xl border transition ${
                      isUploaded
                        ? "bg-emerald-50/30 border-emerald-200"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">{doc.name}</span>
                          {doc.required && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-600 rounded">
                              Mandatory
                            </span>
                          )}
                          {doc.min_stamp_value && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                              Min Rs. {doc.min_stamp_value} Stamp
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{doc.description}</p>

                        {/* Extracted preview chips */}
                        {isUploaded && docData.extracted && (
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {docData.extracted.document_number && (
                              <span className="text-[11px] bg-white border border-emerald-300 text-emerald-800 px-2 py-0.5 rounded font-mono">
                                Doc #{docData.extracted.document_number}
                              </span>
                            )}
                            {docData.extracted.stamp_paper_value && (
                              <span className="text-[11px] bg-white border border-emerald-300 text-emerald-800 px-2 py-0.5 rounded">
                                Stamp: Rs. {docData.extracted.stamp_paper_value}
                              </span>
                            )}
                            {docData.extracted.expiry_date && (
                              <span className="text-[11px] bg-white border border-emerald-300 text-emerald-800 px-2 py-0.5 rounded">
                                Valid Till: {docData.extracted.expiry_date}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Upload actions */}
                      <div className="flex items-center gap-2 sm:self-center">
                        {isUploaded ? (
                          <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold bg-white border border-emerald-300 px-3 py-1.5 rounded-lg">
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span className="truncate max-w-[140px]">{docData.fileName}</span>
                          </div>
                        ) : null}

                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:border-emerald-500 rounded-lg shadow-2xs hover:shadow-xs transition">
                          <UploadCloud className="w-4 h-4 text-emerald-600" />
                          <span>{isUploaded ? "Replace" : "Upload File"}</span>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleFileUpload(doc.code, e.target.files[0]);
                              }
                            }}
                            className="hidden"
                          />
                        </label>

                        {/* 1-Click synthetic sample upload helper */}
                        <button
                          type="button"
                          onClick={() => handleSyntheticSampleUpload(doc)}
                          disabled={isUploading}
                          className="px-2.5 py-1.5 text-[11px] font-medium text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200/80 rounded-lg transition"
                          title="Auto-generate and attach compliant synthetic sample"
                        >
                          {isUploading ? "Uploading..." : "Demo Sample"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: AI Pre-Check Findings & Final Submit */}
      {step === 3 && precheckReport && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Pre-Check Report
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-0.5">
                  Automated Decision-Support Analysis
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Advisory Overall Status:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                    precheckReport.overall_status === "Clear"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : precheckReport.overall_status === "Deficient"
                      ? "bg-rose-100 text-rose-800 border border-rose-200"
                      : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}
                >
                  {precheckReport.overall_status}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              Review any deficiencies or possible anomalies detected below before locking your submission.
              You can rectify documents now or proceed to final submit.
            </p>

            {/* Findings list */}
            <div className="mt-6 space-y-3">
              {precheckReport.findings.map((finding) => (
                <div
                  key={finding.id || finding.rule_id}
                  className={`p-4 rounded-xl border text-xs ${
                    finding.status === "FAIL"
                      ? "bg-rose-50/40 border-rose-200 text-rose-900"
                      : finding.status === "PASS"
                      ? "bg-emerald-50/40 border-emerald-200 text-emerald-900"
                      : "bg-amber-50/40 border-amber-200 text-amber-900"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      {finding.status === "FAIL" ? (
                        <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                      ) : finding.status === "PASS" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-sm text-gray-900">{finding.check_name}</div>
                        <div className="text-gray-700 mt-1">{finding.reason}</div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        finding.severity === "HIGH"
                          ? "bg-rose-100 text-rose-800"
                          : finding.severity === "MEDIUM"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {finding.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold transition"
              >
                Back to Documents
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRunPrecheck}
                  disabled={runningPrecheck}
                  className="px-4 py-2 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${runningPrecheck ? "animate-spin" : ""}`} />
                  Re-run Pre-check
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow hover:shadow-md transition flex items-center gap-2"
                >
                  {submitting ? "Submitting..." : "Confirm & Final Submit"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
