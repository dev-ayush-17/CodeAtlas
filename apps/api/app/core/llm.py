from langchain_ollama import ChatOllama
from app.config import settings


def get_llm():
    return ChatOllama(model= settings.llm_model, base_url= settings.ollama_base_url, temperature= 0.1)