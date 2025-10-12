import React, { useState } from "react";
import ReactDOM from "react-dom/client";

function App() {
  const [file, setFile] = useState(null);
  const [docId, setDocId] = useState(""); 
  const [summary, setSummary] = useState(""); 
  const [mcqs, setMcqs] = useState(""); 
  const [flashcards, setFlashcards] = useState(""); 
  const [loading, setLoading] = useState(false);

  const uploadFile = async () => {
    if (!file) return alert("Please choose a file first.");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("http://localhost:8000/api/upload", {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    setDocId(data.doc_id);
    alert("Uploaded: " + data.doc_id);
  };

  const generateSummary = async () => {
    if (!docId) return alert("Upload a doc first.");
    setLoading(true);
    const res = await fetch(`http://localhost:8000/api/summary?doc_id=${docId}`);
    const data = await res.json();
    setSummary(data.raw_summary || JSON.stringify(data));
    setLoading(false);
  };

  const generateMCQs = async () => {
    if (!docId) return alert("Upload a doc first.");
    setLoading(true);
    const res = await fetch(`http://localhost:8000/api/mcqs?doc_id=${docId}`);
    const data = await res.json();
    setMcqs(data.raw_mcqs || JSON.stringify(data));
    setLoading(false);
  };

  const generateFlashcards = async () => {
    if (!docId) return alert("Upload a doc first.");
    setLoading(true);
    const res = await fetch(`http://localhost:8000/api/flashcards?doc_id=${docId}`);
    const data = await res.json();
    setFlashcards(data.raw_flashcards || JSON.stringify(data));
    setLoading(false);
  };

  return (
    <div className="p-8 font-sans max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">📚 StudyPal</h1>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-4"
      />
      <div className="space-x-3 mb-6">
        <button onClick={uploadFile} className="bg-blue-600 text-white px-4 py-2 rounded">
          Upload
        </button>
        <button disabled={!docId} onClick={generateSummary} className="bg-green-600 text-white px-4 py-2 rounded">
          Summary
        </button>
        <button disabled={!docId} onClick={generateMCQs} className="bg-purple-600 text-white px-4 py-2 rounded">
          MCQs
        </button>
        <button disabled={!docId} onClick={generateFlashcards} className="bg-teal-600 text-white px-4 py-2 rounded">
          Flashcards
        </button>
      </div>

      {loading && <p>⏳ Generating content...</p>}
      {summary && (
        <div className="bg-gray-100 p-4 rounded mb-4">
          <h2 className="font-semibold mb-2">📝 Summary</h2>
          <pre>{summary}</pre>
        </div>
      )}
      {mcqs && (
        <div className="bg-gray-100 p-4 rounded mb-4">
          <h2 className="font-semibold mb-2">🎯 MCQs</h2>
          <pre>{mcqs}</pre>
        </div>
      )}
      {flashcards && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">💡 Flashcards</h2>
          <pre>{flashcards}</pre>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
