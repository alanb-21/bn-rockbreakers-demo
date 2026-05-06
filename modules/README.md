# Optional modules

These are heavier patterns that are NOT part of the default scaffold. Don't pull them in unless the project needs them. When you do pull one in, you must also include its declared dependencies — modules are designed to be coherent units.

## Module list

| Module | What it adds | Depends on |
|---|---|---|
| `backend-api/` | Python serverless API on Vercel — auth, sessions, bookings, contact form, user CRUD, SQLite storage | — (foundation) |
| `booking-calendar/` | Multi-step booking UI: service → date/time → details → confirmation | `backend-api` (to persist bookings) |
| `admin-dashboard/` | Employee/admin login + dashboard for managing bookings, clients, users | `backend-api` |
| `project-gallery/` | Filterable project grid for portfolio pages | — |
| `before-after-slider/` | Drag-to-reveal image comparison slider | — |
| `team-grid/` | Team-member card grid with photo, role, bio, qualifications | — |
| `json-ld-schema/` | Structured-data schema markup for SEO (`Organization`, `LocalBusiness`, etc.) | — |

## Dependency graph

```
backend-api  ←─┬─  booking-calendar     (calendar without backend doesn't persist)
               └─  admin-dashboard      (dashboard requires auth + storage)

(everything else is standalone, front-end only)
```

## How to use a module

Each module folder has its own README with:
- **What it adds** — one-paragraph description
- **Files to copy** — exact path mapping into the destination repo
- **Integration steps** — markup to drop in, CSS to append, JS to append, edits to existing files
- **Customization** — per-project knobs (durations, slot length, role names, etc.)

General flow when you (or Claude) decide to include a module:

1. Read the module's `README.md` first.
2. If it has dependencies, pull those in first (recursively).
3. Copy files into the destination repo per the README's path mapping.
4. Append any CSS/JS to `shared.css` / `shared.js` (modules separate the additive bits clearly).
5. Wire up DOM and run through the integration checklist.

## Adding new modules

If you build a recurring component during a project (e.g. a pricing comparison table, a multi-location selector), pull it back into `modules/` so it's available for next time. Match the existing module README structure.
