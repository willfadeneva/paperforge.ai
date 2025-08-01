from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_community.llms import Ollama
from langchain_core.output_parsers import StrOutputParser
import PyPDF2
import io
import os

app = FastAPI()

# Initialize LLM chain
llm = Ollama(
    model="mistral",
    base_url=os.getenv("OLLAMA_URL", "http://localhost:11434")
)
chain = llm | StrOutputParser()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_text_from_pdf(file_bytes):
    """Extract text from PDF with basic error handling"""
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = "\n".join([page.extract_text() or "" for page in reader.pages])
        if not text.strip():
            raise ValueError("PDF contains no extractable text")
        return text
    except Exception as e:
        raise ValueError(f"PDF processing error: {str(e)}")

@app.post("/summarize-pdf")
async def summarize_pdf(file: UploadFile = File(...)):
    """Single PDF summarization endpoint"""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(400, detail="Only PDF files are accepted")

    try:
        contents = await file.read()
        text = extract_text_from_pdf(contents)
        
        # Generate summary
        prompt = f"Create a concise 3-5 sentence summary of this research paper:\n{text}"
        summary = await chain.ainvoke(prompt)
        
        return {
            "filename": file.filename,
            "summary": summary,
            "pages": len(PyPDF2.PdfReader(io.BytesIO(contents)).pages),
            "status": "success"
        }
    except ValueError as ve:
        raise HTTPException(400, detail=str(ve))
    except Exception as e:
        raise HTTPException(500, detail=f"Processing failed: {str(e)}")

@app.get("/")
async def health_check():
    return {"status": "API is running"}