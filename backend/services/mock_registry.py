import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
import models

def query_mock_issuer(
    db: Session,
    registry_type: str,
    document_number: str,
    institution_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Queries the synthetic external issuing authority registry.
    Returns:
      status: 'VERIFIED', 'MISMATCH_DETECTED', 'EXPIRED', 'SOURCE_UNAVAILABLE', 'MANUAL_REVIEW_REQUIRED'
      details: detailed record and comparison
    """
    timestamp = datetime.datetime.utcnow().isoformat() + "Z"

    if not document_number:
        return {
            "status": "MANUAL_REVIEW_REQUIRED",
            "source": f"Mock {registry_type.replace('_', ' ').title()} Registry",
            "timestamp": timestamp,
            "message": "No document number detected on the submitted certificate for automatic verification."
        }

    # Query internal mock registry table
    record = db.query(models.MockRegistryRecord).filter(
        models.MockRegistryRecord.registry_type == registry_type,
        models.MockRegistryRecord.document_number == document_number.strip()
    ).first()

    if not record:
        # Check if it has a pattern that indicates simulated source unavailable
        if "OFFLINE" in document_number.upper() or "UNAVAIL" in document_number.upper() or "503" in document_number:
            return {
                "status": "SOURCE_UNAVAILABLE",
                "source": f"State {registry_type.replace('_', ' ').title()} Portal (API Gateway)",
                "timestamp": timestamp,
                "message": "External verification gateway responded with HTTP 503 Service Temporarily Unavailable. Routed to manual officer verification."
            }

        return {
            "status": "MANUAL_REVIEW_REQUIRED",
            "source": f"Central {registry_type.replace('_', ' ').title()} Database",
            "timestamp": timestamp,
            "message": f"Document number '{document_number}' not indexed in current online registry. Requires manual verification by officer."
        }

    # Record exists, evaluate status
    rec_status = record.status.upper()

    if rec_status == "SOURCE_UNAVAILABLE":
        return {
            "status": "SOURCE_UNAVAILABLE",
            "source": f"State {registry_type.replace('_', ' ').title()} Portal",
            "timestamp": timestamp,
            "message": "Issuing authority registry server timeout (simulated). Human manual verification required.",
            "registry_record": record.details
        }

    if rec_status == "EXPIRED":
        return {
            "status": "EXPIRED",
            "source": f"Central {registry_type.replace('_', ' ').title()} Database",
            "timestamp": timestamp,
            "message": f"Record found: Document expired on {record.expiry_date} according to official registry.",
            "registry_record": record.details
        }

    if rec_status == "MISMATCH_DETECTED":
        return {
            "status": "MISMATCH_DETECTED",
            "source": f"Central {registry_type.replace('_', ' ').title()} Database",
            "timestamp": timestamp,
            "message": f"Record found but registered institution '{record.institution_name}' differs from application.",
            "registry_record": record.details
        }

    # Check institution name match if provided
    if institution_name and record.institution_name:
        from rapidfuzz import fuzz
        similarity = fuzz.token_sort_ratio(institution_name.lower(), record.institution_name.lower())
        if similarity < 70:
            return {
                "status": "MISMATCH_DETECTED",
                "source": f"Central {registry_type.replace('_', ' ').title()} Database",
                "timestamp": timestamp,
                "message": f"Registry mismatch: Document #{document_number} was issued to '{record.institution_name}', but submitted by '{institution_name}' (similarity {similarity}%).",
                "registry_record": record.details
            }

    return {
        "status": "VERIFIED",
        "source": f"Central {registry_type.replace('_', ' ').title()} Database",
        "timestamp": timestamp,
        "message": f"Successfully cross-verified against official issuing authority registry. Certificate is authentic and active.",
        "registry_record": {
            "document_number": record.document_number,
            "institution_name": record.institution_name,
            "issue_date": record.issue_date,
            "expiry_date": record.expiry_date,
            "details": record.details
        }
    }
