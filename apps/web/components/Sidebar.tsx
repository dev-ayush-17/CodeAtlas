"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/", icon: "dashboard" },
    { name: "Repositories", href: "/repositories", icon: "folder_special" },
    { name: "AI Chat", href: "/chat", icon: "forum" },
  ];

  return (
    <nav className="bg-surface-container text-primary font-body-md h-screen w-sidebar-width fixed left-0 top-0 border-r border-outline-variant flex flex-col p-4 gap-2 z-20">
      <div className="mb-8 px-4">
        <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CodeAtlas</h1>
        <p className="font-label-md text-label-md text-on-surface-variant mt-1">AI Engine Active</p>
      </div>
      <div className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ease-in-out ${
                isActive
                  ? "bg-secondary-container text-on-secondary-container"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:bg-surface-container-highest"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
