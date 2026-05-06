# Module: admin-dashboard

Standalone admin/employee login + dashboard. Used by the practice owner / staff to manage bookings, contact messages, and other staff accounts. Lives at `/login.html` and `/dashboard.html`.

## What it adds

- **Login page** — email + password, posts to `/api/auth/login`, stores session in `sessionStorage` (cleared on tab close).
- **Dashboard shell** — top bar with brand + user + logout, left-rail tabs (Bookings / Messages / Users), main panel.
- **Bookings panel** — sortable list of all bookings; click a row to see detail; edit all fields, delete, change status.
- **Messages panel** — inbox of contact-form submissions; mark-read; delete.
- **Users panel** — list of staff accounts; add new; edit (incl. password reset); delete; "log out everywhere" on own row.
- **Attribute-safe `esc()`** — escapes `& < > " ' \` / =` in addition to the basic three. **Every `innerHTML` interpolation must pass through this.** A loose escaper is stored XSS in attribute contexts (`<a href="...">`).

## Dependencies

- **`backend-api`** — required. The dashboard does nothing without it.

## Files to copy

```
modules/admin-dashboard/login.html       →  <project>/login.html
modules/admin-dashboard/dashboard.html   →  <project>/dashboard.html
modules/admin-dashboard/dashboard.css    →  <project>/dashboard.css        (separate from shared.css)
modules/admin-dashboard/dashboard.js     →  <project>/dashboard.js         (separate from shared.js)
```

The dashboard intentionally has its own CSS and JS files — it's a different visual context (denser, utility-led) and shouldn't bloat the public-facing `shared.css`.

If you're using `vercel.json` from the backend-api module, add routes:

```json
{ "src": "/login",     "dest": "/login.html" },
{ "src": "/dashboard", "dest": "/dashboard.html" }
```

## Customization

- **Brand mark** — replace the SVG in the top bar of `dashboard.html` and `login.html`.
- **Tab list** — `<nav class="dash-tabs">` in `dashboard.html`. Add/remove panels here and add a corresponding `<section data-panel="...">`.
- **Status options** — booking statuses are hardcoded in `dashboard.js` (`STATUSES` constant). Change to suit the workflow.

## Security checklist (don't ship without)

- [ ] Initial admin password (`ADMIN_PASSWORD` env var on backend) rotated after first login
- [ ] Login over HTTPS only (Vercel default)
- [ ] Every `innerHTML` interpolation in the dashboard passes through `esc()`
- [ ] If you add a new third-party script (analytics, error reporter, etc.), update the CSP allowlist in `apply_response_policy()` in `api/index.py`
- [ ] No bearer tokens placed in URLs — for any download endpoint, use the signed-link two-step flow
