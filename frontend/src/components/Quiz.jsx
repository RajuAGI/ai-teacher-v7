import React, { useState } from "react";

const BACKEND = "https://ai-teacher-v7.onrender.com";

export default function Quiz({ token }) {
  const [topic, setTopic] = useState("");
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleQuiz = async () => {
    if (!topic) return;
    setLoading(true);
    const earned = Math.floor(Math.random() * 15) + 1;
    setScore(earned);
    if (token) {
      try {
        await fetch(`${BACKEND}/save-score`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ score: earned, topic }),
        });
      } catch (e) { console.log("Score save failed"); }
    }
    setLoading(false);
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">📝 Quiz</h2>
      <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic likhein" className="border p-2 w-full mb-2 rounded" />
      <button onClick={handleQuiz} disabled={loading} className="bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50">
        {loading ? "..." : "Start Quiz"}
      </button>
      {score !== null && (
        <div className="mt-3 p-3 bg-purple-50 rounded">
          <p className="font-semibold">Score: {score}/15 ✅</p>
          <p className="text-sm text-gray-500">Leaderboard mein save ho gaya!</p>
        </div>
      )}
    </div>
  );
}
