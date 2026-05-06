"""
MTMN Template — backend-api reference implementation.

Single-file Flask app for Vercel @vercel/python. Reference patterns:
  - SQLite at /tmp/data.db (Vercel ephemeral) — swap for Postgres before any
    project that needs durable storage. Schema in schema.sql.
  - Sessions hashed at rest (sha256). Bearer tokens in Authorization header
    only — never in URLs.
  - Login rate limit: 5/IP/5min, 10 wrong tries on one email locks the email
    for 1h.
  - Strict CSP applied to every response. Update apply_response_policy() if
    you add third-party scripts.
  - HMAC-signed short-lived URL helpers for any file-download endpoint.
"""

import hashlib
import hmac
import json
import os
import secrets
import smtplib
import sqlite3
import time
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from functools import wraps

from flask import Flask, g, jsonify, request

# ──────────────────────────────────────────────────────────────────────────
# Config

DB_PATH       = os.environ.get("DB_PATH", "/tmp/data.db")
SECRET_KEY    = os.environ.get("SECRET_KEY", "")  # MUST be set in production
ADMIN_EMAIL   = os.environ.get("ADMIN_EMAIL", "admin@example.com")
ADMIN_PASS    = os.environ.get("ADMIN_PASSWORD", "")
SESSION_TTL   = timedelta(days=7)
SIGNED_URL_TTL = 60  # seconds — for download links

if not SECRET_KEY:
    # Use an ephemeral key in dev so the app boots; production MUST set this
    SECRET_KEY = secrets.token_urlsafe(32)

app = Flask(__name__)


# ──────────────────────────────────────────────────────────────────────────
# DB helpers

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
  first_name TEXT, last_name TEXT, role TEXT NOT NULL DEFAULT 'staff',
  active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL, expires_at TEXT NOT NULL,
  ip TEXT, user_agent TEXT
);
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY, first_name TEXT NOT NULL, last_name TEXT NOT NULL,
  email TEXT NOT NULL, phone TEXT, service TEXT,
  date TEXT NOT NULL, time TEXT NOT NULL, notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending', staff_note TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY, first_name TEXT, last_name TEXT,
  email TEXT NOT NULL, phone TEXT, topic TEXT, notes TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS login_attempts (
  email TEXT NOT NULL, ip TEXT NOT NULL, success INTEGER NOT NULL,
  attempted_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_email ON login_attempts(email, attempted_at);
CREATE INDEX IF NOT EXISTS idx_login_ip    ON login_attempts(ip, attempted_at);
"""


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.executescript(SCHEMA)
        # Bootstrap admin if no users exist
        cur = g.db.execute("SELECT COUNT(*) c FROM users")
        if cur.fetchone()["c"] == 0 and ADMIN_PASS:
            g.db.execute(
                "INSERT INTO users (id, email, password_hash, role, created_at) "
                "VALUES (?, ?, ?, 'admin', ?)",
                (secrets.token_urlsafe(16), ADMIN_EMAIL, hash_password(ADMIN_PASS), now_iso()),
            )
            g.db.commit()
    return g.db


@app.teardown_appcontext
def close_db(exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


# ──────────────────────────────────────────────────────────────────────────
# Utility

def now_iso():
    return datetime.now(timezone.utc).isoformat()


def hash_password(pw: str) -> str:
    salt = secrets.token_bytes(16)
    h = hashlib.scrypt(pw.encode(), salt=salt, n=2**14, r=8, p=1, dklen=32)
    return f"scrypt${salt.hex()}${h.hex()}"


def verify_password(pw: str, stored: str) -> bool:
    try:
        algo, salt_hex, hash_hex = stored.split("$")
        if algo != "scrypt":
            return False
        h = hashlib.scrypt(
            pw.encode(), salt=bytes.fromhex(salt_hex),
            n=2**14, r=8, p=1, dklen=32,
        )
        return hmac.compare_digest(h.hex(), hash_hex)
    except Exception:
        return False


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def sign_payload(payload: str, ttl: int = SIGNED_URL_TTL) -> str:
    """Returns a query string '?exp=<ts>&sig=<hmac>' for a one-shot signed URL."""
    exp = int(time.time()) + ttl
    msg = f"{payload}|{exp}".encode()
    sig = hmac.new(SECRET_KEY.encode(), msg, hashlib.sha256).hexdigest()
    return f"exp={exp}&sig={sig}"


def verify_payload(payload: str, exp: str, sig: str) -> bool:
    try:
        if int(exp) < time.time():
            return False
    except ValueError:
        return False
    expected = hmac.new(SECRET_KEY.encode(), f"{payload}|{exp}".encode(),
                       hashlib.sha256).hexdigest()
    return hmac.compare_digest(sig, expected)


def client_ip() -> str:
    return request.headers.get("X-Forwarded-For", request.remote_addr or "").split(",")[0].strip()


# ──────────────────────────────────────────────────────────────────────────
# Auth decorator

def require_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"error": "missing token"}), 401
        token = auth[7:]
        db = get_db()
        row = db.execute(
            "SELECT s.user_id, u.email, u.role, u.active "
            "FROM sessions s JOIN users u ON u.id = s.user_id "
            "WHERE s.token_hash = ? AND s.expires_at > ?",
            (hash_token(token), now_iso()),
        ).fetchone()
        if not row or not row["active"]:
            return jsonify({"error": "invalid session"}), 401
        g.user = {"id": row["user_id"], "email": row["email"], "role": row["role"]}
        return f(*args, **kwargs)
    return wrapper


# ──────────────────────────────────────────────────────────────────────────
# Rate limiting (login-specific)

def login_rate_limited(email: str, ip: str) -> bool:
    db = get_db()
    cutoff_ip    = (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()
    cutoff_email = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    ip_count = db.execute(
        "SELECT COUNT(*) c FROM login_attempts WHERE ip = ? AND attempted_at > ?",
        (ip, cutoff_ip),
    ).fetchone()["c"]
    if ip_count >= 5:
        return True
    email_fails = db.execute(
        "SELECT COUNT(*) c FROM login_attempts "
        "WHERE email = ? AND success = 0 AND attempted_at > ?",
        (email, cutoff_email),
    ).fetchone()["c"]
    return email_fails >= 10


def record_attempt(email: str, ip: str, success: bool):
    db = get_db()
    db.execute(
        "INSERT INTO login_attempts (email, ip, success, attempted_at) VALUES (?,?,?,?)",
        (email, ip, 1 if success else 0, now_iso()),
    )
    db.commit()


# ──────────────────────────────────────────────────────────────────────────
# Response policy (CSP + security headers)

def apply_response_policy(resp):
    # Update the script-src allowlist if you add third-party scripts.
    resp.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https:; "
        "connect-src 'self'; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self'"
    )
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    resp.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return resp


@app.after_request
def _after(resp):
    return apply_response_policy(resp)


# ──────────────────────────────────────────────────────────────────────────
# Routes

@app.route("/health")
def health():
    return jsonify({"ok": True, "ts": now_iso()})


# ── Auth ──
@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    pw    = data.get("password") or ""
    ip    = client_ip()

    if not email or not pw:
        return jsonify({"error": "email and password required"}), 400
    if login_rate_limited(email, ip):
        return jsonify({"error": "too many attempts, try again later"}), 429

    db = get_db()
    user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    ok = bool(user) and user["active"] and verify_password(pw, user["password_hash"])
    record_attempt(email, ip, ok)
    if not ok:
        return jsonify({"error": "invalid credentials"}), 401

    token = secrets.token_urlsafe(32)
    db.execute(
        "INSERT INTO sessions (token_hash, user_id, created_at, expires_at, ip, user_agent) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (hash_token(token), user["id"], now_iso(),
         (datetime.now(timezone.utc) + SESSION_TTL).isoformat(),
         ip, request.headers.get("User-Agent", "")),
    )
    db.commit()
    return jsonify({
        "token": token,
        "user": {"id": user["id"], "email": user["email"], "role": user["role"]},
    })


@app.post("/api/auth/logout")
@require_auth
def logout():
    auth = request.headers.get("Authorization", "")
    token = auth[7:]
    db = get_db()
    db.execute("DELETE FROM sessions WHERE token_hash = ?", (hash_token(token),))
    db.commit()
    return jsonify({"ok": True})


@app.post("/api/auth/logout-all")
@require_auth
def logout_all():
    db = get_db()
    db.execute("DELETE FROM sessions WHERE user_id = ?", (g.user["id"],))
    db.commit()
    return jsonify({"ok": True})


@app.get("/api/auth/me")
@require_auth
def me():
    return jsonify({"user": g.user})


# ── Bookings ──
@app.post("/api/bookings")
def create_booking():
    data = request.get_json(silent=True) or {}
    required = ["firstName", "lastName", "email", "date", "time"]
    if any(not (data.get(k) or "").strip() for k in required):
        return jsonify({"error": f"missing fields: {required}"}), 400

    booking_id = secrets.token_urlsafe(12)
    db = get_db()
    db.execute(
        "INSERT INTO bookings (id, first_name, last_name, email, phone, service, "
        "date, time, notes, status, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)",
        (booking_id, data["firstName"], data["lastName"], data["email"],
         data.get("phone"), data.get("service"), data["date"], data["time"],
         data.get("notes"), now_iso()),
    )
    db.commit()
    return jsonify({"ok": True, "id": booking_id}), 201


@app.get("/api/bookings")
@require_auth
def list_bookings():
    db = get_db()
    rows = db.execute("SELECT * FROM bookings ORDER BY date DESC, time DESC").fetchall()
    return jsonify({"bookings": [dict(r) for r in rows]})


@app.patch("/api/bookings/<bid>")
@require_auth
def update_booking(bid):
    data = request.get_json(silent=True) or {}
    fields = {
        "first_name": data.get("firstName"), "last_name": data.get("lastName"),
        "email": data.get("email"), "phone": data.get("phone"),
        "service": data.get("service"), "date": data.get("date"),
        "time": data.get("time"), "notes": data.get("notes"),
        "status": data.get("status"), "staff_note": data.get("staffNote"),
    }
    fields = {k: v for k, v in fields.items() if v is not None}
    if not fields:
        return jsonify({"error": "no fields to update"}), 400
    db = get_db()
    setters = ", ".join(f"{k} = ?" for k in fields)
    db.execute(f"UPDATE bookings SET {setters} WHERE id = ?",
               list(fields.values()) + [bid])
    db.commit()
    return jsonify({"ok": True})


@app.delete("/api/bookings/<bid>")
@require_auth
def delete_booking(bid):
    db = get_db()
    db.execute("DELETE FROM bookings WHERE id = ?", (bid,))
    db.commit()
    return jsonify({"ok": True})


# ── Contact form ──
@app.post("/api/contact")
def contact():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip()
    if not email:
        return jsonify({"error": "email required"}), 400

    msg_id = secrets.token_urlsafe(12)
    db = get_db()
    db.execute(
        "INSERT INTO contact_messages (id, first_name, last_name, email, phone, "
        "topic, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (msg_id, data.get("firstName"), data.get("lastName"), email,
         data.get("phone"), data.get("topic"), data.get("notes"), now_iso()),
    )
    db.commit()
    _maybe_send_notification(data)
    return jsonify({"ok": True, "id": msg_id}), 201


def _maybe_send_notification(data):
    host = os.environ.get("SMTP_HOST")
    if not host:
        return
    try:
        msg = EmailMessage()
        msg["Subject"] = f"New contact from {data.get('firstName','')} {data.get('lastName','')}"
        msg["From"] = os.environ.get("MAIL_FROM", "noreply@example.com")
        msg["To"]   = os.environ.get("MAIL_TO",   os.environ.get("MAIL_FROM", "hello@example.com"))
        msg.set_content(json.dumps(data, indent=2))
        with smtplib.SMTP(host, int(os.environ.get("SMTP_PORT", "587"))) as s:
            s.starttls()
            user = os.environ.get("SMTP_USER")
            if user:
                s.login(user, os.environ.get("SMTP_PASS", ""))
            s.send_message(msg)
    except Exception:
        # Don't surface mail failures to the public submitter
        pass


# ── Users (admin) ──
@app.get("/api/users")
@require_auth
def list_users():
    db = get_db()
    rows = db.execute(
        "SELECT id, email, first_name, last_name, role, active, created_at FROM users"
    ).fetchall()
    return jsonify({"users": [dict(r) for r in rows]})


@app.post("/api/users")
@require_auth
def create_user():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    pw    = data.get("password") or ""
    if not email or not pw:
        return jsonify({"error": "email and password required"}), 400
    user_id = secrets.token_urlsafe(16)
    db = get_db()
    try:
        db.execute(
            "INSERT INTO users (id, email, password_hash, first_name, last_name, "
            "role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (user_id, email, hash_password(pw), data.get("firstName"),
             data.get("lastName"), data.get("role", "staff"), now_iso()),
        )
        db.commit()
    except sqlite3.IntegrityError:
        return jsonify({"error": "email already exists"}), 409
    return jsonify({"ok": True, "id": user_id}), 201


@app.patch("/api/users/<uid>")
@require_auth
def update_user(uid):
    data = request.get_json(silent=True) or {}
    fields = {
        "first_name": data.get("firstName"), "last_name": data.get("lastName"),
        "email": (data.get("email") or "").strip().lower() or None,
        "role": data.get("role"),
        "active": int(bool(data["active"])) if "active" in data else None,
    }
    fields = {k: v for k, v in fields.items() if v is not None}
    if data.get("password"):
        fields["password_hash"] = hash_password(data["password"])
    if not fields:
        return jsonify({"error": "no fields to update"}), 400
    db = get_db()
    setters = ", ".join(f"{k} = ?" for k in fields)
    db.execute(f"UPDATE users SET {setters} WHERE id = ?",
               list(fields.values()) + [uid])
    db.commit()
    return jsonify({"ok": True})


@app.delete("/api/users/<uid>")
@require_auth
def delete_user(uid):
    if uid == g.user["id"]:
        return jsonify({"error": "cannot delete yourself"}), 400
    db = get_db()
    db.execute("DELETE FROM users WHERE id = ?", (uid,))
    db.commit()
    return jsonify({"ok": True})


# ──────────────────────────────────────────────────────────────────────────
# Vercel entrypoint

def handler(event, context):
    return app(event, context)
