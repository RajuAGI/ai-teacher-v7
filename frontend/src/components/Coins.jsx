import React, { useState } from "react";

export default function Coins() {
  const [coins,setCoins]=useState(0);

  const handleClaim=()=>{
    const earned=Math.floor(Math.random()*20);
    setCoins(coins+earned);
    alert(`You earned ${earned} coins!`);
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">TeamCoins</h2>
      <p>Total Coins: {coins}</p>
      <button onClick={handleClaim} className="bg-yellow-500 text-white px-4 py-2 rounded mt-2">Claim Coins</button>
    </div>
  );
}
