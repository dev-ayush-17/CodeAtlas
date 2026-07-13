from fastapi import APIRouter
from app.schemas.review_schema import ReviewRequest, ReviewResponse
from app.services.review_services import review_file


router = APIRouter()

@router.get("/")
def get_review():
    return {"message": "review endpoint"}


@router.post("/run", response_model= ReviewResponse)
def run(payload: ReviewRequest):
    result = review_file(payload.repo_id, payload.path)
    return {
        "path": payload.path, "review": result
    }