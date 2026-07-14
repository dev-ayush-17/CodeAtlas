"""
routers/review.py
─────────────────────────────────────────────────────────────────────────────
Added HTTPException handling for file-not-found and general LLM failures.
"""

from fastapi import APIRouter, HTTPException

from app.schemas.review_schema import ReviewRequest, ReviewResponse
from app.services.review_services import review_file

router = APIRouter()


@router.get("/")
def get_review():
    return {"message": "review endpoint"}


@router.post("/run", response_model=ReviewResponse)
def run(payload: ReviewRequest):
    try:
        result = review_file(payload.repo_id, payload.path)
        return {"path": payload.path, "review": result}
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"File '{payload.path}' not found in repository '{payload.repo_id}'.",
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))