"""
services/indexing_service.py
─────────────────────────────────────────────────────────────────────────────
Changes from original:
  - Per-file try/except: one bad file no longer kills the whole index.
  - Files larger than 512 KB are skipped (prevents OOM in the embedding model).
  - Returns `files_skipped` count alongside `chunks_indexed`.
"""

import logging
from pathlib import Path

from app.config import settings
from app.core.chunker import chunk_file
from app.core.vector_store import add_chunks

logger = logging.getLogger(__name__)

# Skip individual files that exceed this size to avoid embedding-model timeouts
MAX_FILE_BYTES = 512 * 1024  # 512 KB


def index_repo(repo_id: str, file_paths: list[str]) -> dict:
    repo_root = Path(settings.repos_dir) / repo_id
    total_chunks = 0
    files_skipped = 0

    for rel_path in file_paths:
        # Normalise to forward-slash so the path works on all platforms
        rel_path_norm = rel_path.replace("\\", "/")
        full_path = repo_root / rel_path_norm

        if not full_path.is_file():
            continue

        # Skip oversized files
        try:
            if full_path.stat().st_size > MAX_FILE_BYTES:
                logger.warning("Skipping oversized file (>512 KB): %s", rel_path_norm)
                files_skipped += 1
                continue
        except OSError:
            files_skipped += 1
            continue

        chunks = chunk_file(full_path, repo_root)
        if not chunks:
            continue

        try:
            add_chunks(repo_id, chunks)
            total_chunks += len(chunks)
        except Exception as exc:
            logger.error("Failed to embed '%s': %s", rel_path_norm, exc)
            files_skipped += 1

    logger.info(
        "Indexing complete — repo=%s chunks=%d skipped=%d",
        repo_id,
        total_chunks,
        files_skipped,
    )
    return {
        "repo_id": repo_id,
        "chunks_indexed": total_chunks,
        "files_skipped": files_skipped,
    }