from pydantic_settings import BaseSettings

class Settings(BaseSettings):

    ollama_base_url: str = "http://localhost:11434"
    llm_model: str = "qwen2.5-coder:7b"
    embedding_model: str = "nomic-embed-text"
    chroma_dir: str = "./data/chroma"
    sqlite_dir: str = "./data/sqlite"
    repos_dir: str = "./data/repos"


    class config:
        env_file = ".env"


settings = Settings()