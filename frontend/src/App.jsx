import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import AskAI from "./components/AskAI";
import Explain from "./components/Explain";
import Quiz from "./components/Quiz";
import Leaderboard from "./components/Leaderboard";
import Coins from "./components/Coins";
import AdminDashboard from "./components/AdminDashboard";

const BACKEND = "https://ai-teacher-v7.onrender.com";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [userName, setUserName] = useState(localStorage.getItem("userName") || "");
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem("isAdmin") === "true");
  const [coins, setCoins] = useState(0);
  const [backendReady, setBackendReady] = useState(false);

  useEffect(() => {
    fetch(`${BACKEND}/`).then(() => setBackendReady(true)).catch(() => setBackendReady(false));
    const interval = setInterval(() => fetch(`${BACKEND}/`).catch(() => {}), 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (token) {
      fetch(`${BACKEND}/my-coins`, { headers: { "Authorization": `Bearer ${token}` } })
        .then(r => r.json()).then(d => setCoins(d.coins || 0)).catch(() => {});
    }
  }, [token]);

  const handleLogin = (tok, name, admin, userCoins) => {
    setToken(tok); setUserName(name);
    setIsAdmin(admin || false);
    setCoins(userCoins || 0);
    localStorage.setItem("token", tok);
    localStorage.setItem("userName", name);
    localStorage.setItem("isAdmin", admin ? "true" : "false");
  };

  const handleLogout = () => {
    setToken(""); setUserName(""); setIsAdmin(false); setCoins(0);
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("isAdmin");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="flex justify-between items-center mb-4 bg-white p-3 rounded shadow">
        <h1 className="text-xl font-bold">🎓 AI Teacher V7</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-1 rounded-full ${backendReady ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
            {backendReady ? "🟢 Online" : "🟡 Connecting..."}
          </span>
          {token && <>
            <span className="text-yellow-600 font-semibold text-sm">🪙 {coins}</span>
            {isAdmin && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Admin</span>}
            <span className="text-green-700 font-semibold text-sm">👤 {userName}</span>
            <button onClick={handleLogout} className="bg-red-500 text-white px-2 py-1 rounded text-sm">Logout</button>
          </>}
        </div>
      </div>

      {!token ? <Login onLogin={handleLogin} /> : (
        <div className="space-y-4">
          <AskAI token={token} />
          <Explain token={token} />
          <Quiz token={token} />
          <Leaderboard />
          <Coins token={token} />
          <AdminDashboard token={token} isAdmin={isAdmin} />
        </div>
      )}
    </div>
  );
}

export default App;
