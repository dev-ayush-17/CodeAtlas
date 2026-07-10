from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_architecture():
    return {"message": "architecture endpoint"}