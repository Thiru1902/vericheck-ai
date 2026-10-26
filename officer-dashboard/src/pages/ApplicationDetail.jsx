import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Building2,
  FileSearch,
  Eye,
  Check,
  X,
  MessageSquare,
  AlertCircle,
  FileCheck2,
  RefreshCw,
  Send,
  HelpCircle,
  Layers,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import api from "../services/api";

export default function ApplicationDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [expandedEvidence, setExpandedEvidence] = useState({});

  // Action Modals
  const [actionModal, setActionModal] = useState({ open: false, type: "", findingId: null, text: "" });
  const [overallModal, setOverallModal] = useState({ open: false, action: "", notes: "" });
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/officer/applications/${id}/report`);
      setReport(res.data);
      if (res.data.documents?.length > 0 && !selectedDocId) {
        setSelectedDocId(res.data.documents[0].id);
      }
    } catch (err) {
      setError("Failed to load application scrutiny report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  const toggleEvidence = (findingId) => {
    setExpandedEvidence((prev) => ({
      ...prev,
      [findingId]: !prev[findingId],
    }));
  };

  const handleFindingDecision = async (findingId, decision, remark) => {
    setSubmittingAction(true);
    try {
      await api.patch(`/findings/${findingId}`, { decision, remark });
      await fetchReport();
      setActionModal({ open: false, type: "", findingId: null, text: "" });
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update finding decision.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleOverallDecision = async () => {
    if (!overallModal.action) return;
    setSubmittingAction(true);
    try {
      await api.post(`/applications/${id}/decision`, {
        action: overallModal.action,
        notes: overallModal.notes,
      });
      await fetchReport();
      setOverallModal({ open: false, action: "", notes: "" });
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to record scrutiny decision.");
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
        <p className="text-sm">Synthesizing application scrutiny report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl inline-block mb-3">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">{error || "Report not found"}</h2>
        <Link to="/" className="mt-4 inline-block text-blue-600 font-semibold text-xs hover:underline">
          Return to Scrutiny Dashboard
        </Link>
      </div>
    );
  }

  const { application_data, documents, findings } = report;
  const currentDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700 mb-1 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Scrutiny Dossier: APP-{application_data.id.toString().padStart(4, "0")}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                application_data.overall_status === "Clear"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : application_data.overall_status === "Deficient"
                  ? "bg-rose-100 text-rose-800 border border-rose-300"
                  : "bg-amber-100 text-amber-800 border border-amber-300"
              }`}
            >
              AI Advisory: {application_data.overall_status}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              State: {application_data.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {application_data.institution?.name} • PID:{" "}
            <span className="font-mono font-bold text-slate-700">{application_data.institution?.permanent_id}</span> •
            Submitted: {application_data.submitted_at ? new Date(application_data.submitted_at).toLocaleString("en-IN") : "Draft"}
          </p>
        </div>

        {/* Top Overall Action Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOverallModal({ open: true, action: "Request Rectification", notes: "" })}
            className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-300 rounded-xl text-xs font-bold shadow-2xs transition"
          >
            Request Rectification
          </button>
          <button
            onClick={() => setOverallModal({ open: true, action: "Escalate for Inspection", notes: "" })}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold shadow-2xs transition"
          >
            Escalate for Inspection
          </button>
          <button
            onClick={() => setOverallModal({ open: true, action: "Mark Reviewed", notes: "" })}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow hover:shadow-md transition"
          >
            Mark Reviewed
          </button>
        </div>
      </div>

      {/* THREE-PANEL CORE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* PANEL 1: Application Form Data (3 cols) */}
        <section aria-labelledby="form-particulars-title" className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h2 id="form-particulars-title" className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              1. Application Form Data
            </h2>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Institution Name</span>
              <span className="font-bold text-slate-900 text-sm block">
                {application_data.institution?.name}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 block font-medium">Permanent ID</span>
                <span className="font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded inline-block mt-0.5">
                  {application_data.institution?.permanent_id}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">State / Region</span>
                <span className="font-semibold text-slate-800">{application_data.institution?.state}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Application Purpose</span>
              <span className="font-bold text-slate-800">{application_data.type}</span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Programme</span>
              <span className="font-medium text-slate-800">{application_data.form_data?.programme || "Engineering & Tech"}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Approved Current Intake</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {application_data.form_data?.current_intake || "N/A"} seats
                </span>
              </div>
              {application_data.form_data?.requested_intake && (
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Requested Intake</span>
                  <span className="font-extrabold text-blue-700 text-sm">
                    {application_data.form_data?.requested_intake} seats
                  </span>
                </div>
              )}
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Trust / Society</span>
              <span className="font-medium text-slate-800">{application_data.form_data?.trust_name || "N/A"}</span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Contact Particulars</span>
              <span className="font-mono text-[11px] text-slate-600 block">
                {application_data.form_data?.contact_details || application_data.institution?.contact_email}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Campus Address</span>
              <span className="text-slate-600 block leading-relaxed">
                {application_data.institution?.address || "N/A"}
              </span>
            </div>

            {application_data.officer_notes && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-xs">
                <span className="font-bold block text-purple-950">Previous Officer Remark:</span>
                <span className="mt-1 block">{application_data.officer_notes}</span>
              </div>
            )}
          </div>
        </section>

        {/* PANEL 2: Document Viewer (4 cols) */}
        <section aria-labelledby="doc-viewer-title" className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <h2 id="doc-viewer-title" className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                2. Document Viewer
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-semibold">{documents.length} Files</span>
          </div>

          {/* Document Switcher Tabs */}
          <div className="flex flex-wrap gap-1.5 pb-2">
            {documents.map((doc) => {
              const isSelected = doc.id === selectedDocId;
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    isSelected
                      ? "bg-[#0f2b48] text-white shadow-2xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      doc.status === "Valid"
                        ? "bg-emerald-400"
                        : doc.status === "Deficient"
                        ? "bg-rose-500"
                        : "bg-amber-400"
                    }`}
                  />
                  <span>{doc.doc_type}</span>
                </button>
              );
            })}
          </div>

          {/* Selected Document Metadata Card */}
          {currentDoc && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 truncate max-w-[200px]">
                    {currentDoc.file_name}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      currentDoc.status === "Valid"
                        ? "bg-emerald-100 text-emerald-800"
                        : currentDoc.status === "Deficient"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {currentDoc.status}
                  </span>
                </div>

                {/* Extracted Structured Fields Chips */}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {currentDoc.extracted_fields?.document_number && (
                    <span className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px] text-slate-800">
                      Doc No: {currentDoc.extracted_fields.document_number}
                    </span>
                  )}
                  {currentDoc.extracted_fields?.stamp_paper_value && (
                    <span className="px-2 py-0.5 bg-white border border-slate-300 rounded text-[10px] text-slate-800 font-semibold">
                      Stamp: Rs. {currentDoc.extracted_fields.stamp_paper_value}
                    </span>
                  )}
                  {currentDoc.extracted_fields?.issue_date && (
                    <span className="px-2 py-0.5 bg-white border border-slate-300 rounded text-[10px] text-slate-800">
                      Issued: {currentDoc.extracted_fields.issue_date}
                    </span>
                  )}
                  {currentDoc.extracted_fields?.expiry_date && (
                    <span className="px-2 py-0.5 bg-white border border-slate-300 rounded text-[10px] text-slate-800">
                      Expires: {currentDoc.extracted_fields.expiry_date}
                    </span>
                  )}
                  {currentDoc.extracted_fields?.issuing_authority && (
                    <span className="px-2 py-0.5 bg-white border border-slate-300 rounded text-[10px] text-slate-800">
                      Auth: {currentDoc.extracted_fields.issuing_authority}
                    </span>
                  )}
                </div>

                <div className="mt-2 text-[10px] font-mono text-slate-400 truncate" title={currentDoc.sha256}>
                  SHA256: {currentDoc.sha256}
                </div>
              </div>

              {/* Embedded Document Frame */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 shadow-inner relative h-[480px]">
                <iframe
                  src={`http://localhost:8000${currentDoc.preview_url}`}
                  className="w-full h-full"
                  title="Document Preview"
                />
                <a
                  href={`http://localhost:8000${currentDoc.preview_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-900 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1.5 shadow"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Screen</span>
                </a>
              </div>
            </div>
          )}
        </section>

        {/* PANEL 3: Validation Report Findings (5 cols) */}
        <section aria-labelledby="validation-findings-title" className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-blue-600" />
              <h2 id="validation-findings-title" className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                3. Validation Report & AI Findings
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-semibold">{findings.length} Checks Applied</span>
          </div>

          <p className="text-[11px] text-slate-500">
            Every rule check provides explainable reasoning and evidence. Use officer controls to accept, dismiss, or request clarification.
          </p>

          <div className="space-y-3.5 overflow-y-auto max-h-[640px] pr-1">
            {findings.map((finding) => {
              const isEvidenceExpanded = !!expandedEvidence[finding.id];

              return (
                <div
                  key={finding.id}
                  className={`p-4 rounded-xl border text-xs transition ${
                    finding.status === "FAIL"
                      ? "bg-rose-50/40 border-rose-200"
                      : finding.status === "PASS"
                      ? "bg-emerald-50/40 border-emerald-200"
                      : finding.status === "SOURCE_PENDING"
                      ? "bg-purple-50/40 border-purple-200"
                      : "bg-amber-50/40 border-amber-200"
                  }`}
                >
                  {/* Finding Title & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{finding.check_name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
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
                      <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                        Target: {finding.document_name} • Rule: <span className="font-mono">{finding.rule_id}</span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        finding.status === "FAIL"
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : finding.status === "PASS"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : finding.status === "SOURCE_PENDING"
                          ? "bg-purple-100 text-purple-800 border border-purple-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {finding.status}
                    </span>
                  </div>

                  {/* Plain Language Reason */}
                  <div className="mt-2 text-slate-700 leading-relaxed font-medium">
                    {finding.reason}
                  </div>

                  {/* Evidence Drawer Toggle */}
                  {finding.evidence && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60">
                      <button
                        onClick={() => toggleEvidence(finding.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 transition"
                      >
                        {isEvidenceExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        <span>{isEvidenceExpanded ? "Hide Evidence Details" : "View Extracted Evidence & Source Cross-Check"}</span>
                      </button>

                      {isEvidenceExpanded && (
                        <div className="mt-2 p-2.5 bg-white border border-slate-200 rounded-lg font-mono text-[11px] text-slate-700 space-y-1 overflow-x-auto">
                          <pre className="whitespace-pre-wrap">{JSON.stringify(finding.evidence, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Officer Action Controls */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px]">
                      <span className="text-slate-400">Officer Decision: </span>
                      <span
                        className={`font-bold ${
                          finding.officer_decision === "ACCEPTED"
                            ? "text-emerald-700"
                            : finding.officer_decision === "DISMISSED"
                            ? "text-slate-500 line-through"
                            : finding.officer_decision === "CLARIFICATION_REQUESTED"
                            ? "text-purple-700"
                            : "text-amber-700"
                        }`}
                      >
                        {finding.officer_decision}
                      </span>
                      {finding.officer_remark && (
                        <span className="text-slate-600 block italic mt-0.5">"{finding.officer_remark}"</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleFindingDecision(finding.id, "ACCEPTED", "Flag accepted by scrutiny officer.")}
                        disabled={submittingAction}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded transition flex items-center gap-1"
                        title="Accept this flag as a legitimate finding"
                      >
                        <Check className="w-3 h-3" /> Accept
                      </button>

                      <button
                        onClick={() => setActionModal({ open: true, type: "DISMISSED", findingId: finding.id, text: "" })}
                        disabled={submittingAction}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition flex items-center gap-1"
                        title="Dismiss flag with mandatory officer remark"
                      >
                        <X className="w-3 h-3" /> Dismiss
                      </button>

                      <button
                        onClick={() => setActionModal({ open: true, type: "CLARIFICATION_REQUESTED", findingId: finding.id, text: "" })}
                        disabled={submittingAction}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-purple-100 hover:bg-purple-200 text-purple-800 rounded transition flex items-center gap-1"
                        title="Request applicant clarification for this finding"
                      >
                        <MessageSquare className="w-3 h-3" /> Clarify
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* DISMISS / CLARIFICATION REMARK MODAL */}
      {actionModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {actionModal.type === "DISMISSED" ? "Dismiss Flag with Reason" : "Request Clarification"}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {actionModal.type === "DISMISSED"
                ? "Provide official justification for overriding this AI advisory flag."
                : "Enter query or documentation requirement for the college applicant."}
            </p>

            <textarea
              value={actionModal.text}
              onChange={(e) => setActionModal({ ...actionModal, text: e.target.value })}
              rows={3}
              required
              placeholder="e.g. Verified via university phone confirmation / Please submit stamped annexure..."
              className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActionModal({ open: false, type: "", findingId: null, text: "" })}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction || !actionModal.text.trim()}
                onClick={() => handleFindingDecision(actionModal.findingId, actionModal.type, actionModal.text)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {submittingAction ? "Recording..." : "Confirm Action"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERALL DECISION MODAL */}
      {overallModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Submit Scrutiny Determination: {overallModal.action}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Final determination by AICTE competent authority. This action will be logged in the permanent audit trail.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Scrutiny Notes & Orders
              </label>
              <textarea
                value={overallModal.notes}
                onChange={(e) => setOverallModal({ ...overallModal, notes: e.target.value })}
                rows={4}
                placeholder="Enter regulatory order remarks, inspection orders, or rectification deadlines..."
                className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOverallModal({ open: false, action: "", notes: "" })}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={handleOverallDecision}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition disabled:opacity-50"
              >
                {submittingAction ? "Recording Order..." : "Confirm Scrutiny Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
