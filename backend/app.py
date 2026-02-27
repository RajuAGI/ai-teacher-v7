from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3, jwt, io, base64, re
from gtts import gTTS
from datetime import datetime, timedelta
import os, json

app = Flask(__name__)
CORS(app, origins="*")

SECRET_KEY = os.environ.get("SECRET_KEY","v7_super_secret")
DB_PATH = "ai_teacher_v7.db"

# -------- Database -------- #
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        avatar TEXT DEFAULT '👤',
        coins INTEGER DEFAULT 0
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS scores(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        score INTEGER,
        topic TEXT,
        date TEXT
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
            data = jwt.decode(token,SECRET_KEY,algorithms=["HS256"])
            request.uid = data["uid"]
        except:
            return jsonify({"error":"Invalid or expired token"}),401
        return f(*args, **kwargs)
    return wrapper

def make_token(uid):
    payload = {"uid":uid,"exp":datetime.utcnow()+timedelta(days=30)}
    return jwt.encode(payload,SECRET_KEY,algorithm="HS256")

# -------- TTS -------- #
def text_to_speech(text):
    try:
        text = re.sub(r'[*#_`]', '', text)
        chunks = [text[i:i+400] for i in range(0,len(text),400)]
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
        print("TTS Error:",e)
        return ""

# -------- Routes -------- #

@app.route("/")
def home(): return "AI Teacher V7 God Mode 🚀 Running"

@app.route("/register", methods=["POST"])
def register():
    d = request.json
    name,email,password = d.get("name",""), d.get("email",""), d.get("password","")
    if not name or not email or not password:
        return jsonify({"error":"All fields required"}),400
    conn = get_db()
    c = conn.cursor()
    if c.execute("SELECT id FROM users WHERE email=?",(email,)).fetchone():
        conn.close()
        return jsonify({"error":"Email exists"}),400
    c.execute("INSERT INTO users(name,email,password) VALUES(?,?,?)",(name,email,password))
    uid = c.lastrowid
    conn.commit(); conn.close()
    token = make_token(uid)
    return jsonify({"token":token,"name":name})

@app.route("/login", methods=["POST"])
def login():
    d = request.json
    email,password = d.get("email",""),d.get("password","")
    conn = get_db()
    c = conn.cursor()
    user = c.execute("SELECT * FROM users WHERE email=? AND password=?",(email,password)).fetchone()
    conn.close()
    if not user: return jsonify({"error":"Invalid credentials"}),401
    token = make_token(user["id"])
    return jsonify({"token":token,"name":user["name"],"avatar":user["avatar"]})

@app.route("/tts", methods=["POST"])
def tts_route():
    text = request.json.get("text","")
    if not text: return jsonify({"audio":""})
    audio = text_to_speech(text)
    return jsonify({"audio":audio})

@app.route("/save-score", methods=["POST"])
@auth_required
def save_score():
    d = request.json
    score,topic = d.get("score",0), d.get("topic","")
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO scores(user_id,score,topic,date) VALUES(?,?,?,?)",
              (request.uid,score,topic,str(datetime.today().date())))
    conn.commit(); conn.close()
    return jsonify({"success":True})

@app.route("/leaderboard")
def leaderboard():
    conn = get_db(); c = conn.cursor()
    c.execute("SELECT users.name, MAX(scores.score) as best FROM scores JOIN users ON scores.user_id=users.id GROUP BY users.id ORDER BY best DESC LIMIT 10")
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return jsonify(rows)

if __name__=="__main__":
    app.run()
