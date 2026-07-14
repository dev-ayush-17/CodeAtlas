"""
routers/chat.py
─────────────────────────────────────────────────────────────────────────────
Added HTTPException handling so LLM / vector-store failures surface as
clear API error messages instead of silent 500s.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.chat_schema import AskRequest, AskResponse
from app.services.history_service import get_history
from app.services.rag_service import answer_questions, explain_file

router = APIRouter()


@router.get("/")
def get_chat():
    return {"message": "chat endpoint"}


@router.post("/ask", response_model=AskResponse)
def ask(payload: AskRequest, db: Session = Depends(get_db)):
    try:
        return answer_questions(db, payload.repo_id, payload.question)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Chat failed: {exc}. "
                "Make sure the repository is indexed and Ollama is running."
            ),
        )


@router.get("/history/{repo_id}")
def history(repo_id: str, db: Session = Depends(get_db)):
    try:
        msgs = get_history(db, repo_id)
        return [
            {"role": m.role, "content": m.content, "sources": m.sources}
            for m in msgs
        ]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/explain/{repo_id}")
def explain(repo_id: str, path: str):
    try:
        return {"explaination": explain_file(repo_id, path)}
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"File '{path}' not found in repository '{repo_id}'.",
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))