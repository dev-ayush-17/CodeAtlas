from pydantic import BaseModel

class CloneRequest(BaseModel):
    github_url: str

class CloneResponse(BaseModel):
    repo_id: str
    file_count: int
    tree: list[str]