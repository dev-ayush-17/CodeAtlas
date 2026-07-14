"use client";

/**
 * app/chat/page.tsx — AI Chat
 * ─────────────────────────────────────────────────────────────────
 * Fully integrated with the backend:
 *   - Reads active repo from localStorage
 *   - Loads real chat history from GET /chat/history/{repo_id} on mount
 *   - Sends questions to POST /chat/ask and renders real answers
 *   - Auto-scrolls to newest message
 *   - Shows sources from last answer in the inspector panel
 *   - Shows gated states: no repo selected / repo not indexed yet
 *
 * Removed: hardcoded activeRepo string, fake suggestion items
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { askQuestion, getChatHistory } from "@/lib/api";
import { getActiveRepo, RepoEntry } from "@/lib/store";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

export default function ChatPage() {
  const [activeRepo, setActiveRepo] = useState<RepoEntry | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load repo + history on mount
  useEffect(() => {
    const repo = getActiveRepo();
    setActiveRepo(repo);

    if (!repo) {
      setIsLoadingHistory(false);
      return;
    }

    getChatHistory(repo.repo_id)
      .then(history => {
        const parsed: Message[] = history.map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          // sources is stored in SQLite as a JSON-encoded string e.g. '["file.py"]'
          sources: m.sources ? (() => { try { return JSON.parse(m.sources!); } catch { return []; } })() : [],
        }));
        setMessages(parsed);
      })
      .catch(() => {}) // non-critical if history fails
      .finally(() => setIsLoadingHistory(false));
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || !activeRepo) return;

    // Optimistic: show user message immediately
    const userMessage: Message = { role: "user", content: trimmed };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await askQuestion(activeRepo.repo_id, trimmed);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: response.answer,
          sources: response.sources || [],
        },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ ${err instanceof Error ? err.message : "Failed to get response. Is the backend running?"}`,
        },
      ]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Last assistant message with non-empty sources for the inspector panel
  const lastSourcedMessage = [...messages]
    .reverse()
    .find(m => m.role === "assistant" && m.sources && m.sources.length > 0);

  // ── Gate: no repo selected ───────────────────────────────────────
  if (!isLoadingHistory && !activeRepo) {
    return (
      <div className="flex h-[calc(100vh-48px-32px)] items-center justify-center bg-surface flex-col gap-6">
        <span className="material-symbols-outlined text-[64px] text-outline">forum</span>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          No active repository selected.
        </p>
        <Link
          href="/repositories"
          className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-lg font-body-md text-body-md hover:brightness-110 transition-all"
        >
          <span className="material-symbols-outlined">folder_open</span>
          Go to Repositories
        </Link>
      </div>
    );
  }

  // ── Gate: repo not indexed ───────────────────────────────────────
  if (!isLoadingHistory && activeRepo && !activeRepo.indexed) {
    return (
      <div className="flex h-[calc(100vh-48px-32px)] items-center justify-center bg-surface flex-col gap-6">
        <span className="material-symbols-outlined text-[64px] text-outline">data_object</span>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Repository not indexed yet.
        </p>
        <p className="font-body-md text-body-md text-outline">
          Index{" "}
          <span className="font-code-md text-code-md text-primary">{activeRepo.repo_id}</span>{" "}
          first to enable AI chat.
        </p>
        <Link
          href="/repositories"
          className="flex items-center gap-2 px-6 py-3 bg-primary-container text-on-primary-container rounded-lg font-body-md text-body-md hover:bg-primary hover:text-on-primary transition-all"
        >
          <span className="material-symbols-outlined">play_arrow</span>
          Index Repository
        </Link>
      </div>
    );
  }

  // ── Main Chat ────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-48px-32px)] bg-surface w-full">

      {/* Chat Area */}
      <section className="flex-1 flex flex-col min-w-0 bg-surface border-r border-outline-variant">

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-4">

          {/* Loading history skeleton */}
          {isLoadingHistory && (
            <div className="flex items-center gap-3 text-on-surface-variant font-body-md text-body-md mt-8">
              <span className="material-symbols-outlined animate-pulse text-primary text-[20px]">
                progress_activity
              </span>
              Loading conversation history...
            </div>
          )}

          {/* Empty state (after history loaded, no messages) */}
          {!isLoadingHistory && messages.length === 0 && activeRepo && (
            <div className="mt-8 flex flex-col items-center justify-center text-center max-w-2xl mx-auto w-full">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-outline-variant flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[32px] text-primary">
                  auto_awesome
                </span>
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface mb-2">
                Ask about your codebase
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mb-1">
                Repository:{" "}
                <span className="font-code-md text-code-md text-primary">
                  {activeRepo.repo_id}
                </span>
              </p>
              <p className="font-body-md text-body-md text-on-surface-variant mb-8">
                Try one of these questions:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                {[
                  { icon: "architecture", text: "Explain the overall architecture" },
                  { icon: "vpn_key", text: "Where is authentication handled?" },
                  { icon: "api", text: "List all the API endpoints" },
                ].map(s => (
                  <button
                    key={s.text}
                    onClick={() => setInput(s.text)}
                    className="p-4 rounded-xl border border-outline-variant bg-surface-container-low hover:bg-surface-container hover:border-primary-container transition-all text-left group flex flex-col gap-2"
                  >
                    <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors text-[20px]">
                      {s.icon}
                    </span>
                    <span className="font-body-md text-body-md text-on-surface">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, idx) =>
            msg.role === "user" ? (
              <div key={idx} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-surface-container-high px-5 py-3 text-on-surface font-body-md text-body-md">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div key={idx} className="flex justify-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-container/20 border border-primary/30 flex items-center justify-center shrink-0 mt-1">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    smart_toy
                  </span>
                </div>
                <div className="flex-1 max-w-[85%] space-y-3">
                  <div className="font-body-md text-body-md text-on-surface whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>
                  {/* Inline source chips */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((src, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container border border-outline-variant font-code-md text-[11px] text-on-surface-variant"
                        >
                          <span className="material-symbols-outlined text-[13px] text-outline">
                            description
                          </span>
                          {src}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {/* Thinking indicator */}
          {isLoading && (
            <div className="flex justify-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-container/20 border border-primary/30 flex items-center justify-center shrink-0 mt-1">
                <span className="material-symbols-outlined text-[18px] text-primary animate-pulse">
                  smart_toy
                </span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant font-body-md text-body-md">
                <span className="material-symbols-outlined animate-spin text-outline text-[16px]">
                  progress_activity
                </span>
                Thinking...
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 md:p-6 pb-10">
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-tertiary/30 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
            <div className="relative bg-surface-container border border-outline-variant rounded-xl flex flex-col shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
              {/* Repo badge */}
              <div className="flex items-center gap-2 px-3 pt-3 pb-1">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary-container/20 border border-outline-variant text-xs text-on-secondary-container whitespace-nowrap">
                  <span className="material-symbols-outlined text-[14px]">folder</span>
                  {activeRepo?.repo_id ?? "—"}
                </span>
              </div>
              <textarea
                ref={textareaRef}
                className="w-full bg-transparent border-none text-on-surface placeholder:text-outline-variant resize-none focus:ring-0 p-3 font-body-md text-body-md"
                placeholder="Ask a question about your codebase…"
                rows={3}
                style={{ minHeight: "80px" }}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="flex items-center justify-between px-3 pb-3">
                <span className="font-code-md text-code-md text-outline text-[11px]">
                  Enter to send · Shift+Enter for new line
                </span>
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="w-8 h-8 rounded-lg bg-primary hover:bg-primary/90 text-on-primary flex items-center justify-center transition-colors shadow-sm disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Inspector Panel */}
      <aside className="w-[280px] hidden lg:flex flex-col bg-surface-container-lowest border-l border-outline-variant pb-8 shrink-0">
        <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low">
          <h3 className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-outline">library_books</span>
            Sources Used
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!lastSourcedMessage ? (
            <p className="font-body-md text-body-md text-on-surface-variant text-sm leading-relaxed">
              Source files the AI references will appear here after each answer.
            </p>
          ) : (
            lastSourcedMessage.sources?.map((src, i) => (
              <div
                key={i}
                className="rounded-lg border border-outline-variant bg-surface p-3 hover:border-primary-container transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[15px] text-outline shrink-0">
                    description
                  </span>
                  <span className="font-code-md text-[11px] text-on-surface truncate">{src}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
