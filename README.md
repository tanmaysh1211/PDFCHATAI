# DocChat — Chat with PDF using GPT-4o Mini + LangChain + RAG

A full-stack intelligent document Q&A system demonstrating **Frontend Development**, **Backend Development**, **AI Integration**, **RAG (Retrieval-Augmented Generation)**, **Vector Databases**, **LangChain**, **API Development**, and **Document Processing**.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React.js)                      │
│   Sidebar (Sessions) │ Chat Area │ Upload Panel │ Sources Panel  │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTP (Axios)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js + Express)                   │
│   Session Management │ File Upload │ MongoDB (Chat History)      │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTP (Internal API)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AI SERVICE (Python + FastAPI)                  │
│                                                                  │
│  PDF Upload → PyPDF → Text Chunks → OpenAI Embeddings → FAISS   │
│                                          │                       │
│  Question → Embed → Similarity Search → Context → GPT-4o Mini  │
│                                                     │            │
│                           Answer + Sources (Page, Para) ◄───────┘
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js, Axios, Custom CSS |
| Backend | Node.js, Express.js, Multer, Mongoose |
| AI Service | Python, FastAPI, LangChain, OpenAI |
| Embeddings | OpenAI text-embedding-3-small |
| LLM | GPT-4o Mini |
| Vector DB | FAISS (Facebook AI Similarity Search) |
| Database | MongoDB (Chat History + Sessions) |

## Features

### Core
- ✅ Upload single or multiple PDFs
- ✅ Ask questions, get answers from document content
- ✅ **Source references** — Page number + Paragraph + excerpt
- ✅ **Conversation memory** — AI remembers context across turns
- ✅ Multiple sessions with persistent history
- ✅ Session management (create, switch, delete)

### Advanced
- ✅ Multiple PDFs per session (all indexed together)
- ✅ Auto-generated session titles from filename
- ✅ Real upload progress tracking
- ✅ In-memory fallback if MongoDB unavailable
- ✅ Expandable source excerpts with page citations
- ✅ Pronoun resolution across turns ("he", "it", "they")

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- Python 3.10+
- MongoDB (optional — app works without it)
- OpenAI API Key (get at platform.openai.com)

### 1. Clone and install

```bash
git clone <repo>
cd chat-pdf
```

### 2. AI Service Setup
```bash
cd ai-service
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

pip install -r requirements.txt

# Start the AI service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env if needed (defaults work for local dev)

npm install

# Start MongoDB (optional)
mongod --dbpath ./data

# Start backend
node server.js
```

### 4. Frontend Setup
```bash
cd frontend
cp .env.example .env

npm install
npm start
```

The app opens at **http://localhost:3000**

---

## Usage

1. **Create a New Chat** — Click "+ New Chat" in the sidebar
2. **Upload PDFs** — Drag & drop or click to browse (supports multiple files)
3. **Wait for Processing** — The system extracts text, creates embeddings, builds FAISS index
4. **Ask Questions** — Type naturally, the AI answers from your documents
5. **See Sources** — Click "Sources" under any answer to see exact page/paragraph references
6. **Continue Conversation** — The AI remembers previous turns (pronoun resolution works!)

---

## Project Structure

```
chat-pdf/
├── frontend/                    # React.js app
│   └── src/
│       ├── components/
│       │   ├── Sidebar.js       # Session list & management
│       │   ├── ChatArea.js      # Main chat interface
│       │   ├── Message.js       # Message bubbles + markdown rendering
│       │   ├── UploadPanel.js   # PDF upload with drag & drop
│       │   └── SourcesPanel.js  # Collapsible source references
│       ├── utils/api.js         # Axios API calls
│       ├── App.js               # Root component
│       └── index.css            # Design system (CSS variables)
│
├── backend/                     # Node.js + Express API
│   ├── server.js                # Routes, MongoDB, session management
│   ├── uploads/                 # Temp file storage (auto-created)
│   └── .env                     # Config
│
└── ai-service/                  # Python FastAPI
    ├── main.py                  # FastAPI app + endpoints
    ├── pdf_processor.py         # PyPDF text extraction + chunking
    ├── rag_engine.py            # FAISS + OpenAI embeddings + GPT-4o Mini
    ├── requirements.txt
    └── .env                     # OPENAI_API_KEY
```

---

## How RAG Works

```
PDF Document
    │
    ▼
PyPDF Text Extraction (page by page, tracks page numbers)
    │
    ▼
RecursiveCharacterTextSplitter (1000 char chunks, 200 overlap)
    │
    ▼
OpenAI text-embedding-3-small → 1536-dim vectors per chunk
    │
    ▼
FAISS Index (cosine similarity, in-memory)
    │
    ├── User asks question
    │       │
    │       ▼
    │   Embed question → Search FAISS → Top 5 relevant chunks
    │       │
    │       ▼
    │   Build prompt: [System] + [Chat History] + [Context] + [Question]
    │       │
    │       ▼
    │   GPT-4o Mini generates answer
    │       │
    │       ▼
    │   Return answer + source metadata (file, page, paragraph, excerpt)
```

---

## API Endpoints

### Backend (Port 5000)
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/sessions | Create session |
| GET | /api/sessions | List all sessions |
| GET | /api/sessions/:id | Get session with messages |
| DELETE | /api/sessions/:id | Delete session |
| POST | /api/sessions/:id/upload | Upload & process PDFs |
| POST | /api/sessions/:id/ask | Ask a question |
| DELETE | /api/sessions/:id/messages | Clear chat history |

### AI Service (Port 8000)
| Method | Path | Description |
|--------|------|-------------|
| POST | /process-pdfs | Build vector store from PDFs |
| POST | /ask | Answer question with RAG |
| DELETE | /session/:id | Clean up session |
| GET | /health | Health check |
