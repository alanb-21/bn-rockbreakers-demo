-- Reference schema for the backend-api module.
-- Tables are auto-created at runtime by api/index.py — this file exists for
-- documentation and for migrating to a hosted Postgres if you outgrow SQLite.

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name    TEXT,
  last_name     TEXT,
  role          TEXT NOT NULL DEFAULT 'staff',  -- 'admin' | 'staff'
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash   TEXT PRIMARY KEY,                -- sha256 of the bearer token
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TEXT NOT NULL,
  expires_at   TEXT NOT NULL,
  ip           TEXT,
  user_agent   TEXT
);

CREATE TABLE IF NOT EXISTS bookings (
  id           TEXT PRIMARY KEY,
  first_name   TEXT NOT NULL,
  last_name    TEXT NOT NULL,
  email        TEXT NOT NULL,
  phone        TEXT,
  service      TEXT,
  date         TEXT NOT NULL,                   -- YYYY-MM-DD
  time         TEXT NOT NULL,                   -- HH:MM
  notes        TEXT,
  status       TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'confirmed' | 'cancelled' | 'completed'
  staff_note   TEXT,
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id           TEXT PRIMARY KEY,
  first_name   TEXT,
  last_name    TEXT,
  email        TEXT NOT NULL,
  phone        TEXT,
  topic        TEXT,
  notes        TEXT,
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS login_attempts (
  email        TEXT NOT NULL,
  ip           TEXT NOT NULL,
  success      INTEGER NOT NULL,
  attempted_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email, attempted_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip    ON login_attempts(ip,    attempted_at);
