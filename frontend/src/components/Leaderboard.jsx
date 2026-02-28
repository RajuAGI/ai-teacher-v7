import React, { useEffect, useState } from "react";

const BACKEND = "https://ai-teacher-v7.onrender.com";

export default function Leaderboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${BACKEND}/leaderboard`);
      const json = await res.json();
      if (Array.isArray(json)) {
        setData(json);
      } else {
        setError("Data format galat hai: " + JSON.stringify(json));
      }
    } catch (e) {
      setError("Backend se connect nahi ho saka: " + e.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold">🏆 Leaderboard</h2>
        <button onClick={fetchData} className="text-sm text-blue-600">🔄 Refresh</button>
      </div>

      {loading && <p className="text-center text-gray-500 py-4">Load ho raha hai...</p>}

      {error && (
        <div className="p-3 bg-red-50 rounded text-red-600 text-sm">
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && data.length === 0 && (
        <p className="text-center text-gray-500 py-4">Koi data nahi — pehle quiz khelo ya daily bonus claim karo!</p>
      )}

      {!loading && data.length > 0 && (
        <div className="space-y-2">
          {data.map((d, i) => (
            <div key={i} className={`flex items-center justify-between p-3 rounded ${i === 0 ? "bg-yellow-50 border border-yellow-200" : i === 1 ? "bg-gray-50" : i === 2 ? "bg-orange-50" : "bg-white border"}`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{medals[i] || `${i + 1}.`}</span>
                <span>{d.avatar || "👤"}</span>
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-xs text-gray-500">{d.quizzes_played || 0} quizzes played</p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-yellow-600">🪙 {d.coins || 0}</div>
                <div className="text-xs text-gray-500">Best: {d.best_score || 0}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
