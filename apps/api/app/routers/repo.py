"""
routers/repo.py
─────────────────────────────────────────────────────────────────────────────
Added HTTPException wrapping so callers receive structured, descriptive error
messages instead of opaque "Internal Server Error" (HTTP 500) responses.
"""

from fastapi import APIRouter, HTTPException

from app.schemas.repo_schema import CloneRequest, CloneResponse
from app.services.ingestion_service import ingest_repository
from app.services.indexing_service import index_repo

router = APIRouter()


@router.get("/")
def get_repo():
    return {"message": "repo endpoint"}


@router.post("/clone", response_model=CloneResponse)
def clone(payload: CloneRequest):
    try:
        return ingest_repository(payload.github_url)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/index/{repo_id}")
def index(repo_id: str):
    from pathlib import Path

    from app.config import settings
    from app.core.git_client import list_source_files

    repo_path = Path(settings.repos_dir) / repo_id
    if not repo_path.exists():
        raise HTTPException(
            status_code=404,
            detail=(
                f"Repository '{repo_id}' not found on the server. "
                "Clone it first via POST /repo/clone."
            ),
        )

    try:
        files = list_source_files(repo_path)
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Could not list repository files: {exc}"
        )

    if not files:
        raise HTTPException(
            status_code=422,
            detail="No indexable source files found in this repository.",
        )

    # Use POSIX paths so they round-trip cleanly through URLs
    rel_files = [f.relative_to(repo_path).as_posix() for f in files]

    try:
        return index_repo(repo_id, rel_files)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Indexing failed: {exc}")