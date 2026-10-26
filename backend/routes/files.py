import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
import models
from services.auth import get_current_user

router = APIRouter(prefix="/files", tags=["File Streaming"])

@router.get("/{doc_id}")
def stream_document_file(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    app = doc.application
    # Access control: applicant must own the institution, officer can view all
    if current_user.role == "applicant":
        if app.institution_id != current_user.institution_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You cannot view documents from another institution."
            )

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File content not found on server storage.")

    media_type = "application/pdf"
    if doc.file_name.lower().endswith((".png", ".jpg", ".jpeg")):
        media_type = "image/png" if doc.file_name.lower().endswith(".png") else "image/jpeg"

    return FileResponse(
        path=doc.file_path,
        media_type=media_type,
        filename=doc.file_name,
        headers={"Content-Disposition": f'inline; filename="{doc.file_name}"'}
    )
