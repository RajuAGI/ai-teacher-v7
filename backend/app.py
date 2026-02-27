from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3, jwt, io, base64, re, requests as http_requests, json
from gtts import gTTS
from datetime import datetime, timedelta
import os

app = Flask(__name__)
CORS(app, origins="*")

SECRET_KEY     = os.environ.get("SECRET_KEY", "v7_super_secret")
DB_PATH        = "ai_teacher_v7.db"
GROQ_API_KEY   = os.environ.get("GROQ_API_KEY", "")
TAVILY_API_KEY = os.environ.get("TAVILY_API_KEY", "")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
GEMINI_API_KEY  = os.environ.get("GEMINI_API_KEY", "")
TEAMCOIN_URL    = os.environ.get("TEAMCOIN_URL", "https://teamcoin-backend.onrender.com")
QUIZ_SECRET     = os.environ.get("QUIZ_SECRET", "quiz_bridge_2025")

# -------- Database -------- #
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db(); c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT, email TEXT UNIQUE, password TEXT,
        avatar TEXT DEFAULT '👤', coins INTEGER DEFAULT 0,
        is_admin INTEGER DEFAULT 0
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS scores(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER, score INTEGER, topic TEXT, date TEXT
    )""")
    conn.commit(); conn.close()

init_db()

# -------- Auth -------- #
def auth_required(f):
    from functools import wraps
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = request.headers.get("Authorization","").replace("Bearer ","")
        if not token: return jsonify({"error":"Login required"}),401
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            request.uid = data["uid"]
        except:
            return jsonify({"error":"Invalid or expired token"}),401
        return f(*args, **kwargs)
    return wrapper

def make_token(uid):
    payload = {"uid":uid,"exp":datetime.utcnow()+timedelta(days=30)}
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

# -------- TTS -------- #
def text_to_speech(text):
    try:
        text = re.sub(r'[*#_`]', '', text)
        chunks = [text[i:i+400] for i in range(0, len(text), 400)]
        final_audio = io.BytesIO()
        for chunk in chunks:
            tts = gTTS(chunk, lang="hi", slow=False)
            buf = io.BytesIO()
            tts.write_to_fp(buf)
            buf.seek(0)
            final_audio.write(buf.read())
        final_audio.seek(0)
        return base64.b64encode(final_audio.read()).decode()
    except Exception as e:
        print("TTS Error:", e)
        return ""

# -------- Tavily Search -------- #
def tavily_search(query):
    if not TAVILY_API_KEY: return ""
    try:
        res = http_requests.post(
            "https://api.tavily.com/search",
            json={"api_key": TAVILY_API_KEY, "query": query, "search_depth": "basic", "max_results": 3, "include_answer": True},
            timeout=10
        )
        data = res.json()
        context = ""
        if data.get("answer"): context += f"Web info: {data['answer']}\n"
        for r in data.get("results", [])[:2]:
            context += f"- {r.get('title','')}: {r.get('content','')[:200]}\n"
        return context.strip()
    except Exception as e:
        print("Tavily Error:", e); return ""

# -------- AI -------- #
def call_groq(messages, max_tokens=800):
    res = http_requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
        json={"model": "llama-3.3-70b-versatile", "messages": messages, "max_tokens": max_tokens},
        timeout=30
    )
    return res.json()["choices"][0]["message"]["content"]

def get_ai_response(prompt, use_search=False):
    if use_search and TAVILY_API_KEY:
        context = tavily_search(prompt)
        if context: prompt = f"{prompt}\n\nWeb se mili info:\n{context}"
    try:
        if GROQ_API_KEY:
            return call_groq([
                {"role": "system", "content": "Tum ek helpful AI teacher ho. Hindi mein jawab do. Simple aur clear explanation do."},
                {"role": "user", "content": prompt}
            ])
    except Exception as e:
        print("Groq Error:", e)
    return "AI response lene mein error aaya. Dobara try karo."


# -------- TeamCoin Integration -------- #
def award_teamcoins(username, score, total, topic):
    if not username or not TEAMCOIN_URL:
        return None
    try:
        coins = score * 2
        if coins <= 0:
            return None
        res = http_requests.post(
            f"{TEAMCOIN_URL}/award-quiz-coins",
            json={
                "secret": QUIZ_SECRET,
                "username": username,
                "coins": coins,
                "score": score,
                "total": total,
                "topic": topic
            },
            timeout=10
        )
        return res.json()
    except Exception as e:
        print("TeamCoin award Error:", e)
        return None

# -------- Routes -------- #

@app.route("/")
def home(): return "AI Teacher V7 Backend Running 🚀"

@app.route("/debug")
def debug():
    return jsonify({"GROQ_KEY_SET": bool(GROQ_API_KEY), "GROQ_KEY_LENGTH": len(GROQ_API_KEY), "TAVILY_KEY_SET": bool(TAVILY_API_KEY)})

@app.route("/register", methods=["POST"])
def register():
    d = request.json
    name, email, password = d.get("name",""), d.get("email",""), d.get("password","")
    if not name or not email or not password:
        return jsonify({"error":"All fields required"}), 400
    conn = get_db(); c = conn.cursor()
    if c.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone():
        conn.close(); return jsonify({"error":"Email already exists"}), 400
    c.execute("INSERT INTO users(name,email,password) VALUES(?,?,?)", (name,email,password))
    uid = c.lastrowid; conn.commit(); conn.close()
    return jsonify({"token": make_token(uid), "name": name, "message": "Registration successful!"})

@app.route("/login", methods=["POST"])
def login():
    d = request.json
    email, password = d.get("email",""), d.get("password","")
    conn = get_db(); c = conn.cursor()
    user = c.execute("SELECT * FROM users WHERE email=? AND password=?", (email,password)).fetchone()
    conn.close()
    if not user: return jsonify({"error":"Invalid credentials"}), 401
    return jsonify({"token": make_token(user["id"]), "name": user["name"], "avatar": user["avatar"], "is_admin": user["is_admin"], "coins": user["coins"]})

@app.route("/ask", methods=["POST"])
def ask():
    question = request.json.get("question","")
    if not question: return jsonify({"answer":"Koi question nahi mila."})
    answer = get_ai_response(question, use_search=True)
    audio = text_to_speech(answer)
    return jsonify({"answer": answer, "audio": audio})

@app.route("/explain", methods=["POST"])
def explain():
    topic = request.json.get("topic","")
    if not topic: return jsonify({"explanation":"Koi topic nahi mila."})
    explanation = get_ai_response(f"Is topic ko detail mein samjhao, easy Hindi mein: {topic}")
    audio = text_to_speech(explanation)
    return jsonify({"explanation": explanation, "audio": audio})

@app.route("/tts", methods=["POST"])
def tts_route():
    text = request.json.get("text","")
    if not text: return jsonify({"audio":""})
    return jsonify({"audio": text_to_speech(text)})

# -------- Quiz -------- #
@app.route("/generate-quiz", methods=["POST"])
def generate_quiz():
    topic = request.json.get("topic","")
    if not topic: return jsonify({"error":"Topic do"}), 400
    try:
        prompt = f"""Create 5 multiple choice questions about "{topic}" in Hindi.
Return ONLY valid JSON in this exact format, nothing else:
{{
  "questions": [
    {{
      "q": "Question text here?",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "answer": "A) option1"
    }}
  ]
}}"""
        raw = call_groq([{"role": "user", "content": prompt}], max_tokens=1000)
        raw = raw.strip()
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"): raw = raw[4:]
        data = json.loads(raw)
        return jsonify(data)
    except Exception as e:
        print("Quiz Error:", e)
        return jsonify({"error":"Quiz generate nahi hua, dobara try karo"}), 500

# -------- Score & Coins -------- #
@app.route("/save-score", methods=["POST"])
@auth_required
def save_score():
    d = request.json
    score, topic = d.get("score",0), d.get("topic","")
    teamcoin_username = d.get("teamcoin_username", "")
    total = d.get("total", 5)
    coins_earned = score * 2
    conn = get_db(); c = conn.cursor()
    c.execute("INSERT INTO scores(user_id,score,topic,date) VALUES(?,?,?,?)",
              (request.uid, score, topic, str(datetime.today().date())))
    c.execute("UPDATE users SET coins = coins + ? WHERE id=?", (coins_earned, request.uid))
    conn.commit(); conn.close()
    
    # TeamCoin pe bhi coins award karo
    teamcoin_result = None
    if teamcoin_username:
        teamcoin_result = award_teamcoins(teamcoin_username, score, total, topic)
    
    return jsonify({
        "success": True, 
        "coins_earned": coins_earned,
        "teamcoin_result": teamcoin_result
    })

@app.route("/my-coins", methods=["GET"])
@auth_required
def my_coins():
    conn = get_db(); c = conn.cursor()
    user = c.execute("SELECT coins FROM users WHERE id=?", (request.uid,)).fetchone()
    conn.close()
    return jsonify({"coins": user["coins"] if user else 0})

@app.route("/claim-coins", methods=["POST"])
@auth_required
def claim_coins():
    conn = get_db(); c = conn.cursor()
    # Check last claim
    today = str(datetime.today().date())
    last = c.execute("SELECT date FROM scores WHERE user_id=? AND topic='daily_claim' AND date=?", (request.uid, today)).fetchone()
    if last:
        conn.close()
        return jsonify({"error": "Aaj ke coins already claim ho gaye!"}), 400
    coins = 10
    c.execute("INSERT INTO scores(user_id,score,topic,date) VALUES(?,?,?,?)", (request.uid, coins, "daily_claim", today))
    c.execute("UPDATE users SET coins = coins + ? WHERE id=?", (coins, request.uid))
    conn.commit(); conn.close()
    return jsonify({"success": True, "coins_earned": coins})

# -------- Leaderboard -------- #
@app.route("/leaderboard")
def leaderboard():
    conn = get_db(); c = conn.cursor()
    c.execute("""SELECT users.name, users.avatar, users.coins,
                 COUNT(scores.id) as quizzes_played,
                 COALESCE(MAX(scores.score),0) as best_score
                 FROM users
                 LEFT JOIN scores ON scores.user_id=users.id AND scores.topic != 'daily_claim'
                 GROUP BY users.id
                 ORDER BY users.coins DESC LIMIT 10""")
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return jsonify(rows)

# -------- Admin -------- #
@app.route("/admin/users")
@auth_required
def admin_users():
    conn = get_db(); c = conn.cursor()
    me = c.execute("SELECT is_admin FROM users WHERE id=?", (request.uid,)).fetchone()
    if not me or not me["is_admin"]:
        conn.close(); return jsonify({"error":"Admin access required"}), 403
    users = c.execute("SELECT id, name, email, coins, is_admin FROM users").fetchall()
    conn.close()
    return jsonify([dict(u) for u in users])

@app.route("/admin/make-admin", methods=["POST"])
@auth_required
def make_admin():
    conn = get_db(); c = conn.cursor()
    me = c.execute("SELECT is_admin FROM users WHERE id=?", (request.uid,)).fetchone()
    if not me or not me["is_admin"]:
        conn.close(); return jsonify({"error":"Admin access required"}), 403
    user_id = request.json.get("user_id")
    c.execute("UPDATE users SET is_admin=1 WHERE id=?", (user_id,))
    conn.commit(); conn.close()
    return jsonify({"success": True})

@app.route("/admin/delete-user", methods=["POST"])
@auth_required
def delete_user():
    conn = get_db(); c = conn.cursor()
    me = c.execute("SELECT is_admin FROM users WHERE id=?", (request.uid,)).fetchone()
    if not me or not me["is_admin"]:
        conn.close(); return jsonify({"error":"Admin access required"}), 403
    user_id = request.json.get("user_id")
    if user_id == request.uid:
        conn.close(); return jsonify({"error":"Apne aap ko delete nahi kar sakte"}), 400
    c.execute("DELETE FROM users WHERE id=?", (user_id,))
    c.execute("DELETE FROM scores WHERE user_id=?", (user_id,))
    conn.commit(); conn.close()
    return jsonify({"success": True})

@app.route("/admin/add-coins", methods=["POST"])
@auth_required
def admin_add_coins():
    conn = get_db(); c = conn.cursor()
    me = c.execute("SELECT is_admin FROM users WHERE id=?", (request.uid,)).fetchone()
    if not me or not me["is_admin"]:
        conn.close(); return jsonify({"error":"Admin access required"}), 403
    user_id = request.json.get("user_id")
    coins = request.json.get("coins", 0)
    c.execute("UPDATE users SET coins = coins + ? WHERE id=?", (coins, user_id))
    conn.commit(); conn.close()
    return jsonify({"success": True})

@app.route("/make-me-admin", methods=["POST"])
@auth_required
def make_me_admin():
    secret = request.json.get("secret","")
    if secret != os.environ.get("ADMIN_SECRET","admin123"):
        return jsonify({"error":"Wrong secret"}), 403
    conn = get_db(); c = conn.cursor()
    c.execute("UPDATE users SET is_admin=1 WHERE id=?", (request.uid,))
    conn.commit(); conn.close()
    return jsonify({"success": True, "message": "Ab tum admin ho!"})

if __name__ == "__main__":
    app.run()
