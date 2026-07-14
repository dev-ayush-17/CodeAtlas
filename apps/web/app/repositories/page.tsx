"use client";

/**
 * app/repositories/page.tsx — Repository Management
 * ─────────────────────────────────────────────────────────────────
 * Left panel:  list of all cloned repos (from localStorage)
 * Right panel: details of selected repo
 *   - File tree with per-file "Explain" and "Review" buttons
 *   - Stats (file count, chunks indexed)
 *   - Index + Architecture Summary buttons
 *   - AI result shown in an inline panel
 *
 * Removed: hardcoded "Indexed" badge, single-repo slot, fake stats
 */

import { useState, useEffect } from "react";
import {
  cloneRepo,
  indexRepo,
  explainFile,
  reviewFile,
  getArchitectureSummary,
} from "@/lib/api";
import {
  getRepos,
  saveRepo,
  updateRepo,
  removeRepo,
  getActiveRepoId,
  setActiveRepoId,
  RepoEntry,
} from "@/lib/store";

type PanelType = "explain" | "review" | "architecture";

interface Panel {
  type: PanelType;
  title: string;
  content: string;
}

export default function RepositoriesPage() {
  const [repos, setRepos] = useState<RepoEntry[]>([]);
  const [activeRepoId, setActiveRepoIdState] = useState<string | null>(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [isCloning, setIsCloning] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [cloneError, setCloneError] = useState<string | null>(null);
  const [indexError, setIndexError] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [isPanelLoading, setIsPanelLoading] = useState(false);

  useEffect(() => {
    setRepos(getRepos());
    setActiveRepoIdState(getActiveRepoId());
  }, []);

  const activeRepo = repos.find(r => r.repo_id === activeRepoId) ?? null;

  const selectRepo = (repo_id: string) => {
    setActiveRepoId(repo_id);
    setActiveRepoIdState(repo_id);
    setPanel(null);
    setIndexError(null);
  };

  // ── Clone ────────────────────────────────────────────────────────
  const handleClone = async () => {
    if (!githubUrl.trim()) return;
    setIsCloning(true);
    setCloneError(null);
    try {
      const result = await cloneRepo(githubUrl.trim());
      const entry: RepoEntry = {
        repo_id: result.repo_id,
        github_url: githubUrl.trim(),
        file_count: result.file_count,
        tree: result.tree,
        indexed: false,
        chunks_indexed: 0,
        cloned_at: new Date().toISOString(),
      };
      saveRepo(entry);
      const updated = getRepos();
      setRepos(updated);
      setActiveRepoId(result.repo_id);
      setActiveRepoIdState(result.repo_id);
      setGithubUrl("");
    } catch (err) {
      setCloneError(err instanceof Error ? err.message : "Clone failed");
    } finally {
      setIsCloning(false);
    }
  };

  // ── Index ────────────────────────────────────────────────────────
  const handleIndex = async () => {
    if (!activeRepoId) return;
    setIsIndexing(true);
    setIndexError(null);
    try {
      const result = await indexRepo(activeRepoId);
      updateRepo(activeRepoId, {
        indexed: true,
        chunks_indexed: result.chunks_indexed,
      });
      setRepos(getRepos());
    } catch (err) {
      setIndexError(err instanceof Error ? err.message : "Indexing failed");
    } finally {
      setIsIndexing(false);
    }
  };

  // ── Explain File ─────────────────────────────────────────────────
  const handleExplain = async (filePath: string) => {
    if (!activeRepoId) return;
    setIsPanelLoading(true);
    setPanel({ type: "explain", title: filePath, content: "" });
    try {
      const result = await explainFile(activeRepoId, filePath);
      setPanel({ type: "explain", title: filePath, content: result.explaination });
    } catch (err) {
      setPanel({
        type: "explain",
        title: filePath,
        content: `Error: ${err instanceof Error ? err.message : "Failed"}`,
      });
    } finally {
      setIsPanelLoading(false);
    }
  };

  // ── Review File ──────────────────────────────────────────────────
  const handleReview = async (filePath: string) => {
    if (!activeRepoId) return;
    setIsPanelLoading(true);
    setPanel({ type: "review", title: filePath, content: "" });
    try {
      const result = await reviewFile(activeRepoId, filePath);
      setPanel({ type: "review", title: filePath, content: result.review });
    } catch (err) {
      setPanel({
        type: "review",
        title: filePath,
        content: `Error: ${err instanceof Error ? err.message : "Failed"}`,
      });
    } finally {
      setIsPanelLoading(false);
    }
  };

  // ── Architecture Summary ─────────────────────────────────────────
  const handleArchitecture = async () => {
    if (!activeRepoId) return;
    setIsPanelLoading(true);
    setPanel({ type: "architecture", title: "Architecture Summary", content: "" });
    try {
      const result = await getArchitectureSummary(activeRepoId);
      setPanel({ type: "architecture", title: "Architecture Summary", content: result.summary });
    } catch (err) {
      setPanel({
        type: "architecture",
        title: "Architecture Summary",
        content: `Error: ${err instanceof Error ? err.message : "Failed"}`,
      });
    } finally {
      setIsPanelLoading(false);
    }
  };

  // ── Remove ───────────────────────────────────────────────────────
  const handleRemove = (repo_id: string) => {
    removeRepo(repo_id);
    const remaining = getRepos();
    setRepos(remaining);
    if (activeRepoId === repo_id) {
      const next = remaining[0]?.repo_id ?? null;
      if (next) setActiveRepoId(next);
      setActiveRepoIdState(next);
    }
    setPanel(null);
  };

  const panelIcon =
    panel?.type === "explain"
      ? "description"
      : panel?.type === "review"
      ? "rate_review"
      : "architecture";

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-48px-32px)] bg-surface w-full">

      {/* ── Left Panel: Repo List ──────────────────────────────────── */}
      <section className="w-[38%] min-w-[300px] max-w-[460px] border-r border-outline-variant bg-surface-dim flex flex-col h-full shrink-0">
        {/* Clone form */}
        <div className="p-4 border-b border-outline-variant flex flex-col gap-4">
          <h2 className="font-headline-md text-headline-md text-on-surface">Repositories</h2>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">
                link
              </span>
              <input
                className="w-full bg-surface-container border border-outline-variant text-on-surface placeholder:text-outline-variant rounded-DEFAULT pl-9 pr-3 py-2 font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                placeholder="https://github.com/..."
                type="url"
                value={githubUrl}
                onChange={e => setGithubUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleClone()}
              />
            </div>
            <button
              onClick={handleClone}
              disabled={isCloning || !githubUrl.trim()}
              className="bg-primary text-on-primary font-label-md text-label-md px-3 py-2.5 rounded-DEFAULT hover:bg-primary/90 transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isCloning ? "hourglass_empty" : "add"}
              </span>
              {isCloning ? "Cloning..." : "Clone"}
            </button>
          </div>
          {cloneError && (
            <p className="text-error font-body-md text-body-md text-sm">{cloneError}</p>
          )}
        </div>

        {/* Repo list */}
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {repos.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant font-body-md text-body-md">
              No repositories yet. Paste a GitHub URL above to clone one.
            </div>
          ) : (
            repos.map(repo => (
              <button
                key={repo.repo_id}
                onClick={() => selectRepo(repo.repo_id)}
                className={`w-full text-left p-3 rounded-lg flex items-start gap-3 relative overflow-hidden transition-colors ${
                  activeRepoId === repo.repo_id
                    ? "bg-surface-container-highest border border-outline-variant"
                    : "hover:bg-surface-container border border-transparent"
                }`}
              >
                {activeRepoId === repo.repo_id && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary rounded-l-lg" />
                )}
                <span
                  className={`material-symbols-outlined text-[20px] mt-0.5 shrink-0 ${
                    activeRepoId === repo.repo_id ? "text-primary" : "text-outline"
                  }`}
                >
                  folder
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-label-md text-label-md text-on-surface truncate">
                      {repo.repo_id}
                    </span>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full font-label-md text-[10px] uppercase tracking-wider flex items-center gap-1 border ${
                        repo.indexed
                          ? "bg-primary-container/20 text-primary border-primary/30"
                          : "bg-surface-container-high text-outline border-outline-variant"
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          repo.indexed ? "bg-primary" : "bg-outline"
                        }`}
                      />
                      {repo.indexed ? "Indexed" : "Cloned"}
                    </span>
                  </div>
                  <div className="font-code-md text-[11px] text-outline truncate">
                    {repo.file_count} files
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      {/* ── Right Panel: Repo Details ──────────────────────────────── */}
      <section className="flex-1 overflow-y-auto bg-surface flex flex-col min-w-0">
        {!activeRepo ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-on-surface-variant">
            <span className="material-symbols-outlined text-[64px] text-outline">folder_open</span>
            <p className="font-body-lg text-body-lg">
              Select or clone a repository to get started.
            </p>
          </div>
        ) : (
          <div className="p-8 max-w-5xl mx-auto w-full flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-outline-variant pb-6">
              <div>
                <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">
                  {activeRepo.repo_id}
                </h1>
                <div className="font-code-md text-code-md text-on-surface-variant flex items-center gap-2 text-[12px]">
                  <span className="material-symbols-outlined text-[15px]">link</span>
                  {activeRepo.github_url}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleArchitecture}
                  disabled={!activeRepo.indexed || isPanelLoading}
                  title={!activeRepo.indexed ? "Index the repo first to use this feature" : ""}
                  className="bg-surface-container border border-outline-variant text-on-surface font-label-md text-label-md px-4 py-2 rounded-DEFAULT hover:bg-surface-container-high transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px]">architecture</span>
                  Architecture
                </button>
                <button
                  onClick={handleIndex}
                  disabled={isIndexing}
                  className="bg-primary text-on-primary font-label-md text-label-md px-4 py-2 rounded-DEFAULT hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isIndexing ? "hourglass_empty" : "play_arrow"}
                  </span>
                  {isIndexing ? "Indexing..." : activeRepo.indexed ? "Re-index" : "Index"}
                </button>
                <button
                  onClick={() => handleRemove(activeRepo.repo_id)}
                  className="border border-error/50 text-error font-label-md text-label-md px-4 py-2 rounded-DEFAULT hover:bg-error/10 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  Remove
                </button>
              </div>
            </div>

            {indexError && (
              <div className="bg-error/10 border border-error/30 text-error rounded-lg px-4 py-3 font-body-md text-body-md">
                {indexError}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface-container-low border border-outline-variant rounded-lg p-5">
                <div className="font-label-md text-label-md text-outline mb-1">Total Files</div>
                <div className="font-headline-lg text-headline-lg text-on-surface">
                  {activeRepo.file_count.toLocaleString()}
                </div>
              </div>
              <div className="bg-surface-container-low border border-outline-variant rounded-lg p-5">
                <div className="font-label-md text-label-md text-outline mb-1">Vector Chunks</div>
                <div className="font-headline-lg text-headline-lg text-on-surface">
                  {activeRepo.indexed ? activeRepo.chunks_indexed.toLocaleString() : "—"}
                </div>
                {!activeRepo.indexed && (
                  <div className="font-label-md text-[11px] text-outline mt-1">
                    Index to enable AI features
                  </div>
                )}
              </div>
              <div className="bg-surface-container-low border border-outline-variant rounded-lg p-5">
                <div className="font-label-md text-label-md text-outline mb-1">Status</div>
                <div
                  className={`font-headline-md text-headline-md ${
                    activeRepo.indexed ? "text-primary" : "text-on-surface-variant"
                  }`}
                >
                  {activeRepo.indexed ? "Indexed" : "Cloned"}
                </div>
                <div className="font-label-md text-[11px] text-outline mt-1">
                  Added {new Date(activeRepo.cloned_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* AI Result Panel (Explain / Review / Architecture) */}
            {panel && (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-surface-container border-b border-outline-variant">
                  <span className="font-label-md text-label-md text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      {panelIcon}
                    </span>
                    <span className="truncate max-w-xs">{panel.title}</span>
                  </span>
                  <button
                    onClick={() => setPanel(null)}
                    className="text-outline hover:text-on-surface transition-colors ml-2 shrink-0"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto">
                  {isPanelLoading && !panel.content ? (
                    <div className="flex items-center gap-3 text-on-surface-variant font-body-md text-body-md">
                      <span className="material-symbols-outlined text-primary text-[18px] animate-spin">
                        progress_activity
                      </span>
                      Analyzing with AI… this may take a moment.
                    </div>
                  ) : (
                    <pre className="font-code-md text-code-md text-on-surface-variant whitespace-pre-wrap leading-relaxed text-[12px]">
                      {panel.content}
                    </pre>
                  )}
                </div>
              </div>
            )}

            {/* File Tree with per-file actions */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider text-[11px]">
                  File Tree ({activeRepo.tree.length} files)
                </h3>
                {!activeRepo.indexed && (
                  <span className="font-label-md text-[11px] text-outline">
                    Index repo to enable Explain & Review
                  </span>
                )}
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden max-h-[520px] overflow-y-auto">
                {activeRepo.tree.length === 0 ? (
                  <p className="p-4 text-outline font-body-md text-body-md">
                    No source files found.
                  </p>
                ) : (
                  activeRepo.tree.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-surface-container-low transition-colors border-b border-outline-variant/30 last:border-0 group"
                    >
                      <span className="material-symbols-outlined text-[14px] text-outline shrink-0">
                        description
                      </span>
                      <span className="font-code-md text-[11px] text-on-surface-variant flex-1 truncate">
                        {file}
                      </span>
                      {activeRepo.indexed && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => handleExplain(file)}
                            disabled={isPanelLoading}
                            className="px-2 py-0.5 rounded text-[10px] bg-surface-container border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            Explain
                          </button>
                          <button
                            onClick={() => handleReview(file)}
                            disabled={isPanelLoading}
                            className="px-2 py-0.5 rounded text-[10px] bg-surface-container border border-outline-variant text-on-surface-variant hover:text-tertiary hover:border-tertiary transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            Review
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
