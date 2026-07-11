from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import repo, chat, review, architecture
from app.db.database import engine, base
from app.models import chat_models


app = FastAPI(title= "CodeAtlas API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(repo.router, prefix= "/repo", tags= ["repo"])
app.include_router(chat.router, prefix= "/chat", tags= ["chat"])
app.include_router(review.router, prefix= "/review", tags= ["review"])
app.include_router(architecture.router, prefix= "/architecture", tags= ["architecture"])


@app.get("/health")
def health():
    return {"status": "ok"}


base.metadata.create_all(bind= engine)