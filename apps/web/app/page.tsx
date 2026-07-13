"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { indexRepo } from "@/lib/api";

export default function DashboardPage() {
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexSuccess, setIndexSuccess] = useState(false);
  const activeRepo = "codeatlas-backend";

  const handleIndex = async () => {
    setIsIndexing(true);
    setIndexSuccess(false);
    try {
      await indexRepo(activeRepo);
      setIndexSuccess(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsIndexing(false);
    }
  };

  return (
    <div className="p-container-margin pb-16">
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="py-6">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Welcome back, Developer.</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">CodeAtlas is ready.</p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Focus: Repository Summary Card */}
          <div className="lg:col-span-2 bg-surface-container rounded-xl border border-outline-variant p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-container/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <p className="font-label-md text-label-md text-primary tracking-widest uppercase mb-1">Active Repository</p>
                <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline">folder</span>
                  {activeRepo}
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container/20 border border-primary/30 text-primary font-label-md text-label-md">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                Complete
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 relative z-10">
              <div className="bg-surface-container-highest p-4 rounded-lg border border-outline-variant/50">
                <p className="font-label-md text-label-md text-on-surface-variant mb-1">Total Files</p>
                <p className="font-headline-md text-headline-md text-on-surface">124</p>
              </div>
              <div className="bg-surface-container-highest p-4 rounded-lg border border-outline-variant/50">
                <p className="font-label-md text-label-md text-on-surface-variant mb-1">Languages</p>
                <p className="font-body-md text-body-md text-on-surface mt-1">Py / JS</p>
              </div>
              <div className="bg-surface-container-highest p-4 rounded-lg border border-outline-variant/50">
                <p className="font-label-md text-label-md text-on-surface-variant mb-1">Embeddings</p>
                <p className="font-headline-md text-headline-md text-on-surface">2,450</p>
              </div>
              <div className="bg-surface-container-highest p-4 rounded-lg border border-outline-variant/50">
                <p className="font-label-md text-label-md text-on-surface-variant mb-1">Last Indexed</p>
                <p className="font-body-md text-body-md text-on-surface mt-1">2 hours ago</p>
              </div>
            </div>

            <div className="relative z-10">
              <div className="flex justify-between font-label-md text-label-md text-on-surface-variant mb-2">
                <span>Indexing Coverage</span>
                <span>100%</span>
              </div>
              <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(173,198,255,0.5)] w-full"></div>
              </div>
            </div>
          </div>

          {/* Right Column: Status & Quick Actions */}
          <div className="space-y-6">
            {/* Status Indicators */}
            <div className="bg-surface-container rounded-xl border border-outline-variant p-6">
              <h4 className="font-label-md text-label-md text-on-surface-variant tracking-widest uppercase mb-4">System Status</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-outline">api</span>
                    <span className="font-body-md text-body-md text-on-surface">FastAPI</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-green-500/30 text-green-400 font-code-md text-code-md bg-green-500/10">
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-outline">smart_toy</span>
                    <span className="font-body-md text-body-md text-on-surface">LLM</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-primary/30 text-primary font-code-md text-code-md bg-primary-container/20">
                    Ready
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-surface-container rounded-xl border border-outline-variant p-6">
              <h4 className="font-label-md text-label-md text-on-surface-variant tracking-widest uppercase mb-4">Quick Actions</h4>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={handleIndex}
                  disabled={isIndexing}
                  className="flex items-center gap-3 w-full px-4 py-3 bg-primary-container text-on-primary-container hover:bg-primary transition-colors rounded-lg font-body-md text-body-md font-medium disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">data_object</span>
                  {isIndexing ? "Indexing..." : indexSuccess ? "Indexed!" : "Index Repository"}
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

          {/* Bottom Row: Activity */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Conversations */}
            <div className="bg-surface-container rounded-xl border border-outline-variant p-0 overflow-hidden">
              <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
                <h4 className="font-label-md text-label-md text-on-surface-variant tracking-widest uppercase">Recent Conversations</h4>
                <Link href="/chat" className="text-primary hover:text-primary-fixed transition-colors font-label-md text-label-md">View All</Link>
              </div>
              <ul className="divide-y divide-outline-variant/50">
                <li className="p-4 hover:bg-surface-container-highest transition-colors cursor-pointer flex gap-4 items-start">
                  <div className="w-8 h-8 rounded bg-surface-variant flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-outline text-sm">chat_bubble</span>
                  </div>
                  <div>
                    <p className="font-body-md text-body-md text-on-surface font-medium">Explain Auth flow</p>
                    <p className="font-label-md text-label-md text-on-surface-variant mt-1">codeatlas-backend • 2 hours ago</p>
                  </div>
                </li>
                <li className="p-4 hover:bg-surface-container-highest transition-colors cursor-pointer flex gap-4 items-start">
                  <div className="w-8 h-8 rounded bg-surface-variant flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-outline text-sm">chat_bubble</span>
                  </div>
                  <div>
                    <p className="font-body-md text-body-md text-on-surface font-medium">How does the embedding pipeline work?</p>
                    <p className="font-label-md text-label-md text-on-surface-variant mt-1">codeatlas-backend • Yesterday</p>
                  </div>
                </li>
                <li className="p-4 hover:bg-surface-container-highest transition-colors cursor-pointer flex gap-4 items-start">
                  <div className="w-8 h-8 rounded bg-surface-variant flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-outline text-sm">chat_bubble</span>
                  </div>
                  <div>
                    <p className="font-body-md text-body-md text-on-surface font-medium">Find API endpoints for user creation</p>
                    <p className="font-label-md text-label-md text-on-surface-variant mt-1">codeatlas-backend • 3 days ago</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Recent Indexing */}
            <div className="bg-surface-container rounded-xl border border-outline-variant p-0 overflow-hidden">
              <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
                <h4 className="font-label-md text-label-md text-on-surface-variant tracking-widest uppercase">Indexing History</h4>
                <button className="text-primary hover:text-primary-fixed transition-colors font-label-md text-label-md">Logs</button>
              </div>
              <ul className="divide-y divide-outline-variant/50">
                <li className="p-4 flex gap-4 items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
                  <div className="flex-1">
                    <p className="font-body-md text-body-md text-on-surface">Full Repository Sync</p>
                    <p className="font-label-md text-label-md text-on-surface-variant">124 files processed</p>
                  </div>
                  <span className="font-code-md text-code-md text-outline">2h ago</span>
                </li>
                <li className="p-4 flex gap-4 items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
                  <div className="flex-1">
                    <p className="font-body-md text-body-md text-on-surface">Incremental Update</p>
                    <p className="font-label-md text-label-md text-on-surface-variant">3 files processed</p>
                  </div>
                  <span className="font-code-md text-code-md text-outline">Yesterday</span>
                </li>
                <li className="p-4 flex gap-4 items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
                  <div className="flex-1">
                    <p className="font-body-md text-body-md text-on-surface">Initial Clone &amp; Index</p>
                    <p className="font-label-md text-label-md text-on-surface-variant">121 files processed</p>
                  </div>
                  <span className="font-code-md text-code-md text-outline">4 days ago</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
