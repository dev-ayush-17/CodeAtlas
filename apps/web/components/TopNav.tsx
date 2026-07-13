"use client";

export default function TopNav() {
  return (
    <header className="bg-surface text-primary font-label-md fixed top-0 right-0 h-toolbar-height border-b border-outline-variant flex items-center justify-between px-gutter w-[calc(100%-260px)] z-10 backdrop-blur-sm bg-opacity-90">
      <div className="flex items-center">
        <span className="font-headline-sm text-lg font-black text-on-surface ml-4 tracking-tight">CodeAtlas</span>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined">dark_mode</span>
        </button>
        <button className="p-2 text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined">account_circle</span>
        </button>
      </div>
    </header>
  );
}
