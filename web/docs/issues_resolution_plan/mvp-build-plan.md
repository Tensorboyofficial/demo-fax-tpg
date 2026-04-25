# Cevi MVP Build Plan — Demo to Product

## The Gap

| Dimension | Current (Demo) | MVP PRD (Product) |
|-----------|---------------|-------------------|
| **Purpose** | Sales pitch for TMG | Daily operational tool for clinic staff |
| **Home page** | Dashboard with ROI hero, KPIs, charts, "How it works" | Fax inbox with spreadsheet-like table |
| **Fax detail** | Card-based layout (classification, routing, audit cards) | Split view: PDF viewer left + spreadsheet extraction right |
| **Sidebar** | Inbox, Upload, Paper EOB, Audit, Settings | Home, Patients, Settings, Documentation, Support |
| **Statuses** | pending, classified, routed, matched, needs_review, completed | Unopened, Opened, Archived, Needs Review |
| **Categories** | 6 types (lab, referral, EOB, imaging, consult, other) | 11+ categories with per-category schemas |
| **Patient roster** | 14 seed patients, no management UI | CSV upload from eCW, ~40-50k patients, full CRUD |
| **Matching** | Simple 3-field score (name 0.55, DOB 0.40, MRN 0.50) | 6-tier matching with per-category thresholds |
| **Cell behavior** | Read-only display | Single-click copy, double-click edit, keyboard nav |
| **Schema builder** | None | Right-side drawer for editing extraction schemas |
| **Pages that exist but shouldn't** | `/demo`, `/agents`, `/agents/:slug`, `/agents/:slug/workflow`, `/integrations`, `/review` | None of these |
| **Pages that should exist but don't** | None | `/patients` |

---

## What to REMOVE (simplify)

These pages/features exist only for the demo pitch and are not in the MVP:

1. **`/` (Dashboard)** — ROI hero, KPI cards, throughput chart, activity feed, "How it works" pipeline
2. **`/demo`** — Live pipeline animation with simulated fax processing
3. **`/agents` + `/agents/:slug` + `/agents/:slug/workflow`** — Agent queue concept
4. **`/integrations`** — Integration catalog grid
5. **`/review`** — Separate review queue (folded into main inbox status filters)
6. **`/eob`** — Separate EOB page (EOB becomes one of 11 categories)
7. **Demo-specific components**: `DemoStage`, `RoiHero`, `ThroughputChart`, `ActivityFeed`, `HowItWorks`, `AgentCard`, `AgentHeader`, `WorkflowEditor`, `IntegrationGrid`
8. **Demo-specific backend**: Agent queue logic, pipeline step config, agent-cards config
9. **Critical banner / patient message button** — Phase 2 features (eCW write-back, SMS)

---

## What to KEEP (reusable foundation)

1. **Three-layer architecture** (`frontend/`, `backend/`, `shared/`) — perfect
2. **Design system** — tokens, colors, fonts, CSS variables
3. **UI atoms** — `Button`, `Badge`, `Card`, `Input`, `IconBox`, `DataTable`, `EmptyState`, `Progress`
4. **Composed molecules** — `StatusBadge`, `FileDropzone`, `ConfidenceMeter`, `EntityCard`
5. **Layout shell** — `AppShell`, `Sidebar` (modified), `Topbar`
6. **Backend services pattern** — Factory + Service + Repository pattern
7. **API route pattern** — thin controllers delegating to services
8. **Supabase / Memory / Seed repository pattern**
9. **Upload flow** — `UploadForm` + `FileDropzone` (modified for new categories)
10. **Shared types/utils** — date formatting, currency, cn(), etc.

---

## Build Phases

### Phase 1: Simplify — Strip Demo, Restructure Routes

**Goal**: Remove demo-only pages/components, set up the MVP route structure.

#### 1a. New route structure

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Home (Fax Inbox) | Main inbox — all faxes, filterable by status + category |
| `/fax/:id` | Single Fax Page | Split view: document viewer + extraction spreadsheet |
| `/category/:slug` | Category Spreadsheet | Per-category spreadsheet (labs, referrals, etc.) |
| `/patients` | Patient Roster | CSV upload, search, patient table |
| `/settings` | Settings | Account settings |

#### 1b. Delete demo pages

- Delete `src/app/demo/` directory
- Delete `src/app/agents/` directory (all 3 pages)
- Delete `src/app/integrations/` directory
- Delete `src/app/review/` directory
- Delete `src/app/eob/` directory
- Convert `src/app/page.tsx` from dashboard to fax inbox
- Rename `src/app/inbox/` to serve at `/` (or redirect)
- Add `src/app/fax/[id]/page.tsx` (new single fax page)
- Add `src/app/category/[slug]/page.tsx` (new category page)
- Add `src/app/patients/page.tsx` (new patients page)

#### 1c. Delete demo components

- `frontend/components/features/dashboard/` — entire directory (RoiHero, ThroughputChart, ActivityFeed, HowItWorks)
- `frontend/components/features/agent/` — entire directory (AgentCard, AgentHeader, WorkflowEditor)
- `frontend/components/features/integration/` — entire directory (IntegrationGrid)
- `frontend/components/features/demo/` — entire directory (DemoStage)
- `frontend/components/features/fax/critical-banner.tsx` — Phase 2
- `frontend/components/features/fax/patient-message-button.tsx` — Phase 2

#### 1d. Delete demo backend/config

- `frontend/config/agent-cards.config.ts`
- `frontend/config/pipeline-steps.config.ts`
- `backend/config/prompts.config.ts` (patientMessage prompt — Phase 2)
- API routes: `api/v1/agent/`, `api/v1/integration/`
- Hooks: `use-agents.ts`

#### 1e. Update sidebar

```
Logo
Home (fax inbox icon)
Patients (users icon)
Settings (settings icon)
---
Documentation (book icon)
Support (headphones icon)
---
Account area (bottom)
```

---

### Phase 2: Data Model — New Types + Schemas

**Goal**: Replace demo types with MVP data model.

#### 2a. New shared types

- **Fax statuses**: `unopened | opened | archived | needs_review` (replace current 6+ statuses)
- **11 categories**: `lab | imaging | consult | referral | prior_auth | dme | forms | records_request | eob | discharge | other`
- **Match decisions**: `matched_confident | needs_review | unmatched | ambiguous | deceased_review`
- **Patient roster type**: FHIR HumanName, eCW account number, identifiers, addresses, telecom, insurance
- **Match result type**: top-N candidates, component scores, decision, threshold snapshot
- **Category config type**: per-category thresholds, weights, routing queue

#### 2b. Import extraction schemas

Copy from `temp/JSO Schemas 25 Categories/` into `src/data/schemas/`:
- Start with the 11 MVP categories: `lab_result`, `imaging_report`, `consult_note`, `referral_incoming`, `prior_auth_response`, `dme_documentation`, `eob_era`, `hospital_discharge_summary`, `medical_records_request`, `physical_exam_form` (forms), `unclassified` (other)
- Add `shared_definitions.schema.json` for shared `patient_reference` + `fax_envelope` blocks

#### 2c. Category config

Create `backend/config/category.config.ts` with per-category:
- `confident_match_threshold`
- `review_threshold`
- `always_human_review`
- `route_to_queue`
- `splittable` flag
- `schema_key` (pointer to extraction schema)

#### 2d. Database schema

Update `supabase/schema.sql`:
- `patient_roster` table (patient_id UUID PK, ecw_account_number, name JSONB, dob, sex, addresses, telecom, identifiers, insurance, source, created_at, updated_at)
- `faxes` table (update status enum to new 4 statuses, add parent_id FK for split EOBs, category field)
- `match_results` table (match_id UUID PK, fax_id FK, candidates JSONB, decision enum, threshold_snapshot, matcher_version, created_at)
- `category_config` table (clinic_id, version, config JSONB)

---

### Phase 3: Fax Inbox (Home Page)

**Goal**: Build the spreadsheet-style fax inbox that replaces the dashboard.

#### 3a. Inbox table with new columns

| Column | Source |
|--------|--------|
| Document ID | `fax.id` |
| Preview thumbnail | `fax.thumbnailUrl` (or first page render) |
| Type / Category | `fax.category` |
| Patient | `fax.matchedPatient.name` or "Unmatched" |
| Sender | `fax.fromOrg` |
| Status | `fax.status` (Unopened/Opened/Archived/Needs Review) |
| Confidence | `fax.matchConfidence` |
| Received | `fax.receivedAt` |

#### 3b. Status tabs

Horizontal tabs above the table: `All | Unopened | Opened | Archived | Needs Review`

#### 3c. Category dropdown filter

Dropdown to filter by category. Contents match wireframe (All, Lab Results, Referrals, Prior Authorizations, ... + Create New Schema).

Selecting a specific category navigates to `/category/:slug`.

#### 3d. Spreadsheet cell behavior

This is the critical UX difference from the demo:
- **Single left-click** on any cell: copies value to clipboard, brief flash + "Copied" toast
- **Double left-click**: enters inline edit mode (Enter saves, Escape cancels, Tab moves right)
- **Keyboard nav**: Arrow keys, Enter (copy + move down), Tab (copy + move right), Cmd+C
- **Row/column selection**: Click row number or column header, Shift+click for range

This requires a custom `SpreadsheetTable` component (or significant enhancement to `DataTable`).

#### 3e. Top bar actions

- Search input (left)
- Upload button + Export button (right)

---

### Phase 4: Single Fax Page (`/fax/:id`)

**Goal**: Build the split-view fax detail page.

#### 4a. Left panel — Document viewer

- Full PDF/image page rendering (use `react-pdf` or similar)
- Page thumbnails strip (left edge or bottom)
- Zoom controls (+/- and fit-to-width)
- Page count indicator

#### 4b. Right panel — Extraction spreadsheet

- Category dropdown (re-classify from here)
- Patient match status badge
- **Field/Value table** in spreadsheet format (single-click copy, double-click edit)
- For labs: nested panels/tests table below the main fields
- Editable inline — all extracted values can be corrected by staff

#### 4c. Top actions

- Save
- Mark Processed / Archive
- Needs Review
- Back (to inbox)

#### 4d. Auto-status update

When a user opens an "Unopened" fax, mark it as "Opened" automatically.

---

### Phase 5: Category Spreadsheet Pages (`/category/:slug`)

**Goal**: Each category gets its own spreadsheet page showing all faxes of that type.

#### 5a. Layout

- Category dropdown (to switch categories)
- Stats line (e.g., "10 faxes - 47 tests")
- Edit Schema button (opens Schema Builder drawer)
- Status tabs (All / Unopened / Opened / Archived / Needs Review)
- Spreadsheet grid with category-specific columns

#### 5b. Lab Results special behavior

- **Grouped view**: Fax -> Panel -> Test (expandable rows)
- **Flat view**: One row per test
- Toggle between grouped and flat

#### 5c. Column definitions per category

Each category's spreadsheet shows columns derived from its JSON schema. The column config is generated from the schema, not hardcoded.

---

### Phase 6: Patient Roster (`/patients`)

**Goal**: Build the patient roster management page.

#### 6a. Patient table

Columns: Patient ID, eCW Account #, First Name, Middle Name, Last Name, DOB, Sex

Same spreadsheet behavior (click-to-copy, double-click-to-edit).

#### 6b. CSV upload

- Upload button opens file picker
- Parse eCW "Patient Demographics Export" CSV format
- Dry-run report: new patients, updates, potential duplicates
- Confirm to commit

#### 6c. Manual add patient

Simple form to add a single patient manually.

#### 6d. Search

Full-text search across patient fields.

#### 6e. Backend

- `PatientRosterService` — CRUD, CSV import, duplicate detection
- `PatientRosterRepository` (Supabase + Memory implementations)
- API routes: `GET /api/v1/patients`, `POST /api/v1/patients`, `POST /api/v1/patients/import`

---

### Phase 7: Schema Builder Drawer

**Goal**: Right-side drawer for viewing/editing extraction schemas.

#### 7a. Trigger points

- Category dropdown -> "+ Create New Schema"
- Category spreadsheet page -> "Edit Schema" button

#### 7b. Drawer UI

- ~50% width from right
- Schema name input
- Field list with types (Text, Date, Object, Array, Select/Enum)
- Expand/collapse nested objects and arrays
- Add/remove/rename/reorder fields
- Change field type
- Save / Cancel buttons

#### 7c. Backend

- Schema stored in `category_config` table (versioned)
- API: `GET /api/v1/schemas/:category`, `PUT /api/v1/schemas/:category`

---

### Phase 8: Enhanced Matching (upgrade from demo)

**Goal**: Replace simple 3-weight matching with 6-tier matching per PRD.

#### 8a. Matching tiers

1. `exact_identifier` — MRN/identifier exact match (score >= 0.98 stops early)
2. `exact_account_number` — eCW account number (score >= 0.98 stops early)
3. `dob_plus_full_name` — DOB exact + family + given[0] after normalization (score >= 0.95 stops early)
4. `alias_plus_dob` — raw_name_text matches known alias + DOB (score >= 0.95 stops early)
5. `fuzzy_name_plus_dob` — Levenshtein/Jaro-Winkler >= 0.85 + DOB match (emit all candidates)
6. `tiebreakers` — Address, phone, insurance member_id (break ties in top 3)

#### 8b. Per-category weights

Config-driven weights per category (lab weights differ from EOB weights as shown in PRD section 4.2).

#### 8c. Decision rules

- `matched_confident` — top score >= confident_threshold AND margin > 0.05
- `ambiguous` — 2+ candidates above threshold within 0.05
- `needs_review` — top score in [review_threshold, confident_threshold)
- `unmatched` — no candidate >= review_threshold
- `deceased_review` — top candidate is deceased

---

### Phase 9: Polish + Account Menu

#### 9a. Account menu

Both bottom sidebar area and top-right initial open the same menu:
- My Account
- Log out

No organization switcher.

#### 9b. Support modal

Centered modal with Cevi support email + copy button + "Open Email Client" button.

#### 9c. Documentation link

Links to external docs (placeholder for MVP).

---

## Implementation Priority (Recommended Order)

| Priority | Phase | Effort | Why This Order |
|----------|-------|--------|----------------|
| 1 | Phase 1 (Simplify) | S | Must clean house before building. Removes confusion. |
| 2 | Phase 2 (Data Model) | M | Everything else depends on the right types + schemas. |
| 3 | Phase 3 (Inbox) | L | The home page — what users see first. Validates the spreadsheet UX. |
| 4 | Phase 6 (Patients) | M | Must exist before matching works with real data. |
| 5 | Phase 4 (Single Fax) | L | Core workflow page — where staff actually act on faxes. |
| 6 | Phase 8 (Matching) | L | Upgrades the brain. Needs patient roster to be meaningful. |
| 7 | Phase 5 (Categories) | M | Extension of inbox — can ship after inbox works. |
| 8 | Phase 7 (Schema Builder) | M | Power feature — can defer after core flow works. |
| 9 | Phase 9 (Polish) | S | Account menu, support modal, docs link. |

**S** = 1-2 sessions, **M** = 2-4 sessions, **L** = 4-6 sessions

---

## Files to Delete (Phase 1 cleanup)

### Pages
- `src/app/page.tsx` (replace with inbox)
- `src/app/demo/page.tsx`
- `src/app/agents/page.tsx`
- `src/app/agents/[slug]/page.tsx`
- `src/app/agents/[slug]/workflow/page.tsx`
- `src/app/integrations/page.tsx`
- `src/app/review/page.tsx`
- `src/app/eob/page.tsx`

### Feature components
- `src/frontend/components/features/dashboard/` (entire dir)
- `src/frontend/components/features/agent/` (entire dir)
- `src/frontend/components/features/integration/` (entire dir)
- `src/frontend/components/features/demo/` (entire dir)
- `src/frontend/components/features/fax/critical-banner.tsx`
- `src/frontend/components/features/fax/patient-message-button.tsx`

### Config
- `src/frontend/config/agent-cards.config.ts`
- `src/frontend/config/pipeline-steps.config.ts`

### API routes
- `src/app/api/v1/agent/` (entire dir)
- `src/app/api/v1/integration/` (entire dir)

### Hooks
- `src/frontend/hooks/use-agents.ts`

### Backend
- `src/data/seed/agents.ts`
- `src/data/seed/integrations.ts`

---

## Files to CREATE (new MVP pages)

### Pages
- `src/app/fax/[id]/page.tsx` — Single fax split view
- `src/app/category/[slug]/page.tsx` — Category spreadsheet
- `src/app/patients/page.tsx` — Patient roster

### Feature components
- `src/frontend/components/features/spreadsheet/` — SpreadsheetTable, SpreadsheetCell, SpreadsheetToolbar
- `src/frontend/components/features/fax-viewer/` — PDFViewer, PageThumbnails, ZoomControls
- `src/frontend/components/features/patients/` — PatientTable, PatientUpload, PatientForm
- `src/frontend/components/features/schema-builder/` — SchemaDrawer, FieldList, FieldEditor
- `src/frontend/components/composed/category-dropdown.tsx`
- `src/frontend/components/composed/account-menu.tsx`
- `src/frontend/components/composed/support-modal.tsx`

### Backend
- `src/backend/services/patient-roster.service.ts`
- `src/backend/services/csv-import.service.ts`
- `src/backend/repositories/interfaces/patient.repository.ts`
- `src/backend/repositories/supabase/supabase-patient.repository.ts`
- `src/backend/repositories/memory/memory-patient.repository.ts`
- `src/backend/config/category.config.ts`

### API routes
- `src/app/api/v1/patients/route.ts` — GET (list) + POST (create)
- `src/app/api/v1/patients/import/route.ts` — POST (CSV upload)
- `src/app/api/v1/schemas/[category]/route.ts` — GET + PUT

### Shared types
- `src/shared/types/patient-roster.types.ts`
- `src/shared/types/match-result.types.ts`
- `src/shared/types/category.types.ts`
- `src/shared/constants/categories.ts` (11 categories)
- `src/shared/constants/match-decisions.ts`

### Data
- `src/data/schemas/` — 11 JSON extraction schemas from temp folder
- `src/data/seed/patient-roster.ts` — seed patients in new FHIR format
