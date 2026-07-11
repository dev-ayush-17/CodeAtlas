from langchain_chroma import Chroma
from app.core.embeddings import get_embeddings
from app.config import settings

def get_vector_store(repo_id: str):
    return Chroma(
        collection_name= repo_id,
        embedding_function= get_embeddings(),
        persist_directory= settings.chroma_dir,
    )


def add_chunks(repo_id: str, chunks: list[dict]):
    store = get_vector_store(repo_id)
    texts = [c["content"] for c in chunks]
    metadatas = [c["metadata"] for c in chunks]
    store.add_texts(texts= texts, metadatas= metadatas)


def query_chunks(repo_id: str, query: str, k: int = 6):
    store = get_vector_store(repo_id)
    return store.similarity_search(query, k=k)