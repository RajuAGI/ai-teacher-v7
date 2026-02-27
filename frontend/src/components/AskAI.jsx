import React, { useState } from "react";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export default function AskAI({ token }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question) return;
    setLoading(true); setAnswer(""); setAudioUrl("");
    try {
      const res = await fetch(`${BACKEND}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      }).then(r => r.json());
      setAnswer(res.answer || "Jawab nahi mila.");
      if (res.audio) setAudioUrl(`data:audio/mp3;base64,${res.audio}`);
    } catch (e) {
      setAnswer("Error: Backend se connect nahi ho saka.");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">🤖 AI se Poochho</h2>
      <input value={question} onChange={e => setQuestion(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleAsk()}
        placeholder="Apna sawaal likhein..." className="border p-2 w-full mb-2 rounded" />
      <button onClick={handleAsk} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
        {loading ? "Soch raha hai..." : "Poochho"}
      </button>
      {answer && <div className="mt-3 p-3 bg-blue-50 rounded whitespace-pre-wrap">{answer}</div>}
      {audioUrl && <audio src={audioUrl} controls autoPlay className="mt-2 w-full" />}
    </div>
  );
}
