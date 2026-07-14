"""
services/ingestion_service.py
─────────────────────────────────────────────────────────────────────────────
Change: file paths in the returned `tree` now use POSIX forward-slashes
(via Path.as_posix()) so they are consistent on Windows and Linux,
display correctly in the frontend, and round-trip cleanly through URLs
when sent back to /chat/explain or /review/run.
"""

import hashlib
from pathlib import Path

from app.core.git_client import clone_repo, list_source_files


def make_repo_id(github_url: str) -> str:
    return hashlib.sha1(github_url.encode()).hexdigest()[:10]


def ingest_repository(github_url: str) -> dict:
    repo_id = make_repo_id(github_url)
    repo_path = clone_repo(github_url, repo_id)
    files = list_source_files(repo_path)

    # Use POSIX paths (forward slashes) so these display and round-trip correctly
    tree = [f.relative_to(repo_path).as_posix() for f in files]

    return {
        "repo_id": repo_id,
        "file_count": len(files),
        "tree": tree,
    }