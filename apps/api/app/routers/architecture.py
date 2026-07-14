"""
routers/architecture.py
─────────────────────────────────────────────────────────────────────────────
Added HTTPException wrapping so LLM failures return a useful error message.
"""

from fastapi import APIRouter, HTTPException

from app.services.architecture_services import summarise_architecture

router = APIRouter()


@router.get("/")
def get_architecture():
    return {"message": "architecture endpoint"}


@router.get("/summary/{repo_id}")
def summary(repo_id: str):
    try:
        return {"summary": summarise_architecture(repo_id)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
