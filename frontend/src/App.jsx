import React, { useState } from "react";
import Login from "./components/Login";
import AskAI from "./components/AskAI";
import Explain from "./components/Explain";
import Quiz from "./components/Quiz";
import Leaderboard from "./components/Leaderboard";
import Coins from "./components/Coins";
import AdminDashboard from "./components/AdminDashboard";
import Classroom from "./components/Classroom";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [userName, setUserName] = useState(localStorage.getItem("userName") || "");

  const handleLogin = (tok, name) => {
    setToken(tok);
    setUserName(name);
    localStorage.setItem("token", tok);
    localStorage.setItem("userName", name);
  };

  const handleLogout = () => {
    setToken(""); setUserName("");
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🎓 AI Teacher V7</h1>
        {token && (
          <div className="flex items-center gap-3">
            <span className="text-green-700 font-semibold">👤 {userName}</span>
            <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded text-sm">Logout</button>
          </div>
        )}
      </div>

      {!token ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div className="space-y-6">
          <AskAI token={token} />
          <Explain token={token} />
          <Quiz token={token} />
          <Leaderboard />
          <Coins token={token} />
          <AdminDashboard token={token} />
          <Classroom token={token} />
        </div>
      )}
    </div>
  );
}

export default App;
