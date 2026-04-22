# MASTER UPGRADE PLAN · Texas Physicians × Cevi

**Synthesis of 10 skills/agents:** supabase, claude-api, code-reviewer, security-reviewer, healthcare-reviewer, architect, ui-ux (via brand-reviewer), plus existing design-system.md, DEMO_PLAN.md, and the Cevi logo SVG.

**Author:** dev@cevi.ai · **Generated:** 2026-04-23 · **Timebox:** remaining hours before morning demo

---

## 0. Executive punch-list (what the 4 reviewers found)

### CRITICAL — will fail or embarrass on stage
| # | Finding | Source | Session |
|---|---|---|---|
| C1 | Model names (Claude Opus 4.7, Sonnet 4.6, Haiku 4.5) leak in **5 places** | code-reviewer | S8 |
| C2 | "Edit workflow" + "Run pilot report" are dead buttons on every agent page | code-reviewer + user | S8 |
| C3 | No way for the client to run their own fax through the system | user + code-reviewer | S11 |
| C4 | Public server action has **no rate limit** — anyone could burn the $5K Anthropic credit | security-reviewer | S13 |
| C5 | Critical K+ 6.1 fax has **no acknowledgement / callback workflow** — patient-safety gap any MD will catch | healthcare-reviewer | S12 |

### HIGH — clinically or commercially wrong
| # | Finding | Fix | Session |
|---|---|---|---|
| H1 | `I25.10 + I20.9` is a coding contradiction | Use `I25.110` (CAD *with* stable angina) | S8 |
| H2 | `K63.5` is for non-neoplastic polyps — adenoma is `D12.5` | Swap | S8 |
| H3 | Thyroid panel (TSH 0.18, FT4 2.8) tagged `urgent` is overcalled | Downgrade to `routine` with "abnormal — PCP review" | S8 |
| H4 | CPT codes on consult are *recommendations*, not procedures performed | Relabel section "Suggested future orders" | S8 |
| H5 | Missing Clinic column in inbox — 4-clinic group lives by which clinic | Add to `InboxTable.tsx` | S8 |
| H6 | DemoStage crashes with non-null assert if hero fax ID drifts | Add guard | S8 |
| H7 | classify.ts leaks raw SDK error messages | Sanitize to generic string | S8 |
| H8 | No `.env.example` / doc for swapping Supabase projects | Add file + README section | S13 |

### HIGH-VALUE ADD — the "wow" moments
| # | Feature | Rationale | Session |
|---|---|---|---|
| W1 | Upload a fax (PDF / image / text-paste) → Cevi classifies it live | Direct user ask; healthcare-reviewer also flagged this | S11 |
| W2 | "Draft patient message" button on any lab/consult fax — 4th-grade reading level, ready to send | Healthcare-reviewer: biggest missing wow moment. PCPs spend 30-60 min/day on these. | S12 |
| W3 | "Acknowledge critical result" modal with callback timer | Patient-safety theater that happens to be real patient safety | S12 |
| W4 | Real Supabase persistence so refreshes survive + client can see writes | User ask + architect | S9, S10 |
| W5 | Real Cevi logo wordmark in sidebar (svg the user provided) | Brand alignment | S8 |

---

## 1. Internal product model names (replace all external Claude references)

**Never expose Claude / Anthropic / model IDs in the UI.** Speak in Cevi product tiers:

| Internal tier | Cevi product name | When we use it |
|---|---|---|
| Haiku 4.5 | **Cevi Base** | Trivial classification, Rx refills, simple lab routing |
| Sonnet 4.6 | **Cevi Pro** | Default — lab results, referrals, prior auth, imaging |
| Opus 4.7 (1M) | **Cevi Max** | Specialist consults, high-stakes reasoning, patient-message drafting |

UI copy patterns:
- Topbar: `"Cevi AI · 14 faxes processed in the last hour"` (no model name)
- Classification card: `"Classified by Cevi Pro"`, buttons labeled `Base / Pro / Max`
- Timeline events: `"Classified by Cevi Pro"` (model field removed from UI; still logged in audit table internally)
- Demo stage: `"Cevi Pro · lab_result @ high confidence"`

Implementation lives in `src/lib/claude.ts` `MODEL_LABELS`; every UI reads from that constant.

---

## 2. Supabase architecture

### 2.1 Credentials (env-only, swap-ready)
```
NEXT_PUBLIC_SUPABASE_URL=<project-url>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<sb_publishable_***>
```
(Real values live in `.env.local` and Vercel env — never committed.)
No hardcoded `supabase.co` URL anywhere in `src/`. To swap projects later, change Vercel envs only.

### 2.2 Tables (under `public` schema, all with permissive-for-anon RLS)
| Table | Purpose | Notes |
|---|---|---|
| `patients` | Patient directory for matching | Indexed on `(last_name, first_name)`, `(dob)`, `(mrn)` |
| `providers` | Internal providers | Read-only |
| `integrations` | Integration cards on `/integrations` | Read-only |
| `agents` | Connected agent stats | Read-only |
| `faxes` | Every fax received | `extracted jsonb`, `ocr_text`, `is_user_uploaded bool` |
| `fax_events` | Pipeline audit trail | `(fax_id, at desc)` index |
| `fax_candidates` | Top-N match candidates per fax | PK `(fax_id, patient_id)` |
| `patient_messages` | Drafted patient-facing notes | `status text`, `draft_body text` |
| `critical_ack` | Callback acknowledgements | `fax_id`, `acknowledged_by`, `called_at`, `note` |

RLS (demo-safe): `select true to anon`, `insert true to anon` (demo has no auth). Tighten to per-clinic post-MVP. Tables without anon inserts (`patients`, `providers`, `integrations`, `agents`) are select-only by anon; seeded once by us.

### 2.3 Client split (`src/lib/supabase/`)
- `client.ts` — browser singleton using publishable key (client components, live inserts)
- `server.ts` — RSC / Server Action client, cookie-aware for future auth
- `schema.ts` — shared row-shape types (mirrors what Supabase returns)
- `repositories/{faxes,patients,providers,events,agents,integrations}.ts` — domain-type mappers

Existing `src/lib/types.ts` stays as single source of truth; repositories map snake_case rows → camelCase domain types.

### 2.4 Seeding
- `supabase/schema.sql` — one file with CREATE TABLE + indexes + RLS policies, applied via the Supabase SQL editor manually (demo constraint — no CLI, no CI).
- `scripts/seed.ts` — TypeScript seeder that reads the existing in-memory fixtures (`/src/data/*.ts`) and upserts via the publishable key (works because of permissive RLS). Idempotent via `onConflict`. Run with `pnpm tsx scripts/seed.ts`.

---

## 3. Upload pipeline (new `/upload` route)

**Flow:** drop zone (PDF / PNG / JPG / paste OCR text) → server action → classify via Cevi Pro using vision content blocks for PDFs/images, text fallback for paste → patient match (trigram or fallback string match against `patients`) → insert fax + events into Supabase → `revalidatePath('/inbox')` → redirect to `/inbox/[newId]`.

**File handling:** max 15 MB, `image/png`, `image/jpeg`, `image/webp`, `application/pdf`. Images are inlined as base64 content blocks; PDFs use Claude's `document` content block.

**User UX:** dedicated page with 3 tabs — Upload file / Paste OCR text / Use sample. "Use sample" auto-fills a pre-canned Quest lab report so the client can click through even without a real fax.

**New files:**
- `src/app/upload/page.tsx`
- `src/app/upload/UploadForm.tsx` (client)
- `src/app/upload/actions.ts` (server action)
- `src/lib/ai/classify-upload.ts` (the Claude vision call)

---

## 4. Critical-result acknowledge flow + patient message draft

### 4.1 Acknowledge modal on critical faxes
On any fax with `urgency: critical`, the Fax Detail page shows a sticky red rail on the left edge and a dismiss-blocking banner: "Critical result · patient not yet contacted · [timer: 3 min]". Clicking opens a modal:
- Who called (dropdown: you / nurse Guerrero / front desk)
- When (default: now)
- Patient response (free text)
- "Mark acknowledged" → writes `critical_ack` row + appends `human_override` event → banner flips green.

### 4.2 "Draft patient message" CTA
Available on any lab_result, specialist_consult, or imaging_report fax. Clicking it fires a server action that uses **Cevi Max** to draft a 4th-grade-reading-level note from the extracted fields. Output goes into a modal with:
- Subject line
- Body (editable textarea)
- Buttons: *Copy* / *Send to patient portal (mock)* / *Edit and queue*

This is the demo money-shot per healthcare-reviewer.

---

## 5. Security hardening

| # | Control | How |
|---|---|---|
| SEC1 | Rate limit `classifyFax` server action | `src/lib/rate-limit.ts` — LRU cache keyed by IP from `x-forwarded-for`, 10 req / IP / minute |
| SEC2 | Rate limit upload action | Same limiter, separate bucket, 5 req / IP / minute |
| SEC3 | `.env.local.example` committed | Documents every var required |
| SEC4 | Error sanitization | `classify.ts` returns generic user-facing strings; full error logged server-side only |
| SEC5 | Git secret scan | `grep -r "sk-ant"` and `grep -r "sb_"` on `git diff --cached` before first public push |
| SEC6 | Supabase RLS enabled on every table | Per architect design |
| SEC7 | Publishable key only in `NEXT_PUBLIC_`, service role never in client bundle | We don't use service role at all in this demo |

---

## 6. Sessions — execution order

Work is split into 6 sessions. I will execute them back-to-back. Each session ends with `pnpm exec tsc --noEmit`, a smoke test, and a commit.

### Session 8 · Brand + rename + clinical fixes (45 min)
**Inputs:** design-system.md, cevi logo.svg, code-reviewer + healthcare-reviewer findings.
**Deliverables:**
- Cevi wordmark SVG moved to `public/cevi-logo.svg`, rendered in `Sidebar.tsx` (replacing ad-hoc "c" bubble)
- `MODEL_LABELS` → Cevi Base/Pro/Max; all 5 leak sites updated; Topbar copy changed
- Dead buttons fixed: "Edit workflow" disabled with "Coming Q2 pilot" tooltip; "Run pilot report" wired to a /pilot-report stub (download CSV)
- ICD codes corrected (I25.110, D12.5), thyroid urgency downgrade, CPT section relabeled
- Clinic column added to InboxTable
- DemoStage hero-fax guard + error-state banner
- classify.ts error sanitization
- C1, C2, H1–H7 closed.

### Session 9 · Supabase infra (60 min)
- `supabase/schema.sql` with all 9 tables, indexes, RLS policies
- `src/lib/supabase/{client,server,schema}.ts` + 6 repositories
- `scripts/seed.ts` — seeds everything from existing fixtures
- Vercel env vars + `.env.local` updated
- Walk through Supabase SQL editor to apply schema (manual)
- `pnpm tsx scripts/seed.ts` runs clean
- W4 in flight.

### Session 10 · Wire reads from Supabase (45 min)
- Every page that reads from `/src/data/*` now reads from repositories
- Fallback to in-memory fixtures if Supabase errors (demo resilience)
- Audit page reads live events from DB
- Confirm every existing route still returns 200

### Session 11 · Upload feature (75 min)
- `/upload` page with tabbed UX (file / paste / sample)
- Server action calls Claude (Cevi Pro for text, Cevi Max for PDFs/images) with vision
- Patient match against Supabase patients
- Events + fax row inserted
- Redirect to detail
- Inbox "New fax" button wired
- W1 closed.

### Session 12 · Critical ack + patient message draft (60 min)
- Sticky critical-result banner + acknowledge modal
- `critical_ack` table writes
- "Draft patient message" CTA on lab/consult/imaging fax types
- `/src/app/actions/draft-message.ts` using Cevi Max
- Modal with editable body + copy / mock-send
- W2, W3, C5 closed.

### Session 13 · Security, GitHub, redeploy (45 min)
- Rate limiter installed on both server actions
- `.env.local.example` + README install section
- Git init → commit history clean → check no secrets → push to GitHub (`demo-fax-tpg`)
- Redeploy to Vercel (aliased URL stays `web-mu-fawn-77.vercel.app`)
- Full E2E smoke test on production URL
- C4, SEC1–SEC7 closed.

---

## 7. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Supabase SQL editor fails to run our schema on their cluster | Low | High | Keep in-memory fallback paths; demo still works without Supabase |
| Claude vision call rejected for large PDF | Med | Med | Limit upload to 10MB, show clear error |
| Rate limiter breaks legit demo clicks | Low | High | 10 req/min/IP is generous; test with 20 rapid clicks |
| Vercel redeploy introduces TS regression | Med | Med | `tsc --noEmit` before every push; keep existing prod URL aliased so rollback is one click |
| Client asks "show me on my own fax" — upload must work | High | Critical | Session 11 is non-negotiable |
| Sample pre-canned fax for upload feels staged | Low | Low | Include both "Use sample" and "Paste text" so it's clearly real-pipe |
| Model rename breaks audit row history | Low | Low | DB model column stores internal ID; UI derives the label via `MODEL_LABELS` |

---

## 8. What we will tell the client tomorrow

Opening one-liner: *"Since our last call we did two big things. One — your whole inbox is now sitting on a real Postgres database, so you can refresh, share the link with your nurses, and see live changes. Two — you can drop your own fax in the upload page and watch Cevi handle it end-to-end in under 15 seconds. Shall I show you?"*

Then the 5-minute flow from `DEMO_SCRIPT.md`, with the new /upload stop right after the critical potassium walkthrough.

---

*If we slip, cut Session 12 first (the wow adds) before cutting Session 11 (the ability to process their own fax). The upload is the table-stakes ask.*
