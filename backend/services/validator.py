import os
import json
import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from rapidfuzz import fuzz

import models
from services.anomaly import (
    check_duplicate_file,
    check_stamp_paper_anomaly,
    check_pdf_metadata_anomaly,
    check_future_date_anomaly
)
from services.mock_registry import query_mock_issuer
from services.extractor import classify_document

CONFIG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config")

def get_config_for_type(app_type: str) -> Optional[Dict[str, Any]]:
    """Loads JSON config for application type."""
    type_slug = app_type.lower().replace(" ", "_")
    config_file = os.path.join(CONFIG_DIR, f"{type_slug}.json")
    if not os.path.exists(config_file):
        # Fallback to extension of approval
        config_file = os.path.join(CONFIG_DIR, "extension_of_approval.json")
    try:
        with open(config_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading config file {config_file}: {e}")
        return None

def parse_date_safely(date_str: str) -> Optional[datetime.date]:
    """Tries parsing various date string formats."""
    if not date_str:
        return None
    cleaned = str(date_str).strip()
    formats = [
        "%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d",
        "%d %B %Y", "%d %b %Y", "%B %d, %Y"
    ]
    for fmt in formats:
        try:
            return datetime.datetime.strptime(cleaned, fmt).date()
        except Exception:
            continue
    # Regex fallback for year
    import re
    match = re.search(r"(\d{4})", cleaned)
    if match:
        try:
            year = int(match.group(1))
            return datetime.date(year, 1, 1)
        except Exception:
            pass
    return None

def validate_application(db: Session, application_id: int) -> Dict[str, Any]:
    """
    Executes the full config-driven validation pipeline for an application.
    Generates explainable findings and updates the application's overall status.
    """
    app = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not app:
        raise ValueError(f"Application #{application_id} not found")

    config = get_config_for_type(app.type)
    if not config:
        raise ValueError(f"No validation configuration found for type: {app.type}")

    form_data = app.form_data or {}
    institution = app.institution
    form_inst_name = form_data.get("institution_name") or (institution.name if institution else "")
    form_perm_id = form_data.get("permanent_id") or (institution.permanent_id if institution else "")
    submission_date = app.submitted_at or app.created_at or datetime.datetime.utcnow()

    # Clear previous automated findings
    db.query(models.Finding).filter(models.Finding.application_id == app.id).delete()

    findings: List[models.Finding] = []
    documents = db.query(models.Document).filter(models.Document.application_id == app.id).all()
    docs_by_type = {doc.doc_type: doc for doc in documents}

    # 1. Check Completeness: All required documents uploaded
    required_docs_config = config.get("required_documents", [])
    for req_doc in required_docs_config:
        doc_code = req_doc["code"]
        doc_name = req_doc["name"]
        is_required = req_doc.get("required", True)

        if doc_code not in docs_by_type:
            if is_required:
                finding = models.Finding(
                    application_id=app.id,
                    document_id=None,
                    rule_id=f"RULE_REQ_DOC_MISSING_{doc_code}",
                    check_name=f"Mandatory Document Check: {doc_name}",
                    status="FAIL",
                    severity="HIGH",
                    reason=f"Mandatory document '{doc_name}' was not uploaded.",
                    evidence={
                        "missing_document_code": doc_code,
                        "document_name": doc_name,
                        "checklist_requirement": req_doc.get("description", "")
                    }
                )
                findings.append(finding)
        else:
            # Document exists, check required extracted fields
            doc = docs_by_type[doc_code]
            extracted = doc.extracted_fields or {}
            raw_text = doc.extracted_text or ""
            metadata = doc.metadata_info or {}

            # 1a. Classification match check
            classification = classify_document(raw_text, doc_code)
            if not classification["is_match"] and len(raw_text) > 100:
                findings.append(models.Finding(
                    application_id=app.id,
                    document_id=doc.id,
                    rule_id="RULE_DOC_CLASSIFICATION_MISMATCH",
                    check_name=f"Document Type Classification: {doc_name}",
                    status="WARNING",
                    severity="MEDIUM",
                    reason=f"Possible anomaly, needs human verification: Uploaded content does not strongly resemble '{doc_name}'. Found keywords: {', '.join(classification.get('matched_keywords', [])) or 'None'}.",
                    evidence={
                        "claimed_type": doc_code,
                        "confidence_score": classification["confidence"],
                        "matched_keywords": classification["matched_keywords"]
                    }
                ))

            # 1b. Check required fields inside document
            req_fields = req_doc.get("required_fields", [])
            missing_fields = []
            for field in req_fields:
                if field not in extracted or not extracted[field]:
                    missing_fields.append(field)
            if missing_fields:
                findings.append(models.Finding(
                    application_id=app.id,
                    document_id=doc.id,
                    rule_id=f"RULE_DOC_FIELDS_INCOMPLETE_{doc_code}",
                    check_name=f"Document Field Completeness: {doc_name}",
                    status="WARNING",
                    severity="MEDIUM",
                    reason=f"Missing key structured field(s) in {doc_name}: {', '.join(missing_fields)}.",
                    evidence={
                        "document_code": doc_code,
                        "missing_fields": missing_fields,
                        "extracted_fields": extracted
                    }
                ))

            # 2. Anomaly Checks for this document
            # 2a. Duplicate SHA-256 Check
            sha_anomalies = check_duplicate_file(db, doc.id, app.id, doc.sha256)
            for anomaly in sha_anomalies:
                findings.append(models.Finding(
                    application_id=app.id,
                    document_id=doc.id,
                    rule_id=anomaly["rule_id"],
                    check_name=anomaly["check_name"],
                    status="FAIL",
                    severity=anomaly["severity"],
                    reason=anomaly["reason"],
                    evidence=anomaly["evidence"]
                ))

            # 2b. Stamp paper value check
            min_stamp = req_doc.get("min_stamp_value", config.get("min_stamp_paper_value", 220))
            stamp_anomaly = check_stamp_paper_anomaly(extracted, doc_code, min_stamp)
            if stamp_anomaly:
                findings.append(models.Finding(
                    application_id=app.id,
                    document_id=doc.id,
                    rule_id=stamp_anomaly["rule_id"],
                    check_name=stamp_anomaly["check_name"],
                    status="FAIL",
                    severity=stamp_anomaly["severity"],
                    reason=stamp_anomaly["reason"],
                    evidence=stamp_anomaly["evidence"]
                ))

            # 2c. PDF Metadata integrity check
            pdf_meta_anomaly = check_pdf_metadata_anomaly(metadata, extracted)
            if pdf_meta_anomaly:
                findings.append(models.Finding(
                    application_id=app.id,
                    document_id=doc.id,
                    rule_id=pdf_meta_anomaly["rule_id"],
                    check_name=pdf_meta_anomaly["check_name"],
                    status="WARNING",
                    severity=pdf_meta_anomaly["severity"],
                    reason=pdf_meta_anomaly["reason"],
                    evidence=pdf_meta_anomaly["evidence"]
                ))

            # 2d. Future issue date check
            future_date_anomaly = check_future_date_anomaly(extracted)
            if future_date_anomaly:
                findings.append(models.Finding(
                    application_id=app.id,
                    document_id=doc.id,
                    rule_id=future_date_anomaly["rule_id"],
                    check_name=future_date_anomaly["check_name"],
                    status="FAIL",
                    severity=future_date_anomaly["severity"],
                    reason=future_date_anomaly["reason"],
                    evidence=future_date_anomaly["evidence"]
                ))

            # 3. Expiry / Validity Date Check
            doc_expiry_str = extracted.get("expiry_date") or extracted.get("valid_till")
            if doc_expiry_str:
                doc_expiry = parse_date_safely(doc_expiry_str)
                sub_date = submission_date.date() if isinstance(submission_date, datetime.datetime) else submission_date
                if doc_expiry and doc_expiry < sub_date:
                    findings.append(models.Finding(
                        application_id=app.id,
                        document_id=doc.id,
                        rule_id="RULE_DOC_EXPIRED",
                        check_name=f"Document Expiry Check: {doc_name}",
                        status="FAIL",
                        severity="HIGH",
                        reason=f"Possible anomaly, needs human verification: {doc_name} expired on {doc_expiry_str}, prior to application submission.",
                        evidence={
                            "document_expiry_date": str(doc_expiry),
                            "submission_date": str(sub_date),
                            "difference_days": (sub_date - doc_expiry).days
                        }
                    ))

            # 4. Cross-document consistency: Institution Name & Permanent ID
            doc_inst_name = extracted.get("institution_name")
            if doc_inst_name and form_inst_name:
                similarity = fuzz.token_sort_ratio(form_inst_name.lower(), doc_inst_name.lower())
                threshold = config.get("fuzzy_match_threshold", 85)
                if similarity < threshold:
                    findings.append(models.Finding(
                        application_id=app.id,
                        document_id=doc.id,
                        rule_id="RULE_INST_NAME_MISMATCH",
                        check_name=f"Institution Name Consistency: {doc_name}",
                        status="FAIL",
                        severity="HIGH",
                        reason=f"Possible anomaly, needs human verification: Institution name in {doc_name} ('{doc_inst_name}') differs from application form ('{form_inst_name}'). Fuzzy match: {similarity}% (Required >= {threshold}%).",
                        evidence={
                            "document_value": doc_inst_name,
                            "application_form_value": form_inst_name,
                            "match_score": similarity,
                            "threshold": threshold
                        }
                    ))

            doc_perm_id = extracted.get("permanent_id")
            if doc_perm_id and form_perm_id:
                clean_doc_pid = doc_perm_id.replace(" ", "").upper()
                clean_form_pid = form_perm_id.replace(" ", "").upper()
                if clean_doc_pid != clean_form_pid:
                    findings.append(models.Finding(
                        application_id=app.id,
                        document_id=doc.id,
                        rule_id="RULE_PERM_ID_MISMATCH",
                        check_name=f"Permanent Institute ID Match: {doc_name}",
                        status="FAIL",
                        severity="HIGH",
                        reason=f"Possible anomaly, needs human verification: Permanent ID in {doc_name} ('{doc_perm_id}') does not match Institution Permanent ID ('{form_perm_id}').",
                        evidence={
                            "document_permanent_id": doc_perm_id,
                            "expected_permanent_id": form_perm_id
                        }
                    ))

            # 5. Mock Issuing-Authority Registry Cross-Check
            registry_type = req_doc.get("mock_registry")
            if registry_type:
                doc_number = extracted.get("document_number") or ""
                mock_res = query_mock_issuer(db, registry_type, doc_number, form_inst_name)
                mock_status = mock_res.get("status")

                if mock_status == "VERIFIED":
                    findings.append(models.Finding(
                        application_id=app.id,
                        document_id=doc.id,
                        rule_id=f"RULE_REGISTRY_VERIFIED_{registry_type.upper()}",
                        check_name=f"Issuing Authority Source Verification: {doc_name}",
                        status="PASS",
                        severity="LOW",
                        reason=f"Verified directly against {mock_res.get('source')}.",
                        evidence=mock_res
                    ))
                elif mock_status == "SOURCE_UNAVAILABLE":
                    findings.append(models.Finding(
                        application_id=app.id,
                        document_id=doc.id,
                        rule_id=f"RULE_REGISTRY_SOURCE_UNAVAILABLE_{registry_type.upper()}",
                        check_name=f"Source Registry Verification: {doc_name}",
                        status="SOURCE_PENDING",
                        severity="MEDIUM",
                        reason=f"External source unavailable ({mock_res.get('source')}). Routed to manual officer scrutiny.",
                        evidence=mock_res
                    ))
                elif mock_status == "MISMATCH_DETECTED":
                    findings.append(models.Finding(
                        application_id=app.id,
                        document_id=doc.id,
                        rule_id=f"RULE_REGISTRY_MISMATCH_{registry_type.upper()}",
                        check_name=f"Source Registry Cross-Check: {doc_name}",
                        status="FAIL",
                        severity="HIGH",
                        reason=f"Possible anomaly, needs human verification: Source registry check returned mismatch against document #{doc_number}.",
                        evidence=mock_res
                    ))
                elif mock_status == "EXPIRED":
                    findings.append(models.Finding(
                        application_id=app.id,
                        document_id=doc.id,
                        rule_id=f"RULE_REGISTRY_EXPIRED_{registry_type.upper()}",
                        check_name=f"Source Registry Expiry Check: {doc_name}",
                        status="FAIL",
                        severity="HIGH",
                        reason=f"Possible anomaly, needs human verification: Issuing authority records document as EXPIRED.",
                        evidence=mock_res
                    ))
                else:
                    findings.append(models.Finding(
                        application_id=app.id,
                        document_id=doc.id,
                        rule_id=f"RULE_REGISTRY_MANUAL_REVIEW_{registry_type.upper()}",
                        check_name=f"Source Registry Status: {doc_name}",
                        status="WARNING",
                        severity="MEDIUM",
                        reason=f"{mock_res.get('message', 'Manual review needed by officer')}.",
                        evidence=mock_res
                    ))

    # 6. Cycle Deadline Check
    deadline_str = config.get("deadline_date")
    if deadline_str:
        deadline_dt = parse_date_safely(deadline_str.split("T")[0])
        sub_d = submission_date.date() if isinstance(submission_date, datetime.datetime) else submission_date
        if deadline_dt and sub_d > deadline_dt:
            findings.append(models.Finding(
                application_id=app.id,
                document_id=None,
                rule_id="RULE_APPLICATION_DELAYED",
                check_name="Cycle Submission Deadline Check",
                status="WARNING",
                severity="MEDIUM",
                reason=f"Application submitted on {sub_d}, after the official cycle deadline ({deadline_dt}). Late submission justification required.",
                evidence={
                    "submission_date": str(sub_d),
                    "deadline_date": str(deadline_dt),
                    "delay_days": (sub_d - deadline_dt).days
                }
            ))

    # 7. Increase in Intake Specific Checks
    if app.type == "Increase in Intake":
        form_current_intake = form_data.get("current_intake")
        form_req_intake = form_data.get("requested_intake")

        # Check against Previous EoA letter
        prev_eoa_doc = docs_by_type.get("PREV_EOA")
        if prev_eoa_doc and prev_eoa_doc.extracted_fields:
            eoa_intake = prev_eoa_doc.extracted_fields.get("current_intake") or prev_eoa_doc.extracted_fields.get("approved_intake")
            if eoa_intake and form_current_intake and int(form_current_intake) != int(eoa_intake):
                findings.append(models.Finding(
                    application_id=app.id,
                    document_id=prev_eoa_doc.id,
                    rule_id="RULE_INTAKE_MISMATCH_PREV_EOA",
                    check_name="Baseline Intake Cross-Check (Previous EoA)",
                    status="FAIL",
                    severity="HIGH",
                    reason=f"Possible anomaly, needs human verification: Current intake declared in form ({form_current_intake}) does not match intake approved in previous EoA letter ({eoa_intake}).",
                    evidence={
                        "form_current_intake": form_current_intake,
                        "previous_eoa_intake": eoa_intake
                    }
                ))

        if form_current_intake and form_req_intake:
            try:
                curr = int(form_current_intake)
                req = int(form_req_intake)
                if req <= curr:
                    findings.append(models.Finding(
                        application_id=app.id,
                        document_id=None,
                        rule_id="RULE_INTAKE_INCREASE_INVALID",
                        check_name="Requested Intake Figure Check",
                        status="WARNING",
                        severity="MEDIUM",
                        reason=f"Requested intake ({req}) is not greater than current sanctioned intake ({curr}).",
                        evidence={"current_intake": curr, "requested_intake": req}
                    ))
                elif req > curr * 2:
                    findings.append(models.Finding(
                        application_id=app.id,
                        document_id=None,
                        rule_id="RULE_INTAKE_EXCESSIVE_INCREASE",
                        check_name="AICTE Permissible Seat Expansion Limit",
                        status="WARNING",
                        severity="HIGH",
                        reason=f"Possible anomaly, needs human verification: Requested intake expansion (> 100% increase) exceeds standard single-cycle expansion norms without special council dispensation.",
                        evidence={"current_intake": curr, "requested_intake": req}
                    ))
            except Exception:
                pass

    # Save findings
    for finding in findings:
        db.add(finding)
    db.flush()

    # Determine overall status
    has_fail = any(f.status == "FAIL" for f in findings)
    has_warning = any(f.status in ["WARNING", "SOURCE_PENDING"] for f in findings)

    if has_fail:
        overall_status = "Deficient"
    elif has_warning:
        overall_status = "Needs Manual Review"
    else:
        overall_status = "Clear"

    app.overall_status = overall_status
    db.commit()

    return {
        "application_id": app.id,
        "overall_status": overall_status,
        "total_findings": len(findings),
        "fails": len([f for f in findings if f.status == "FAIL"]),
        "warnings": len([f for f in findings if f.status in ["WARNING", "SOURCE_PENDING"]]),
        "passes": len([f for f in findings if f.status == "PASS"]),
        "findings": [
            {
                "id": f.id,
                "rule_id": f.rule_id,
                "check_name": f.check_name,
                "status": f.status,
                "severity": f.severity,
                "reason": f.reason,
                "evidence": f.evidence,
                "document_id": f.document_id,
                "officer_decision": f.officer_decision
            }
            for f in findings
        ]
    }
