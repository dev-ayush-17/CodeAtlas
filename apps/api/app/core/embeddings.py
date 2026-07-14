"""
core/embeddings.py
─────────────────────────────────────────────────────────────────────────────
WHY THIS FILE WAS REWRITTEN
─────────────────────────────────────────────────────────────────────────────
The original code used langchain_ollama.OllamaEmbeddings, which internally
uses the Ollama Python client. On Windows, that client spawns a model-runner
subprocess and tries to talk to it on a randomly-assigned port (e.g. 52593).
If that subprocess crashes or is never started, every embedding call raises:

  ollama._types.ResponseError:
    Post "http://127.0.0.1:52593/tokenize": connectex: No connection could
    be made because the target machine actively refused it. (status 400)

FIX: We bypass the langchain_ollama client entirely and call Ollama's stable
public REST endpoint  POST /api/embed  using Python's built-in urllib.
This endpoint is available in Ollama >= 0.1.21 and does NOT rely on any
internal subprocess communication.

CONFIRMED WORKING:
  POST http://localhost:11434/api/embed
  {"model": "nomic-embed-text", "input": ["hello world"]}
  → {"embeddings": [[...768 floats...]]}
"""

import json
import logging
import time
import urllib.error
import urllib.request

from app.config import settings

logger = logging.getLogger(__name__)


class OllamaEmbeddings:
    """
    Drop-in replacement for langchain_ollama.OllamaEmbeddings.

    Calls Ollama's /api/embed REST endpoint directly via urllib (stdlib only,
    no extra dependencies).  ChromaDB only requires embed_documents() and
    embed_query() — this class provides both.
    """

    def __init__(self, model: str, base_url: str):
        self.model = model
        self.base_url = base_url.rstrip("/")

    # ── Internal HTTP call ────────────────────────────────────────────────

    def _post_embed(self, texts: list[str]) -> list[list[float]]:
        """
        POST /api/embed with a batch of texts.
        Returns a list of embedding vectors (one per input text).
        """
        payload = json.dumps({"model": self.model, "input": texts}).encode()
        req = urllib.request.Request(
            f"{self.base_url}/api/embed",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = json.loads(resp.read())
                return data["embeddings"]
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors="ignore")
            raise RuntimeError(
                f"Ollama /api/embed returned HTTP {e.code}: {body}"
            ) from e
        except urllib.error.URLError as e:
            raise RuntimeError(
                f"Cannot reach Ollama at {self.base_url}. "
                f"Make sure Ollama is running.  Reason: {e.reason}"
            ) from e

    def _embed_with_retry(
        self, texts: list[str], retries: int = 3
    ) -> list[list[float]]:
        """Retry wrapper with exponential back-off for transient failures."""
        last_exc: Exception = RuntimeError("No attempts made")
        for attempt in range(retries):
            try:
                return self._post_embed(texts)
            except Exception as exc:
                last_exc = exc
                if attempt < retries - 1:
                    wait = 2**attempt  # 1 s, 2 s
                    logger.warning(
                        "Ollama embed attempt %d/%d failed: %s — retrying in %ds",
                        attempt + 1,
                        retries,
                        exc,
                        wait,
                    )
                    time.sleep(wait)
        raise last_exc

    # ── Public LangChain / ChromaDB interface ─────────────────────────────

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """Embed a list of document strings (called by ChromaDB add_texts)."""
        if not texts:
            return []
        # Send in batches of 16 to avoid very large request bodies
        batch_size = 16
        results: list[list[float]] = []
        for i in range(0, len(texts), batch_size):
            results.extend(self._embed_with_retry(texts[i : i + batch_size]))
        return results

    def embed_query(self, text: str) -> list[float]:
        """Embed a single query string (called by ChromaDB similarity_search)."""
        return self._embed_with_retry([text])[0]


def get_embeddings() -> OllamaEmbeddings:
    return OllamaEmbeddings(
        model=settings.embedding_model,
        base_url=settings.ollama_base_url,
    )