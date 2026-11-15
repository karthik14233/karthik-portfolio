import os
import re
import time
from collections import defaultdict, deque

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
from supabase import create_client

load_dotenv()

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024  # reject oversized requests

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # server-side only, never in frontend
db = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
TAG_RE = re.compile(r"<[^>]*>")
CTRL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")

# Simple per-IP limit: 5 messages per hour (per worker process).
LIMIT, WINDOW = 5, 3600
recent = defaultdict(deque)


def clean(value, max_len):
    """Strip HTML tags and control characters, trim, and cap length."""
    value = CTRL_RE.sub("", TAG_RE.sub("", str(value or "")))
    return value.strip()[:max_len]


def client_ip():
    return request.headers.get("X-Forwarded-For", request.remote_addr or "").split(",")[0].strip()


@app.after_request
def security_headers(resp):
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return resp


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/healthz")
def healthz():
    return jsonify(status="ok")


@app.post("/contact")
def contact():
    data = request.get_json(silent=True) or request.form

    # Honeypot: real users never see or fill this field. Pretend success to bots.
    if data.get("website"):
        return jsonify(ok=True, message="Thanks! Your message was sent."), 200

    ip = client_ip()
    now = time.time()
    q = recent[ip]
    while q and now - q[0] > WINDOW:
        q.popleft()
    if len(q) >= LIMIT:
        return jsonify(ok=False, errors={"form": "Too many messages. Try again in an hour."}), 429

    name = clean(data.get("name"), 80)
    email = clean(data.get("email"), 120).lower()
    message = clean(data.get("message"), 2000)

    errors = {}
    if len(name) < 2:
        errors["name"] = "Enter your name (at least 2 characters)."
    if not EMAIL_RE.match(email):
        errors["email"] = "Enter a valid email address."
    if len(message) < 10:
        errors["message"] = "Write a message of at least 10 characters."
    if errors:
        return jsonify(ok=False, errors=errors), 400

    if db is None:
        app.logger.error("Supabase is not configured")
        return jsonify(ok=False, errors={"form": "Server is not configured yet."}), 500
    try:
        db.table("messages").insert({"name": name, "email": email, "message": message}).execute()
    except Exception:
        app.logger.exception("Failed to save message")
        return jsonify(ok=False, errors={"form": "Could not save your message. Please try again."}), 500

    q.append(now)
    return jsonify(ok=True, message="Thanks! Your message was sent."), 201


@app.get("/api/visits")
def visits():
    if db is None:
        return jsonify(ok=False), 500
    try:
        total = int(db.rpc("increment_visits").execute().data)
    except Exception:
        app.logger.exception("Visit counter failed")
        return jsonify(ok=False), 500
    resp = jsonify(ok=True, visits=total)
    resp.headers["Cache-Control"] = "no-store"
    return resp


if __name__ == "__main__":
    app.run(debug=True, port=int(os.getenv("PORT", 5000)))
