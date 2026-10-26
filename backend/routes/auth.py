from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from database import get_db
import models
from services.auth import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    user_name: str
    institution_id: Optional[int] = None
    institution_name: Optional[str] = None
    institution_perm_id: Optional[str] = None

@router.post("/login", response_model=TokenResponse)
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == creds.email.strip().lower()).first()
    if not user or not verify_password(creds.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. For demo, use 'Demo@123' or select a quick-login profile."
        )

    inst = user.institution
    token = create_access_token({
        "sub": str(user.id),
        "role": user.role,
        "email": user.email,
        "name": user.name,
        "institution_id": user.institution_id
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "user_name": user.name,
        "institution_id": inst.id if inst else None,
        "institution_name": inst.name if inst else None,
        "institution_perm_id": inst.permanent_id if inst else None
    }

@router.get("/demo-users")
def get_demo_users(db: Session = Depends(get_db)):
    """Provides pre-configured demo user accounts for 1-click UI login."""
    users = db.query(models.User).all()
    result = []
    for u in users:
        inst = u.institution
        result.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "institution_id": u.institution_id,
            "institution_name": inst.name if inst else None,
            "permanent_id": inst.permanent_id if inst else None
        })
    return result

@router.get("/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    inst = current_user.institution
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "institution_id": current_user.institution_id,
        "institution": {
            "id": inst.id,
            "name": inst.name,
            "permanent_id": inst.permanent_id,
            "state": inst.state
        } if inst else None
    }
