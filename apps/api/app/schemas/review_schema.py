from pydantic import BaseModel


class ReviewRequest(BaseModel):
    repo_id: str
    path: str


class ReviewResponse(BaseModel):
    path: str
    review: str