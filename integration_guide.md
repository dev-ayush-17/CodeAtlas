# CodeAtlas — Frontend ↔ Backend Integration Guide

> **Goal of this document**: Teach you, hands-on and in depth, *how* and *why* every piece of
> the CodeAtlas frontend talks to the FastAPI backend — so you can replicate the skill in any
> future project on your own.

---

## Table of Contents

1. [How the Web Works — The Mental Model](#1-how-the-web-works--the-mental-model)
2. [Your Project Architecture at a Glance](#2-your-project-architecture-at-a-glance)
3. [The Backend Contract — Reading FastAPI Routes](#3-the-backend-contract--reading-fastapi-routes)
4. [The API Layer — `lib/api.ts` Explained Line-by-Line](#4-the-api-layer--libapiits-explained-line-by-line)
5. [React State + Async Fetching — The Core Pattern](#5-react-state--async-fetching--the-core-pattern)
6. [Page-by-Page Integration](#6-page-by-page-integration)
   - 6.1 [Repositories Page](#61-repositories-page-post--clone--post--index)
   - 6.2 [Chat Page](#62-chat-page-post--chatask)
   - 6.3 [Dashboard Page](#63-dashboard-page-making-it-live)
   - 6.4 [Settings Page](#64-settings-page-persisting-config)
7. [TypeScript Types — Contract Enforcement](#7-typescript-types--contract-enforcement)
8. [Error Handling Patterns](#8-error-handling-patterns)
9. [CORS — Why the Backend Has to Allow Your Frontend](#9-cors--why-the-backend-has-to-allow-your-frontend)
10. [Loading & UI State Best Practices](#10-loading--ui-state-best-practices)
11. [Environment Variables — Keeping Secrets Safe](#11-environment-variables--keeping-secrets-safe)
12. [What to Practice Next](#12-what-to-practice-next)

---

## 1. How the Web Works — The Mental Model

Before writing a single line of integration code, understand the conversation that happens
between your browser and your API server.

```
  Browser (Next.js)                 Server (FastAPI @ localhost:8000)
  ─────────────────                 ─────────────────────────────────
  User clicks "Add Repo"
        │
        │  HTTP POST /repo/clone
        │  Content-Type: application/json
        │  Body: { "github_url": "https://github.com/..." }
        │ ────────────────────────────────────────────────►
        │
        │                               FastAPI receives the request
        │                               • validates body against CloneRequest schema
        │                               • calls ingest_repository(github_url)
        │                               • clones the repo, counts files
        │
        │  HTTP 200 OK
        │  Body: { "repo_id": "abc123", "file_count": 42, "tree": [...] }
        │ ◄────────────────────────────────────────────────
        │
  React updates state with the
  response and re-renders the UI
```

**Key vocabulary you must know:**

| Term | Meaning |
|------|---------|
| **HTTP Method** | `GET` (read), `POST` (create/action), `PUT` (replace), `PATCH` (partial update), `DELETE` (remove) |
| **Endpoint / Route** | A URL path like `/repo/clone` that maps to a function on the server |
| **Request Body** | JSON data you send *to* the server (only on POST/PUT/PATCH) |
| **Response Body** | JSON data the server sends *back* to you |
| **Status Code** | `200` = success, `422` = validation error, `500` = server crash |
| **CORS** | Security policy: server must explicitly permit cross-origin requests |
| **async / await** | JavaScript syntax for waiting on network calls without blocking |

---

## 2. Your Project Architecture at a Glance

```
CodeAtlas/
├── apps/
│   ├── api/                   ← FastAPI Backend (Python)
│   │   └── app/
│   │       ├── main.py        ← FastAPI app, CORS, router mounting
│   │       ├── config.py      ← Settings (URLs, directories)
│   │       ├── routers/       ← HTTP endpoints (repo, chat, review, architecture)
│   │       ├── schemas/       ← Pydantic models = request/response shape contracts
│   │       ├── services/      ← Business logic (RAG, indexing, git cloning)
│   │       ├── core/          ← Utilities (LLM, vector store, chunker, prompts)
│   │       ├── models/        ← SQLAlchemy DB models (ChatMessage)
│   │       └── db/            ← Database connection (SQLite)
│   │
│   └── web/                   ← Next.js Frontend (TypeScript/React)
│       ├── app/               ← App Router pages
│       │   ├── page.tsx       ← Dashboard (/)
│       │   ├── repositories/page.tsx
│       │   ├── chat/page.tsx
│       │   └── settings/page.tsx
│       ├── components/        ← Shared UI (Sidebar, TopNav, Footer)
│       ├── lib/
│       │   └── api.ts         ← ★ THE INTEGRATION LAYER ★
│       └── app/globals.css    ← Design tokens via Tailwind v4
```

**The golden rule:** Your frontend (`apps/web`) should *never* talk directly to the database,
LLM, or vector store. It only talks to the FastAPI backend, which acts as a secure middleman.

---

## 3. The Backend Contract — Reading FastAPI Routes

Every FastAPI route is a *contract*. Read it and you know exactly what your frontend needs
to send and what it will receive back.

### How to read a FastAPI route

```python
# File: apps/api/app/routers/chat.py

from app.schemas.chat_schema import AskRequest, AskResponse  # ← These define the contract

@router.post("/ask", response_model=AskResponse)   # ← Method=POST, Path=/chat/ask, returns AskResponse shape
def ask(payload: AskRequest, db: Session = Depends(get_db)):
    #      ↑ body must match AskRequest
    return answer_questions(db, payload.repo_id, payload.question)
```

Now look at the schemas:

```python
# File: apps/api/app/schemas/chat_schema.py

class AskRequest(BaseModel):
    repo_id: str      # ← frontend MUST send this field
    question: str     # ← frontend MUST send this field

class AskResponse(BaseModel):
    answer: str       # ← frontend WILL receive this
    sources: list[str] # ← frontend WILL receive this
```

**Translation into what your frontend sends/receives:**

```
POST http://localhost:8000/chat/ask

REQUEST body (what you send):
{
  "repo_id": "abc123",
  "question": "How does the auth system work?"
}

RESPONSE body (what you get back):
{
  "answer": "The auth system uses JWT tokens...",
  "sources": ["app/auth/routes.py", "app/models/user.py"]
}
```

### Complete endpoint map for CodeAtlas

| Frontend Action | Method | URL | Request Body | Response |
|----------------|--------|-----|-------------|----------|
| Clone a GitHub repo | `POST` | `/repo/clone` | `{ github_url }` | `{ repo_id, file_count, tree[] }` |
| Index a repo | `POST` | `/repo/index/{repo_id}` | *(none)* | `{ repo_id, chunks_indexed }` |
| Ask a question | `POST` | `/chat/ask` | `{ repo_id, question }` | `{ answer, sources[] }` |
| Get chat history | `GET` | `/chat/history/{repo_id}` | *(none)* | `[{ role, content, sources }]` |
| Explain a file | `GET` | `/chat/explain/{repo_id}?path=...` | *(none)* | `{ explaination }` |
| Code review | `POST` | `/review/run` | `{ repo_id, path }` | `{ path, review }` |
| Architecture summary | `GET` | `/architecture/summary/{repo_id}` | *(none)* | `{ summary }` |
| Health check | `GET` | `/health` | *(none)* | `{ status: "ok" }` |

---

## 4. The API Layer — `lib/api.ts` Explained Line-by-Line

`lib/api.ts` is the **only** place in your frontend that knows the backend URL. Every page
imports from here — that way, if the URL ever changes, you change it in exactly one place.

```typescript
// File: apps/web/lib/api.ts

// ─────────────────────────────────────────────────────────────────────────────
// BASE URL
// This is the address of your FastAPI server.
// In production you would change this to your deployed backend URL.
// Ideally, store this in an environment variable (see Section 11).
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:8000";


// ─────────────────────────────────────────────────────────────────────────────
// cloneRepo — POST /repo/clone
//
// WHY: User pastes a GitHub URL; we send it to the backend which:
//   1. Hashes the URL to create a unique repo_id
//   2. Clones the repo to disk
//   3. Scans the files and returns a tree
//
// PARAMETER: githubUrl — full GitHub URL string (e.g. "https://github.com/...")
// RETURNS:   { repo_id: string, file_count: number, tree: string[] }
// ─────────────────────────────────────────────────────────────────────────────
export async function cloneRepo(githubUrl: string) {
  const res = await fetch(`${API_BASE}/repo/clone`, {
    method: "POST",                         // ← must match the @router.post decorator
    headers: { "Content-Type": "application/json" }, // ← tells FastAPI to parse body as JSON
    body: JSON.stringify({ github_url: githubUrl }), // ← must match CloneRequest schema field names
    //                       ↑ note: Python uses snake_case ("github_url"), not camelCase
  });

  // ← If the server returned a non-2xx status code, throw immediately.
  //   The page component will catch this and show an error to the user.
  if (!res.ok) throw new Error("Failed to clone repo");

  // ← .json() parses the response body from a JSON string into a JavaScript object.
  return res.json();
}


// ─────────────────────────────────────────────────────────────────────────────
// indexRepo — POST /repo/index/{repo_id}
//
// WHY: After cloning, the user initiates indexing. The backend:
//   1. Lists all source files in the cloned repo folder
//   2. Reads each file, splits into chunks
//   3. Creates vector embeddings and stores them in ChromaDB
//
// PARAMETER: repoId — the hash ID returned by cloneRepo
// RETURNS:   { repo_id: string, chunks_indexed: number }
// ─────────────────────────────────────────────────────────────────────────────
export async function indexRepo(repoId: string) {
  const res = await fetch(
    `${API_BASE}/repo/index/${repoId}`, // ← repoId is a URL path segment, not a body field
    { method: "POST" }                  // ← no body needed; the ID is in the URL
  );
  if (!res.ok) throw new Error("Failed to index repo");
  return res.json();
}


// ─────────────────────────────────────────────────────────────────────────────
// getChatHistory — GET /chat/history/{repo_id}
//
// WHY: On page load, fetch previous Q&A pairs for this repo from SQLite.
//   The backend queries ChatMessage rows filtered by repo_id.
//
// RETURNS: Array of { role: "user"|"assistant", content: string, sources: string[] }
// ─────────────────────────────────────────────────────────────────────────────
export async function getChatHistory(repoId: string) {
  // ← GET requests have NO body. Data goes in the URL path.
  const res = await fetch(`${API_BASE}/chat/history/${repoId}`);
  if (!res.ok) throw new Error("Failed to fetch chat history");
  return res.json();
}


// ─────────────────────────────────────────────────────────────────────────────
// askQuestion — POST /chat/ask
//
// WHY: Core feature. When user submits a question, the backend:
//   1. Searches ChromaDB for the most relevant code chunks
//   2. Builds a prompt: [context chunks] + [question]
//   3. Sends to Ollama LLM
//   4. Saves the exchange to SQLite
//   5. Returns the answer + source files used
//
// RETURNS: { answer: string, sources: string[] }
// ─────────────────────────────────────────────────────────────────────────────
export async function askQuestion(repoId: string, question: string) {
  const res = await fetch(`${API_BASE}/chat/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      repo_id: repoId,   // ← matches AskRequest.repo_id
      question: question // ← matches AskRequest.question
    }),
  });
  if (!res.ok) throw new Error("Failed to ask question");
  return res.json();
  // Returns: { answer: "...", sources: ["file/path.py", ...] }
}


// ─────────────────────────────────────────────────────────────────────────────
// explainFile — GET /chat/explain/{repo_id}?path=...
//
// WHY: User wants a plain-English explanation of a specific file.
//   The backend reads the file from disk and asks the LLM to explain it.
//
// NOTE: The file path goes as a QUERY PARAMETER (?path=...), not a path segment.
//   This is because file paths can contain slashes which would break URL routing.
//   encodeURIComponent() safely encodes special characters (/, ., spaces, etc.)
// ─────────────────────────────────────────────────────────────────────────────
export async function explainFile(repoId: string, path: string) {
  const res = await fetch(
    `${API_BASE}/chat/explain/${repoId}?path=${encodeURIComponent(path)}`
    //                                           ↑ encodes "app/main.py" → "app%2Fmain.py"
  );
  if (!res.ok) throw new Error("Failed to explain file");
  return res.json();
  // Returns: { explaination: "This file is the entry point..." }
  // NOTE: "explaination" is a typo in the backend — your frontend must match it exactly!
}


// ─────────────────────────────────────────────────────────────────────────────
// reviewFile — POST /review/run
//
// WHY: Requests an AI code review of a specific file.
//   Backend reads the file, builds a review prompt, calls the LLM.
//
// RETURNS: { path: string, review: string }
// ─────────────────────────────────────────────────────────────────────────────
export async function reviewFile(repoId: string, path: string) {
  const res = await fetch(`${API_BASE}/review/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      repo_id: repoId, // ← ReviewRequest.repo_id
      path: path       // ← ReviewRequest.path
    }),
  });
  if (!res.ok) throw new Error("Failed to review file");
  return res.json();
}


// ─────────────────────────────────────────────────────────────────────────────
// getArchitectureSummary — GET /architecture/summary/{repo_id}
//
// WHY: Generates a high-level architecture summary of the entire codebase.
//   Backend scans file tree, reads key files, sends to LLM.
//
// RETURNS: { summary: string }
// ─────────────────────────────────────────────────────────────────────────────
export async function getArchitectureSummary(repoId: string) {
  const res = await fetch(`${API_BASE}/architecture/summary/${repoId}`);
  if (!res.ok) throw new Error("Failed to get architecture summary");
  return res.json();
}
```

---

## 5. React State + Async Fetching — The Core Pattern

This is the **universal pattern** used across every page in CodeAtlas.
Master this, and you can integrate any API anywhere.

```typescript
// ─────────────────────────────────────────────────────────────────────────────
// THE UNIVERSAL ASYNC FETCH PATTERN
// ─────────────────────────────────────────────────────────────────────────────

"use client"; // ← Required for useState and event handlers in Next.js App Router

import { useState, useEffect } from "react";
import { someApiFunction } from "@/lib/api"; // ← Always import from your API layer

export default function MyPage() {

  // ── STEP 1: Define state variables ──────────────────────────────────────────
  //
  // You need at least three types of state for any fetch operation:
  //   - The DATA itself (null before it loads, actual value after)
  //   - A LOADING flag (true while waiting for the server)
  //   - An ERROR value (stores the error message if something went wrong)
  //
  const [data, setData] = useState<SomeType | null>(null);   // starts as null
  const [isLoading, setIsLoading] = useState(false);         // starts as false
  const [error, setError] = useState<string | null>(null);   // starts as null


  // ── STEP 2: Load data on page mount ─────────────────────────────────────────
  //
  // useEffect with an empty dependency array [] runs ONCE when the component
  // first appears on screen. Use this to load initial data.
  //
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);   // ← show spinner / skeleton UI
      setError(null);       // ← clear any previous errors

      try {
        const result = await someApiFunction("some-param");
        setData(result);    // ← store the response, React re-renders
      } catch (err) {
        // err is typed as 'unknown' in TypeScript — cast it:
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        // finally always runs, whether success or error
        setIsLoading(false); // ← hide spinner
      }
    };

    loadData(); // ← call the async function (can't make useEffect itself async)
  }, []);      // ← [] means "run once on mount"


  // ── STEP 3: Handle user-triggered actions ────────────────────────────────────
  //
  // For actions triggered by buttons (clone, index, send message), use event handlers.
  // Same pattern as above, but called by onClick instead of useEffect.
  //
  const handleAction = async () => {
    if (isLoading) return; // ← prevent double-clicking

    setIsLoading(true);
    setError(null);

    try {
      const result = await someApiFunction("param");
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsLoading(false);
    }
  };


  // ── STEP 4: Render based on state ───────────────────────────────────────────
  return (
    <div>
      {/* Show loading state */}
      {isLoading && <p>Loading...</p>}

      {/* Show error state */}
      {error && <p className="text-red-500">{error}</p>}

      {/* Show data when available */}
      {data && <p>{data.someField}</p>}

      {/* Always show the action button */}
      <button onClick={handleAction} disabled={isLoading}>
        {isLoading ? "Working..." : "Do Something"}
      </button>
    </div>
  );
}
```

---

## 6. Page-by-Page Integration

### 6.1 Repositories Page — `POST /repo/clone` + `POST /repo/index`

**Current state** (already implemented): The basic clone and index flow works.
Below is the full annotated version showing *exactly* why each line exists.

```typescript
// File: apps/web/app/repositories/page.tsx
"use client";

import { useState } from "react";
// ← Import ONLY what this page needs. Don't import everything from api.ts.
import { cloneRepo, indexRepo } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// TypeScript interface — mirrors the CloneResponse Pydantic schema
// WHY: TypeScript will warn you at build time if you try to access a field
// that doesn't exist, or if you pass wrong types to a function.
// ─────────────────────────────────────────────────────────────────────────────
interface CloneResponse {
  repo_id: string;
  file_count: number;
  tree: string[];
}

export default function RepositoriesPage() {
  // ── State declarations ───────────────────────────────────────────────────────
  const [githubUrl, setGithubUrl] = useState(""); // controlled input value
  const [activeRepoId, setActiveRepoId] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [repoData, setRepoData] = useState<CloneResponse | null>(null);
  const [indexResult, setIndexResult] = useState<{ chunks_indexed: number } | null>(null);
  const [cloneError, setCloneError] = useState<string | null>(null);
  const [indexError, setIndexError] = useState<string | null>(null);

  // ── Clone handler ────────────────────────────────────────────────────────────
  const handleClone = async () => {
    // Guard: don't proceed if input is empty
    if (!githubUrl.trim()) return;

    setIsCloning(true);
    setCloneError(null); // clear previous error on new attempt

    try {
      // This sends:  POST http://localhost:8000/repo/clone
      //              Body: { "github_url": "https://github.com/..." }
      const result: CloneResponse = await cloneRepo(githubUrl);

      // result is: { repo_id: "abc123", file_count: 42, tree: ["file1.py", ...] }
      setActiveRepoId(result.repo_id);
      setRepoData(result);
      setGithubUrl(""); // ← clear input after success (good UX)

    } catch (err) {
      // The error could be a network error (no server), or a 4xx/5xx from FastAPI
      setCloneError(err instanceof Error ? err.message : "Clone failed");
    } finally {
      setIsCloning(false);
    }
  };

  // ── Index handler ────────────────────────────────────────────────────────────
  const handleIndex = async () => {
    if (!activeRepoId) return; // can't index without a repo

    setIsIndexing(true);
    setIndexError(null);

    try {
      // This sends:  POST http://localhost:8000/repo/index/abc123
      //              No body (the repo_id is in the URL path)
      const result = await indexRepo(activeRepoId);
      // result is: { repo_id: "abc123", chunks_indexed: 2450 }
      setIndexResult(result);

    } catch (err) {
      setIndexError(err instanceof Error ? err.message : "Indexing failed");
    } finally {
      setIsIndexing(false);
    }
  };


  return (
    <div>
      {/* ── Clone Input ─────────────────────────────────────────────────────── */}
      {/*
        This is a "controlled input" — React owns the value via state.
        onChange fires on every keypress and updates state.
        This keeps the input and state synchronized.
      */}
      <input
        type="text"
        value={githubUrl}
        onChange={(e) => setGithubUrl(e.target.value)}
        placeholder="https://github.com/user/repo"
      />

      {/* ── Clone Button ────────────────────────────────────────────────────── */}
      <button
        onClick={handleClone}
        disabled={isCloning || !githubUrl.trim()} // disable if busy or no input
      >
        {isCloning ? "Cloning..." : "Clone Repository"}
      </button>

      {/* ── Clone Error ─────────────────────────────────────────────────────── */}
      {/* Conditional rendering: only shows if cloneError is not null */}
      {cloneError && (
        <p style={{ color: "red" }}>Error: {cloneError}</p>
      )}

      {/* ── Repo Details (shown after successful clone) ──────────────────────── */}
      {/* Optional chaining (?.) prevents crash if repoData is null */}
      {repoData && (
        <div>
          <h2>Repository: {activeRepoId}</h2>
          <p>Files: {repoData.file_count}</p>

          {/* ── Index Button (only shown after cloning) ─────────────────────── */}
          <button
            onClick={handleIndex}
            disabled={isIndexing}
          >
            {isIndexing ? "Indexing..." : "Index Repository"}
          </button>

          {indexError && <p style={{ color: "red" }}>{indexError}</p>}

          {/* ── Show index success ───────────────────────────────────────────── */}
          {indexResult && (
            <p>✓ Indexed {indexResult.chunks_indexed} chunks</p>
          )}

          {/* ── File Tree ───────────────────────────────────────────────────── */}
          <ul>
            {repoData.tree.map((file, index) => (
              // ← 'key' is REQUIRED on list items in React.
              // Use the index when items don't have unique IDs.
              // Use a stable unique value (like file path) when available.
              <li key={file}>{file}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

### 6.2 Chat Page — `POST /chat/ask`

This page shows **optimistic UI** — we add the user message to the screen *immediately*,
before the server responds, to make the app feel fast and responsive.

```typescript
// File: apps/web/app/chat/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { askQuestion, getChatHistory } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// TypeScript interfaces — define the shape of our data
// ─────────────────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant"; // ← union type: only these two string values are allowed
  content: string;
  sources?: string[]; // ← '?' means optional (may or may not be present)
}

// The raw response from the backend /chat/ask endpoint
interface AskResponse {
  answer: string;
  sources: string[];
}

// The shape of a message from /chat/history/{repo_id}
interface HistoryMessage {
  role: string;
  content: string;
  sources: string | null; // ← backend returns JSON-encoded string or null
}


export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeRepo = "fastapi-backend"; // TODO: Replace with a real repo selector

  // ← useRef gives us a mutable reference that persists across renders.
  // We use it to scroll to the bottom of the chat container after new messages.
  const chatBottomRef = useRef<HTMLDivElement>(null);


  // ── Load chat history on mount ───────────────────────────────────────────────
  // WHY: When a user returns to the chat page, they should see their history.
  useEffect(() => {
    const loadHistory = async () => {
      try {
        // GET http://localhost:8000/chat/history/fastapi-backend
        const history: HistoryMessage[] = await getChatHistory(activeRepo);

        // The backend stores sources as a JSON string (e.g. '["file.py"]').
        // We need to parse it back into an array.
        const parsedMessages: Message[] = history.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
          // JSON.parse turns '["file.py"]' back into ["file.py"]
          sources: msg.sources ? JSON.parse(msg.sources) : [],
        }));

        setMessages(parsedMessages);
      } catch (err) {
        // History loading failure is non-critical — just log it
        console.error("Could not load chat history:", err);
      }
    };

    loadHistory();
  }, [activeRepo]); // ← re-run if activeRepo changes


  // ── Auto-scroll to bottom when messages update ───────────────────────────────
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    //                     ↑ optional chaining — safe if ref is null
  }, [messages]); // ← runs every time messages array changes


  // ── Send message handler ─────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    // ── OPTIMISTIC UPDATE ──────────────────────────────────────────────────────
    // Add the user's message to the UI immediately, before the server responds.
    // This makes the chat feel instant and responsive.
    const userMessage: Message = { role: "user", content: trimmedInput };
    setMessages(prev => [...prev, userMessage]);
    // ← We use 'prev => [...prev, userMessage]' (functional update) instead of
    //   setMessages([...messages, userMessage]) because React state updates are
    //   asynchronous. The functional form always gets the latest state.

    setInput("");       // ← clear the text box
    setIsLoading(true); // ← show "Thinking..." indicator
    setError(null);

    try {
      // POST http://localhost:8000/chat/ask
      // Body: { "repo_id": "fastapi-backend", "question": "How does auth work?" }
      const response: AskResponse = await askQuestion(activeRepo, trimmedInput);

      // Add the assistant's response to the messages array
      const assistantMessage: Message = {
        role: "assistant",
        content: response.answer,
        sources: response.sources,
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get response");

      // Add a visible error message in the chat (optional but good UX)
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "⚠️ Sorry, something went wrong. Please try again.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };


  // ── Keyboard handler ─────────────────────────────────────────────────────────
  // Allow sending with Enter key (but Shift+Enter creates a new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // ← prevent Enter from inserting a newline
      handleSend();
    }
  };


  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>

      {/* ── Message List ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: "16px" }}>
            <strong>{msg.role === "user" ? "You" : "CodeAtlas AI"}</strong>
            <p>{msg.content}</p>

            {/* ── Sources Panel ─────────────────────────────────────────────── */}
            {/* Only render sources if the message has them AND there are some */}
            {msg.sources && msg.sources.length > 0 && (
              <div>
                <small>Sources used:</small>
                <ul>
                  {msg.sources.map((src, i) => (
                    <li key={i} style={{ fontFamily: "monospace", fontSize: "12px" }}>
                      {src}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        {/* ── Thinking Indicator ─────────────────────────────────────────────── */}
        {isLoading && <p><em>CodeAtlas is thinking...</em></p>}

        {/* ── Error Message ──────────────────────────────────────────────────── */}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {/* ← This invisible div is the scroll target */}
        <div ref={chatBottomRef} />
      </div>

      {/* ── Input Area ───────────────────────────────────────────────────────── */}
      <div style={{ padding: "16px", borderTop: "1px solid #333" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your codebase..."
          rows={3}
          disabled={isLoading} // ← prevent input while waiting
          style={{ width: "100%", resize: "none" }}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
```

---

### 6.3 Dashboard Page — Making It Live

The current dashboard uses **hardcoded data** (`124 files`, `2,450` embeddings, etc.).
Here is how to replace it with real API calls.

**What needs to change:**

1. Fetch the health status from `/health` to show "Online/Offline" correctly.
2. After a repo is indexed, call the index endpoint and show the real `chunks_indexed`.

```typescript
// File: apps/web/app/page.tsx  (UPDATED SECTIONS)
"use client";

import { useState, useEffect } from "react";
import { indexRepo } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// Fetch the backend health status
// ─────────────────────────────────────────────────────────────────────────────
async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch("http://localhost:8000/health");
    // The /health endpoint returns { "status": "ok" }
    return res.ok;
  } catch {
    // fetch() throws if the server is unreachable (ECONNREFUSED)
    return false;
  }
}

export default function DashboardPage() {
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexResult, setIndexResult] = useState<{ chunks_indexed: number } | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null); // null = "checking"
  const activeRepo = "fastapi-backend"; // TODO: use global state/context

  // ── Check health on mount ────────────────────────────────────────────────────
  useEffect(() => {
    checkBackendHealth().then(online => setBackendOnline(online));
  }, []);

  const handleIndex = async () => {
    setIsIndexing(true);
    try {
      const result = await indexRepo(activeRepo);
      setIndexResult(result); // { repo_id: "...", chunks_indexed: 2450 }
    } catch (err) {
      console.error("Index failed:", err);
    } finally {
      setIsIndexing(false);
    }
  };

  return (
    <div>
      {/* Dynamic backend status — no more hardcoded "Online" */}
      <span>
        FastAPI:{" "}
        {backendOnline === null
          ? "Checking..."          // still loading
          : backendOnline
          ? "🟢 Online"            // health check passed
          : "🔴 Offline"           // server unreachable
        }
      </span>

      {/* Dynamic index result */}
      {indexResult && (
        <p>✓ {indexResult.chunks_indexed.toLocaleString()} chunks indexed</p>
      )}

      <button onClick={handleIndex} disabled={isIndexing}>
        {isIndexing ? "Indexing..." : "Index Repository"}
      </button>
    </div>
  );
}
```

---

### 6.4 Settings Page — Persisting Config

The settings page currently does nothing when you click "Save Changes".
Here is a pattern to persist settings using `localStorage` (for client-side persistence
without needing a backend settings endpoint).

```typescript
// File: apps/web/app/settings/page.tsx
"use client";

import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Interface for our settings object
// ─────────────────────────────────────────────────────────────────────────────
interface AppSettings {
  backendUrl: string;
  defaultRepo: string;
}

// Default values
const DEFAULT_SETTINGS: AppSettings = {
  backendUrl: "http://localhost:8000",
  defaultRepo: "fastapi-backend",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  // ── Load saved settings on mount ─────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("codeatlas_settings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings(parsed);
      } catch {
        // Invalid JSON in localStorage — use defaults
      }
    }
  }, []);

  // ── Handle field changes ─────────────────────────────────────────────────────
  // This is a generic handler that works for any field.
  // The field name is passed dynamically using keyof AppSettings.
  const handleChange = (field: keyof AppSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    //                    ↑ spread existing settings, then override the changed field
  };

  // ── Save handler ─────────────────────────────────────────────────────────────
  const handleSave = () => {
    localStorage.setItem("codeatlas_settings", JSON.stringify(settings));
    setSaved(true);
    // Reset the "Saved!" feedback after 2 seconds
    setTimeout(() => setSaved(false), 2000);
  };

  // ── Reset handler ────────────────────────────────────────────────────────────
  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem("codeatlas_settings");
  };

  return (
    <div>
      <h2>General Settings</h2>

      {/* ── Backend URL Input ─────────────────────────────────────────────────── */}
      <label>
        Backend URL
        <input
          type="text"
          value={settings.backendUrl}
          // onChange updates state, which re-renders the input with new value
          onChange={(e) => handleChange("backendUrl", e.target.value)}
        />
      </label>

      {/* ── Default Repo Input ────────────────────────────────────────────────── */}
      <label>
        Default Repository
        <input
          type="text"
          value={settings.defaultRepo}
          onChange={(e) => handleChange("defaultRepo", e.target.value)}
        />
      </label>

      {/* ── Action Buttons ────────────────────────────────────────────────────── */}
      <button onClick={handleReset}>Reset Defaults</button>
      <button onClick={handleSave}>
        {saved ? "✓ Saved!" : "Save Changes"}
      </button>
    </div>
  );
}
```

---

## 7. TypeScript Types — Contract Enforcement

TypeScript's job is to catch mistakes at **compile time** (before the app runs in the browser).
Always type your API responses to get this protection.

```typescript
// ─────────────────────────────────────────────────────────────────────────────
// APPROACH 1: Interface (preferred for API responses)
// ─────────────────────────────────────────────────────────────────────────────
interface CloneResponse {
  repo_id: string;
  file_count: number;
  tree: string[];
}

// Now TypeScript knows the shape of the response:
const result: CloneResponse = await cloneRepo(url);
console.log(result.repo_id);     // ✓ TypeScript approves
console.log(result.nonExistent); // ✗ TypeScript ERROR: Property 'nonExistent' does not exist


// ─────────────────────────────────────────────────────────────────────────────
// APPROACH 2: Typing the function return explicitly
// ─────────────────────────────────────────────────────────────────────────────

// In lib/api.ts, you can type the Promise return:
export async function cloneRepo(githubUrl: string): Promise<CloneResponse> {
  const res = await fetch(`${API_BASE}/repo/clone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ github_url: githubUrl }),
  });
  if (!res.ok) throw new Error("Failed to clone repo");
  return res.json() as Promise<CloneResponse>; // ← cast the parsed JSON
}


// ─────────────────────────────────────────────────────────────────────────────
// APPROACH 3: Union types for multiple states
// ─────────────────────────────────────────────────────────────────────────────
type IndexStatus = "idle" | "indexing" | "success" | "error";

const [status, setStatus] = useState<IndexStatus>("idle");

// TypeScript prevents typos:
setStatus("indexing"); // ✓ valid
setStatus("loading");  // ✗ Type '"loading"' is not assignable to type 'IndexStatus'


// ─────────────────────────────────────────────────────────────────────────────
// APPROACH 4: Optional fields with ?
// ─────────────────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[]; // ← The '?' means this field may or may not exist
}

const msg: Message = { role: "user", content: "Hello" }; // ✓ sources is optional
msg.sources?.forEach(s => console.log(s)); // ← optional chaining for safe access
```

---

## 8. Error Handling Patterns

Errors come in different forms. Here is how to handle each:

```typescript
// ─────────────────────────────────────────────────────────────────────────────
// Pattern 1: Network Error (server is down / no internet)
// fetch() itself throws — your catch block catches it
// ─────────────────────────────────────────────────────────────────────────────
try {
  const res = await fetch("http://localhost:8000/repo/clone", { ... });
} catch (networkError) {
  // This runs if the server is unreachable
  console.error("Network error:", networkError);
  setError("Cannot connect to CodeAtlas API. Is the server running?");
}


// ─────────────────────────────────────────────────────────────────────────────
// Pattern 2: HTTP Error (server responded but with an error status)
// fetch() does NOT throw for 4xx/5xx — you must check res.ok
// ─────────────────────────────────────────────────────────────────────────────
const res = await fetch("...");
if (!res.ok) {
  // Try to parse the error body from FastAPI
  // FastAPI returns errors as: { "detail": "error description" }
  const errorData = await res.json().catch(() => null);
  const message = errorData?.detail || `HTTP Error ${res.status}`;
  throw new Error(message);
}


// ─────────────────────────────────────────────────────────────────────────────
// Pattern 3: FastAPI Validation Error (you sent wrong data)
// FastAPI returns 422 Unprocessable Entity with a detailed errors array
// ─────────────────────────────────────────────────────────────────────────────
const res = await fetch("...");
if (res.status === 422) {
  const errorBody = await res.json();
  // errorBody.detail is an array of: { loc: [...], msg: "...", type: "..." }
  const firstError = errorBody.detail[0];
  throw new Error(`Validation: ${firstError.msg} at ${firstError.loc.join(".")}`);
}


// ─────────────────────────────────────────────────────────────────────────────
// Pattern 4: Robust api.ts wrapper (production-quality)
// ─────────────────────────────────────────────────────────────────────────────
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  let res: Response;

  try {
    res = await fetch(url, options);
  } catch {
    throw new Error("Network error: Could not connect to the API server.");
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body.detail) detail = body.detail;
    } catch { /* ignore JSON parse errors */ }
    throw new Error(detail);
  }

  return res.json();
}

// Usage:
export async function cloneRepo(githubUrl: string): Promise<CloneResponse> {
  return apiFetch<CloneResponse>(`${API_BASE}/repo/clone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ github_url: githubUrl }),
  });
}
```

---

## 9. CORS — Why the Backend Has to Allow Your Frontend

**Without CORS**, your browser would refuse to show the API response, even if the server
sends a successful `200 OK`. This is a browser security feature, not a bug.

### How it works in CodeAtlas:

```python
# File: apps/api/app/main.py

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # ← ONLY allow requests from Next.js dev server
    allow_methods=["*"],                       # ← Allow GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],                       # ← Allow Content-Type, Authorization, etc.
    allow_credentials=False,                   # ← Don't allow cookies (we don't use them)
)
```

**When you deploy to production**, change `allow_origins` to your real domain:

```python
# Production CORS — be specific, never use "*" in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://codeatlas.yourdomain.com",
        "https://www.codeatlas.yourdomain.com",
    ],
    allow_methods=["GET", "POST"],  # ← restrict to only what you actually use
    allow_headers=["Content-Type"],
)
```

**Common CORS mistake to avoid:**

```typescript
// ✗ WRONG — Do NOT add CORS headers in the frontend. The BACKEND must set them.
const res = await fetch(url, {
  headers: {
    "Access-Control-Allow-Origin": "*", // ← This does NOTHING. Only servers set this.
  },
});
```

---

## 10. Loading & UI State Best Practices

The current implementation already follows good patterns. Here are the principles explained:

```typescript
// ─────────────────────────────────────────────────────────────────────────────
// RULE 1: Disable buttons during loading to prevent duplicate requests
// ─────────────────────────────────────────────────────────────────────────────
<button
  onClick={handleSend}
  disabled={isLoading || !input.trim()} // ← two conditions: busy OR no input
>
  {isLoading ? "Sending..." : "Send"} {/* ← Show feedback in button text */}
</button>


// ─────────────────────────────────────────────────────────────────────────────
// RULE 2: Use functional state updates to avoid stale closures
// ─────────────────────────────────────────────────────────────────────────────

// ✗ BAD: Can cause bugs if handleSend is called in rapid succession
setMessages([...messages, newMessage]);

// ✓ GOOD: Always gets the latest state, even if state hasn't re-rendered yet
setMessages(prev => [...prev, newMessage]);


// ─────────────────────────────────────────────────────────────────────────────
// RULE 3: Always use finally to clear loading state
// ─────────────────────────────────────────────────────────────────────────────
try {
  const result = await someRequest();
  setData(result);
} catch (err) {
  setError(err.message);
  // ✗ BAD: If setIsLoading(false) is only here, it doesn't run on success path
} finally {
  setIsLoading(false); // ← always runs, success or failure
}


// ─────────────────────────────────────────────────────────────────────────────
// RULE 4: Clear errors on each new attempt
// ─────────────────────────────────────────────────────────────────────────────
const handleSend = async () => {
  setError(null); // ← clear old error before starting
  try { ... } catch (err) { setError(err.message); }
};


// ─────────────────────────────────────────────────────────────────────────────
// RULE 5: Skeleton loading vs spinner — pick the right one
// ─────────────────────────────────────────────────────────────────────────────

// For initial page load (you know the shape of the data):
if (isLoading) return <SkeletonCard />; // shows placeholder content

// For user-triggered actions (button operations):
<button disabled={isLoading}>
  {isLoading ? "Loading..." : "Action"}
</button>
```

---

## 11. Environment Variables — Keeping Secrets Safe

Currently `API_BASE` is hardcoded in `lib/api.ts`. This is a problem because:
- You can't easily switch between dev and production
- If you ever add an API key, it would be visible in your source code

**The right approach:**

```bash
# File: apps/web/.env.local  (git-ignored — never commit this file!)
# ─────────────────────────────────────────────────────────────────────────────
# Next.js environment variables MUST start with NEXT_PUBLIC_ to be accessible
# in browser code. Without this prefix, they are server-only.
# ─────────────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```typescript
// File: apps/web/lib/api.ts  (UPDATED)

// process.env.NEXT_PUBLIC_API_URL reads from .env.local during build
// The fallback "http://localhost:8000" is used if the variable isn't set
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Everything else stays the same
export async function cloneRepo(githubUrl: string) { ... }
```

```bash
# For production (e.g., Vercel), set environment variables in the dashboard.
# For local dev, use .env.local
# For CI/CD, use your pipeline's secret management
```

---

## 12. What to Practice Next

You now understand every integration in CodeAtlas. Here is your learning roadmap:

### Level 1 — Apply What You've Learned
- [ ] **Replace all hardcoded data on the Dashboard** with real API calls (architecture summary, chat history count)
- [ ] **Wire the Settings page** to actually persist the `backendUrl` and use it in `api.ts`
- [ ] **Add the `/health` endpoint** check to the Dashboard's system status panel

### Level 2 — Add New Features
- [ ] **Add a file explain button** in the Repositories page: when user clicks a file in the tree, call `explainFile(repoId, path)` and show the explanation in a side panel
- [ ] **Add code review**: in the file tree, add a "Review" button for each file that calls `reviewFile(repoId, path)` and shows the AI review
- [ ] **Add architecture summary** to a new route `/architecture` that calls `getArchitectureSummary(repoId)` and renders the markdown result

### Level 3 — Advanced Patterns
- [ ] **Global State**: Use React Context to share `activeRepoId` across all pages instead of hardcoding it per page
- [ ] **Custom Hook**: Extract the fetch logic into reusable hooks: `useChatHistory(repoId)`, `useArchitecture(repoId)`
- [ ] **Streaming Responses**: Modify the `/chat/ask` endpoint to use `StreamingResponse` and update the frontend to read chunks as they arrive using `ReadableStream`
- [ ] **Error Boundary**: Add a React Error Boundary component to gracefully catch unhandled errors instead of showing a blank page

### Cheat Sheet — When to Use What

| Scenario | Pattern |
|----------|---------|
| Load data when page opens | `useEffect(() => { fetch(); }, [])` |
| Send data on button click | `async function handleClick() { ... }` on `onClick` |
| Show different UI while loading | `isLoading` state + conditional rendering |
| Show different UI on error | `error` state + conditional rendering |
| Keep input field in sync with state | Controlled input: `value={state}` + `onChange={setState}` |
| Append to a list (like chat messages) | `setList(prev => [...prev, newItem])` |
| Data from URL path (`/repo/:id`) | Path segment: `/repo/${repoId}` |
| Data from query string (`?key=value`) | `?path=${encodeURIComponent(value)}` |
| JSON request body (POST) | `headers: { "Content-Type": "application/json" }` + `body: JSON.stringify({...})` |

---

*This document covers the complete integration surface of CodeAtlas. Every pattern shown here
is a reusable, industry-standard approach you can apply in any React + REST API project.*
