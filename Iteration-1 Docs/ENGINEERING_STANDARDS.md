# Smart Kumbh Mela Platform — Engineering Standards

This document is a standing brief for the coding agent. It applies to **every module**, on top of whatever the current module checklist says. Paste this once at the start of a session, then reference it ("follow ENGINEERING_STANDARDS.md") in every module prompt instead of re-typing it.

Stack is locked: React + Tailwind (frontend) · Node.js + Express + Socket.IO (backend) · MongoDB + Mongoose · Python + FastAPI + YOLOv8 + OpenCV + face_recognition/DeepFace (AI service) · Twilio · Leaflet + OSRM. Do not suggest alternatives.

---

## 1. Code quality — non-negotiable

- **No placeholders.** No `// TODO`, no `throw new Error("not implemented")`, no stub functions that return mock data pretending to be real. If something is genuinely out of scope for this module, say so in a written note — don't leave dead code pretending to be a feature.
- **No dead/unused code.** No unused imports, unused variables, commented-out blocks left "just in case," no console.log left over from debugging.
- **No silent scope-filling.** If the spec is ambiguous, the agent must ask or state its assumption explicitly in a short note before writing code — never guess silently and move on.
- **Every async operation is handled.** Every `await`/Promise has a try/catch or `.catch()`. Every Express route handler passes errors to a central error-handling middleware — no swallowed errors, no unhandled promise rejections.
- **Input validation on every endpoint.** Use a schema validator (e.g. Zod or Joi) on all request bodies/params before they touch a controller. Reject bad input with a proper 4xx and a clear message — don't let it fall through to a DB error.
- **No memory/resource leaks:**
  - Every WebSocket/Socket.IO listener registered has a matching cleanup on disconnect.
  - Every `setInterval`/`setTimeout` is cleared when its owning context ends (case auto-expiry timers, offline-queue retry timers, etc.).
  - Every DB connection/cursor is properly closed or pooled — no ad-hoc `new MongoClient()` per request.
  - React: every `useEffect` that subscribes (socket listener, interval, event listener) returns a cleanup function. No state updates after unmount.
  - Python AI service: release camera/video capture handles (`cv2.VideoCapture.release()`) and GPU tensors explicitly when a stream or matching job stops; don't let `start_matching` jobs run forever if `stop_matching` isn't received — always enforce the configurable timeout server-side, not just client-side.
- **No hardcoded secrets or config.** API keys, DB URIs, Twilio credentials, JWT secret — all from `.env`, never committed, always with a `.env.example` kept up to date.
- **Consistent error shape** across the whole API: `{ error: { code, message } }`. Don't mix formats between routes.
- **Logging, not console.log soup.** Use a real logger (pino/winston) with levels. No `console.log` in committed backend code.
- **Every collection/schema matches the data model in the reference docs exactly** — field names, types, and relationships. If the agent thinks a field should change, it flags it, it doesn't quietly rename things.

## 2. Testing & self-verification (per module)

Before a module is marked done, the agent must:
1. Run it locally and demonstrate the happy path actually works (not just "it should work").
2. Check each item in that module's checklist (see `MODULE_CHECKLIST.md`) against the real running code.
3. Report, in plain language: what was built, what was assumed, what is explicitly NOT done yet (and why — e.g. "Phase 2").
4. Flag any leak/cleanup risk it's aware of, even ones it didn't fully solve.

Never accept "looks good" from the agent without this report. Ask for it explicitly if it's skipped.

## 3. Git & structure discipline

- Follow the repo layout in `Kumbh_Mela_Agent_Build_Reference.pdf` exactly (`client/`, `server/`, `ai-service/`, `docs/`).
- One commit per completed, working module — not one giant commit at the end.
- Commit messages describe what changed functionally, not "update files."

---

## 4. UI/UX Design System — avoid the generic AI look, on purpose

The generic AI-generated look to actively avoid: warm cream background with a terracotta/clay accent; SaaS cards with identical rounded corners and the same soft grey shadow on everything; tracked-out ALL-CAPS eyebrow labels above every heading; a stray "→" tacked onto every button; numbered 01/02/03 badges on content that isn't actually a sequence. None of that here.

**This platform is closer to an emergency-operations / command-center product than a marketing SaaS product**, with a separate lighter visitor-facing surface. Design for that reality, not for a landing page.

### 4.1 Two distinct visual registers, one system

- **Admin / Super Admin dashboard** — a control-room surface. Dense, high-contrast, built for someone scanning many zones at once under time pressure. Not soft, not playful.
- **Visitor / Volunteer mobile-first app** — used outdoors, in daylight, by people who may be stressed or moving. Higher contrast, larger touch targets, fewer competing colors, calmer.

Both share the same token system (colors, type scale, spacing) below — the *density* and *tone* differ, not the underlying palette.

### 4.2 Color — semantic, not decorative

Status colors here carry real meaning (crowd density, SOS state) — they must never be reused as generic UI accents elsewhere in the product, or they stop communicating anything.

Base palette (admin/control surface):
- `--bg-base: #0F1319` — near-black slate, not pure black, not navy-cliché
- `--bg-panel: #171C24` — panel/card background, one step up from base
- `--border-hairline: #2A3140` — hairline dividers, not drop shadows
- `--text-primary: #E8EAED`
- `--text-muted: #8891A0`
- `--accent-primary: #3E7CB1` — a desaturated steel-blue, used for primary actions/links only, not decoration

Visitor-facing surface (lighter, higher outdoor-contrast):
- `--bg-base-light: #F7F8FA`
- `--bg-panel-light: #FFFFFF`
- `--text-primary-light: #14181F`
- `--accent-primary-light: #2C6690`

Semantic status colors (used **only** for what they mean — density, SOS state, scan validity — never for a "featured" badge or a marketing highlight):
- Density Low: `#3E8E5B`
- Density Medium: `#C98A2E`
- Density High/Critical: `#B4402A`
- SOS / Emergency active: `#C4324B` (distinct from density-high red — don't reuse the same hex, they mean different things and must be visually distinguishable when both appear together on a dashboard)
- Success/confirmed (e.g. "person found," "scan verified"): `#3E8E5B`
- Neutral/pending: `#8891A0`

Do not introduce a second accent color "for variety." One primary accent per surface, status colors reserved strictly for status.

### 4.3 Typography

- UI/body: **Inter** or **IBM Plex Sans** — one family, used consistently for labels, nav, buttons, body copy.
- Data/numeric (crowd counts, timestamps, coordinates, zone IDs, IDs on QR/wristbands): use **tabular figures** (`font-variant-numeric: tabular-nums`) so numbers in tables/dashboards align — this is a functional choice for this data-dense product, not decoration. A monospace face (e.g. IBM Plex Mono) is justified specifically for these numeric/ID fields, not for general body text.
- No all-caps labels. Sentence case throughout, including buttons and section headers.
- No single-word accent styling in headings (no bolding/italicizing one word for "punch").

### 4.4 Layout & structural devices

- Admin dashboard: flat panels with hairline borders (`--border-hairline`), sharp or minimally rounded corners (2–4px, not the uniform 12–16px SaaS-card radius), information-dense grid — this is a console, not a brochure.
- Visitor app: slightly more rounded (8px) touch targets, generous spacing, since it's touch-first and used under stress.
- No numbered 01/02/03 markers unless the content is a literal sequence (e.g. onboarding steps for a new volunteer — that's a real sequence; a features list is not).
- No decorative gradient washes. Zone/density visualization uses actual data-driven color (the semantic status colors above), not a gradient for visual interest.
- Motion: only on state change that the user caused or needs to notice — a zone flipping to high-density, an SOS arriving, a scan verifying. No hover-lift animations on every card, no fade-slide-up entrance on every section.

### 4.5 Copy tone

- Plain, active voice, from the end user's perspective: "Scan verified" not "Verification successful"; "Raise SOS" not "Submit emergency request."
- Errors state what happened and what to do next, in the interface's voice — never "Oops!" or an apology.
- A button's label matches the resulting state/toast exactly (button says "Confirm found" → resulting status says "Found," not "Resolved").

### 4.6 Before accepting any UI from the agent

Ask it to state, in one line: what makes this screen's design specific to a crowd-safety/command-center product rather than a generic dashboard template. If it can't answer that, send it back.
