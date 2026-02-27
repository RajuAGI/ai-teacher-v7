import React, { useState, useEffect } from "react";

const BACKEND = "https://ai-teacher-v7.onrender.com";

export default function AdminDashboard({ token, isAdmin }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [showSecretInput, setShowSecretInput] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/admin/users`, {
        headers: { "Authorization": `Bearer ${token}` }
      }).then(r => r.json());
      if (res.error) setMsg(res.error);
      else setUsers(res);
    } catch (e) { setMsg("Error aaya"); }
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) fetchUsers(); }, [isAdmin]);

  const deleteUser = async (user_id) => {
    if (!window.confirm("Sure ho? Delete ho jayega!")) return;
    const res = await fetch(`${BACKEND}/admin/delete-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ user_id })
    }).then(r => r.json());
    if (res.success) { setMsg("User delete ho gaya!"); fetchUsers(); }
    else setMsg(res.error);
  };

  const addCoins = async (user_id, name) => {
    const coins = parseInt(prompt(`${name} ko kitne coins dene hain?`));
    if (!coins || isNaN(coins)) return;
    const res = await fetch(`${BACKEND}/admin/add-coins`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ user_id, coins })
    }).then(r => r.json());
    if (res.success) { setMsg(`${coins} coins de diye!`); fetchUsers(); }
  };

  const claimAdmin = async () => {
    const res = await fetch(`${BACKEND}/make-me-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ secret: adminSecret })
    }).then(r => r.json());
    if (res.success) { setMsg("Ab tum Admin ho! Page refresh karo."); setShowSecretInput(false); }
    else setMsg(res.error);
  };

  if (!isAdmin) {
    return (
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-3">⚙️ Admin Dashboard</h2>
        <p className="text-gray-500 mb-3">Admin access required.</p>
        {!showSecretInput ? (
          <button onClick={() => setShowSecretInput(true)} className="bg-gray-700 text-white px-4 py-2 rounded text-sm">
            Admin Secret Daalo
          </button>
        ) : (
          <div className="flex gap-2">
            <input type="password" value={adminSecret} onChange={e => setAdminSecret(e.target.value)}
              placeholder="Admin secret key" className="border p-2 flex-1 rounded" />
            <button onClick={claimAdmin} className="bg-gray-700 text-white px-4 py-2 rounded">Submit</button>
          </div>
        )}
        {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold">⚙️ Admin Dashboard</h2>
        <button onClick={fetchUsers} className="text-sm text-blue-600">🔄 Refresh</button>
      </div>
      {msg && <p className="mb-2 text-sm text-green-600">{msg}</p>}
      {loading ? <p>Load ho raha hai...</p> :
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Total users: {users.length}</p>
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <span className="font-medium">{u.name}</span>
                {u.is_admin ? <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Admin</span> : null}
                <div className="text-xs text-gray-500">{u.email} • 🪙 {u.coins}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => addCoins(u.id, u.name)}
                  className="text-xs bg-yellow-500 text-white px-2 py-1 rounded">+Coins</button>
                <button onClick={() => deleteUser(u.id)}
                  className="text-xs bg-red-500 text-white px-2 py-1 rounded">Delete</button>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}
