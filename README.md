# 🗺️ CodeAtlas

> **Understand any codebase through AI-powered conversations.**

CodeAtlas is an AI-powered codebase understanding platform that helps developers explore, analyze, and reason about software repositories using natural language. Instead of manually navigating hundreds of files, developers can ask questions about a repository and receive context-aware answers generated using local Large Language Models (LLMs).

Built as an AI engineering project, CodeAtlas combines **FastAPI**, **Next.js**, **local LLMs via Ollama**, and **Retrieval-Augmented Generation (RAG)** into a complete end-to-end application.

---

## ✨ Features

* 📂 Index local software repositories
* 🤖 Chat with your codebase using natural language
* 🧠 Local LLM integration via Ollama
* 🔍 Retrieval-Augmented Generation (RAG)
* 📑 Repository structure and metadata analysis
* 🏗️ Project architecture insights
* 💬 Rich AI chat interface
* ⚡ FastAPI backend with interactive Swagger documentation
* 🎨 Modern React frontend

---

## 🏛️ Architecture

```text
                +----------------------+
                |      React UI        |
                +----------+-----------+
                           |
                           |
                    HTTP / REST API
                           |
                           v
                +----------------------+
                |      FastAPI         |
                |      Backend         |
                +----------+-----------+
                           |
        +------------------+------------------+
        |                  |                  |
        v                  v                  v
 Repository         RAG Pipeline       Ollama (Local LLM)
 Processing          Embeddings             Inference
        |                  |
        +---------+--------+
                  |
                  v
          Context Retrieval
                  |
                  v
            AI Generated Answer
```

---

## 🚀 Tech Stack

### Backend

* FastAPI
* Python
* Pydantic
* Uvicorn

### Frontend

* Next
* TypeScript
* Modern Component Architecture

### AI Stack

* Ollama
* Local Large Language Models
* Embedding Models
* Retrieval-Augmented Generation (RAG)

---

## 📸 Application

The application consists of four primary areas:

* 📊 Dashboard
* 📁 Repository Management
* 💬 AI Chat
* ⚙️ Settings & System

---

## ⚙️ How It Works

1. Add a local repository.
2. Index the repository.
3. Files are processed and chunked.
4. Embeddings are generated.
5. Metadata is stored.
6. Ask questions in the AI Chat.
7. Relevant code context is retrieved.
8. The local LLM generates an informed response.

---

---

## 🛠️ Running the Project

### Clone the repository

```bash
git clone https://github.com/<your-username>/CodeAtlas.git
cd CodeAtlas
```

### Backend

```bash
cd apps/api

python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Backend will be available at:

```
http://localhost:8000
```

Swagger UI:

```
http://localhost:8000/docs
```

---

### Frontend

```bash
cd apps/web

npm install

npm run dev
```

Frontend will be available at:

```
http://localhost:3000
```

---

## 🎯 Project Goals

CodeAtlas was built to explore practical AI engineering concepts, including:

* Building production-style FastAPI APIs
* Local LLM integration
* Retrieval-Augmented Generation
* Repository indexing
* Embedding pipelines
* AI-powered developer tools
* Modern frontend architecture
* End-to-end AI application development

---

---

## 🤝 Contributing

Contributions, suggestions, and feedback are always welcome.

Feel free to fork the project, open an issue, or submit a pull request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

Developed by **lbyarinth** as part of an AI Engineering learning journey.

The goal of CodeAtlas is not just to build another chatbot, but to create a practical AI-powered developer assistant that demonstrates modern AI engineering practices using local models and open-source technologies.
