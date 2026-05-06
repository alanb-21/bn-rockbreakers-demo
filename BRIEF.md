# BRIEF.md — B&N Rockbreakers Brand Hub Demo

## Project context

This repo is a **demo build** for cold-pitching B&N Rockbreakers Ltd — a 20+ year family-run rockbreaker sale/hire/repair business in Mallow, Co Cork. The demo is a reimagined brand hub site at `bnrockbreakers.ie`, sent unsolicited to William and Daniel Noonan as a sales artefact (same playbook as the David Kelleher outreach).

Two existing Shopify e-commerce stores stay live and unchanged: `rockbreakerchisels.ie` and `bnfluidequipment.ie`. The demo links *out* to them as product pillars — it does **not** replace them. The pitch is for a hub-and-spoke architecture, not full consolidation.

Tech: Vanilla HTML + CSS + JS via the MTMN Template scaffold. No build step, no framework.

---

## Knowledge Base

| Field | Value |
|---|---|
| Business name | B&N Rockbreakers Ltd |
| Location | Blossomfort, Ballyclough, Mallow, Co Cork |
| Founded | 20+ years (exact date not public) |
| Owners | William Noonan (087-4100681), Daniel Noonan (087-7443952) |
| Phone | +353 22 27807 |
| Email | info@bnrockbreakers.ie |
| Team size | 3–5 people |
| Primary goal of site | Establish brand authority + capture hire/repair quote leads. Funnel users into the chisel and fluid equipment Shopify stores. |
| Target customer | Demolition contractors, civil engineering firms, plant hire companies, quarry operators across Munster |

**USPs**
- **Sole FRD Furukawa rockbreaker agent for Munster** — this is the headline credential
- 20+ years sale/hire/repair experience across all makes
- Hire fleet covering 1–35 ton excavators (daily, weekly, monthly rates)
- Family-run, direct phone access to owners
- Recognized supplier relationships: Gates, Donaldson, Baldwin, Maxol, MTG, ESCO, Probox

**Tone:** Industrial + authoritative. Heritage and reliability lead. Earthy, not corporate. No marketing-speak.

---

## Product pillars

1. **Rockbreakers** — sale, hire, repair (this site is the hub for this pillar)
2. **Chisels** — rockbreakerchisels.ie (existing Shopify, stays live)
3. **Fluid Equipment** — bnfluidequipment.ie (Meclube distributor, existing Shopify, stays live)

The home page must clearly route users into pillars 2 and 3 with strong external CTAs.

---

## PRD

### Pages

1. **Home** (`index.html`)
   - Hero: FRD Munster agent anchor + 20+ years credential + primary CTA "Get a Hire Quote"
   - Three product pillar cards (Rockbreakers / Chisels → external / Fluid → external)
   - Hire fleet preview (excavator-tonnage range)
   - Trust strip with supplier logos (FRD, Gates, Donaldson, Maxol, MTG, ESCO)
   - "Why B&N" section (3–4 reasons)
   - Quote CTA band

2. **Services** (`services.html`)
   - Three sections: **Sale**, **Hire**, **Repair**
   - Each section: short description, what's covered, typical use cases, CTA
   - Hire section includes fleet table (1–35 ton excavator capacities, daily/weekly/monthly)

3. **About** (`about.html`)
   - Family business story
   - The Noonan brothers
   - The Mallow yard
   - Supplier relationships timeline
   - FRD agency announcement

4. **Contact** (`contact.html`)
   - Phone (click-to-call), email (mailto), address
   - Google Maps embed (Blossomfort, Ballyclough, Mallow)
   - Quote request form (Name, Phone, Email, Equipment Type, Message)
   - Both Noonan mobile numbers visible

### Functional requirements
- Quote request form on Home, Services, Contact
- Click-to-call on every phone number (mobile)
- `mailto:` on every email
- Google Maps iframe on Contact
- External links to chisels + fluid equipment stores open in new tab

### Out of scope (demo)
- CMS / editable content
- Live e-commerce (covered by the two existing Shopify stores)
- AI chatbot (Phase 3 upsell)
- Real yard/team photography (use Unsplash placeholders, flag in pitch)
- Real form submission backend (form is visual only — Formspree or similar in Phase 1 paid build)

---

## Design Brief

**Aesthetic direction:** Premium industrial. A 20-year Munster operator that means it. Heavy display type, generous whitespace, big confident hero photography of rockbreakers in action. Dark base palette with one strong red accent (FRD's brand colour, intentionally). Think Caterpillar's recent web direction meets restrained European industrial brands — confident, not flashy.

**Colour palette**
| Token | Hex | Use |
|---|---|---|
| Background | `#1A1A1A` | Body background, dark sections |
| Surface | `#252525` | Cards, secondary surfaces |
| Text | `#F5F2ED` | Primary text |
| Muted text | `#8A8A8A` | Secondary text, captions |
| Accent | `#D4202C` | FRD red — buttons, active states, accent lines |
| Border | `#3A3A3A` | Subtle dividers |

**Typography**
- Headlines: heavy display sans — **Inter 800/900** or **Space Grotesk Bold** (use whichever the template ships with). Tight tracking, large sizes (clamp 48px → 96px on hero).
- Body: **Inter 400/500**. Generous line-height (1.6–1.7).
- Numbers/specs (e.g. "1–35 TON"): use the display weight, not body weight.

**Imagery**
- Hero: rockbreaker in action on quarry/demolition site
- About: yard, workshop, equipment close-ups
- Pillar cards: clean equipment shots on dark backgrounds
- For demo only: use Unsplash industrial/construction photography. Pick deliberately rugged shots — avoid stock-photo handshakes, generic catalogue shots, or suit-and-tie business imagery.
- Suggested Unsplash search terms: `rockbreaker`, `excavator demolition`, `quarry`, `construction equipment`, `industrial workshop`

**UI rules**
- Sharp corners (no rounded cards)
- No gradients
- No box shadows (use borders or contrast instead)
- Sticky minimal top nav, logo left, links right, mobile hamburger
- Big section breaks, full-bleed where it earns it
- Animations: minimal — fade-in on scroll is fine, nothing more

**Reference sites**
- `liscarroll-engineering.vercel.app` (your own work — same target quality)
- `caterpillar.com` (industrial heritage done right)
- Atlas Copco's main site (heavy industrial confidence)

**What to avoid**
- Bootstrap-style card grids
- The 2014 WordPress feel of the current bnrockbreakers.ie
- The stock Shopify look of the other two B&N sites
- Centred hero copy walls
- Stock photo handshakes and generic suits-in-meeting imagery
- Excessive animations

---

## Pricing (proposal stage — NOT in demo)

| Scope | One-time | Monthly |
|---|---|---|
| Brand hub rebuild only (this demo) | **€1,800** | €40/mo (hosting, SSL, support) |
| + Reskin both Shopify stores to match design system | **€4,200** | €70/mo |
| + AI quote bot for hire/repair | **€6,500** | €120/mo |

Payment: 50% deposit, 50% on delivery. 6–8 week timeline.

Pitch math: site costs €1,800. If it brings in two extra hire jobs in year one (~€4–5k average), it's paid for itself.

---

## Build order (recommended)

1. CUSTOMIZE block — palette, fonts, brand vars
2. Global layout — nav, footer, page shell
3. Home page hero + pillars
4. Home page trust strip + quote CTA
5. Services page (Sale / Hire / Repair sections)
6. About page
7. Contact page (form + map)
8. Mobile QA pass on all pages
9. Deploy to Vercel
