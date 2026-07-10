from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_review():
    return {"message": "review endpoint"}