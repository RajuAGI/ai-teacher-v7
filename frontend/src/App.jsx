import React from "react";
import Login from "./components/Login";
import AskAI from "./components/AskAI";
import Explain from "./components/Explain";
import Quiz from "./components/Quiz";
import Leaderboard from "./components/Leaderboard";
import Coins from "./components/Coins";
import AdminDashboard from "./components/AdminDashboard";
import Classroom from "./components/Classroom";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-center mb-6">AI Teacher V7 God Mode</h1>
      <Login />
      <div className="mt-6 space-y-6">
        <AskAI />
        <Explain />
        <Quiz />
        <Leaderboard />
        <Coins />
        <AdminDashboard />
        <Classroom />
      </div>
    </div>
  );
}

export default App;
