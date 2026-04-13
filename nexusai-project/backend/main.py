import os
import uuid
import fitz
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from embedder import embed_texts, embed_single, chunk_text
from vector_store import ensure_index, upsert_vectors, query_vectors, delete_all_vectors
from generator import answer_question, generate_flashcards, generate_quiz, generate_summary

app = FastAPI(title="NexusAI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuestionRequest(BaseModel):
    question: str

class GenerateRequest(BaseModel):
    type: str

@app.on_event("startup")
async def startup():
    try:
        ensure_index()
        print("✅ Endee index ready")
    except Exception as e:
        print(f"⚠️  Could not connect to Endee: {e}")
    try:
        from embedder import get_model
        get_model()
        print("✅ Embedding model ready")
    except Exception as e:
        print(f"⚠️  Could not load model: {e}")

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()
    filename = file.filename or "document"

    if filename.endswith(".pdf"):
        try:
            doc = fitz.open(stream=content, filetype="pdf")
            text = "\n".join(page.get_text() for page in doc)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {e}")
    elif filename.endswith(".txt"):
        text = content.decode("utf-8", errors="ignore")
    else:
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported")

    if not text.strip():
        raise HTTPException(status_code=400, detail="No text could be extracted from the file")

    chunks = chunk_text(text, chunk_size=400, overlap=80)
    if not chunks:
        raise HTTPException(status_code=400, detail="No chunks generated")

    embeddings = embed_texts(chunks)

    vectors = [
        {
            "id": f"{filename}-chunk-{i}-{uuid.uuid4().hex[:6]}",
            "vector": embeddings[i],
            "metadata": {"text": chunks[i], "source": filename, "chunk_index": i},
        }
        for i in range(len(chunks))
    ]

    try:
        upsert_vectors(vectors)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vector DB error: {e}")

    return {
        "status": "success",
        "filename": filename,
        "chunks": len(chunks),
        "message": f"Uploaded and indexed {len(chunks)} chunks from '{filename}'",
    }

@app.post("/ask")
async def ask(request: QuestionRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    query_vec = embed_single(request.question)
    try:
        matches = query_vectors(query_vec, top_k=5)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vector DB error: {e}")

    if not matches:
        return {"answer": "No relevant content found. Please upload your study material first."}

    answer = await answer_question(request.question, matches)
    return {"answer": answer}

@app.post("/generate")
async def generate(request: GenerateRequest):
    dummy_vec = embed_single("key concepts important topics definitions")
    try:
        matches = query_vectors(dummy_vec, top_k=5)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vector DB error: {e}")

    if not matches:
        raise HTTPException(status_code=404, detail="No content found. Upload study material first.")

    gen_type = request.type.lower()

    try:
        if gen_type == "flashcards":
            data = await generate_flashcards(matches)
            return {"type": "flashcards", "data": data}
        elif gen_type == "quiz":
            data = await generate_quiz(matches)
            return {"type": "quiz", "data": data}
        elif gen_type == "summary":
            data = await generate_summary(matches)
            return {"type": "summary", "data": data}
        else:
            raise HTTPException(status_code=400, detail="type must be 'flashcards', 'quiz', or 'summary'")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {e}")

@app.delete("/reset")
async def reset():
    try:
        delete_all_vectors()
        return {"status": "reset", "message": "All vectors cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reset failed: {e}")

@app.get("/health")
async def health():
    return {"status": "ok", "service": "NexusAI API"}