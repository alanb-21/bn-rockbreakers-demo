# Module: backend-api

Foundation module. Single-file Python serverless backend with SQLite storage. Everything else that needs persistence depends on this.

## What it adds

- **Auth & sessions** — email + password login, session tokens hashed at rest, `Authorization: Bearer <token>` header for API requests.
- **Rate limiting** — 5 logins/IP/5min, 10 wrong tries on one email locks that email for 1h.
- **Bookings** — public POST endpoint to create, authenticated GET/PATCH/DELETE for management.
- **Contact form** — public POST that stores submissions and (optionally) emails the team.
- **Users** — authenticated CRUD for staff accounts.
- **Strict CSP** — set on every response. Add new third-party scripts to the allowlist before they load.
- **HMAC-signed short-lived URLs** — pattern for any PDF / file download endpoint that mustn't accept bearer tokens in query strings.

## Files to copy

```
modules/backend-api/api/index.py     →  <project>/api/index.py
modules/backend-api/vercel.json      →  <project>/vercel.json
modules/backend-api/requirements.txt →  <project>/requirements.txt
modules/backend-api/schema.sql       →  <project>/schema.sql      (reference only — runtime auto-creates tables)
```

## Environment variables (set in Vercel project settings)

| Var | Purpose |
|---|---|
| `SECRET_KEY` | HMAC signing key for short-lived URLs. Generate with `python -c "import secrets;print(secrets.token_urlsafe(64))"` |
| `ADMIN_EMAIL` | Bootstrap admin account email — created on first request if no users exist |
| `ADMIN_PASSWORD` | Bootstrap admin password — change immediately after first login |
| `MAIL_FROM` | (Optional) Email to send contact-form notifications from |
| `MAIL_TO` | (Optional) Where to deliver notifications |
| `SMTP_*` | (Optional) SMTP credentials if email notifications are wanted |

## Deploy

Vercel auto-detects `vercel.json`. From the project root:

```bash
vercel --prod
```

Or push to a Vercel-connected GitHub repo and it deploys on commit.

## Endpoints reference

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/login` | — | Email + password → session token |
| `POST` | `/api/auth/logout` | session | Invalidate this session |
| `POST` | `/api/auth/logout-all` | session | Invalidate all sessions for the current user |
| `GET` | `/api/auth/me` | session | Current user record |
| `POST` | `/api/bookings` | — | Public booking submission |
| `GET` | `/api/bookings` | session | List all bookings (admin) |
| `PATCH` | `/api/bookings/<id>` | session | Edit booking |
| `DELETE` | `/api/bookings/<id>` | session | Delete booking |
| `POST` | `/api/contact` | — | Public contact-form submission |
| `GET` | `/api/users` | session | List staff |
| `POST` | `/api/users` | session | Create staff |
| `PATCH` | `/api/users/<id>` | session | Edit staff (incl. password reset) |
| `DELETE` | `/api/users/<id>` | session | Delete staff (refuses self-delete) |
| `GET` | `/health` | — | Health check |

## Security checklist (don't ship without)

- [ ] `SECRET_KEY` set in Vercel, not committed to repo
- [ ] `ADMIN_PASSWORD` rotated after first login
- [ ] CSP allowlist updated if any third-party scripts were added (`apply_response_policy()` in `api/index.py`)
- [ ] HTTPS enforced (Vercel default — verify domain config)
- [ ] All admin-side `innerHTML` interpolations pass through the attribute-safe `esc()` helper (see `admin-dashboard` module)
- [ ] No bearer tokens in URLs — file download endpoints use the signed-link two-step flow
