import React, { useEffect, useState } from "react";
import { getLeaderboard } from "../api";

export default function Leaderboard() {
  const [data,setData]=useState([]);

  useEffect(()=>{
    async function fetchData(){
      const res=await getLeaderboard();
      setData(res);
    }
    fetchData();
  },[]);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">Leaderboard</h2>
      <ol className="list-decimal ml-5">
        {data.map((d,i)=><li key={i}>{d.name} - {d.best}</li>)}
      </ol>
    </div>
  );
}
