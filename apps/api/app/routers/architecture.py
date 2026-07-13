from fastapi import APIRouter
from app.services.architecture_services import summarise_architecture


router = APIRouter()

@router.get("/")
def get_architecture():
    return {"message": "architecture endpoint"}


@router.get("/summary/{repo_id}")
def summary(repo_id: str):
    return {
        "summary": summarise_architecture(repo_id)
    }
