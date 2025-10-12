import os
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import openai
import PyPDF2
from io import BytesIO

app = FastAPI()

# CORS - allow your frontend origin in production instead of "*"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Read API key from environment variable
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY not set. See README and set it in your environment (.env or platform secret).")
openai.api_key = OPENAI_API_KEY

DOCS = {}

def extract_text_from_pdf(file_bytes):
    reader = PyPDF2.PdfReader(file_bytes)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text.strip()

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()
    if file.filename.lower().endswith(".pdf"):
        text = extract_text_from_pdf(BytesIO(content))
    else:
        text = content.decode("utf-8")
    doc_id = f"doc_{len(DOCS)+1}"
    DOCS[doc_id] = text
    return {"doc_id": doc_id, "preview": text[:500]}

@app.get("/api/summary")
async def get_summary(doc_id: str):
    text = DOCS.get(doc_id, "")
    if not text:
        return {"error": "Document not found"}

    # Structured prompt: ask for JSON to simplify parsing
    prompt = (
        "You are an assistant that summarizes study notes. "
        "Given the following notes, return a JSON object with fields: paragraph_summary (string), key_points (array of up to 5 strings)."
        "\n\nNotes:\n" + text[:2000]
    )
    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=400
    )
    raw = response.choices[0].message["content"]
    return {"raw_summary": raw}

@app.get("/api/mcqs")
async def get_mcqs(doc_id: str):
    text = DOCS.get(doc_id, "")
    if not text:
        return {"error": "Document not found"}

    prompt = (
        "Generate 5 multiple choice questions (A-D) from the notes. "
        "Return results as a JSON array of objects with: question, options (array of 4), correct (index 0-3), explanation."
        "\n\nNotes:\n" + text[:2000]
    )
    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=800
    )
    raw = response.choices[0].message["content"]
    return {"raw_mcqs": raw}

@app.get("/api/flashcards")
async def get_flashcards(doc_id: str):
    text = DOCS.get(doc_id, "")
    if not text:
        return {"error": "Document not found"}

    prompt = (
        "Create 10 flashcards as JSON array of objects with: front, back. Keep answers concise."
        "\n\nNotes:\n" + text[:2000]
    )
    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=800
    )
    raw = response.choices[0].message["content"]
    return {"raw_flashcards": raw}
