from fastapi import APIRouter
from app.schemas.repo_schema import CloneRequest, CloneResponse
from app.services.ingestion_service  import ingest_repository
from app.services.indexing_service import index_repo


router = APIRouter()

@router.get("/")
def get_repo():
    return {"message": "repo endpoint"}


@router.post("/clone", response_model= CloneResponse)
def clone(payload: CloneRequest):
    result = ingest_repository(payload.github_url)
    return result

@router.post("/index/{repo_id}")
def index (repo_id: str):
    from pathlib import Path
    from app.config import settings
    from app.core.git_client import list_source_files
    repo_path = Path(settings.repos_dir) / repo_id
    files = list_source_files(repo_path)
    rel_files = [str(f.relative_to(repo_path)) for f in files]
    return index_repo(repo_id, rel_files)