from langchain_text_splitters import RecursiveCharacterTextSplitter
from pathlib import Path



LANGUAGE_MAP = {
    ".py": "python", ".js": "js", ".ts": "js", ".tsx": "js", ".java": "java", ".go": "go", ".rs": "rust"
}

def chunk_file(path: Path, repo_root: Path) -> list[dict]:

    text = path.read_text(errors= "ignore")
    splitter = RecursiveCharacterTextSplitter(chunk_size= 1000, chunk_overlap= 150)
    chunks = splitter.split_text(text)
    rel_path = str(path.relative_to(repo_root))

    return [ 
        {
            "content": chunk,
            "metadata": {
                "path": rel_path,
                "language": LANGUAGE_MAP.get(path.suffix, "text"),
                "chunk_id": f"{rel_path}::{i}"
            },
        }
        for i, chunk in enumerate(chunks)
    ]