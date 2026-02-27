import React, { useState } from "react";
import { register, login } from "../api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) return alert("Sab fields bharein");
    setLoading(true);
    const res = await register({ name, email, password });
    setLoading(false);
    if (res.token) { onLogin(res.token, res.name); }
    else { alert(res.error || "Registration failed"); }
  };

  const handleLogin = async () => {
    if (!email || !password) return alert("Email aur password bharein");
    setLoading(true);
    const res = await login({ email, password });
    setLoading(false);
    if (res.token) { onLogin(res.token, res.name); }
    else { alert(res.error || "Login failed"); }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-4 text-center">🔐 Login / Register</h2>
      <input placeholder="Name (sirf register ke liye)" value={name} onChange={e => setName(e.target.value)} className="border p-2 w-full mb-2 rounded" />
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="border p-2 w-full mb-2 rounded" />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="border p-2 w-full mb-3 rounded" />
      <div className="flex gap-2">
        <button onClick={handleRegister} disabled={loading} className="flex-1 bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50">
          {loading ? "..." : "Register"}
        </button>
        <button onClick={handleLogin} disabled={loading} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
          {loading ? "..." : "Login"}
        </button>
      </div>
    </div>
  );
}
