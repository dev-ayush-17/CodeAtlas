from pathlib import Path
from app.config import settings
from app.core.llm import get_llm
from app.core.prompts import REVIEW_PROMPT


def review_file(repo_id: str, relative_path: str) -> str:
    file_path = Path(settings.repos_dir) / repo_id / relative_path
    code = file_path.read_text(errors= "ignore")
    prompt = REVIEW_PROMPT.format(path= relative_path, code= code[:6000])
    return get_llm().invoke(prompt).content


