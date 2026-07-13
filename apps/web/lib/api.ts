const API_BASE = "http://localhost:8000";

export async function cloneRepo(githubUrl: string) {
  const res = await fetch(`${API_BASE}/repo/clone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ github_url: githubUrl }),
  });
  if (!res.ok) throw new Error("Failed to clone repo");
  return res.json();
}

export async function indexRepo(repoId: string) {
  const res = await fetch(`${API_BASE}/repo/index/${repoId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to index repo");
  return res.json();
}

export async function getChatHistory(repoId: string) {
  const res = await fetch(`${API_BASE}/chat/history/${repoId}`);
  if (!res.ok) throw new Error("Failed to fetch chat history");
  return res.json();
}

export async function askQuestion(repoId: string, question: string) {
  const res = await fetch(`${API_BASE}/chat/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo_id: repoId, question }),
  });
  if (!res.ok) throw new Error("Failed to ask question");
  return res.json();
}

export async function explainFile(repoId: string, path: string) {
  const res = await fetch(`${API_BASE}/chat/explain/${repoId}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error("Failed to explain file");
  return res.json();
}

export async function reviewFile(repoId: string, path: string) {
  const res = await fetch(`${API_BASE}/review/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo_id: repoId, path }),
  });
  if (!res.ok) throw new Error("Failed to review file");
  return res.json();
}

export async function getArchitectureSummary(repoId: string) {
  const res = await fetch(`${API_BASE}/architecture/summary/${repoId}`);
  if (!res.ok) throw new Error("Failed to get architecture summary");
  return res.json();
}
