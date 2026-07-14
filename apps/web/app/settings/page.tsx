"use client";

/**
 * app/settings/page.tsx — Settings
 * ─────────────────────────────────────────────────────────────────
 * Now fully functional:
 *   - Backend URL is saved to localStorage and used by api.ts
 *   - "Test Connection" calls GET /health for real
 *   - "Active Repository" dropdown is populated from localStorage repos
 *   - "Save Changes" and "Reset to Defaults" actually work
 *
 * Removed (no backend support):
 *   - "AI Models" tab
 *   - "Indexing" tab
 *   - Theme toggle (no implementation)
 */

import { useState, useEffect } from "react";
import {
  getSettings,
  saveSettings,
  resetSettings,
  getRepos,
  getActiveRepoId,
  setActiveRepoId,
  RepoEntry,
} from "@/lib/store";

type ConnectionStatus = "idle" | "checking" | "ok" | "error";

export default function SettingsPage() {
  const [backendUrl, setBackendUrl] = useState("http://localhost:8000");
  const [repos, setRepos] = useState<RepoEntry[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const settings = getSettings();
    setBackendUrl(settings.backendUrl);
    setRepos(getRepos());
    setSelectedRepoId(getActiveRepoId() ?? "");
  }, []);

  const handleSave = () => {
    saveSettings({ backendUrl });
    if (selectedRepoId) setActiveRepoId(selectedRepoId);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    resetSettings();
    setBackendUrl("http://localhost:8000");
    setConnectionStatus("idle");
    setSaved(false);
  };

  const handleTestConnection = async () => {
    setConnectionStatus("checking");
    try {
      // Test using the current input value (not the saved one)
      const res = await fetch(`${backendUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      setConnectionStatus(res.ok ? "ok" : "error");
    } catch {
      setConnectionStatus("error");
    }
  };

  return (
    <div className="p-container-margin pb-16">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Page Header */}
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-1">Settings</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Configure your CodeAtlas instance.
          </p>
        </div>

        {/* ── Backend URL ─────────────────────────────────────────── */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 space-y-4">
          <div>
            <h3 className="font-body-lg text-body-lg font-medium text-on-surface">Backend URL</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              The address of your running FastAPI server.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="url"
              value={backendUrl}
              onChange={e => {
                setBackendUrl(e.target.value);
                setConnectionStatus("idle");
              }}
              className="flex-1 bg-surface-dim border border-outline-variant rounded-md px-3 py-2 text-on-surface font-code-md text-code-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              placeholder="http://localhost:8000"
            />
            <button
              onClick={handleTestConnection}
              disabled={connectionStatus === "checking" || !backendUrl.trim()}
              className="px-4 py-2 rounded-md border border-outline-variant text-on-surface hover:bg-surface-container transition-colors font-label-md text-label-md whitespace-nowrap flex items-center gap-2 disabled:opacity-50"
            >
              <span
                className={`material-symbols-outlined text-[16px] ${
                  connectionStatus === "checking" ? "animate-spin" : ""
                } ${
                  connectionStatus === "ok"
                    ? "text-green-400"
                    : connectionStatus === "error"
                    ? "text-error"
                    : ""
                }`}
              >
                {connectionStatus === "ok"
                  ? "check_circle"
                  : connectionStatus === "error"
                  ? "error"
                  : "wifi"}
              </span>
              {connectionStatus === "checking"
                ? "Checking..."
                : connectionStatus === "ok"
                ? "Connected!"
                : connectionStatus === "error"
                ? "Failed"
                : "Test Connection"}
            </button>
          </div>

          {connectionStatus === "ok" && (
            <p className="text-green-400 font-body-md text-body-md text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Successfully connected to the backend.
            </p>
          )}
          {connectionStatus === "error" && (
            <p className="text-error font-body-md text-body-md text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">error</span>
              Could not connect. Make sure the FastAPI server is running.
            </p>
          )}
        </div>

        {/* ── Active Repository ────────────────────────────────────── */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 space-y-4">
          <div>
            <h3 className="font-body-lg text-body-lg font-medium text-on-surface">
              Active Repository
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              The repository used across Dashboard, Chat, and Repositories pages.
            </p>
          </div>

          {repos.length === 0 ? (
            <p className="text-outline font-body-md text-body-md text-sm">
              No repositories cloned yet.{" "}
              <a href="/repositories" className="text-primary hover:underline">
                Go to Repositories
              </a>{" "}
              to add one.
            </p>
          ) : (
            <select
              value={selectedRepoId}
              onChange={e => setSelectedRepoId(e.target.value)}
              className="w-full bg-surface-dim border border-outline-variant rounded-md px-3 py-2 text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
            >
              <option value="">— Select a repository —</option>
              {repos.map(r => (
                <option key={r.repo_id} value={r.repo_id}>
                  {r.repo_id} · {r.file_count} files ·{" "}
                  {r.indexed ? `${r.chunks_indexed} chunks` : "Not indexed"}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* ── About ────────────────────────────────────────────────── */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6">
          <h3 className="font-body-lg text-body-lg font-medium text-on-surface mb-3">About</h3>
          <dl className="space-y-2">
            <div className="flex justify-between font-body-md text-body-md">
              <dt className="text-on-surface-variant">Version</dt>
              <dd className="font-code-md text-code-md text-on-surface">1.0.0</dd>
            </div>
            <div className="flex justify-between font-body-md text-body-md">
              <dt className="text-on-surface-variant">LLM Model</dt>
              <dd className="font-code-md text-code-md text-on-surface">qwen2.5-coder:7b</dd>
            </div>
            <div className="flex justify-between font-body-md text-body-md">
              <dt className="text-on-surface-variant">Embedding Model</dt>
              <dd className="font-code-md text-code-md text-on-surface">nomic-embed-text</dd>
            </div>
            <div className="flex justify-between font-body-md text-body-md">
              <dt className="text-on-surface-variant">Vector Store</dt>
              <dd className="font-code-md text-code-md text-on-surface">ChromaDB</dd>
            </div>
          </dl>
        </div>

        {/* ── Actions ──────────────────────────────────────────────── */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-md border border-outline-variant text-on-surface hover:bg-surface-container transition-colors font-label-md text-label-md font-medium"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-md bg-primary text-on-primary font-label-md text-label-md font-medium hover:brightness-110 transition-all shadow-[0_0_15px_rgba(173,198,255,0.2)]"
          >
            {saved ? "✓ Saved!" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
