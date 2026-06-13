from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import tempfile
import shutil
from dotenv import load_dotenv

from pdf_processor import PDFProcessor
from rag_engine import RAGEngine

load_dotenv()

app = FastAPI(title="Chat-PDF AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global RAG engine instances per session
rag_engines: dict = {}

class QuestionRequest(BaseModel):
    session_id: str
    question: str
    chat_history: Optional[List[dict]] = []

class QuestionResponse(BaseModel):
    answer: str
    sources: List[dict]
    session_id: str

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai-service"}

@app.post("/process-pdfs")
async def process_pdfs(
    session_id: str,
    files: List[UploadFile] = File(...)
):
    """Process uploaded PDFs and build vector store"""
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    temp_dir = tempfile.mkdtemp()
    pdf_paths = []

    try:
        # Save uploaded files temporarily
        for file in files:
            if not file.filename.endswith(".pdf"):
                raise HTTPException(status_code=400, detail=f"{file.filename} is not a PDF")
            
            temp_path = os.path.join(temp_dir, file.filename)
            with open(temp_path, "wb") as f:
                content = await file.read()
                f.write(content)
            pdf_paths.append({"path": temp_path, "name": file.filename})

        # Process PDFs
        processor = PDFProcessor()
        chunks = processor.process_pdfs(pdf_paths)

        print("SESSION:", session_id)
        print("CHUNKS:", len(chunks))

        if not chunks:
            raise HTTPException(status_code=400, detail="No text could be extracted from PDFs")

        # Build RAG engine
        engine = RAGEngine(session_id)
        engine.build_vector_store(chunks)
        rag_engines[session_id] = engine

        return {
            "success": True,
            "session_id": session_id,
            "chunks_created": len(chunks),
            "files_processed": [p["name"] for p in pdf_paths]
        }

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


@app.post("/ask", response_model=QuestionResponse)
async def ask_question(request: QuestionRequest):
    """Ask a question about the uploaded PDFs"""
    print("ASK SESSION:", request.session_id)
    engine = rag_engines.get(request.session_id)
    print("ENGINE FOUND:", engine is not None)
    # engine = rag_engines.get(request.session_id)
    
    if not engine:
        raise HTTPException(
            status_code=404, 
            detail="Session not found. Please upload PDFs first."
        )

    try:
        result = engine.ask(request.question, request.chat_history)
        return QuestionResponse(
            answer=result["answer"],
            sources=result["sources"],
            session_id=request.session_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Clean up a session"""
    if session_id in rag_engines:
        del rag_engines[session_id]
    return {"success": True, "message": "Session deleted"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
