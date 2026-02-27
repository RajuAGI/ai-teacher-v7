import React, { useState } from "react";
import { register, login } from "../api";

export default function Login() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [name,setName]=useState(""); const [token,setToken]=useState("");

  const handleRegister=async()=>{
    const res=await register({name,email,password});
    if(res.token) setToken(res.token);
    alert(res.message || res.error || "Done");
  }

  const handleLogin=async()=>{
    const res=await login({email,password});
    if(res.token) setToken(res.token);
    alert(res.message || res.error || "Done");
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">Login / Register</h2>
      <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} className="border p-2 w-full mb-2"/>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="border p-2 w-full mb-2"/>
      <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} className="border p-2 w-full mb-2"/>
      <button onClick={handleRegister} className="bg-green-600 text-white px-4 py-2 rounded mr-2">Register</button>
      <button onClick={handleLogin} className="bg-blue-600 text-white px-4 py-2 rounded">Login</button>
    </div>
  );
}
