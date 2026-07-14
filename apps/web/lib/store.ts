/**
 * lib/store.ts
 * ─────────────────────────────────────────────────────────────────
 * Shared localStorage-based state for the CodeAtlas frontend.
 * Used to persist cloned repos, the active repo selection, and
 * app settings across page navigations without a state library.
 */

// ── Types ─────────────────────────────────────────────────────────

export interface RepoEntry {
  repo_id: string;       // SHA-1 hash from the backend (e.g. "a1b2c3d4e5")
  github_url: string;    // original GitHub URL the user entered
  file_count: number;    // total source files from clone response
  tree: string[];        // relative file paths from clone response
  indexed: boolean;      // whether /repo/index has been run
  chunks_indexed: number; // number of vector chunks (0 if not indexed)
  cloned_at: string;     // ISO date string
}

export interface AppSettings {
  backendUrl: string;    // FastAPI server address
}

// ── Storage Keys ──────────────────────────────────────────────────

const REPOS_KEY = "codeatlas_repos";
const ACTIVE_REPO_KEY = "codeatlas_active_repo";
const SETTINGS_KEY = "codeatlas_settings";

const DEFAULT_SETTINGS: AppSettings = {
  backendUrl: "http://localhost:8000",
};

// ── Repos ─────────────────────────────────────────────────────────

/** Returns all saved repos from localStorage */
export function getRepos(): RepoEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(REPOS_KEY) || "[]");
  } catch {
    return [];
  }
}

/** Adds or updates a repo entry in localStorage */
export function saveRepo(repo: RepoEntry): void {
  const repos = getRepos();
  const idx = repos.findIndex(r => r.repo_id === repo.repo_id);
  if (idx >= 0) repos[idx] = repo;
  else repos.push(repo);
  localStorage.setItem(REPOS_KEY, JSON.stringify(repos));
}

/** Partially updates a repo entry (e.g. after indexing) */
export function updateRepo(repo_id: string, updates: Partial<RepoEntry>): void {
  const repos = getRepos();
  const idx = repos.findIndex(r => r.repo_id === repo_id);
  if (idx >= 0) {
    repos[idx] = { ...repos[idx], ...updates };
    localStorage.setItem(REPOS_KEY, JSON.stringify(repos));
  }
}

/** Removes a repo from localStorage (does NOT delete from disk) */
export function removeRepo(repo_id: string): void {
  const repos = getRepos().filter(r => r.repo_id !== repo_id);
  localStorage.setItem(REPOS_KEY, JSON.stringify(repos));
}

/** Finds a single repo by ID */
export function getRepo(repo_id: string): RepoEntry | null {
  return getRepos().find(r => r.repo_id === repo_id) ?? null;
}

// ── Active Repo ───────────────────────────────────────────────────

/** Returns the currently selected repo_id, or null */
export function getActiveRepoId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_REPO_KEY);
}

/** Sets the currently selected repo_id */
export function setActiveRepoId(repo_id: string): void {
  localStorage.setItem(ACTIVE_REPO_KEY, repo_id);
}

/** Returns the full RepoEntry for the active repo, or null */
export function getActiveRepo(): RepoEntry | null {
  const id = getActiveRepoId();
  if (!id) return null;
  return getRepo(id);
}

// ── Settings ──────────────────────────────────────────────────────

/** Returns app settings, merged with defaults */
export function getSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Saves app settings to localStorage */
export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/** Resets settings back to defaults */
export function resetSettings(): void {
  localStorage.removeItem(SETTINGS_KEY);
}
