import React, { useState, useEffect } from "react";

const BACKEND = "https://ai-teacher-v7.onrender.com";

export default function Coins({ token }) {
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchCoins = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND}/my-coins`, {
        headers: { "Authorization": `Bearer ${token}` }
      }).then(r => r.json());
      setCoins(res.coins || 0);
    } catch (e) {}
  };

  useEffect(() => { fetchCoins(); }, [token]);

  const claimCoins = async () => {
    setLoading(true); setMsg("");
    try {
      const res = await fetch(`${BACKEND}/claim-coins`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      }).then(r => r.json());
      if (res.success) {
        setMsg(`+${res.coins_earned} coins mile! 🎉`);
        fetchCoins();
      } else {
        setMsg(res.error || "Error aaya");
      }
    } catch (e) { setMsg("Error aaya"); }
    setLoading(false);
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-3">🪙 TeamCoins</h2>
      <div className="text-center py-4">
        <div className="text-5xl font-bold text-yellow-500">{coins}</div>
        <div className="text-gray-500 mt-1">Total Coins</div>
      </div>
      <div className="bg-yellow-50 rounded p-3 mb-3 text-sm">
        <p>🎯 Quiz complete karo → score × 2 coins</p>
        <p>📅 Daily login bonus → 10 coins</p>
      </div>
      <button onClick={claimCoins} disabled={loading}
        className="w-full bg-yellow-500 text-white py-2 rounded font-semibold disabled:opacity-50">
        {loading ? "Claim ho raha hai..." : "🎁 Daily Bonus Claim Karo"}
      </button>
      {msg && <p className={`mt-2 text-center text-sm ${msg.includes("mile") ? "text-green-600" : "text-red-600"}`}>{msg}</p>}
    </div>
  );
}
