# MTMN Template

Static-site scaffold for new MTMN client builds. Vanilla HTML + CSS + JS — no build step, no framework, no npm. Drop it in a repo, find/replace placeholders, ship.

The default palette is **neutral greyscale**. Brand-colour customization happens in the CUSTOMIZE block at the top of `shared.css` `:root`.

## What's in the box (core scaffold)

```
index.html       Home page — hero, stats, trust bar, services preview, testimonials, booking CTA
about.html       Page header, split image+content, values grid, mission strip, light CTA
services.html    Page header, full 6-card service grid, FAQ accordion, light CTA
contact.html     Page header, basic contact form, find-us CTA with hours/email
404.html         Branded not-found page
shared.css       Full design system — :root tokens, all components, responsive
shared.js        Nav scroll, reveals, mobile menu, mouse-follow, count-up, FAQ, carousel
images/          Drop hero.jpg, about.jpg, etc. here
modules/         Optional heavier patterns — see "Optional modules" below
```

## Optional modules

The `modules/` folder contains heavier patterns that are **not part of the default scaffold**. Pull them in only when the project needs them. Each module has its own README listing dependencies and integration steps.

| Module | Adds | Depends on |
|---|---|---|
| `backend-api/` | Python serverless API on Vercel: auth, sessions, bookings, contact, users, SQLite | — |
| `booking-calendar/` | 4-step booking wizard (service → date/time → details → confirmation) | `backend-api` |
| `admin-dashboard/` | Login + dashboard for managing bookings, messages, staff | `backend-api` |
| `project-gallery/` | Filterable portfolio grid | — |
| `before-after-slider/` | Drag-to-reveal image comparison | — |
| `team-grid/` | Team-member cards with photo, role, bio | — |
| `json-ld-schema/` | Structured-data SEO markup for the head | — |

When pulling a module in, also pull in its dependencies. See `modules/README.md` for the dependency graph.

## Use it for a new project

### Option A — clone for an MTMN demo site (with prefix convention)

The existing demo sites use a `<industry>-` prefix (e.g. `demo-index.html`, `solicitor-shared.css`). To match that convention:

```bash
cd C:/Users/drwal/Documents/GitHub
gh repo create <new-repo-name> --public --clone
cp -r Template/* <new-repo-name>/
cp Template/.gitignore <new-repo-name>/
cd <new-repo-name>

# Rename files with the prefix (replace <prefix> with e.g. dental, accountant, plumber)
mv index.html <prefix>-index.html
mv about.html <prefix>-about.html
mv services.html <prefix>-services.html
mv contact.html <prefix>-contact.html
mv shared.css <prefix>-shared.css
mv shared.js <prefix>-shared.js

# Then create a new index.html that meta-refreshes to the prefixed home
cat > index.html <<'EOF'
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta http-equiv="refresh" content="0;url=<prefix>-index.html">
<link rel="canonical" href="<prefix>-index.html">
<title>[Brand Name]</title></head><body></body></html>
EOF

# Update the <link>/<script> tags and inter-page hrefs to use the prefixed names
# (one find/replace pass: index.html -> <prefix>-index.html, etc.)
```

### Option B — flat naming (one-off client sites, agency style)

Keep the filenames as-is. `index.html` is the homepage directly. No redirect file needed.

```bash
cd C:/Users/drwal/Documents/GitHub
gh repo create <new-repo-name> --public --clone
cp -r Template/* <new-repo-name>/
cp Template/.gitignore <new-repo-name>/
cd <new-repo-name>
git add . && git commit -m "Initial scaffold from MTMN Template" && git push
```

## Customizing per project

1. **Colours** — edit the CUSTOMIZE block at the top of `shared.css` `:root`. All component CSS pulls from those tokens, so a brand swap is one edit.
2. **Type** — replace `--serif`, `--sans`, `--mono` if the brand needs different fonts. Update the Google Fonts `<link>` in each HTML head.
3. **Logo mark** — find the `<svg class="nav-logo-mark">` block in each HTML page and the matching footer SVG; swap for the brand's mark.
4. **Copy** — every placeholder is in square brackets (`[Brand Name]`, `[Tagline]`, `[Service 1]`, etc.). Find/replace pass.
5. **Phone numbers** — `+3530XXXXXXXX` and `(0XX) XXX XXX` placeholders throughout.
6. **Back-to-MTMN pill** — keep on demo deliverables, delete the `.mtmn-back` block from each page for non-MTMN client work.

## What's NOT in the template (copy from existing repos when needed)

- **Booking calendar** (3-step service → date/time → details flow): see `demo-site/demo-contact.html` and the booking-calendar CSS at the bottom of `demo-site/demo-shared.css`.
- **Project gallery with filter buttons**: see `construction-demo-site/construction-projects.html` and its `.filter-btn` / `.gallery-card` CSS.
- **Before/after slider**: see `construction-demo-site/construction-shared.js` (`.ba-slider` block).
- **Team grid with bios**: see `demo-site/demo-about.html`.
- **JSON-LD schema markup**: see `mtmn-digital/index.html` head — adapt the `Organization` / `LocalBusiness` blocks.

## Conventions (don't fight these)

- Avoid inline styles except for tiny one-offs (matches the existing repos).
- Add new JS as an IIFE in `shared.js` with an early-return guard so pages without the relevant DOM cost nothing.
- Add new CSS tokens to `:root` rather than hard-coding values inside components.
- Reveal animations: add `.reveal` (and optionally `.reveal-delay-1/2/3/4`) to anything that should fade up on scroll.
- Stat count-up: put the number in the first text node, with `data-count="<number>"` on the parent; suffix in `<em>`.

## Deploy targets

- **GitHub Pages** — push to `main`, enable Pages in repo settings, point at root. Done.
- **Vercel** — drag-drop or `vercel` CLI from the repo root. No `vercel.json` needed for plain static.
- For a Vercel project that also needs a backend, copy `mtmn-digital/vercel.json` and `api/index.py` patterns.
