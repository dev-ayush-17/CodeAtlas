from pydantic import BaseModel


class AskRequest(BaseModel):
    repo_id: str
    question: str


class AskResponse(BaseModel):
    answer: str
    sources: list[str]