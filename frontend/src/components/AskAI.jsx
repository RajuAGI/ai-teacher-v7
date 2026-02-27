import React, { useState } from "react";
import { tts } from "../api";

export default function AskAI() {
  const [question,setQuestion]=useState(""); const [answer,setAnswer]=useState("");
  const [audioUrl,setAudioUrl]=useState("");

  const handleAsk=async()=>{
    if(!question) return;
    const fakeAnswer=`आपका प्रश्न: ${question}. इसका उत्तर: ... (AI response)`;
    setAnswer(fakeAnswer);
    const res=await tts(fakeAnswer);
    if(res.audio) setAudioUrl(`data:audio/mp3;base64,${res.audio}`);
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">Ask AI</h2>
      <input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Type your question" className="border p-2 w-full mb-2"/>
      <button onClick={handleAsk} className="bg-blue-600 text-white px-4 py-2 rounded">Ask</button>
      {answer && <p className="mt-2">{answer}</p>}
      {audioUrl && <audio src={audioUrl} controls className="mt-2"/>}
    </div>
  );
}
