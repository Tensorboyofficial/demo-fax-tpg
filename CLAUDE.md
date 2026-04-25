# CLAUDE.md — Cevi Platform

## 0. Token Efficiency (CRITICAL)

### Never Explore What You Already Know
- The Codebase Map below lists every file and its purpose. **Use it. Do NOT launch Explore agents or glob/grep to "find" files that are already listed.**
- When the user's prompt includes file paths, go directly to those files. Do NOT read other files "for context" unless you hit a missing dependency.
- **Read only what you need:** Use `offset` and `limit` params to read specific sections of files, not entire 1000+ line files.
- **No redundant reads:** If you read a file once, don't read it again. Don't read files, then launch an Explore agent that re-reads them.
- **Prefer Grep/Glob over Explore agents.** Explore agents are only for truly unknown codebases. This codebase is fully mapped below.
- **Max 3 research rounds before starting work.** If you need more than ~10 file reads to understand a task, you're over-exploring. Use the codebase map + the user's prompt to target exactly what you need.

---

## 1. Architecture — Three-Layer Separation (Non-Negotiable)

This project has a strict **Frontend / Backend / Shared** separation inside a single Next.js app.

```
src/
├── frontend/     UI only — components, hooks, frontend config
├── backend/      Logic only — services, repositories, factories, backend config
├── shared/       Pure TypeScript — types, constants, utils (no React, no Node)
├── data/         Seed & fixture data
└── app/          Next.js routing — thin pages + thin API routes
```

### Import Rules (Enforced)

| From \ To | `frontend/` | `backend/` | `shared/` |
|-----------|:-----------:|:----------:|:---------:|
| `frontend/` | Yes | **NEVER** | Yes |
| `backend/` | **NEVER** | Yes | Yes |
| `shared/` | **NEVER** | **NEVER** | Yes |
| `app/(pages)/` | Yes | **NEVER** | Yes |
| `app/api/` | **NEVER** | Yes | Yes |

**If you're about to import from `backend/` in a component, STOP. Use a hook that calls an API route instead.**

### Path Aliases

```
@/*          → src/*
@/frontend/* → src/frontend/*
@/backend/*  → src/backend/*
@/shared/*   → src/shared/*
@/data/*     → src/data/*
```

### Full Architecture Docs

All architectural decisions, patterns, and specs live in `docs/architecture/`. Read the relevant doc before making structural changes:

| Doc | When to Read |
|-----|-------------|
| `01-OVERVIEW.md` | Starting on the project, understanding the "why" |
| `02-FOLDER-STRUCTURE.md` | Adding files, creating new modules |
| `03-SOLID-PRINCIPLES.md` | Writing any service, component, or interface |
| `04-CONFIG-SYSTEM.md` | Adding any value that could change (colors, rules, weights, limits) |
| `05-FACTORY-PATTERN.md` | Creating services, swapping implementations |
| `06-FRONTEND-ARCHITECTURE.md` | Building components, hooks, pages |
| `07-BACKEND-ARCHITECTURE.md` | Building services, repos, API routes |
| `08-COMPONENT-SYSTEM.md` | Building UI — check if a reusable component already exists |
| `09-DATA-FLOW.md` | API contracts, how FE talks to BE |
| `10-MIGRATION-GUIDE.md` | Moving files from old structure to new |

---

## 2. Code Quality Standards (Non-Negotiable)

### SOLID Principles — Every File, Every Time

- **S — Single Responsibility:** One service = one domain. One component = one visual concern. One config file = one config domain. If it does two things, split it.
- **O — Open/Closed:** Add new fax types, routing rules, model tiers, badge colors via **config entries** — never by modifying existing service/component code. If you're adding an `if/else` for a new case, you're violating O/C.
- **L — Liskov Substitution:** `SupabaseFaxRepository`, `MemoryFaxRepository`, `SeedFaxRepository` all implement `IFaxRepository`. Any can replace another without breaking `FaxService`.
- **I — Interface Segregation:** Small interfaces: `IClassifier`, `IRouter`, `IMatcher`, `IFaxRepository`. Not one god interface. Components accept only the props they use.
- **D — Dependency Inversion:** Services depend on **interfaces**, not concrete classes. Factories wire concrete implementations. Services never instantiate their own dependencies.

### Config-Driven Factory Pattern

- **Every value that could change** lives in a config file, not in code.
- **Factories** read config + environment to create service instances.
- **Adding a feature** = adding a config entry. Not writing new code.

**What MUST be in config (never hardcoded):**
- Routing rules (fax type + urgency → queue)
- AI model tiers, IDs, labels, token limits
- Patient matching weights and thresholds
- Rate limit numbers
- System prompts for Claude
- Badge color mappings
- Navigation items and routes
- KPI card definitions
- Table column definitions
- Upload constraints (max size, accepted types)
- Agent queue metadata
- Pipeline step definitions

**Config locations:**
- Frontend config → `src/frontend/config/`
- Backend config → `src/backend/config/`
- Shared constants → `src/shared/constants/`

### Write Less Code, Get More Done

- Before building a new component, check `docs/architecture/08-COMPONENT-SYSTEM.md` — the reusable atom/molecule likely already exists.
- **One `DataTable`** replaces all table components. Use column configs, not new table files.
- **One `StatusBadge`** replaces all badge logic. It reads from `badge.config.ts`.
- **One `KpiRow`** renders any set of KPI cards from config.
- Don't build abstractions for things that happen once. Three similar lines > premature abstraction.
- Don't add features, config flags, or "improvements" that weren't asked for.
- Don't add comments for obvious code. Only comment the *why*, never the *what*.

### Design Patterns

- **Guard Clauses:** Return early for invalid states. Flat > nested.
- **Composition over Inheritance:** Never extend components. Compose atoms into molecules into organisms.
- **Smart Wrapper, Dumb Content:** Organisms can use hooks/state. Their children are pure rendering.
- **Props Down, Events Up:** Parent passes data down, child fires callbacks up.

---

## 3. Frontend Rules

### Component Hierarchy

```
PAGES (thin shells — compose organisms, ~20 lines each)
  └── ORGANISMS (features/ — domain-specific, use hooks)
       └── MOLECULES (composed/ — reusable across features)
            └── ATOMS (ui/ — project-agnostic primitives)
```

### Component Locations

| Need | Use This | Location |
|------|----------|----------|
| Render a metric number | `Stat` or `KpiCard` | `ui/stat.tsx`, `composed/kpi-card.tsx` |
| Render a colored label | `StatusBadge` | `composed/status-badge.tsx` |
| Render a list/table | `DataTable` with column config | `ui/data-table.tsx` |
| Render a progress bar | `ConfidenceMeter` | `composed/confidence-meter.tsx` |
| Render a mini chart | `Sparkline` | `composed/sparkline.tsx` |
| Render an empty view | `EmptyState` | `ui/empty-state.tsx` |
| Render a card | `Card` (compound) | `ui/card.tsx` |
| Render a page title | `PageHeader` | `layout/page-header.tsx` |
| Render patient/provider | `EntityCard` | `composed/entity-card.tsx` |
| Render an event log | `TimelineItem` in a loop | `composed/timeline-item.tsx` |
| Render a file upload | `FileDropzone` | `composed/file-dropzone.tsx` |

### Hooks — Bridge to Backend

Components **never** call `fetch()` directly. They use hooks from `frontend/hooks/`:

```
useFaxes()        → GET /api/v1/fax
useFaxDetail(id)  → GET /api/v1/fax/:id
useClassify(id)   → POST /api/v1/fax/:id/classify
useUpload()       → POST /api/v1/fax
useDraftMessage() → POST /api/v1/fax/:id/message
useAgents()       → GET /api/v1/agent
useAudit()        → GET /api/v1/audit
```

### Server vs Client Components

Default to **Server Components**. Add `"use client"` only when the component needs:
- `useState`, `useEffect`, `useCallback`
- Event handlers (`onClick`, `onSubmit`)
- Browser APIs
- Hooks from `frontend/hooks/`

### Responsive Design — Mobile-First

- Every layout works at 3 breakpoints: mobile (<640px), tablet (640-1024px), desktop (>1024px).
- Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`). Never hardcode pixel widths.
- Tables: horizontal scroll with `overflow-x-auto` or card layout below `md:`.
- Touch targets: minimum 44x44px on mobile.
- Test mentally at 375px width before calling it done.

### UX Polish

- Every action gets instant visual feedback (loading spinner, disabled state, toast).
- Use `transition-all duration-200` on hover states, modals, accordions.
- Loading: skeleton loaders or shimmer. Never blank screens.
- Empty states: message + CTA. Never render empty `<tbody>`.

---

## 4. Backend Rules

### Four-Layer Stack

```
API Routes (thin controllers) → validate, delegate, respond
    ↓
Services (business logic) → one per domain, depends on interfaces
    ↓
Factories (composition root) → reads config, creates instances
    ↓
Repositories (data access) → implements interfaces, one per data source
```

### API Routes — Thin Controllers

Every route does exactly 3 things:
1. Apply middleware (rate limiting, validation)
2. Call one service method via factory
3. Return `Response.json(result)`

**No business logic in routes.** No direct DB calls. No direct Anthropic SDK calls.

### Route Map

| Method | Path | Service | Rate Limit |
|--------|------|---------|------------|
| `GET` | `/api/v1/fax` | `FaxService.getAllFaxes()` | -- |
| `POST` | `/api/v1/fax` | `UploadService.processUpload()` | 8/min |
| `GET` | `/api/v1/fax/:id` | `FaxService.getFaxById()` | -- |
| `POST` | `/api/v1/fax/:id/classify` | `ClassificationService.classify()` | 15/min |
| `POST` | `/api/v1/fax/:id/message` | `MessagingService.draftMessage()` | 6/min |
| `POST` | `/api/v1/fax/:id/acknowledge` | `AuditService.logEvent()` | -- |
| `GET` | `/api/v1/agent` | `FaxService.getAgentQueues()` | -- |
| `GET` | `/api/v1/agent/:slug` | `FaxService.getFaxesByQueue()` | -- |
| `GET` | `/api/v1/audit` | `AuditService.getEvents()` | -- |
| `GET` | `/api/v1/integration` | static from config | -- |

### Services

| Service | Single Responsibility |
|---------|----------------------|
| `ClassificationService` | Send OCR text to Claude, return typed result |
| `MatchingService` | Score patients against extracted fields using config weights |
| `RoutingService` | Evaluate config-driven rules, return queue + status |
| `MessagingService` | Draft patient-facing messages via Claude |
| `AuditService` | Log and query audit events |
| `FaxService` | CRUD operations on faxes |
| `UploadService` | Orchestrate: classify → match → route → persist |

### Repositories — Interface-First

All repositories implement interfaces from `backend/repositories/interfaces/`. Three implementations:

| Implementation | When Used |
|---------------|-----------|
| `SupabaseFaxRepository` | `SUPABASE_URL` is set (production/staging) |
| `MemoryFaxRepository` | No Supabase, in-memory fallback (dev) |
| `SeedFaxRepository` | Read-only demo fixtures (always available) |

`RepositoryFactory` detects environment and creates the right one. Services never know which they get.

### Error Handling

- Validate at system boundaries only (API route inputs, external API responses).
- Services throw typed errors: `ValidationError`, `NotFoundError`.
- `error-handler.ts` maps errors to HTTP status codes (400, 404, 429, 500).
- **Never expose internal errors to client.** Log server-side, return generic message.
- Never log PHI (patient names, DOB, phone numbers) — HIPAA violation.

---

## 5. Shared Layer Rules

`src/shared/` is pure TypeScript with **zero dependencies** on React or Node APIs.

### Types (`shared/types/`)

- `fax.types.ts` — Fax, ExtractedFields, FaxEvent
- `patient.types.ts` — Patient, MatchCandidate
- `provider.types.ts` — Provider
- `agent.types.ts` — AgentStat, AgentKey
- `integration.types.ts` — Integration
- `api.types.ts` — All API request/response contracts

### Constants (`shared/constants/`)

- `fax-types.ts` — `FAX_TYPES` array + `FaxType` type
- `fax-status.ts` — `FAX_STATUSES` array + `FaxStatus` type
- `urgency.ts` — `URGENCY_LEVELS` + priority ordering
- `agent-keys.ts` — `AGENT_KEYS` array

**Rule:** Never use string literals for fax types, statuses, or urgencies in code. Always import from constants.

### Utils (`shared/utils/`)

- `cn.ts` — Tailwind class merging (clsx + tailwind-merge)
- `date.ts` — `formatDateTime`, `formatRelative`, `formatDate`, `formatDob`, `calcAge`
- `format.ts` — `percent`, `currency`
- `string.ts` — `initials`, `normalize`

---

## 6. Mandatory Workflow (Every Task)

### Root Cause, Not Patchwork
1. **Read the code** — understand what's happening and why
2. **Identify the root cause** — not the symptom, the SOURCE
3. **Reason about side effects** — will this fix break something else?
4. **Fix once at the source** — a single, clean fix
5. **Build to verify** — if more than 1 new error appears, the fix is wrong. Revert and rethink.

### Before Writing Code — Check These First
1. Does a reusable component already exist? → Check `08-COMPONENT-SYSTEM.md`
2. Should this value be in config? → If it could change, yes. Check `04-CONFIG-SYSTEM.md`
3. Am I importing across layers? → `frontend/` never imports `backend/`. Check import rules above.
4. Am I adding a new if/else for a new case? → Probably should be a config entry instead.

### Plan-Driven Issue Resolution

**Step 1: Read & Understand** using the Codebase Map below.

**Step 2: Define Acceptance Criteria** — clear, binary PASS/FAIL.

**Step 3: Write the Plan** — `docs/issues_resolution_plan/<issue-name>.md`

**Step 4: Execute** — follow the plan. Don't deviate without updating it.

**Step 5: Verify** — `npm run build` with 0 errors. Test the actual page/endpoint.

**Step 6: Manager Summary (MANDATORY)**
- 2-3 sentences max. What was broken, what was done, what was verified.
- Zero jargon. A non-technical PM should fully understand it.

### Safety Rules
- **Never push without permission** — always ask "Ready to push?" and wait.
- **Never delete external resources** (Supabase tables, Anthropic config) without explicit instruction.
- **Never skip tests** — if you wrote code, you test it.

---

## 7. Performance Rules

- `Promise.all()` for parallel API fetches — never sequential `await` chains.
- `.select("field1,field2")` not `.select("*")` for Supabase queries.
- Lazy-load heavy components (Framer Motion, charts) with `next/dynamic`.
- Server-side pagination for tables >100 rows.
- Show loading states immediately — skeleton loaders, never blank screens.
- Deduplicate API calls — if two components need the same data, lift the fetch up or share a hook.

---

## 8. HIPAA Compliance

- **Never log PHI** — no patient names, phone numbers, DOB, or health data in logs or console output.
- **Audit every PHI access** — fail-fast if audit log write fails.
- **Immutable audit events** — INSERT only, no UPDATE/DELETE on `user_fax_events`.
- **Error sanitization** — internal errors logged server-side only. Client gets generic messages.
- **Prompt safety** — Claude system prompts forbid inventing data not present in the fax.

---

## 9. Design System

| Token | Value |
|-------|-------|
| **Accent (Brand)** | `#E35336` (terracotta) |
| **Success/Jade** | `#2D7A54` / `#7EC4A5` |
| **Coral** | `#F4845F` |
| **Amber** | `#F7B267` |
| **Sand** | `#D4A574` |
| **Teal** | `#6CB4C4` |
| **Body Font** | DM Sans (300-700) |
| **Heading Font** | EB Garamond |
| **Mono Font** | SF Mono (IDs, MRNs, timestamps) |
| **Border Radius** | 4px / 8px / 12px / 16px |
| **Cards** | Flat, `1px solid #E3E2DE`, `border-radius: 8px` |
| **Focus Ring** | `ring-2 ring-[#E35336]/30` |
| **Icons** | Lucide React (single library, never mix) |

Full design spec: `docs/design/`

---

## 10. Project Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Framework | Next.js 16 (App Router) | Pages + API routes |
| Language | TypeScript (strict) | All files typed |
| UI | React 19 + Tailwind 4 + Radix UI | Server & Client components |
| AI | Anthropic Claude SDK | 3 tiers: Haiku / Sonnet / Opus |
| Database | Supabase (PostgreSQL) | With Memory + Seed fallbacks |
| Animations | Framer Motion | Lazy-loaded |
| Icons | Lucide React | Single icon library |
| Fonts | DM Sans + EB Garamond | Google Fonts |

---

## 11. Codebase Map

> **RULE:** Use this map to jump directly to the right file. Do NOT glob/grep to "find" files listed here. When you add, delete, or rename a file, update this map in the SAME edit session.

### App — Pages (`app/(pages)/`)

| File | Route | Purpose |
|------|-------|---------|
| `page.tsx` | `/` | Dashboard — composes RoiHero, KpiRow, ThroughputChart, ActivityFeed, HowItWorks |
| `inbox/page.tsx` | `/inbox` | Fax list — KpiRow + FaxTable (DataTable with INBOX_COLUMNS) |
| `inbox/[id]/page.tsx` | `/inbox/:id` | Fax detail — FaxPreview, ClassificationCard, PatientMatchCard, ExtractedFields, RoutingCard, AuditTimeline, CriticalBanner |
| `upload/page.tsx` | `/upload` | Upload form — FileDropzone + ClassificationResult |
| `agents/page.tsx` | `/agents` | Agent queues — AgentCard grid from config |
| `agents/[slug]/page.tsx` | `/agents/:slug` | Queue detail — AgentHeader + DataTable |
| `agents/[slug]/workflow/page.tsx` | `/agents/:slug/workflow` | Workflow editor (UI only) |
| `review/page.tsx` | `/review` | Human review queue — filtered DataTable |
| `audit/page.tsx` | `/audit` | Audit trail — filterable DataTable |
| `integrations/page.tsx` | `/integrations` | Integration catalog grid |
| `settings/page.tsx` | `/settings` | Settings (UI only) |
| `demo/page.tsx` | `/demo` | Live pipeline demo |

### App — API Routes (`app/api/v1/`)

| File | Method | Endpoint | Delegates To |
|------|--------|----------|-------------|
| `fax/route.ts` | GET/POST | `/api/v1/fax` | FaxService / UploadService |
| `fax/[id]/route.ts` | GET | `/api/v1/fax/:id` | FaxService |
| `fax/[id]/classify/route.ts` | POST | `/api/v1/fax/:id/classify` | ClassificationService |
| `fax/[id]/message/route.ts` | POST | `/api/v1/fax/:id/message` | MessagingService |
| `fax/[id]/acknowledge/route.ts` | POST | `/api/v1/fax/:id/acknowledge` | AuditService |
| `agent/route.ts` | GET | `/api/v1/agent` | FaxService |
| `agent/[slug]/route.ts` | GET | `/api/v1/agent/:slug` | FaxService |
| `audit/route.ts` | GET | `/api/v1/audit` | AuditService |
| `integration/route.ts` | GET | `/api/v1/integration` | Config |

### Frontend — Atoms (`frontend/components/ui/`)

| File | Component | Used For |
|------|-----------|---------|
| `button.tsx` | `Button` | All clickable actions |
| `badge.tsx` | `Badge` | Raw colored label (used by StatusBadge) |
| `card.tsx` | `Card` (compound) | Every card/section container |
| `input.tsx` | `Input` | Text inputs, search |
| `progress.tsx` | `Progress` | Bar fills (used by ConfidenceMeter) |
| `stat.tsx` | `Stat` | Single KPI number |
| `icon-box.tsx` | `IconBox` | Colored icon container |
| `data-table.tsx` | `DataTable` | ALL tables (inbox, agents, audit, review) |
| `empty-state.tsx` | `EmptyState` | Empty/error views |

### Frontend — Molecules (`frontend/components/composed/`)

| File | Component | Composes |
|------|-----------|---------|
| `confidence-meter.tsx` | `ConfidenceMeter` | Progress + color logic |
| `kpi-card.tsx` | `KpiCard` | Card + IconBox + Stat |
| `kpi-row.tsx` | `KpiRow` | Grid of KpiCards from config |
| `status-badge.tsx` | `StatusBadge` | Badge + badge.config.ts lookup |
| `sparkline.tsx` | `Sparkline` | Mini SVG chart |
| `timeline-item.tsx` | `TimelineItem` | Single audit event row |
| `file-dropzone.tsx` | `FileDropzone` | Drag & drop upload area |
| `entity-card.tsx` | `EntityCard` | Patient/provider display |

### Frontend — Organisms (`frontend/components/features/`)

| Folder | Components |
|--------|-----------|
| `fax/` | `FaxTable`, `FaxPreview`, `ClassificationCard`, `PatientMatchCard`, `ExtractedFields`, `RoutingCard`, `CriticalBanner`, `PatientMessageModal` |
| `dashboard/` | `RoiHero`, `ThroughputChart`, `ActivityFeed`, `HowItWorks` |
| `agent/` | `AgentCard`, `AgentHeader`, `WorkflowEditor` |
| `upload/` | `UploadForm`, `ClassificationResult` |
| `audit/` | `AuditTable` |
| `integration/` | `IntegrationGrid` |

### Frontend — Layout (`frontend/components/layout/`)

| File | Component |
|------|-----------|
| `app-shell.tsx` | Root wrapper (sidebar + topbar + content) |
| `sidebar.tsx` | Config-driven navigation |
| `topbar.tsx` | Header bar |
| `page-header.tsx` | Reusable page title + actions |

### Frontend — Hooks (`frontend/hooks/`)

| File | Hook | API Endpoint |
|------|------|-------------|
| `use-api.ts` | `useApi` | Base fetch wrapper |
| `use-faxes.ts` | `useFaxes` | GET /api/v1/fax |
| `use-fax-detail.ts` | `useFaxDetail` | GET /api/v1/fax/:id |
| `use-classify.ts` | `useClassify` | POST /api/v1/fax/:id/classify |
| `use-upload.ts` | `useUpload` | POST /api/v1/fax |
| `use-draft-message.ts` | `useDraftMessage` | POST /api/v1/fax/:id/message |
| `use-agents.ts` | `useAgents` | GET /api/v1/agent |
| `use-audit.ts` | `useAudit` | GET /api/v1/audit |

### Frontend — Config (`frontend/config/`)

| File | What It Configures |
|------|-------------------|
| `navigation.config.ts` | Sidebar links, routes, icons, sections |
| `badge.config.ts` | Badge colors for type, status, urgency |
| `kpi.config.ts` | KPI card definitions per page (dashboard, inbox, agents) |
| `table-columns.config.ts` | Column definitions for DataTable (inbox, audit, agent, review) |
| `agent-cards.config.ts` | Agent queue card metadata (name, icon, color, slug) |
| `pipeline-steps.config.ts` | "How it works" step definitions |
| `upload.config.ts` | Accepted file types, max sizes, labels |

### Backend — Services (`backend/services/`)

| File | Service | Responsibility |
|------|---------|---------------|
| `classification.service.ts` | `ClassificationService` | Claude API classification |
| `matching.service.ts` | `MatchingService` | Patient matching with config weights |
| `routing.service.ts` | `RoutingService` | Config-driven fax routing |
| `messaging.service.ts` | `MessagingService` | Patient message drafting |
| `audit.service.ts` | `AuditService` | Event logging and querying |
| `fax.service.ts` | `FaxService` | Fax CRUD orchestration |
| `upload.service.ts` | `UploadService` | Upload pipeline: classify → match → route → persist |

### Backend — Repositories (`backend/repositories/`)

| File | Class | Interface |
|------|-------|-----------|
| `interfaces/fax.repository.ts` | `IFaxRepository` | findAll, findById, findByFilter, create, update |
| `interfaces/event.repository.ts` | `IEventRepository` | findByFaxId, findAll, create |
| `interfaces/message.repository.ts` | `IMessageRepository` | create, findByFaxId |
| `supabase/supabase-fax.repository.ts` | `SupabaseFaxRepository` | Implements IFaxRepository |
| `supabase/supabase-event.repository.ts` | `SupabaseEventRepository` | Implements IEventRepository |
| `supabase/supabase-message.repository.ts` | `SupabaseMessageRepository` | Implements IMessageRepository |
| `supabase/supabase.client.ts` | Supabase client singleton | -- |
| `memory/memory-fax.repository.ts` | `MemoryFaxRepository` | Implements IFaxRepository |
| `memory/memory-event.repository.ts` | `MemoryEventRepository` | Implements IEventRepository |
| `seed/seed-fax.repository.ts` | `SeedFaxRepository` | Implements IFaxRepository (read-only) |

### Backend — Factories (`backend/factories/`)

| File | Factory | Creates |
|------|---------|--------|
| `repository.factory.ts` | `createFaxRepository()` etc. | Picks Supabase / Memory / Seed based on env |
| `classifier.factory.ts` | `createClassifier(tier)` | ClaudeClassifier with model config |
| `router.factory.ts` | `createRouter()` | ConfigDrivenRouter from routing rules |
| `service.factory.ts` | `getFaxService()`, `getUploadService()` etc. | Wires services with deps |

### Backend — Config (`backend/config/`)

| File | What It Configures |
|------|-------------------|
| `models.config.ts` | AI model tiers (Haiku/Sonnet/Opus), IDs, labels, token limits, env overrides |
| `routing-rules.config.ts` | Fax routing decision tree (condition → queue + status + notify) |
| `matching.config.ts` | Patient matching weights (name 0.55, DOB 0.40, MRN 0.50) and thresholds |
| `rate-limit.config.ts` | Per-endpoint rate limits (classify 15/min, upload 8/min, draft 6/min) |
| `prompts.config.ts` | Claude system prompts for classification and patient messaging |
| `upload.config.ts` | Max file sizes, allowed MIME types, default clinic/fax number |

### Backend — Middleware (`backend/middleware/`)

| File | Purpose |
|------|---------|
| `rate-limiter.ts` | Per-IP token bucket rate limiting |
| `validator.ts` | Request validation helpers |
| `error-handler.ts` | Maps errors to HTTP status codes, sanitizes for client |

### Shared — Types (`shared/types/`)

| File | Types |
|------|-------|
| `fax.types.ts` | `Fax`, `ExtractedFields`, `FaxEvent` |
| `patient.types.ts` | `Patient`, `MatchCandidate` |
| `provider.types.ts` | `Provider` |
| `agent.types.ts` | `AgentStat`, `AgentKey` |
| `integration.types.ts` | `Integration` |
| `api.types.ts` | All API request/response contracts |

### Shared — Constants (`shared/constants/`)

| File | Exports |
|------|---------|
| `fax-types.ts` | `FAX_TYPES`, `FaxType` |
| `fax-status.ts` | `FAX_STATUSES`, `FaxStatus` |
| `urgency.ts` | `URGENCY_LEVELS`, `Urgency`, `URGENCY_PRIORITY` |
| `agent-keys.ts` | `AGENT_KEYS`, `AgentKey` |

### Shared — Utils (`shared/utils/`)

| File | Functions |
|------|----------|
| `cn.ts` | `cn()` — Tailwind class merging |
| `date.ts` | `formatDateTime`, `formatRelative`, `formatDate`, `formatDob`, `calcAge` |
| `format.ts` | `percent`, `currency` |
| `string.ts` | `initials`, `normalize` |

### Data (`data/seed/`)

| File | Contains |
|------|---------|
| `faxes.ts` | 10+ seed fax records with full OCR text |
| `patients.ts` | 14 seed patients |
| `providers.ts` | 4 TMG doctors |
| `agents.ts` | 5 agent queue definitions |
| `integrations.ts` | 11 integration catalog entries |
| `lab-results.ts` | 10 structured lab faxes with panels/tests for hierarchical spreadsheet view |

### Database (`supabase/schema.sql`)

| Table | Purpose |
|-------|---------|
| `user_faxes` | Uploaded faxes (authoritative for user data) |
| `user_fax_events` | Audit trail (immutable, INSERT only) |
| `critical_ack` | Critical result acknowledgements |
| `patient_messages` | AI-drafted patient messages |

### Root Config Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts |
| `tsconfig.json` | TypeScript config with path aliases |
| `next.config.ts` | Next.js config |
| `postcss.config.mjs` | PostCSS for Tailwind |

### Documentation

| Path | Content |
|------|---------|
| `docs/architecture/` | 10 architecture docs (overview, structure, SOLID, config, factory, FE, BE, components, data flow, migration) |
| `docs/design/` | Design system (tokens, patterns, CSS variables, brand, assets) |
| `docs/images/screenshots/` | Reference screenshots (17 images) |
| `docs/01-14 *.md` | Original project docs (overview, data models, pages, AI, integrations, etc.) |
