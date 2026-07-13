"use client";

export default function Footer() {
  return (
    <footer className="bg-surface-container-low text-primary font-code-md fixed bottom-0 right-0 h-8 border-t border-outline-variant flex items-center justify-end px-4 w-[calc(100%-260px)] gap-4 z-10 cursor-default text-xs">
      <span className="text-outline hover:text-on-primary-container transition-colors">v1.0.4</span>
      <span className="text-outline hover:text-on-primary-container transition-colors flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
        FastAPI: Online
      </span>
      <span className="text-outline hover:text-on-primary-container transition-colors flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
        LLM: Ready
      </span>
    </footer>
  );
}
