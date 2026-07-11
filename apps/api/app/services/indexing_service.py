from pathlib import Path
from app.config import settings
from app.core.chunker import chunk_file
from app.core.vector_store import add_chunks


def index_repo(repo_id: str, file_paths: list[str]):

    repo_root = Path(settings.repos_dir) / repo_id
    total_chunks = 0
    for rel_path in file_paths:
        full_path = repo_root / rel_path
        if not full_path.is_file():
            continue

        chunks = chunk_file(full_path, repo_root)
        if chunks:
            add_chunks(repo_id, chunks)
            total_chunks += len(chunks)

    return {"repo_id": repo_id, "chunks_indexed": total_chunks}