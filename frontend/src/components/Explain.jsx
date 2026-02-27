import React, { useState } from "react";
import { tts } from "../api";

export default function Explain() {
  const [topic, setTopic] = useState("");
  const [explanation, setExplanation] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  const handleExplain = async () => {
    if (!topic) return;
    const text = `यहाँ '${topic}' का पूरा explanation है। (AI generated content)`;
    setExplanation(text);
    const res = await tts(text);
    if (res.audio) setAudioUrl(`data:audio/mp3;base64,${res.audio}`);
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">Explain Topic</h2>
      <input
        type="text"
        value={topic}
        onChange={e => setTopic(e.target.value)}
        placeholder="Enter topic"
        className="border p-2 w-full mb-2"
      />
      <button onClick={handleExplain} className="bg-green-600 text-white px-4 py-2 rounded">
        Explain
      </button>
      {explanation && <p className="mt-2">{explanation}</p>}
      {audioUrl && <audio src={audioUrl} controls className="mt-2" />}
    </div>
  );
}
