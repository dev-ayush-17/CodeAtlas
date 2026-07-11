from sqlalchemy.orm import Session
from app.core.vector_store import query_chunks
from app.core.llm import get_llm
from app.core.prompts import RAG_SYSTEM_PROMPT
from app.services.history_service import save_message


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