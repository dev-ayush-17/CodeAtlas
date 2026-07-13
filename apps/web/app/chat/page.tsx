"use client";

import { useState } from "react";
import { askQuestion } from "@/lib/api";

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const activeRepo = "fastapi-backend";

  const handleSend = async () => {
    if (!input.trim() || !activeRepo) return;
    
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await askQuestion(activeRepo, userMessage.content);
      // Assuming response has { answer: string, sources?: string[] }
      const assistantMessage: Message = { 
        role: "assistant", 
        content: response.answer || response.response || JSON.stringify(response),
        sources: response.sources || []
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [...prev, { role: "assistant", content: "Error: Failed to fetch response." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-48px-32px)] bg-surface w-full">
      {/* Middle Column: Chat Area */}
      <section className="flex-1 flex flex-col min-w-0 bg-surface border-r border-outline-variant relative">
        {/* Chat Messages Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6" id="chat-container">
          
          {messages.length === 0 ? (
            <div className="mt-8 mb-12 flex flex-col items-center justify-center text-center max-w-2xl mx-auto w-full">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-outline-variant flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[32px] text-primary">auto_awesome</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface mb-2">How can I help you today?</h2>
              <p className="text-on-surface-variant mb-8">Type your question about the codebase.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                <button 
                  onClick={() => setInput("Explain the architecture")}
                  className="p-4 rounded-xl border border-outline-variant bg-surface-container-low hover:bg-surface-container hover:border-primary-container transition-all text-left group flex flex-col gap-2"
                >
                  <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors text-[20px]">architecture</span>
                  <span className="text-sm font-medium text-on-surface">Explain the architecture</span>
                </button>
                <button 
                  onClick={() => setInput("Where is auth?")}
                  className="p-4 rounded-xl border border-outline-variant bg-surface-container-low hover:bg-surface-container hover:border-primary-container transition-all text-left group flex flex-col gap-2"
                >
                  <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors text-[20px]">vpn_key</span>
                  <span className="text-sm font-medium text-on-surface">Where is auth?</span>
                </button>
                <button 
                  onClick={() => setInput("Find API endpoints")}
                  className="p-4 rounded-xl border border-outline-variant bg-surface-container-low hover:bg-surface-container hover:border-primary-container transition-all text-left group flex flex-col gap-2"
                >
                  <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors text-[20px]">api</span>
                  <span className="text-sm font-medium text-on-surface">Find API endpoints</span>
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              msg.role === "user" ? (
                <div key={idx} className="flex justify-end mb-4">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-surface-container-high px-5 py-3 text-on-surface">
                    <p>{msg.content}</p>
                  </div>
                </div>
              ) : (
                <div key={idx} className="flex justify-start mb-4">
                  <div className="flex gap-4 max-w-full md:max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-primary-container/20 border border-primary/30 flex items-center justify-center shrink-0 mt-1">
                      <span className="material-symbols-outlined text-[18px] text-primary">smart_toy</span>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="text-on-surface whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                </div>
              )
            ))
          )}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="flex gap-4 max-w-full md:max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-primary-container/20 border border-primary/30 flex items-center justify-center shrink-0 mt-1">
                  <span className="material-symbols-outlined text-[18px] text-primary animate-pulse">smart_toy</span>
                </div>
                <div className="flex-1 flex items-center text-on-surface-variant font-code-md text-sm">
                  Thinking...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area (Bottom) */}
        <div className="p-4 bg-surface md:p-6 pb-8 md:pb-12">
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-tertiary/30 rounded-2xl blur opacity-30 group-focus-within:opacity-100 transition duration-500"></div>
            <div className="relative bg-surface-container border border-outline-variant rounded-xl flex flex-col shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
              <div className="flex items-center gap-2 px-3 pt-3 pb-1 overflow-x-auto">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary-container/20 border border-outline-variant text-xs text-on-secondary-container whitespace-nowrap">
                  <span className="material-symbols-outlined text-[14px]">folder</span>
                  {activeRepo}
                </span>
              </div>
              <textarea 
                className="w-full bg-transparent border-none text-on-surface placeholder-outline-variant resize-none focus:ring-0 p-3 text-sm" 
                placeholder="Ask a question about your code..." 
                rows={3} 
                style={{ minHeight: "80px" }}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <div className="flex items-center justify-end px-3 pb-3">
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

      {/* Right Column: Inspector (Sources) */}
      <aside className="w-[300px] hidden lg:flex flex-col bg-surface-container-lowest border-l border-outline-variant h-full pb-8">
        <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
          <h3 className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-outline">library_books</span>
            Referenced Sources
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="text-xs text-on-surface-variant leading-relaxed">The AI uses your repository context to answer.</p>
          {messages.filter(m => m.role === "assistant" && m.sources && m.sources.length > 0).slice(-1).map((msg, idx) => (
            <div key={idx} className="space-y-2">
              {msg.sources?.map((src, i) => (
                <div key={i} className="group rounded-lg border border-outline-variant bg-surface p-3 hover:border-primary-container transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 text-sm text-on-surface font-medium truncate">
                    <span className="material-symbols-outlined text-[16px] text-secondary-fixed-dim">description</span>
                    <span className="truncate">{src}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
