from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_chat():
    return {"message": "chat endpoint"}