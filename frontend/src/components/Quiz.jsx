import React, { useState } from "react";

const BACKEND = "https://ai-teacher-v7.onrender.com";

export default function Quiz({ token }) {
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [teamcoinUsername, setTeamcoinUsername] = useState(
    localStorage.getItem("teamcoin_username") || ""
  );

  const saveTeamcoinUsername = (val) => {
    setTeamcoinUsername(val);
    localStorage.setItem("teamcoin_username", val);
  };

  const generateQuiz = async () => {
    if (!topic) return;
    setLoading(true); setQuestions([]); setResult(null); setAnswers({});
    try {
      const res = await fetch(`${BACKEND}/generate-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      }).then(r => r.json());
      if (res.questions) setQuestions(res.questions);
      else alert(res.error || "Quiz generate nahi hua");
    } catch (e) { alert("Error aa gaya"); }
    setLoading(false);
  };

  const submitQuiz = async () => {
    let score = 0;
    questions.forEach((q, i) => { if (answers[i] === q.answer) score++; });

    let teamcoinMsg = "";
    if (token) {
      try {
        const res = await fetch(`${BACKEND}/save-score`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({
            score,
            topic,
            total: questions.length,
            teamcoin_username: teamcoinUsername
          }),
        }).then(r => r.json());

        if (res.teamcoin_result?.success) {
          teamcoinMsg = res.teamcoin_result.message;
        } else if (res.teamcoin_result?.error) {
          teamcoinMsg = `TeamCoin: ${res.teamcoin_result.error}`;
        }
      } catch (e) {}
    }

    setResult({ score, total: questions.length, teamcoinMsg });
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-3">📝 AI Quiz</h2>

      {/* TeamCoin Username */}
      <div className="mb-3 p-3 bg-yellow-50 rounded border border-yellow-200">
        <p className="text-sm font-medium text-yellow-800 mb-1">🪙 TeamCoin Username (optional)</p>
        <input
          value={teamcoinUsername}
          onChange={e => saveTeamcoinUsername(e.target.value)}
          placeholder="Apna TeamCoin username likhein"
          className="border p-2 w-full rounded text-sm"
        />
        <p className="text-xs text-yellow-600 mt-1">Quiz complete karne par TeamCoin pe bhi coins milenge!</p>
      </div>

      {/* Topic Input */}
      {!result && (
        <div className="flex gap-2 mb-4">
          <input value={topic} onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === "Enter" && generateQuiz()}
            placeholder="Topic likhein (jaise: Photosynthesis, History)"
            className="border p-2 flex-1 rounded" />
          <button onClick={generateQuiz} disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50 whitespace-nowrap">
            {loading ? "Ban raha hai..." : "Quiz Banao"}
          </button>
        </div>
      )}

      {/* Questions — before submit */}
      {questions.length > 0 && !result && (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={i} className="p-3 bg-purple-50 rounded">
              <p className="font-medium mb-2">{i + 1}. {q.q}</p>
              <div className="space-y-1">
                {q.options.map((opt, j) => (
                  <label key={j} className={`flex items-center gap-2 p-2 rounded cursor-pointer ${answers[i] === opt ? "bg-purple-200" : "hover:bg-purple-100"}`}>
                    <input type="radio" name={`q${i}`} value={opt}
                      onChange={() => setAnswers({ ...answers, [i]: opt })} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button onClick={submitQuiz}
            className="w-full bg-green-600 text-white py-2 rounded font-semibold">
            Submit Quiz ✅
          </button>
        </div>
      )}

      {/* Result + Answers — after submit */}
      {result && (
        <div>
          {/* Score Card */}
          <div className={`p-4 rounded text-center mb-4 ${result.score >= result.total / 2 ? "bg-green-50" : "bg-red-50"}`}>
            <p className="text-3xl font-bold mb-1">{result.score}/{result.total}</p>
            <p className="text-sm">+{result.score * 2} AI Teacher coins 🪙</p>
            {result.teamcoinMsg && (
              <p className={`text-sm mt-2 font-medium ${result.teamcoinMsg.includes("मिले") ? "text-green-600" : "text-red-500"}`}>
                {result.teamcoinMsg}
              </p>
            )}
          </div>

          {/* Answer Review */}
          <div className="space-y-3 mb-4">
            <p className="font-semibold text-gray-700">📋 Answers Review:</p>
            {questions.map((q, i) => {
              const userAnswer = answers[i];
              const correct = q.answer;
              const isCorrect = userAnswer === correct;
              return (
                <div key={i} className={`p-3 rounded border-l-4 ${isCorrect ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}>
                  <p className="font-medium mb-2">{i + 1}. {q.q}</p>
                  {q.options.map((opt, j) => {
                    const isCorrectOpt = opt === correct;
                    const isUserOpt = opt === userAnswer;
                    return (
                      <div key={j} className={`flex items-center gap-2 p-1.5 rounded text-sm mb-1
                        ${isCorrectOpt ? "bg-green-200 font-semibold" : ""}
                        ${isUserOpt && !isCorrectOpt ? "bg-red-200" : ""}
                      `}>
                        <span>
                          {isCorrectOpt ? "✅" : isUserOpt && !isCorrectOpt ? "❌" : "⬜"}
                        </span>
                        {opt}
                        {isCorrectOpt && <span className="text-green-700 ml-1">(Sahi jawab)</span>}
                        {isUserOpt && !isCorrectOpt && <span className="text-red-700 ml-1">(Tumhara jawab)</span>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <button onClick={() => { setQuestions([]); setResult(null); setTopic(""); setAnswers({}); }}
            className="w-full bg-purple-600 text-white py-2 rounded font-semibold">
            Dobara Khelo 🔄
          </button>
        </div>
      )}
    </div>
  );
}
