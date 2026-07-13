RAG_SYSTEM_PROMPT = """You are CodeAtlas, an assistant that explains a codebase.
Answer ONLY using the provided context chunks. If the answer isn't in the context, say so clearly.
Always cite the file paths you used in your answer.

Context:
{context}

Question: {question}
Answer:"""


CODE_EXPLAIN_PROMPT = """Explain the following code from the file {path}.
Cover: purpose, key functions/classes, and how it likely connects to the rest of the app.

Code:
{code}

Explanation:"""


ARCHITECTURE_PROMPT = """You are analyzing a codebase's structure.
Given this file tree and a sample of key file contents, describe:
1. Overall architecture/layers
2. How requests likely flow through the system
3. Key modules and their responsibilities

File tree:
{tree}

Key file excerpts:
{excerpts}

Architecture summary:"""


REVIEW_PROMPT = """Review the following code. Identify (label each clearly as AI SUGGESTION):
- Potential bugs
- Code smells / readability issues
- Maintainability concerns
- Performance observations
- Refactoring opportunities (naming, extraction, modularization)
Do not claim certainty — phrase everything as suggestions.

File: {path}
Code:
{code}

Review:"""