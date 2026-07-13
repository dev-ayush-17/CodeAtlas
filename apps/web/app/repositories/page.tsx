"use client";

import { useState } from "react";
import { cloneRepo, indexRepo } from "@/lib/api";

export default function RepositoriesPage() {
  const [githubUrl, setGithubUrl] = useState("");
  const [activeRepoId, setActiveRepoId] = useState<string | null>("fastapi-backend");
  const [isCloning, setIsCloning] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [repoData, setRepoData] = useState<{ file_count: number; tree: string[] } | null>(null);

  const handleClone = async () => {
    if (!githubUrl) return;
    setIsCloning(true);
    try {
      const result = await cloneRepo(githubUrl);
      setActiveRepoId(result.repo_id);
      setRepoData({ file_count: result.file_count, tree: result.tree });
      setGithubUrl("");
    } catch (e) {
      console.error(e);
      alert("Failed to clone repository.");
    } finally {
      setIsCloning(false);
    }
  };

  const handleIndex = async () => {
    if (!activeRepoId) return;
    setIsIndexing(true);
    try {
      await indexRepo(activeRepoId);
      alert("Indexing completed!");
    } catch (e) {
      console.error(e);
      alert("Failed to index repository.");
    } finally {
      setIsIndexing(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-48px-32px)] bg-surface w-full">
      {/* Left Panel: Repository List (40%) */}
      <section className="w-[40%] min-w-[320px] max-w-[480px] border-r border-outline-variant bg-surface-dim flex flex-col h-full z-0">
        {/* List Header & Actions */}
        <div className="p-4 border-b border-outline-variant flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-on-surface">Repositories</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">link</span>
              <input 
                className="w-full bg-surface-container border border-outline-variant text-on-surface placeholder:text-outline-variant rounded-DEFAULT pl-9 pr-3 py-2 font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all" 
                placeholder="GitHub URL..." 
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
            </div>
            <button 
              onClick={handleClone}
              disabled={isCloning || !githubUrl}
              className="bg-primary text-on-primary font-label-md text-label-md px-3 py-2.5 rounded-DEFAULT hover:bg-primary/90 transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              {isCloning ? "Cloning..." : "Add Repo"}
            </button>
          </div>
        </div>

        {/* List Items */}
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {/* Active Item */}
          <button className="w-full text-left p-3 rounded-lg bg-surface-container-highest border border-outline-variant flex items-start gap-3 relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
            <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">folder</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-label-md text-label-md text-on-surface truncate">{activeRepoId || "No Repository Selected"}</span>
                <span className="bg-primary-container/20 text-primary-container border border-primary-container/30 px-2 py-0.5 rounded-full font-label-md text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-container shadow-[0_0_4px_theme(colors.primary-container)]"></div>
                  Indexed
                </span>
              </div>
              <div className="font-code-md text-code-md text-[11px] text-on-surface-variant truncate mb-2">/repos/{activeRepoId || "..."}</div>
              <div className="flex items-center gap-2 font-label-md text-[11px] text-outline">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">code</span> {repoData ? "Analyzed" : "Ready"}</span>
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Right Panel: Repository Details (60%) */}
      <section className="flex-1 overflow-y-auto bg-surface flex flex-col">
        <div className="p-8 max-w-5xl mx-auto w-full flex flex-col gap-8">
          {/* Details Header & Actions */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-outline-variant pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-code-md text-[12px] uppercase tracking-wide">Repository</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1 flex items-center gap-3">
                {activeRepoId || "No Repository Selected"}
              </h1>
              <div className="font-code-md text-code-md text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">folder_open</span>
                /repos/{activeRepoId || "..."}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={handleIndex}
                disabled={isIndexing || !activeRepoId}
                className="bg-surface-container border border-outline-variant text-on-surface font-label-md text-label-md px-4 py-2 rounded-DEFAULT hover:bg-surface-container-high hover:text-on-surface transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                {isIndexing ? "Indexing..." : "Index"}
              </button>
            </div>
          </div>

          {/* Bento Grid: Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-container-low border border-outline-variant rounded-lg p-5 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-[100px]">description</span>
              </div>
              <div className="font-label-md text-label-md text-outline mb-1">Total Files</div>
              <div className="font-display-lg text-display-lg text-on-surface">{repoData?.file_count || 0}</div>
            </div>
          </div>

          {/* Split Content: Tree & Table */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Folder Tree Component */}
            <div className="flex flex-col gap-3">
              <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider text-[11px] border-b border-outline-variant pb-2">Codebase Structure</h3>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 font-code-md text-code-md text-on-surface-variant overflow-x-auto max-h-[400px]">
                {repoData?.tree ? (
                  repoData.tree.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 py-1 text-on-surface hover:bg-surface-container-low transition-colors px-2 cursor-default">
                      <span className="material-symbols-outlined text-[16px] text-outline">description</span>
                      {file}
                    </div>
                  ))
                ) : (
                  <div className="text-outline">No files found. Clone a repo first.</div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </section>
    </div>
  );
}
