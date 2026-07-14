"use client";

/**
 * components/Footer.tsx
 * Polls GET /health every 30s to show real API status.
 * Removed "LLM: Ready" — no backend endpoint supports this.
 */

import { useState, useEffect } from "react";
import { checkHealth } from "@/lib/api";

export default function Footer() {
  // null = still checking, true = online, false = offline
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => setApiOnline(await checkHealth());
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="bg-surface-container-low font-code-md fixed bottom-0 right-0 h-8 border-t border-outline-variant flex items-center justify-end px-4 w-[calc(100%-260px)] gap-4 z-10 cursor-default text-xs">
      <span className="text-outline">v1.0.0</span>
      <span className="text-outline flex items-center gap-1.5">
        <span
          className={`w-1.5 h-1.5 rounded-full inline-block transition-colors ${
            apiOnline === null
              ? "bg-outline animate-pulse"
              : apiOnline
              ? "bg-green-500"
              : "bg-error"
          }`}
        />
        API:{" "}
        {apiOnline === null
          ? "Checking..."
          : apiOnline
          ? "Online"
          : "Offline"}
      </span>
    </footer>
  );
}
