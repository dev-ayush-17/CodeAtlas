"use client";


import Link from "next/link";
import { useState, useEffect } from "react";
import { indexRepo, getChatHistory, checkHealth } from "@/lib/api";
import { getActiveRepo, updateRepo, RepoEntry } from "@/lib/store";

export default function DashboardPage() {
  const [activeRepo, setActiveRepo] = useState<RepoEntry | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexError, setIndexError] = useState<string | null>(null);
  const [recentMessages, setRecentMessages] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const repo = getActiveRepo();
    setActiveRepo(repo);

    // Real health check
    checkHealth().then(setApiOnline);

    // Real chat history (last 5 messages for the activity feed)
    if (repo) {
      getChatHistory(repo.repo_id)
        .then(msgs => setRecentMessages(msgs.slice(-5).reverse()))
        .catch(() => {}); // non-critical
    }
  }, []);

  const handleIndex = async () => {
    if (!activeRepo) return;
    setIsIndexing(true);
    setIndexError(null);
    try {
      const result = await indexRepo(activeRepo.repo_id);
      updateRepo(activeRepo.repo_id, {
        indexed: true,
        chunks_indexed: result.chunks_indexed,
      });
      setActiveRepo(prev =>
        prev ? { ...prev, indexed: true, chunks_indexed: result.chunks_indexed } : prev
      );
    } catch (err) {
      setIndexError(err instanceof Error ? err.message : "Indexing failed");
    } finally {
      setIsIndexing(false);
    }
  };

  // ── Empty State ────────────────────────────────────────────────────────────
  if (!activeRepo) {
    return (
      <div className="p-container-margin pb-16">
        <div className="max-w-7xl mx-auto space-y-6">
          <section className="py-6">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">
              Welcome to CodeAtlas.
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
              Get started by cloning a repository.
            </p>
          </section>

          <div className="flex flex-col items-center justify-center py-24 gap-6 bg-surface-container rounded-xl border border-dashed border-outline-variant">
            <span className="material-symbols-outlined text-[64px] text-outline">
              folder_open
            </span>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              No repository selected yet.
            </p>
            <Link
              href="/repositories"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-lg font-body-md text-body-md hover:brightness-110 transition-all shadow-[0_0_20px_rgba(173,198,255,0.3)]"
            >
              <span className="material-symbols-outlined">add</span>
              Add Your First Repository
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  return (
    <div className="p-container-margin pb-16">
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="py-6">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Dashboard</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
            Active repository overview.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Main: Repository Summary Card ─────────────────────────── */}
          <div className="lg:col-span-2 bg-surface-container rounded-xl border border-outline-variant p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-container/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <p className="font-label-md text-label-md text-primary tracking-widest uppercase mb-1">
                  Active Repository
                </p>
                <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline">folder</span>
                  {activeRepo.repo_id}
                </h3>
                <p className="font-code-md text-code-md text-outline mt-1 truncate max-w-xs text-[12px]">
                  {activeRepo.github_url}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-label-md text-label-md ${
                  activeRepo.indexed
                    ? "bg-primary-container/20 border-primary/30 text-primary"
                    : "bg-surface-container-high border-outline-variant text-on-surface-variant"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    activeRepo.indexed ? "bg-primary animate-pulse" : "bg-outline"
                  }`}
                />
                {activeRepo.indexed ? "Indexed" : "Cloned — Not Indexed"}
              </span>
            </div>

            {/* Real stats from stored clone/index results */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 relative z-10">
              <div className="bg-surface-container-highest p-4 rounded-lg border border-outline-variant/50">
                <p className="font-label-md text-label-md text-on-surface-variant mb-1">
                  Total Files
                </p>
                <p className="font-headline-md text-headline-md text-on-surface">
                  {activeRepo.file_count.toLocaleString()}
                </p>
              </div>
              <div className="bg-surface-container-highest p-4 rounded-lg border border-outline-variant/50">
                <p className="font-label-md text-label-md text-on-surface-variant mb-1">
                  Chunks Indexed
                </p>
                <p className="font-headline-md text-headline-md text-on-surface">
                  {activeRepo.indexed
                    ? activeRepo.chunks_indexed.toLocaleString()
                    : "—"}
                </p>
                {!activeRepo.indexed && (
                  <p className="font-label-md text-[11px] text-outline mt-1">
                    Run Index to enable AI
                  </p>
                )}
              </div>
              <div className="bg-surface-container-highest p-4 rounded-lg border border-outline-variant/50">
                <p className="font-label-md text-label-md text-on-surface-variant mb-1">
                  Added
                </p>
                <p className="font-body-md text-body-md text-on-surface">
                  {new Date(activeRepo.cloned_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {indexError && (
              <p className="mt-4 text-error font-body-md text-body-md relative z-10">
                {indexError}
              </p>
            )}
          </div>

          {/* ── Right Column: Status + Quick Actions ──────────────────── */}
          <div className="space-y-6">
            {/* System Status (real /health check) */}
            <div className="bg-surface-container rounded-xl border border-outline-variant p-6">
              <h4 className="font-label-md text-label-md text-on-surface-variant tracking-widest uppercase mb-4">
                System Status
              </h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-outline">api</span>
                  <span className="font-body-md text-body-md text-on-surface">FastAPI</span>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border font-code-md text-code-md ${
                    apiOnline === null
                      ? "border-outline-variant text-outline bg-surface-container-high"
                      : apiOnline
                      ? "border-green-500/30 text-green-400 bg-green-500/10"
                      : "border-error/30 text-error bg-error/10"
                  }`}
                >
                  {apiOnline === null
                    ? "Checking..."
                    : apiOnline
                    ? "Online"
                    : "Offline"}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-surface-container rounded-xl border border-outline-variant p-6">
              <h4 className="font-label-md text-label-md text-on-surface-variant tracking-widest uppercase mb-4">
                Quick Actions
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={handleIndex}
                  disabled={isIndexing}
                  className="flex items-center gap-3 w-full px-4 py-3 bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary transition-colors rounded-lg font-body-md text-body-md font-medium disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">
                    {isIndexing ? "hourglass_empty" : "data_object"}
                  </span>
                  {isIndexing
                    ? "Indexing..."
                    : activeRepo.indexed
                    ? "Re-index Repository"
                    : "Index Repository"}
                </button>
                <Link
                  href="/chat"
                  className="flex items-center gap-3 w-full px-4 py-3 bg-transparent border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors rounded-lg font-body-md text-body-md"
                >
                  <span className="material-symbols-outlined">chat</span>
                  Open AI Chat
                </Link>
                <Link
                  href="/repositories"
                  className="flex items-center gap-3 w-full px-4 py-3 bg-transparent border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors rounded-lg font-body-md text-body-md"
                >
                  <span className="material-symbols-outlined">source</span>
                  View Repository
                </Link>
              </div>
            </div>
          </div>

          {/* ── Bottom: Real Recent Conversations ─────────────────────── */}
          <div className="lg:col-span-3">
            <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden">
              <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
                <h4 className="font-label-md text-label-md text-on-surface-variant tracking-widest uppercase">
                  Recent Conversations
                </h4>
                <Link
                  href="/chat"
                  className="text-primary hover:text-primary-fixed transition-colors font-label-md text-label-md"
                >
                  Open Chat
                </Link>
              </div>

              {recentMessages.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    No conversations yet.{" "}
                    <Link href="/chat" className="text-primary hover:underline">
                      Start chatting
                    </Link>{" "}
                    about your codebase.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-outline-variant/50">
                  {recentMessages.map((msg, i) => (
                    <li
                      key={i}
                      className="p-4 hover:bg-surface-container-highest transition-colors flex gap-4 items-start"
                    >
                      <div
                        className={`w-8 h-8 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                          msg.role === "user"
                            ? "bg-surface-container-high"
                            : "bg-primary-container/20"
                        }`}
                      >
                        <span className="material-symbols-outlined text-outline text-[16px]">
                          {msg.role === "user" ? "person" : "smart_toy"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-body-md text-body-md text-on-surface truncate">
                          {msg.content.length > 100
                            ? msg.content.slice(0, 100) + "..."
                            : msg.content}
                        </p>
                        <p className="font-label-md text-label-md text-on-surface-variant mt-1 capitalize">
                          {msg.role} · {activeRepo.repo_id}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
