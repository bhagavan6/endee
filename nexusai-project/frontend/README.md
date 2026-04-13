# 🧠 NexusAI — AI Study Assistant

> **Stop reading. Start understanding.**  
> Upload any lecture notes or textbook and instantly get AI-powered Q&A, Flashcards, Quizzes, and Summaries — powered by Endee Vector DB, MiniLM embeddings, and LLaMA 3.

**Submission for Endee.io Internship — SDE / AI / ML Intern**

---

## 📸 Screenshots

| Home | Ask AI |
|---|---|
| ![Home](./screenshots/01-home.png) | ![Ask AI](./screenshots/03-ask-ai.png) |

| Flashcards | MCQ Quiz |
|---|---|
| ![Flashcards](./screenshots/04-flashcards.png) | ![Quiz](./screenshots/05-quiz.png) |

| Summary | Light Mode |
|---|---|
| ![Summary](./screenshots/06-summary.png) | ![Light](./screenshots/07-light-mode.png) |

---

## ✨ Features

- 📄 **Upload** — PDF or TXT lecture notes (chunked into 400-word segments)
- 💬 **Ask AI** — RAG-powered Q&A grounded in your actual notes
- 🃏 **Flashcards** — Auto-generated question/answer cards for active recall
- ❓ **MCQ Quiz** — 5-question multiple choice quiz with instant scoring
- 📝 **Summary** — Structured markdown summary of key concepts
- 🌙 **Dark/Light Mode** — Toggle between themes

---

## 🏗️ System Architecture

┌─────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                   │
│          Upload │ Ask AI │ Flashcards │ Quiz │ Summary      │
└──────────────────────────┬──────────────────────────────────┘
│ REST API
▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                          │
│                                                             │
│  1. PDF/TXT Parser (PyMuPDF)                                │
│  2. Text Chunker  (400 words, 80 overlap)                   │
│  3. Embedder      (MiniLM-L6-v2 → 384d vectors)             │
│                        │                                    │
│                        ▼                                    │
│  ┌─────────────────────────────────┐                        │
│  │     Endee Vector DB (Docker)    │                        │
│  │  • Cosine similarity index      │                        │
│  │  • Stores chunks + metadata     │                        │
│  │  • Top-K semantic retrieval     │                        │
│  └─────────────────────────────────┘                        │
│                        │                                    │
│                        ▼                                    │
│  4. Groq LLM (LLaMA 3.1 8B)                                 │
│     • RAG Q&A                                               │
│     • Flashcard generation                                  │
│     • MCQ Quiz generation                                   │
│     • Summary generation                                    │
└─────────────────────────────────────────────────────────────┘

---

## 🔍 How Endee Powers NexusAI

NexusAI uses **Endee** as its core vector database for all semantic search operations:

| Step | What happens |
|---|---|
| **1. Index Creation** | A `nexusai` index is created with 384 dimensions and cosine similarity metric |
| **2. Embedding** | Each text chunk is embedded using `all-MiniLM-L6-v2` into a 384-dimensional vector |
| **3. Upsert** | Vectors are stored in Endee with chunk text and source metadata |
| **4. Semantic Search** | User queries are embedded and matched against stored vectors using ANN search |
| **5. RAG Pipeline** | Top-5 retrieved chunks form the context window for LLaMA 3 to generate accurate answers |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React + Vite | UI with dark/light theme |
| Backend | FastAPI (Python) | REST API + orchestration |
| Vector DB | **Endee** (Docker) | Semantic search & storage |
| Embeddings | MiniLM-L6-v2 | Text → 384d vectors |
| LLM | LLaMA 3.1 8B (Groq) | Q&A, flashcards, quiz, summary |
| PDF Parsing | PyMuPDF | Extract text from PDFs |

---

## ⚙️ Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker Desktop
- Free Groq API key → [console.groq.com](https://console.groq.com)

### Step 1 — Clone & setup Endee

```bash
git clone https://github.com/bhagavan6/nexusai.git
cd nexusai

# Pull the Endee submodule
git submodule update --init --recursive

# Start Endee vector database
docker run -p 8080:8080 -v ./endee-data:/data --name endee-server endeeio/endee-server:latest
```

### Step 2 — Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# Mac/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` folder:
GROQ_API_KEY=your_groq_api_key_here

Start the backend:
```bash
uvicorn main:app --reload
```

Wait for:
✅ Endee index ready
✅ Embedding model ready

### Step 3 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Open → **http://localhost:5173**

---

## 📁 Project Structure

nexusai/
├── backend/
│   ├── main.py          # FastAPI endpoints
│   ├── embedder.py      # MiniLM embeddings + text chunking
│   ├── vector_store.py  # Endee vector DB client
│   ├── generator.py     # Groq LLM — RAG, flashcards, quiz, summary
│   ├── .env             # GROQ_API_KEY (not committed)
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── App.jsx      # Full React UI with dark/light theme
│       └── index.css    # Emerald green theme
├── screenshots/         # App screenshots
├── endee/               # Forked Endee submodule ⭐
└── README.md

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload` | Upload PDF/TXT, chunk, embed & store in Endee |
| `POST` | `/ask` | RAG Q&A — semantic search + LLM answer |
| `POST` | `/generate` | Generate flashcards, quiz, or summary |
| `DELETE` | `/reset` | Clear all vectors from Endee index |
| `GET` | `/health` | Health check |

---

## 🧑‍💻 Author

**Nagalinga Bhagavan** — [github.com/bhagavan6](https://github.com/bhagavan6)

---

*Built with ❤️ for the Endee.io Internship*
