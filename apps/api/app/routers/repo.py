from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_repo():
    return {"message": "repo endpoint"}