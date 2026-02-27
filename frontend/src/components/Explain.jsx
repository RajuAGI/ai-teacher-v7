import React, { useState } from "react";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export default function Explain({ token }) {
  const [topic, setTopic] = useState("");
  const [explanation, setExplanation] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExplain = async () => {
    if (!topic) return;
    setLoading(true); setExplanation(""); setAudioUrl("");
    try {
      const res = await fetch(`${BACKEND}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      }).then(r => r.json());
      setExplanation(res.explanation || "Explanation nahi mili.");
      if (res.audio) setAudioUrl(`data:audio/mp3;base64,${res.audio}`);
    } catch (e) {
      setExplanation("Error: Backend se connect nahi ho saka.");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">📖 Topic Explain Karo</h2>
      <input value={topic} onChange={e => setTopic(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleExplain()}
        placeholder="Topic likhein (jaise: Photosynthesis, Pythagoras)" className="border p-2 w-full mb-2 rounded" />
      <button onClick={handleExplain} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50">
        {loading ? "Samjha raha hai..." : "Explain Karo"}
      </button>
      {explanation && <div className="mt-3 p-3 bg-green-50 rounded whitespace-pre-wrap">{explanation}</div>}
      {audioUrl && <audio src={audioUrl} controls autoPlay className="mt-2 w-full" />}
    </div>
  );
}
