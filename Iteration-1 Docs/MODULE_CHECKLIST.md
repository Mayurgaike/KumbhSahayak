# Smart Kumbh Mela Platform — Module-by-Module Checklist

Build in this exact order (matches the dependency chain in `Kumbh_Mela_Agent_Build_Reference.pdf`, Section 1). Feed the agent **one module at a time** — this file's per-module section, plus `ENGINEERING_STANDARDS.md`, plus the relevant pages of the two reference PDFs. Do not move to the next module until the current one passes its checklist against actually-running code.

For every module, the acceptance bar is: **it runs, it does what's listed, nothing is a placeholder, cleanup is handled, and the agent has told you what it assumed.**

---

## Module 0 — Data Models + DB Connection
**Depends on:** nothing. Build first.

- [ ] MongoDB connection with proper pooling, retry-on-startup-failure, and graceful shutdown (closes connection on process exit)
- [ ] Mongoose schemas created for all 9 collections: `users`, `familyMembers`, `zones`, `scanLogs`, `crowdLogs`, `cameraSources`, `lostPersonCases`, `emergencies`, `volunteerReports`
- [ ] Every schema field matches the "Data Collections — Quick Field Reference" table in the Agent Build Reference exactly (names, types, refs)
- [ ] Relationships modeled with proper `ObjectId` refs, not embedded duplication (per the earlier architecture decision — `familyMembers` referenced from `users`, not embedded)
- [ ] Indexes added where lookups will be frequent (e.g. `familyMembers.digitalQR`, `zones._id` lookups, `scanLogs.familyMemberId`)
- [ ] Basic seed script for local dev (a few zones, a test admin) — clearly marked as dev-only, not runnable in production
- [ ] `.env.example` includes `MONGODB_URI`

## Module 1 — Auth + Role Guard
**Depends on:** Module 0

- [ ] JWT-based auth: register/login for visitors (self-registration only — see Module 3 for why volunteers/admins differ)
- [ ] Password hashing with bcrypt, proper salt rounds, never logging or returning password hashes
- [ ] Role guard middleware enforcing `visitor / volunteer / admin / superadmin` on every protected route
- [ ] Admin routes scoped to their own `zoneId`; superadmin routes see all zones — enforced server-side, not just hidden in the UI
- [ ] Token expiry + refresh handled; expired tokens return a clean 401, not a stack trace
- [ ] No route is accidentally left unguarded — do a full route audit at the end of this module

## Module 2 — Zones + Admin/Volunteer Hierarchy
**Depends on:** Module 1

- [ ] Zone CRUD (superadmin-only for create/delete; zone admin can update their own zone's `facilities`)
- [ ] Zone schema includes `facilities[]` (medical camp / exit / help desk) per the data model
- [ ] Admin-only volunteer account creation endpoint (no self-registration path exists for volunteers — verify this is actually enforced, not just absent from the UI)
- [ ] Zone → admin → volunteers hierarchy queryable (given a zone, list its admin and volunteers)
- [ ] This module unblocks SOS routing, crowd alert fan-out, and volunteer assignment — don't let any of those leak into this module's scope

## Module 3 — Visitor & Family Registration + Digital QR
**Depends on:** Module 1

- [ ] `POST /api/auth/register` — visitor self-registration
- [ ] `POST /api/family-members` — add family member, generates a signed digital QR (unique token) immediately
- [ ] Photo upload is optional at registration — verify nothing downstream breaks when it's absent
- [ ] Digital QR is usable immediately in-app, no dependency on physical issuance
- [ ] `POST /api/family-members/:id/issue-band` — marks `physicalBandIssued: true` at a checkpoint
- [ ] QR generation is a signed/verifiable token, not a guessable sequential ID

## Module 4 — QR Scan + Passphrase Reveal + Scan Logging
**Depends on:** Module 3

- [ ] `GET /api/scan/:qrCode` — requires volunteer/admin JWT, does NOT return personal info directly
- [ ] Passphrase auto-shown only inside the scanning volunteer/admin's own logged-in session (authenticator-style) — verify it cannot be retrieved by anyone else, including another logged-in volunteer
- [ ] `POST /api/scan/:qrCode/verify` — validates passphrase, only then reveals name + guardian contact + address
- [ ] Every scan (successful or failed) writes a `scanLogs` entry: who scanned, location, timestamp, whose QR — verify failed attempts are logged too, not just successful reveals
- [ ] Rate-limit repeated failed verify attempts on the same QR to prevent brute-forcing the passphrase

## Module 5 — Crowd Monitoring Pipeline
**Depends on:** Module 0 (independent of Modules 3–4, can be built in parallel)

- [ ] Python AI service: camera source abstraction — webcam / CCTV-RTSP / recorded file, swappable via config with no code change
- [ ] Frame sampler running at a sane interval (not every frame — this is a resource/heat concern, not just a nicety)
- [ ] YOLOv8 person detection → density calculation (low/medium/high) per zone
- [ ] `crowd:update` sent over WebSocket to Node backend; backend stores to `crowdLogs` and re-broadcasts `zone:status` to all clients (no auth required on this broadcast, per spec)
- [ ] `alert:zone` fires to admins when density crosses the high threshold — verify the threshold is configurable, not hardcoded
- [ ] **Resource cleanup:** verify `cv2.VideoCapture` handles are released if a camera source is swapped or the service restarts; verify the WebSocket client reconnects cleanly on backend restart without leaking duplicate connections

## Module 6 — Lost Person Face Matching
**Depends on:** Module 3 (registration/photo), Module 5 (AI service + WebSocket bridge)

- [ ] `POST /api/lost-person-cases` — raises a case; `referenceImage` = uploaded photo, falling back to registered photo if present
- [ ] `start_matching` sent to AI service only when a case is explicitly raised — verify matching does NOT run continuously/passively for anyone not currently the subject of an open case
- [ ] Face matching checks live camera feeds against the reference image; `match_found` returned with `zoneId`, `confidence`, timestamp
- [ ] On match: nearest admin/volunteer to that zone is alerted, plus whoever raised the case — status stays `open` (a match is a lead, not auto-resolution)
- [ ] `PATCH /api/lost-person-cases/:id` confirms found → sends `stop_matching`
- [ ] Case auto-expires (server-side timer, not client-side) after a configurable timeout if never confirmed — verify the timer is actually cleared on manual confirmation so it doesn't fire after the fact
- [ ] QR-based identification (Module 4) is verified to remain fully independent of this module — no shared state, no cross-linking

## Module 7 — SOS / Emergency
**Depends on:** Module 2 (zones + role hierarchy)

- [ ] `POST /api/sos` — type is `medical` or `police/security`; routes to that zone's type-specific admin, not directly to police/medical
- [ ] Volunteer-raised mass-incident SOS (stampede/riot/fight) skips normal routing — goes to zone admin + superadmin simultaneously, marked high-priority
- [ ] `sos:new` Socket.IO event + actual Twilio voice call + SMS — verify both fire, not just the dashboard event
- [ ] Offline handling: SOS queues locally on the client when network is unavailable, auto-retries on reconnect — test this against an actual dropped connection, not just code review
- [ ] `PATCH /api/sos/:id/assign` — assigns to a responder

## Module 8 — Navigation
**Depends on:** Module 5 (crowd data), Module 2 (zones.facilities)

- [ ] `GET /api/zones/status` (+ live via `zone:status`) — current density per zone
- [ ] Zone-status map view (color-coded) with alternative-zone suggestion via simple distance/adjacency lookup — verify this is NOT implemented as full pathfinding (out of scope per spec, would be wasted effort)
- [ ] Facility routing (medical camps/exits/help desks only) uses Leaflet + Leaflet Routing Machine + OSRM for real route guidance — this is the one place turn-by-turn is in scope
- [ ] Verify the "crowd-awareness, not turn-by-turn" distinction is actually reflected in the UI — general navigation should visibly look/feel different from facility routing, not blur into one generic maps screen

## Module 9 — Volunteer Dashboard
**Depends on:** Module 1 (auth), Modules 7–8 (SOS/case data to display)

- [ ] `POST /api/volunteers` — admin-only creation, assigns zone + role, generates credentials
- [ ] `GET /api/volunteers/tasks` — volunteer's assigned tasks (SOS cases, lost-person cases)
- [ ] Volunteer dashboard: task list, zone view, two-way notifications with admin, emergency-report shortcut
- [ ] Verify there is genuinely no self-registration path for volunteers anywhere in the client — check the route guards, not just the nav UI

## Module 10 — Phase 2 Layer (build only after MVP above is stable)
**Depends on:** all of the above

- [ ] Twilio SMS/WhatsApp alerts to zone + government officers on high density
- [ ] Historical `crowdLogs` analytics/planning view
- [ ] `POST /api/volunteers/:id/report` — public misconduct reporting by volunteer ID; admin resolve/warn/deactivate workflow

---

## Handoff template (copy per module)

```
Build Module <N> — <name> from MODULE_CHECKLIST.md.
Follow ENGINEERING_STANDARDS.md for all code quality and UI/UX rules.
Reference: Smart_Kumbh_Mela_Safety_Platform (Architecture Reference), section <X>.
Reference: Kumbh_Mela_Agent_Build_Reference, section <Y>.
Do not start any later module.
When done, report: what was built, what you assumed, what's explicitly deferred, and any cleanup/leak risk you're aware of.
```
