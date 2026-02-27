from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3, jwt, io, base64, re, requests as http_requests
from gtts import gTTS
from datetime import datetime, timedelta
import os

app = Flask(__name__)
CORS(app, origins="*")

SECRET_KEY      = os.environ.get("SECRET_KEY", "v7_super_secret")
DB_PATH         = "ai_teacher_v7.db"
GROQ_API_KEY    = os.environ.get("GROQ_API_KEY", "")
TAVILY_API_KEY  = os.environ.get("TAVILY_API_KEY", "")
OPENAI_API_KEY  = os.environ.get("OPENAI_API_KEY", "")
GEMINI_API_KEY  = os.environ.get("GEMINI_API_KEY", "")

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
        avatar TEXT DEFAULT '👤', coins INTEGER DEFAULT 0
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
    if not TAVILY_API_KEY:
        return ""
    try:
        res = http_requests.post(
            "https://api.tavily.com/search",
            json={"api_key": TAVILY_API_KEY, "query": query, "search_depth": "basic", "max_results": 3, "include_answer": True},
            timeout=10
        )
        data = res.json()
        context = ""
        if data.get("answer"):
            context += f"Web info: {data['answer']}\n"
        for r in data.get("results", [])[:2]:
            context += f"- {r.get('title','')}: {r.get('content','')[:200]}\n"
        return context.strip()
    except Exception as e:
        print("Tavily Error:", e)
        return ""

# -------- AI Providers -------- #
def grok_response(prompt):
    try:
        res = http_requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": "llama3-8b-8192",
                "messages": [
                    {"role": "system", "content": "Tum ek helpful AI teacher ho. Hindi mein jawab do. Simple aur clear explanation do."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 600
            },
            timeout=20
        )
        return res.json()["choices"][0]["message"]["content"]
    except Exception as e:
        print("Grok Error:", e); return None

def openai_response(prompt):
    try:
        res = http_requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": "gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": "You are a helpful AI teacher. Answer in Hindi."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 600
            },
            timeout=20
        )
        return res.json()["choices"][0]["message"]["content"]
    except Exception as e:
        print("OpenAI Error:", e); return None

def gemini_response(prompt):
    try:
        res = http_requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}",
            json={"contents": [{"parts": [{"text": f"AI teacher ki tarah Hindi mein jawab do: {prompt}"}]}]},
            timeout=20
        )
        return res.json()["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        print("Gemini Error:", e); return None

def get_ai_response(prompt, use_search=False):
    if use_search and TAVILY_API_KEY:
        context = tavily_search(prompt)
        if context:
            prompt = f"{prompt}\n\nWeb se mili info:\n{context}"

    answer = None
    if GROQ_API_KEY:    answer = grok_response(prompt)
    if not answer and OPENAI_API_KEY:  answer = openai_response(prompt)
    if not answer and GEMINI_API_KEY:  answer = gemini_response(prompt)
    if not answer:
        return "Koi AI key configure nahi hai. Render mein GROQ_API_KEY set karein."
    return answer

# -------- Routes -------- #

@app.route("/")
def home(): return "AI Teacher V7 Backend Running 🚀"

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
    return jsonify({"token": make_token(user["id"]), "name": user["name"], "avatar": user["avatar"]})

@app.route("/ask", methods=["POST"])
def ask():
    question = request.json.get("question","")
    if not question: return jsonify({"answer":"Koi question nahi mila."})
    answer = get_ai_response(question, use_search=True)
    audio  = text_to_speech(answer)
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

@app.route("/save-score", methods=["POST"])
@auth_required
def save_score():
    d = request.json
    score, topic = d.get("score",0), d.get("topic","")
    conn = get_db(); c = conn.cursor()
    c.execute("INSERT INTO scores(user_id,score,topic,date) VALUES(?,?,?,?)",
              (request.uid, score, topic, str(datetime.today().date())))
    conn.commit(); conn.close()
    return jsonify({"success": True})

@app.route("/leaderboard")
def leaderboard():
    conn = get_db(); c = conn.cursor()
    c.execute("SELECT users.name, MAX(scores.score) as best FROM scores JOIN users ON scores.user_id=users.id GROUP BY users.id ORDER BY best DESC LIMIT 10")
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return jsonify(rows)

if __name__ == "__main__":
    app.run()


@app.route("/debug")
def debug():
    return jsonify({
        "GROQ_KEY_SET": bool(GROQ_API_KEY),
        "GROQ_KEY_LENGTH": len(GROQ_API_KEY),
        "TAVILY_KEY_SET": bool(TAVILY_API_KEY),
    })
    
