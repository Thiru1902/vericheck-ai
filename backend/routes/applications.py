import os
import shutil
import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
import models
from services.auth import require_applicant, get_current_user
from services.anomaly import calculate_sha256
from services.extractor import (
    extract_text_and_metadata_from_pdf,
    extract_structured_fields,
    classify_document
)
from services.validator import validate_application, get_config_for_type

router = APIRouter(prefix="/applications", tags=["Applicant Applications"])

STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "storage", "documents")
os.makedirs(STORAGE_DIR, exist_ok=True)

class CreateApplicationRequest(BaseModel):
    type: str  # 'Extension of Approval' or 'Increase in Intake'
    form_data: dict

@router.get("")
def list_applicant_applications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_applicant)
):
    """Lists applications belonging to the logged-in applicant's institution."""
    query = db.query(models.Application)
    if current_user.institution_id:
        query = query.filter(models.Application.institution_id == current_user.institution_id)

    applications = query.order_by(models.Application.created_at.desc()).all()
    result = []
    for app in applications:
        docs_count = len(app.documents)
        findings_count = len(app.findings)
        fails_count = len([f for f in app.findings if f.status == "FAIL"])
        warnings_count = len([f for f in app.findings if f.status in ["WARNING", "SOURCE_PENDING"]])
        result.append({
            "id": app.id,
            "type": app.type,
            "status": app.status,
            "overall_status": app.overall_status,
            "institution_name": app.institution.name if app.institution else "N/A",
            "permanent_id": app.institution.permanent_id if app.institution else "N/A",
            "submitted_at": app.submitted_at.isoformat() if app.submitted_at else None,
            "created_at": app.created_at.isoformat() if app.created_at else None,
            "documents_count": docs_count,
            "findings_count": findings_count,
            "fails_count": fails_count,
            "warnings_count": warnings_count,
            "officer_notes": app.officer_notes
        })
    return result

@router.post("")
def create_application(
    req: CreateApplicationRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_applicant)
):
    """Creates a new draft application for the institution."""
    if not current_user.institution_id:
        raise HTTPException(status_code=400, detail="User is not associated with an institution.")

    config = get_config_for_type(req.type)
    deadline = config.get("deadline_date") if config else None

    app = models.Application(
        institution_id=current_user.institution_id,
        type=req.type,
        status="Draft",
        overall_status="Needs Manual Review",
        form_data=req.form_data,
        deadline=deadline
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    # Log audit event
    audit = models.AuditLog(
        actor=current_user.name,
        role=current_user.role,
        action="APPLICATION_CREATED",
        details={
            "application_id": app.id,
            "type": app.type,
            "institution_id": current_user.institution_id
        }
    )
    db.add(audit)
    db.commit()

    return {"message": "Application created successfully", "application_id": app.id, "status": app.status}

@router.get("/{id}")
def get_application(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Gets application details, documents, and findings."""
    app = db.query(models.Application).filter(models.Application.id == id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if current_user.role == "applicant" and app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied to this application.")

    docs = []
    for d in app.documents:
        docs.append({
            "id": d.id,
            "doc_type": d.doc_type,
            "file_name": d.file_name,
            "file_size": d.file_size,
            "sha256": d.sha256,
            "status": d.status,
            "extracted_fields": d.extracted_fields,
            "preview_url": f"/files/{d.id}",
            "created_at": d.created_at.isoformat() if d.created_at else None
        })

    findings_list = []
    for f in app.findings:
        findings_list.append({
            "id": f.id,
            "document_id": f.document_id,
            "rule_id": f.rule_id,
            "check_name": f.check_name,
            "status": f.status,
            "severity": f.severity,
            "reason": f.reason,
            "evidence": f.evidence,
            "officer_decision": f.officer_decision,
            "officer_remark": f.officer_remark
        })

    return {
        "id": app.id,
        "type": app.type,
        "status": app.status,
        "overall_status": app.overall_status,
        "form_data": app.form_data,
        "deadline": app.deadline,
        "submitted_at": app.submitted_at.isoformat() if app.submitted_at else None,
        "created_at": app.created_at.isoformat() if app.created_at else None,
        "institution": {
            "id": app.institution.id,
            "name": app.institution.name,
            "permanent_id": app.institution.permanent_id,
            "state": app.institution.state,
            "address": app.institution.address
        } if app.institution else None,
        "documents": docs,
        "findings": findings_list,
        "officer_notes": app.officer_notes
    }

@router.post("/{id}/documents")
async def upload_document(
    id: int,
    file: UploadFile = File(...),
    doc_type: str = Form(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_applicant)
):
    """Uploads a document, extracts text/fields, computes SHA-256."""
    app = db.query(models.Application).filter(models.Application.id == id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    # Check if locked unless rectification requested
    if app.status in ["Submitted", "Clear"] and not app.officer_notes:
        raise HTTPException(status_code=400, detail="Application is locked after submission.")

    file_bytes = await file.read()
    file_size = len(file_bytes)
    sha256 = calculate_sha256(file_bytes)

    # Save to disk
    app_dir = os.path.join(STORAGE_DIR, str(id))
    os.makedirs(app_dir, exist_ok=True)
    saved_filename = f"{doc_type}_{file.filename}"
    file_path = os.path.join(app_dir, saved_filename)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # Extract text & metadata if PDF
    extracted_text = ""
    metadata = {}
    if file.filename.lower().endswith(".pdf"):
        extracted_text, metadata = extract_text_and_metadata_from_pdf(file_path)
    else:
        extracted_text = f"Image Document: {file.filename} (Format: {file.content_type})"

    extracted_fields = extract_structured_fields(extracted_text, doc_type)

    # Remove existing doc of same type if present
    existing_doc = db.query(models.Document).filter(
        models.Document.application_id == id,
        models.Document.doc_type == doc_type
    ).first()
    if existing_doc:
        db.delete(existing_doc)
        db.flush()

    doc = models.Document(
        application_id=app.id,
        doc_type=doc_type,
        file_name=file.filename,
        file_path=file_path,
        sha256=sha256,
        file_size=file_size,
        extracted_text=extracted_text,
        extracted_fields=extracted_fields,
        metadata_info=metadata,
        status="Extracted"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Audit log
    audit = models.AuditLog(
        actor=current_user.name,
        role=current_user.role,
        action="DOCUMENT_UPLOADED",
        details={
            "application_id": app.id,
            "document_id": doc.id,
            "doc_type": doc_type,
            "file_name": file.filename,
            "sha256": sha256
        }
    )
    db.add(audit)
    db.commit()

    return {
        "message": "Document uploaded and processed successfully",
        "document_id": doc.id,
        "doc_type": doc.doc_type,
        "extracted_fields": doc.extracted_fields
    }

@router.post("/{id}/precheck")
def run_precheck(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_applicant)
):
    """Executes on-demand precheck validation and returns actionable findings."""
    app = db.query(models.Application).filter(models.Application.id == id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    report = validate_application(db, id)

    # Log audit event
    audit = models.AuditLog(
        actor=current_user.name,
        role=current_user.role,
        action="PRECHECK_RUN",
        details={
            "application_id": app.id,
            "overall_status": report["overall_status"],
            "fails": report["fails"],
            "warnings": report["warnings"]
        }
    )
    db.add(audit)
    db.commit()

    return report

@router.post("/{id}/submit")
def submit_application(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_applicant)
):
    """Locks and formally submits the application."""
    app = db.query(models.Application).filter(models.Application.id == id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    # Run full validation
    report = validate_application(db, id)

    app.submitted_at = datetime.datetime.utcnow()
    app.status = "Submitted"
    app.overall_status = report["overall_status"]
    db.commit()

    # Log audit event
    audit = models.AuditLog(
        actor=current_user.name,
        role=current_user.role,
        action="APPLICATION_SUBMITTED",
        details={
            "application_id": app.id,
            "overall_status": app.overall_status,
            "total_findings": report["total_findings"],
            "fails": report["fails"]
        }
    )
    db.add(audit)
    db.commit()

    return {
        "message": "Application submitted successfully and forwarded for scrutiny",
        "status": app.status,
        "overall_status": app.overall_status,
        "report_summary": {
            "total_findings": report["total_findings"],
            "fails": report["fails"],
            "warnings": report["warnings"]
        }
    }

@router.get("/{id}/summary")
def get_application_summary(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Returns summary of validation report, rectification requests, and remarks."""
    app = db.query(models.Application).filter(models.Application.id == id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    fails = [f for f in app.findings if f.status == "FAIL"]
    warnings = [f for f in app.findings if f.status in ["WARNING", "SOURCE_PENDING"]]
    passes = [f for f in app.findings if f.status == "PASS"]

    return {
        "id": app.id,
        "status": app.status,
        "overall_status": app.overall_status,
        "submitted_at": app.submitted_at.isoformat() if app.submitted_at else None,
        "officer_notes": app.officer_notes,
        "counts": {
            "total": len(app.findings),
            "fails": len(fails),
            "warnings": len(warnings),
            "passes": len(passes)
        },
        "findings": [
            {
                "id": f.id,
                "check_name": f.check_name,
                "status": f.status,
                "severity": f.severity,
                "reason": f.reason,
                "officer_decision": f.officer_decision,
                "officer_remark": f.officer_remark
            }
            for f in app.findings
        ]
    }
