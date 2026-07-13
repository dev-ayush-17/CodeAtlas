from pathlib import Path
from app.config import settings
from app.core.git_client import list_source_files
from app.core.llm import get_llm
from app.core.prompts import ARCHITECTURE_PROMPT


def summarise_architecture(repo_id: str) -> str:
    repo_path = Path(settings.repos_dir) / repo_id
    files = list_source_files(repo_path)
    tree = "\n".join(str(f.relative_to(repo_path)) for f in files)

    key_names = {"main", "app", "index", "config", "server", "router"}
    key_files = [f for f in files if any(k in f.name.lower() for k in key_names)][:6]
    excerpts = "\n\n".join(
        f"---{f.relative_to(repo_path)} ---\n{f.read_text(errors= "ignore")[:1000]}" for f in files
    )

    prompt = ARCHITECTURE_PROMPT.format(tree= tree[:4000], excerpts= excerpts)
    return get_llm().invoke(prompt).content