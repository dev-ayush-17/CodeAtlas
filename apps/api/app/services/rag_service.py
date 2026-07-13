from sqlalchemy.orm import Session
from app.core.vector_store import query_chunks
from app.core.llm import get_llm
from app.core.prompts import RAG_SYSTEM_PROMPT, CODE_EXPLAIN_PROMPT
from app.services.history_service import save_message
from pathlib import Path
from app.config import settings


def answer_questions(db: Session, repo_id: str, question: str) -> dict:

    docs = query_chunks(repo_id, question)
    context = "\n\n".join(f"[{d.metadata}]\n{d.page_content}" for d in docs)
    prompt = RAG_SYSTEM_PROMPT.format(context= context, question= question)
    llm = get_llm()
    response = llm.invoke(prompt)
    answer_text = response.content

    sources = sorted(set(d.metadata["path"] for d in docs))

    save_message(db, repo_id, "user", question)
    save_message(db, repo_id, "assistant", answer_text, sources)

    return {"answer": answer_text, "sources": sources}


def explain_file(repo_id: str, relative_path: str) -> str:
    file_path = Path(settings.repos_dir) / repo_id / relative_path
    code = file_path.read_text(errors= "ignore")
    prompt = CODE_EXPLAIN_PROMPT.format(path= relative_path, code= code[:6000])
    llm = get_llm()
    return llm.invoke(prompt).content