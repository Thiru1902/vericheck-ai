from fastapi import APIRouter, HTTPException
from services.validator import get_config_for_type

router = APIRouter(prefix="/config", tags=["Configuration"])

@router.get("/types")
def get_types():
    return [
        {
            "id": "Extension of Approval",
            "name": "Extension of Approval (EoA)",
            "description": "Annual continuation of approval for existing institutions and approved intake."
        },
        {
            "id": "Increase in Intake",
            "name": "Increase in Intake (III)",
            "description": "Increase in approved student capacity or seat intake in existing approved programmes."
        }
    ]

@router.get("/checklist/{app_type}")
def get_checklist(app_type: str):
    config = get_config_for_type(app_type)
    if not config:
        raise HTTPException(status_code=404, detail=f"Checklist not found for type '{app_type}'")
    return config
