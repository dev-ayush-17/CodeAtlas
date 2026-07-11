import shutil
from pathlib import Path
from git import Repo
from app.config import settings


IGNORED_DIRS = {".git", "node_modules", "build", "dist", "venv", "__pycache__", ".next"}
IGNORED_EXTENSIONS = {".lock", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".woff", ".zip", ".exe"}


def clone_repo(github_url: str, repo_id: str) -> Path:
    dest = Path(settings.repos_dir)
    if dest.exists():
        shutil.rmtree(dest)

    Repo.clone_from(github_url, dest)
    return dest


def list_source_files(repo_path: Path) -> list[Path]:
    files = []
    for path in repo_path.rglob("*"):
        if path.is_dir():
            continue
        if any(part in IGNORED_DIRS for part in path.parts):
            continue
        if path.suffix.lower() in IGNORED_EXTENSIONS:
            continue
        files.append(path)

    return files