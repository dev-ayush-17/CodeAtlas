from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.chat_schema import AskRequest, AskResponse
from app.services.rag_service import answer_questions
from app.services.history_service import get_history


router = APIRouter()

@router.get("/")
def get_chat():
    return {"message": "chat endpoint"}


@router.post("/ask", response_model= AskResponse)
def ask(payload: AskRequest, db: Session = Depends(get_db)):
    return answer_questions(db, payload.repo_id, payload.question)


@router.get("/history/{repo_id}")
def history(repo_id: str, db: Session = Depends(get_db)):
    msgs = get_history(db, repo_id)
    return [
        {
            "role": m.role,
            "content": m.content,
            "sources": m.sources
        }
        for m in msgs
    ]