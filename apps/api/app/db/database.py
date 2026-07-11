from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings
import os


os.makedirs(settings.sqlite_dir, exist_ok= True)
engine = create_engine(f"sqlite:///{settings.sqlite_dir}/chat_history.db")
sessionLocal = sessionmaker(bind= engine)
base = declarative_base()


def get_db():
    db = sessionLocal()
    try:
        yield db
    finally:
        db.close()