/**
 * lib/api.ts
 * ─────────────────────────────────────────────────────────────────
 * All HTTP calls to the FastAPI backend live here.
 * Pages import individual functions — never fetch() directly.
 *
 * Base URL is read dynamically from localStorage settings so the
 * user can change it on the Settings page without a rebuild.
 */

import { getSettings } from "./store";

/** Returns the backend base URL from settings (default: localhost:8000) */
function getApiBase(): string {
  return getSettings().backendUrl;
}

// ── Repo ──────────────────────────────────────────────────────────

/**
 * POST /repo/clone
 * Clones a GitHub repo to the backend server.
 * @returns { repo_id, file_count, tree[] }
 */
export async function cloneRepo(githubUrl: string) {
  const res = await fetch(`${getApiBase()}/repo/clone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Field name must match CloneRequest Pydantic schema (snake_case)
    body: JSON.stringify({ github_url: githubUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Clone failed (HTTP ${res.status})`);
  }
  return res.json() as Promise<{ repo_id: string; file_count: number; tree: string[] }>;
}

/**
 * POST /repo/index/{repo_id}
 * Chunks + embeds all source files into ChromaDB vector store.
 * @returns { repo_id, chunks_indexed }
 */
export async function indexRepo(repoId: string) {
  const res = await fetch(`${getApiBase()}/repo/index/${repoId}`, {
    method: "POST",
    // No body — repo_id is a URL path segment
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Indexing failed (HTTP ${res.status})`);
  }
  return res.json() as Promise<{ repo_id: string; chunks_indexed: number }>;
}

// ── Chat ──────────────────────────────────────────────────────────

/**
 * GET /chat/history/{repo_id}
 * Loads all past messages for a repo from SQLite.
 * Note: `sources` is a JSON-encoded string in the DB — you must JSON.parse() it.
 * @returns [{ role, content, sources: string|null }]
 */
export async function getChatHistory(repoId: string) {
  const res = await fetch(`${getApiBase()}/chat/history/${repoId}`);
  if (!res.ok) throw new Error(`History fetch failed (HTTP ${res.status})`);
  return res.json() as Promise<Array<{ role: string; content: string; sources: string | null }>>;
}

/**
 * POST /chat/ask
 * Sends a question through the RAG pipeline and returns an AI answer.
 * @returns { answer, sources[] }
 */
export async function askQuestion(repoId: string, question: string) {
  const res = await fetch(`${getApiBase()}/chat/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo_id: repoId, question }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Chat failed (HTTP ${res.status})`);
  }
  return res.json() as Promise<{ answer: string; sources: string[] }>;
}

/**
 * GET /chat/explain/{repo_id}?path=...
 * Asks the LLM to explain a specific source file.
 * Note: The backend has a typo — returns `explaination` (not `explanation`).
 * Note: Paths are normalised to forward-slashes before encoding so Windows
 *       backslash paths stored in localStorage round-trip cleanly.
 * @returns { explaination: string }
 */
export async function explainFile(repoId: string, filePath: string) {
  const normalised = filePath.replace(/\\/g, '/');
  const res = await fetch(
    `${getApiBase()}/chat/explain/${repoId}?path=${encodeURIComponent(normalised)}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Explain failed (HTTP ${res.status})`);
  }
  return res.json() as Promise<{ explaination: string }>;
}

// ── Review ────────────────────────────────────────────────────────

/**
 * POST /review/run
 * Requests an AI code review of a specific file in the repo.
 * Paths are normalised to forward-slashes for cross-platform consistency.
 * @returns { path, review }
 */
export async function reviewFile(repoId: string, filePath: string) {
  const normalised = filePath.replace(/\\/g, '/');
  const res = await fetch(`${getApiBase()}/review/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo_id: repoId, path: normalised }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Review failed (HTTP ${res.status})`);
  }
  return res.json() as Promise<{ path: string; review: string }>;
}

// ── Architecture ──────────────────────────────────────────────────

/**
 * GET /architecture/summary/{repo_id}
 * Generates a high-level architecture summary of the entire codebase.
 * @returns { summary }
 */
export async function getArchitectureSummary(repoId: string) {
  const res = await fetch(`${getApiBase()}/architecture/summary/${repoId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Architecture summary failed (HTTP ${res.status})`);
  }
  return res.json() as Promise<{ summary: string }>;
}

// ── Health ────────────────────────────────────────────────────────

/**
 * GET /health
 * Checks if the FastAPI backend is reachable.
 * @returns true if online, false otherwise
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/health`, {
      signal: AbortSignal.timeout(4000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
