# Cevi · Fax Intelligence for Texas Physicians Group

Demo application showing Cevi's fax-management & downstream-agent workflow for a multi-location primary care practice running eClinicalWorks.

**Live demo:** https://web-mu-fawn-77.vercel.app

## What's inside

| Path | Purpose |
|---|---|
| `web/` | Next.js 16 + Tailwind v4 + TypeScript app (the demo) |
| `web/supabase/schema.sql` | Postgres schema for uploaded faxes, events, acknowledgements, patient messages |
| `design-system.md` | The Cevi design system — tokens, typography, components |
| `DEMO_PLAN.md` | Original six-hour build plan |
| `DEMO_SCRIPT.md` | Five-minute client pitch, click-by-click |
| `MASTER_UPGRADE_PLAN.md` | Follow-on upgrade plan (Supabase, upload, hardening) |
| `cevi logo.svg` | Cevi wordmark |

## Run locally

```bash
cd web
cp .env.local.example .env.local     # fill in real values
pnpm install
pnpm dev                              # → http://localhost:3000
```

Required env vars in `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-…
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
```

## First-run Supabase setup

The uploaded-fax feature persists to Supabase. Before using `/upload`:

1. Open the Supabase dashboard → **SQL Editor** → **New query**
2. Paste the contents of `web/supabase/schema.sql`
3. Click **Run**
4. Verify with `cd web && node scripts/check-supabase.mjs`

Without the schema, the app still works — upload reads Claude and shows the result, but the fax is not persisted. The UI surfaces this clearly.

## Routes

| Route | Purpose |
|---|---|
| `/` | Dashboard: KPIs, weekly throughput, activity feed, agent strip |
| `/inbox` | All faxes (seed + uploaded). Filters, clinic column, SLA timers. |
| `/inbox/[id]` | Fax detail: preview, live re-classification (Base/Pro/Max), patient match, extracted fields, routing, audit timeline. Critical-result banner + "Draft patient message" where relevant. |
| `/upload` | Upload a PDF / image / paste OCR — classified live by Cevi AI, persisted to Supabase. |
| `/agents` | The 5 connected agents (Referrals, Prior Auth, Lab Results, Rx Refills, Records). |
| `/agents/[slug]` | Per-agent queue + CSV pilot-report export. |
| `/agents/[slug]/workflow` | Workflow rules editor (rule toggles, auto-route, escalation chain, version log). |
| `/review` | Low-confidence faxes waiting for human disposition. |
| `/audit` | Full event log, filterable, CSV-exportable. |
| `/integrations` | eClinicalWorks, Healow, Doxy.me, Quest, LabCorp, Availity — connected + available. |
| `/settings` | Team, thresholds, notifications, compliance (stubbed). |
| `/demo` | Live pipeline stage — "Trigger inbound fax" watches the 8-step flow run in real time with a real Claude call. |

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack default) + React 19.2
- **Styling:** Tailwind v4 + Cevi design tokens (see `design-system.md`)
- **AI:** Anthropic SDK (Claude Opus 4.7 / Sonnet 4.6 / Haiku 4.5) — branded internally as **Cevi Base / Pro / Max**
- **Data:** Supabase Postgres (uploaded faxes + events + acknowledgements + patient messages) with permissive-for-anon RLS for the demo. Seed data stays in-memory for speed.
- **Deploy:** Vercel

## Security

- Rate limiters on every server action (15/min classify, 8/min upload, 6/min draft)
- Error messages sanitized — no raw SDK errors leak to the client
- All secrets env-only; `.env.local` gitignored
- RLS enabled on every table; publishable (anon) key is safe in the browser
- No service-role key is ever loaded client-side

## Credits

Built for a Texas Physicians Group pitch. Synthetic patient data throughout — no real PHI.
