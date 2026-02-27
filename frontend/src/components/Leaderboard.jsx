import React, { useEffect, useState } from "react";

const BACKEND = "https://ai-teacher-v7.onrender.com";

export default function Leaderboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/leaderboard`).then(r => r.json());
      setData(res);
    } catch (e) {}
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
      {loading ? <p className="text-center text-gray-500">Load ho raha hai...</p> :
        data.length === 0 ? <p className="text-center text-gray-500">Koi data nahi — pehle quiz khelo!</p> :
        <div className="space-y-2">
          {data.map((d, i) => (
            <div key={i} className={`flex items-center justify-between p-3 rounded ${i === 0 ? "bg-yellow-50" : i === 1 ? "bg-gray-50" : i === 2 ? "bg-orange-50" : "bg-white border"}`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{medals[i] || `${i+1}.`}</span>
                <span>{d.avatar || "👤"}</span>
                <span className="font-medium">{d.name}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-yellow-600">🪙 {d.coins}</div>
                <div className="text-xs text-gray-500">{d.quizzes_played} quizzes</div>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}
