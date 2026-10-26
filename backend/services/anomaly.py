import hashlib
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import models

def calculate_sha256(file_bytes: bytes) -> str:
    """Calculates SHA-256 checksum of a file."""
    hasher = hashlib.sha256()
    hasher.update(file_bytes)
    return hasher.hexdigest()

def check_duplicate_file(db: Session, current_doc_id: Optional[int], current_app_id: int, sha256_hash: str) -> List[Dict[str, Any]]:
    """Checks if exact same file hash was uploaded elsewhere or under multiple types."""
    anomalies = []

    # Check same application, different doc_type
    same_app_docs = db.query(models.Document).filter(
        models.Document.application_id == current_app_id,
        models.Document.sha256 == sha256_hash
    )
    if current_doc_id:
        same_app_docs = same_app_docs.filter(models.Document.id != current_doc_id)
    same_app_match = same_app_docs.first()

    if same_app_match:
        anomalies.append({
            "rule_id": "ANOMALY_SAME_FILE_MULTI_TYPE",
            "check_name": "Identical File Under Multiple Document Types",
            "severity": "HIGH",
            "reason": f"Possible anomaly, needs human verification: Exact identical file uploaded for both '{same_app_match.doc_type}' and this document.",
            "evidence": {
                "sha256": sha256_hash,
                "conflicting_document_id": same_app_match.id,
                "conflicting_doc_type": same_app_match.doc_type,
                "conflicting_file_name": same_app_match.file_name
            }
        })

    # Check across different applications / institutions
    other_app_docs = db.query(models.Document).join(models.Application).filter(
        models.Document.application_id != current_app_id,
        models.Document.sha256 == sha256_hash
    ).first()

    if other_app_docs:
        other_app = db.query(models.Application).filter(models.Application.id == other_app_docs.application_id).first()
        other_inst = other_app.institution.name if (other_app and other_app.institution) else "Another Institution"
        anomalies.append({
            "rule_id": "ANOMALY_CROSS_APP_DUPLICATE",
            "check_name": "Cross-Application Duplicate File Check",
            "severity": "HIGH",
            "reason": f"Possible anomaly, needs human verification: Identical document file (SHA-256 match) was previously submitted by '{other_inst}' in Application #{other_app_docs.application_id}.",
            "evidence": {
                "sha256": sha256_hash,
                "other_institution": other_inst,
                "other_application_id": other_app_docs.application_id,
                "other_file_name": other_app_docs.file_name
            }
        })

    return anomalies

def check_stamp_paper_anomaly(extracted_fields: Dict[str, Any], doc_type: str, min_stamp_val: int = 220) -> Optional[Dict[str, Any]]:
    """Checks if affidavit is executed on insufficient stamp paper value."""
    if "AFFIDAVIT" not in doc_type.upper():
        return None

    stamp_val = extracted_fields.get("stamp_paper_value")
    if stamp_val is not None:
        if stamp_val < min_stamp_val:
            return {
                "rule_id": "RULE_STAMP_VAL_DEFICIENT",
                "check_name": "Affidavit Non-Judicial Stamp Paper Value Check",
                "severity": "HIGH",
                "reason": f"Possible anomaly, needs human verification: Stamp paper value detected as Rs. {stamp_val}, which is below the mandatory minimum of Rs. {min_stamp_val}.",
                "evidence": {
                    "extracted_value": f"Rs. {stamp_val}",
                    "mandatory_minimum": f"Rs. {min_stamp_val}",
                    "document_type": doc_type
                }
            }
    return None

def check_pdf_metadata_anomaly(metadata: Dict[str, Any], extracted_fields: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Checks for suspicious metadata, creation dates later than claimed issue date, or editing anomalies."""
    creation_date_str = metadata.get("creation_date", "")
    issue_date_str = extracted_fields.get("issue_date", "")

    # Look for obvious metadata flags e.g. "TAMPERED", "MODIFIED_LATER" or year discrepancies
    if "TAMPERED" in str(metadata) or "SUSPICIOUS" in str(metadata):
        return {
            "rule_id": "ANOMALY_PDF_METADATA_TAMPERED",
            "check_name": "PDF File Metadata Integrity Check",
            "severity": "MEDIUM",
            "reason": "Possible anomaly, needs human verification: PDF metadata contains modification traces or inconsistencies indicating document was altered post-generation.",
            "evidence": {
                "producer": metadata.get("producer"),
                "creation_date": metadata.get("creation_date"),
                "mod_date": metadata.get("mod_date"),
                "claimed_issue_date": issue_date_str
            }
        }

    return None

def check_future_date_anomaly(extracted_fields: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Checks if issue date is in the future compared to current date."""
    issue_date_str = extracted_fields.get("issue_date")
    if not issue_date_str:
        return None

    try:
        # Simple date checks
        current_year = datetime.datetime.utcnow().year
        # Search for year in string
        import re
        year_match = re.search(r"\b(20\d\d)\b", str(issue_date_str))
        if year_match:
            year = int(year_match.group(1))
            if year > current_year + 1:
                return {
                    "rule_id": "ANOMALY_FUTURE_ISSUE_DATE",
                    "check_name": "Document Issue Date Chronology Check",
                    "severity": "HIGH",
                    "reason": f"Possible anomaly, needs human verification: Document issue date ({issue_date_str}) is dated in the future.",
                    "evidence": {
                        "detected_issue_date": issue_date_str,
                        "reference_current_year": current_year
                    }
                }
    except Exception:
        pass

    return None
