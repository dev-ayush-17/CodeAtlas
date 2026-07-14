"""
services/architecture_services.py
─────────────────────────────────────────────────────────────────────────────
BUG FIXED: The original code built `excerpts` by iterating over `files`
(ALL files) instead of `key_files` (up to 6 key files).  For a large repo
this created an enormous prompt that would timeout or exceed context limits.

Also normalised all paths to POSIX forward-slashes so the output is
readable and consistent across Windows / Linux.
"""

from pathlib import Path

from app.config import settings
from app.core.git_client import list_source_files
from app.core.llm import get_llm
from app.core.prompts import ARCHITECTURE_PROMPT


def summarise_architecture(repo_id: str) -> str:
    repo_path = Path(settings.repos_dir) / repo_id
    files = list_source_files(repo_path)

    # Use POSIX paths for consistent, readable output on all platforms
    tree = "\n".join(f.relative_to(repo_path).as_posix() for f in files)

    key_names = {"main", "app", "index", "config", "server", "router"}
    key_files = [
        f for f in files if any(k in f.name.lower() for k in key_names)
    ][:6]

    # FIX: was `for f in files` — must be `for f in key_files`
    excerpts = "\n\n".join(
        f"--- {f.relative_to(repo_path).as_posix()} ---\n"
        f"{f.read_text(errors='ignore')[:1000]}"
        for f in key_files
    )

    prompt = ARCHITECTURE_PROMPT.format(tree=tree[:4000], excerpts=excerpts)
    return get_llm().invoke(prompt).content