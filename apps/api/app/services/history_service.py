import json 
from sqlalchemy.orm import Session
from app.models.chat_models import ChatMessage


def save_message(db: Session, repo_id: str, role:str, content: str, sources: list[str] | None= None):

    msg = ChatMessage(repo_id= repo_id, role= role, content= content, sources= json.dumps(sources or []))
    db.add(msg)
    db.commit()


def get_history(db: Session, repo_id: str):
    return db.query(ChatMessage).filter(ChatMessage.repo_id == repo_id).order_by(ChatMessage.created_at).all()