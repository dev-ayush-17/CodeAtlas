import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "CodeAtlas - AI Code Intelligence",
  description: "AI-powered codebase understanding application.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-surface font-body-md min-h-screen overflow-x-hidden antialiased">
        <Sidebar />
        <TopNav />
        <main className="ml-sidebar-width pt-[48px] h-screen overflow-y-auto">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
