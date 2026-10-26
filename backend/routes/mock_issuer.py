from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from services.mock_registry import query_mock_issuer

router = APIRouter(prefix="/mock-issuer", tags=["Mock Issuing Authorities"])

@router.get("/university-noc")
def verify_university_noc(
    doc_number: str = Query(..., description="Document / NOC number"),
    institution_name: str = Query(None, description="Institution Name"),
    db: Session = Depends(get_db)
):
    return query_mock_issuer(db, "university_noc", doc_number, institution_name)

@router.get("/fire-noc")
def verify_fire_noc(
    doc_number: str = Query(..., description="Fire NOC certificate number"),
    institution_name: str = Query(None, description="Institution Name"),
    db: Session = Depends(get_db)
):
    return query_mock_issuer(db, "fire_noc", doc_number, institution_name)

@router.get("/trust-registry")
def verify_trust_registry(
    doc_number: str = Query(..., description="Trust resolution / registration number"),
    institution_name: str = Query(None, description="Institution Name"),
    db: Session = Depends(get_db)
):
    return query_mock_issuer(db, "trust_registry", doc_number, institution_name)
