from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from app.db.database import base


class ChatMessage(base):

    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True)
    repo_id = Column(String, index= True)
    role = Column(String)
    content = Column(Text)
    sources = Column(Text, nullable= True)
    created_at = Column(DateTime, default= datetime.utcnow)