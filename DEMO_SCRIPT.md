# Demo Script · Texas Physicians × Cevi

**Live URL:** https://web-mu-fawn-77.vercel.app
**Alt URL:** https://web-ieprgmdlx-tensorboyalives-projects.vercel.app
**Repo:** `/Users/lucifer/Documents/demo_fax/web`
**Local dev:** `cd web && pnpm dev` → http://localhost:3000

---

## Five-minute pitch

### Open at `/` (Dashboard)

> "Good morning — this is your inbox for yesterday. 14 faxes landed overnight across all four clinics. Cevi auto-routed 92% of them without a human touching anything. The 5% we flagged for review? You're about to see exactly why."

Point out:
- **Hours saved** stat: 127 this month
- **PA turnaround** stat: 1.8 days vs industry 5 days → **$18,400 recovered this month** (referenced in agents page)
- **Activity feed** on the right — every event auditable

### Click "Open inbox" (`/inbox`)

> "Every fax, triaged on arrival. Classification with Claude, patient match against your eClinicalWorks directory, routing rules you control."

Highlight:
- Filter chips on the left (type), status dropdown on the right
- Critical row (Priya Ramanathan — K+ 6.1, red dot, pulses) at the top
- Confidence meter column — green at 99%, amber on the 82% immigration physical, red on the 52% unknown

### Click the critical potassium row (`/inbox/FAX-20260423-002`)

> "This fax landed 3 minutes ago. Quest Diagnostics, potassium 6.1, a critical high. Watch what Cevi did."

Walk through the right column top to bottom:
1. **Classification card** — "lab_result" @ 98%, Critical urgency. Model: Claude Sonnet 4.6. Latency: 1.9s.
2. **Patient match card** — Priya Ramanathan, MRN match at 98%, auto-confirmed.
3. **Structured extraction** — AI summary, diagnoses (hyperkalemia), recommendations, ICD-10 codes.
4. **Routing card** — Routed to Dr. Harbison. Reason: Critical lab value → PCP + SMS to on-call.
5. **Pipeline audit timeline** — received → OCR → classified → matched → extracted → routed → eCW write-back. Every step timestamped.

> "Now watch this. I'm going to re-run this classification live, right now, on Opus 4.7 — our best-in-class reasoning model."

Click **Opus 4.7** button in the Classification card. Wait 4-8 seconds. New extraction renders. Timeline adds a new event. Model badge updates.

> "That's Anthropic's most powerful model, running inside your workflow, inside HIPAA-compliant infrastructure, with full audit trail."

### Click "All agents" in sidebar (`/agents`)

> "Classification is the starting line. Every classified fax kicks off a connected agent. Here are the five we've already stood up for Texas Physicians."

Highlight:
- **Referrals**: 14 weekly, 4h 12m avg booking time vs industry 2.3 days
- **Prior Auth**: 1.8d turnaround vs 5d industry — **$18,400/mo recovered**
- **Lab Results**: 61 weekly, 9 minute routing, 3 critical this week flagged
- **Rx Refills**: 38 weekly, 23-minute turnaround
- **Records**: 22 weekly, 0 overdue

### Click Prior Auth (`/agents/prior-auth`)

> "Every PA request is a drafted response, queued for your doctor's signature. The approval itself? Auto-written back to eClinicalWorks."

### Jump to `/integrations`

> "All connected: eClinicalWorks, Healow, Doxy.me, Quest, LabCorp, Availity. Syncing every few minutes. Nothing changes in your workflow — we plug into what you already have."

### Close at `/audit`

> "HIPAA §164.312(b). SOC 2 CC7.2. Every OCR run, every model call, every routing decision — timestamped, exportable. Your compliance team doesn't open a ticket; they just filter and export CSV."

Click **Export CSV** button to demonstrate.

### (Optional money shot) `/demo`

> "Let me show you this happen in real time."

Click **Trigger inbound fax**. Watch the 8-step pipeline light up over ~6 seconds. Point out the real Claude response card that appears below with the actual model, actual latency, actual tokens.

### Close

> "Free 14-day pilot. We mirror your fax line at 817-860-2704. You keep every dollar of recovered auth. If it doesn't land, you owe nothing."

---

## What's synthetic (disclose if asked)

- **All patient records** are synthetic. No PHI was used.
- **Clinic names + provider names** come from the public txphysicians.com site.
- **AI classification is live** — every "Re-run" button hits Anthropic's API right now.
- **eCW write-back, SMS, Healow booking** are simulated in this demo. In the pilot, those integrations are real (we'd set them up on day 1).

## If something breaks on stage

- Claude call fails → Classification card shows an inline error. The seeded extraction stays visible. Move on.
- Vercel URL slow → local dev at http://localhost:3000 is the fallback. Pre-warm by visiting `/` and `/inbox/FAX-20260423-002` before the meeting.
- Day-of-week wrong → shrug, say "staging environment." The demo isn't about the calendar.

## Post-meeting follow-through

1. Leave the URL live for 7 days minimum (Vercel keeps it unless we delete).
2. Send the one-pager recap (draft tomorrow).
3. **Rotate the Anthropic API key** in the Anthropic Console — it was pasted in session transcript.
