import hashlib
from pathlib import Path
from app.core.git_client import clone_repo, list_source_files

def make_repo_id(github_url: str) -> str:
    return hashlib.sha1(github_url.encode()).hexdigest()[:10]


def ingest_repository(github_url: str) -> dict:

    repo_id = make_repo_id(github_url)
    repo_path = clone_repo(github_url, repo_id)
    files = list_source_files(repo_path)
    tree = [str(f.relative_to(repo_path)) for f in files]

    return {
        "repo_id": repo_id,
        "file_count": len(files),
        "tree": tree
    }