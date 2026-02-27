const BACKEND = "https://ai-teacher-v7.onrender.com";

export const register = (data) =>
  fetch(`${BACKEND}/register`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(res => res.json());

export const login = (data) =>
  fetch(`${BACKEND}/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(res => res.json());

export const getLeaderboard = () =>
  fetch(`${BACKEND}/leaderboard`).then(res => res.json());

export const saveScore = (data, token) =>
  fetch(`${BACKEND}/save-score`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify(data),
  }).then(res => res.json());
