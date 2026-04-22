# Texas Physicians Group × Cevi — Fax Intelligence Demo

**Client:** Texas Physicians Group (txphysicians.com)
**Demo lead:** Cevi
**Timebox:** 6 hours
**Delivery target:** tomorrow morning
**Stack:** Next.js 16 (App Router) + Tailwind v4 + Cevi design tokens + TypeScript
**Deploy:** Vercel preview URL (recommended) or local
**Author:** dev@cevi.ai — 2026-04-23

---

## 1. Who we are pitching

### 1.1 The client, in their own words

Texas Physicians Group is a **family practice + internal medicine group** across the Dallas–Fort Worth metroplex.

| Signal | Value |
|---|---|
| Locations open | Arlington, Pantego, Grand Prairie, River Oaks |
| Coming soon | Azle, Watauga, Bedford, Irving, Lake Dallas (→ **9 total**) |
| Named providers | Todd Thang Nguyen, MD · Dr. Alicia Harbison |
| Services | Adult primary care, peds, labs, imaging (US/X-ray/DEXA), COVID testing, immigration physicals, allergy, Coumadin, DOT physicals, telehealth, infusion, exec health, corporate wellness, durable medical equipment |
| Stated tech stack | **eClinicalWorks** patient portal (mycw128.ecwcloud.com), **Healow** scheduling, **Doxy.me** telehealth |
| Contact | Main 817-860-2700 · **Fax 817-860-2704** |
| Primary address | 1119 W. Randol Mill Rd. Suite 103, Arlington, TX 76012 |
| Taglines | "An Immaculate Care of You, for You" · "Welcome to a Healthy Lifestyle" |

### 1.2 What "the client asked for categorization" really means

Multi-location PCP groups with a central fax line for 9 clinics drown in inbound documents. The stated ask ("categorize our faxes") is the tip of an operational iceberg — the **actual** pain:

1. **Unmatched faxes queue** — front desk manually looks up patient by name + DOB from a fax header that may be blurry.
2. **Routing latency** — a STAT lab result sits in the general fax inbox for hours before the right nurse sees it.
3. **Prior auth bleed** — payer requests timing out because nobody saw the fax.
4. **Referral leakage** — inbound referrals from cardiology, ortho, GI land in a pile, never get booked, the referring provider never hears back.
5. **Rx refill chaos** — pharmacy refill faxes hit the same inbox as records requests.
6. **Audit panic** — OCR + chart match + human disposition is nowhere in one trail for compliance.

### 1.3 The Cevi "10x" angle

The `cevi.ai/workflows/fax-management-document-classification` page is explicit: classification is the **entry point** to 5 connected agents.

```
                         ┌─▶ Referral Management & Tracking
Fax ingest  ─▶ OCR  ─▶   │
              Classify   ├─▶ Prior Authorization Processing
              Patient    │
              match  ─▶  ├─▶ Medical Records Request Processing
              Extract    │
              Route ─▶   ├─▶ Prescription Routing & Refill Mgmt
                         │
                         └─▶ Lab Results Delivery & Follow-Up
```

**What we sell in the demo:** not "we sort your faxes" but "every fax triggers the right downstream workflow, writes to eClinicalWorks, notifies the right provider, and leaves an audit trail — automatically, in under 90 seconds, 24/7."

Page verbatim claims we can stand behind:
- **95%+ classification accuracy** (below-threshold → manual queue)
- **HIPAA / SOC 2 Type II / BAA on all plans / 99.9% uptime**
- **148+ integrations, 50+ EHRs, including eClinicalWorks** ← the client's actual EHR
- **Visual workflow builder · No-code AI automation**
- **6-step pipeline**: receive → OCR + classify → patient match → field extract → chart attach + route → provider notify

---

## 2. Demo narrative (5-minute client pitch)

**Minute 0–1 · The pain they already feel.**
"You have 9 clinics and one fax number at each. Yesterday alone, {N} faxes landed. Of those, {X} needed a human to decide what it is, who it's for, and where it goes. Cevi removes that human step for the 95% that's routine and flags the 5% that isn't."

**Minute 1–2 · Live inbox walk-through.**
Open the Fax Inbox. Show incoming fax from Baylor Scott & White Cardiology. Classified as "Specialist consultation report" with 97% confidence. Patient auto-matched to "Maria Gonzalez, DOB 1962-07-14" at 99% confidence. Extracted fields: referring provider, diagnosis, recommendations. Routed to Dr. Nguyen's results inbox with a notification.

**Minute 2–3 · The 10x — connected agents.**
Click into Connected Agents view. Show 5 cards live:
- Referrals (14 this week, avg booking time 4h 12m)
- Prior Auth (9 open, avg turnaround 1.8 days — compare industry 5 days)
- Medical Records (22 fulfilled, 0 overdue)
- Rx Refills (38 routed to pharmacy queue)
- Lab Results (61 delivered, 3 flagged critical → SMS to on-call nurse)

**Minute 3–4 · Compliance + write-back.**
Open the Audit Trail for any fax. Every OCR run, classification decision, match, route, and human action timestamped and user-stamped. Show the eClinicalWorks write-back card: "Attached 6-page PDF to chart. Added encounter note. Completed in 42s."

**Minute 4–5 · ROI dashboard + close.**
Home dashboard KPIs: **3,120 faxes/month processed**, **94% auto-routed**, **$42K/month recovered from prior auth leakage**, **127 FTE hours/month saved**. Close with "free pilot, we mirror your fax line for 14 days, and you keep every dollar of recovered auth."

---

## 3. Demo surfaces — what we actually build

| # | Surface | Purpose in pitch | Complexity |
|---|---|---|---|
| 1 | Dashboard home (`/`) | ROI headline, KPI tiles, live activity feed | M |
| 2 | Fax Inbox (`/inbox`) | List of incoming faxes, classification badges, patient match status, SLA timers, filter chips | **H** |
| 3 | Fax Detail (`/inbox/[id]`) | PDF preview pane, OCR text panel, extracted fields, patient match card, routing panel, audit timeline | **H** |
| 4 | Connected Agents (`/agents`) | 5 agent cards with live counters, drill-in to each queue | M |
| 5 | Patient Match Review (`/review`) | Queue of low-confidence matches needing human disposition | S |
| 6 | Audit Trail (`/audit`) | Filterable log, exportable CSV | S |
| 7 | Integrations (`/integrations`) | eClinicalWorks + Healow + Doxy.me shown "connected", others shown available | S |
| 8 | Demo driver (`/demo`) | Hidden URL that triggers the "live" fax to land during the pitch | S |

Legend: S = 30-45 min, M = 60-75 min, H = 90-120 min.

---

## 4. Execution plan — 6 one-hour sessions

### Session 1 · Scaffold + design tokens (60 min)
**Needs:**
- Next.js 16 + React 19 + Tailwind v4 scaffold with `--turbo`
- DM Sans + EB Garamond via `next/font/google`
- `globals.css` from design-system.md §12.1 verbatim
- `src/lib/utils.ts` (`cn` helper), `src/components/ui/{button,card,badge,input}.tsx`
- `AppShell` layout: 240px sidebar (Cevi wordmark, nav items, org switcher stub) + 64px topbar
- Seed data at `src/data/*.ts` — faxes, patients, providers, agent counters

**Outputs:**
- Running localhost with sidebar + empty routes
- `/` renders a placeholder "Good morning, Texas Physicians" H1 in EB Garamond 28px, terracotta accent verified

### Session 2 · Fax Inbox + seed data (60 min)
**Needs:**
- 12-15 seeded faxes spanning all 5 document types (referral, lab, prior auth, rx, records)
- Table with columns: Received, From, Type badge (Desert Mirage colors), Patient match, Confidence, Status, Route, SLA timer
- Filter chips by type + status
- Status badges: Auto-routed (jade), Needs review (amber), Failed match (accent), Routed (sand)

**Outputs:**
- `/inbox` fully interactive, rows clickable → `/inbox/[id]`
- KPI strip above table: today's counts, 7-day auto-route %, critical count

### Session 3 · Fax Detail + extraction UI (90 min)
**Needs:**
- Two-pane layout: left = synthetic fax image preview (we generate 3-5 realistic-looking PDFs/images), right = extracted fields + actions
- "OCR text" collapsible panel with real-looking raw text
- Patient match card with 3 candidates + confidence bars, "Confirm" / "Override" buttons
- Extracted fields table: Sending provider, Date, Document type, Diagnosis (if applicable), Recommendations, Urgency, MRN
- Routing panel: suggested destination (inbox owner + reason) + override dropdown
- Audit timeline (vertical): Received → OCR → Classify → Match → Extract → Route → Write-back → Notify
- "Accept & route" primary CTA

**Outputs:**
- `/inbox/[id]` end-to-end for a specialist consult fax (hero demo path)
- Minimum 3 faxes polished deep, rest show "last viewed" state

### Session 4 · Connected Agents (60 min)
**Needs:**
- 5 agent cards, each with: icon box (accent/teal/jade etc.), title, subtitle, live counter (last 7d), 2-metric row (e.g., "Avg turnaround · 1.8d" + "Open · 9"), drill-in link
- Individual agent pages (stubbed — single shared template) showing that agent's filtered fax queue

**Outputs:**
- `/agents` with 5 cards + drill-in to Referrals page fully working

### Session 5 · Dashboard home + Integrations + Audit (60 min)
**Needs:**
- Home: 4 stat cards (serif numbers), 7-day throughput chart (simple sparkline or bar), activity feed (last 10 events), "Connected Agents" summary strip
- Integrations page: eClinicalWorks + Healow + Doxy.me cards marked Connected (jade), ~6 more Available
- Audit: table with filters, export CSV button (can be stub that downloads seed data)

**Outputs:**
- `/`, `/integrations`, `/audit` all demo-ready

### Session 6 · Demo driver + polish + deploy (60 min)
**Needs:**
- `/demo` route with a "Trigger inbound fax" button that adds a new row to inbox with animated arrival
- Favicon, OG image, page titles
- Deploy to Vercel (preview URL OK)
- Run-through with demo script taped to the side of the screen

**Outputs:**
- Shareable Vercel URL
- Rehearsed 5-minute pitch

**Buffer:** 60 min reserved for fixes and one polish pass.

---

## 5. Data strategy

All synthetic, HIPAA-safe (no real PHI). Names from a canned list, DOBs in 1940–1995, MRNs MRN-XXXXXX format. We **lean into the client's reality**: their actual provider names (Nguyen, Harbison), clinic locations (Arlington / Pantego / Grand Prairie / River Oaks), EHR (eClinicalWorks), fax number (817-860-2704) — it makes the demo feel pre-built-for-them.

Sample fax types to seed:
1. Specialist consult — "Baylor Scott & White Heart & Vascular — Consult Report" → Dr. Nguyen
2. Lab result — "Quest Diagnostics — CBC, BMP, HbA1c (critical K+ 6.1)" → Dr. Harbison, critical flag
3. Prior auth request — "BCBS Texas — PA request for MRI lumbar spine" → auth queue
4. Referral (inbound) — "Arlington Orthopedic — Referral to PCP for shared care" → Referrals
5. Records request — "Attorney's office — medical records subpoena" → Records queue
6. Rx refill — "CVS Pharmacy — Metformin 1000mg refill auth" → Rx agent
7. Specialist consult — "UT Southwestern GI — Colonoscopy report" → Dr. Nguyen
8. Lab result — normal panel, routine routing
9. Immigration physical form — "USCIS I-693" → custom queue (hat tip to their actual service line)
10. Low-confidence OCR (intentionally noisy) — lands in review queue, demo the human-override path

---

## 6. Open questions for the user (answered via AskUserQuestion)

1. **AI layer** — real Claude/OpenAI call for classification and extraction on the 3 hero faxes, or 100% pre-baked mocks?
2. **Data layer** — Supabase with a tiny `faxes` + `patients` + `events` schema, or in-memory seed only?
3. **Deployment** — Vercel preview URL (recommended so the client can click tonight) or localhost-only?
4. **Scope trade-off** — depth-first (3 surfaces nailed, 2 stubbed) or breadth-first (all 8 surfaces at 70%)?

## 7. What we need from you (materials)

| Item | Why | Blocking? |
|---|---|---|
| Anthropic API key **or** OpenAI key | Real AI extraction on hero faxes (if we go hybrid) | Only if answer to Q1 = real AI |
| Supabase project URL + anon key + service role | Real persistence | Only if Q2 = Supabase |
| Vercel account + team slug | Deploy | If Q3 = Vercel |
| Logo for Texas Physicians (or OK to use their favicon) | Co-branded header | Nice-to-have |
| Any real sample fax (redacted) from the client | 1 extra polish fax in the demo | Nice-to-have |
| Confirmation of client's legal/branded name on the site | They list "Texas Physicians Group" — is that correct? | Blocking before deploy |

---

## 8. Risks and what we cut first if we run long

| Risk | Mitigation | Cut-first fallback |
|---|---|---|
| Real OCR/PDF rendering eats time | Use 3 pre-rendered PNG "fax" mocks + hand-authored OCR text | Skip PDF preview — show OCR text only |
| Supabase setup friction | Start in-memory, migrate later | Stay in-memory through demo |
| Vercel deploy issue with Tailwind v4 | Deploy early (Session 1) to catch drift | Fall back to localhost with screen share |
| Animation polish eats the last hour | Hard stop on motion, use only the 5 design-system transitions | Kill demo-driver animation, trigger via refresh |
| Audit log drift | Generate events from a single deterministic script | Hide Audit page from nav if broken |

---

## 9. Post-demo follow-through

- Leave the Vercel URL active for 7 days with client-only password
- Send a one-page recap with the **free 14-day pilot** offer from the Cevi page
- Capture any in-meeting feedback against this doc and ship a v2 within 48h

---

*This plan is the source of truth for the 6-hour build. If we drift, we drift consciously — note it here, don't just do it.*
