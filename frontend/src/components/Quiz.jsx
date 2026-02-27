import React, { useState } from "react";

export default function Quiz() {
  const [topic,setTopic]=useState("");
  const [score,setScore]=useState(0);

  const handleQuiz=()=>{
    if(!topic) return;
    const earned=Math.floor(Math.random()*15);
    setScore(earned);
    alert(`Quiz on ${topic} finished! You scored ${earned}`);
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">Quiz</h2>
      <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Enter topic" className="border p-2 w-full mb-2"/>
      <button onClick={handleQuiz} className="bg-purple-600 text-white px-4 py-2 rounded">Start Quiz</button>
      {score>0 && <p className="mt-2">Score: {score}</p>}
    </div>
  );
}
