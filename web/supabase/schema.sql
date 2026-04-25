-- Cevi MVP schema — Transcend Medical Group
-- Apply in Supabase SQL editor. Idempotent: safe to re-run.

-- =============================================================================
-- patient_roster — clinic patient roster seeded via CSV export from eCW
-- =============================================================================
create table if not exists public.patient_roster (
  patient_id uuid primary key default gen_random_uuid(),
  ecw_account_number text not null,
  name jsonb not null default '{}'::jsonb,
  dob date not null,
  sex text not null default 'U',
  addresses jsonb default '[]'::jsonb,
  telecom jsonb default '[]'::jsonb,
  identifiers jsonb default '[]'::jsonb,
  insurance jsonb default '[]'::jsonb,
  primary_provider jsonb,
  aliases jsonb default '[]'::jsonb,
  deceased jsonb,
  source text not null default 'csv_upload',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_patient_roster_ecw
  on public.patient_roster (ecw_account_number);
create index if not exists idx_patient_roster_dob
  on public.patient_roster (dob);
create index if not exists idx_patient_roster_name
  on public.patient_roster using gin (name);

-- =============================================================================
-- user_faxes — all faxes (uploaded + ingested via email)
-- =============================================================================
create table if not exists public.user_faxes (
  id text primary key,
  parent_id text references public.user_faxes(id),
  received_at timestamptz not null default now(),
  pages int not null default 1,
  from_number text,
  from_org text,
  fax_number_to text default '817-860-2704',
  to_clinic text,
  status text not null default 'unopened',
  type text not null default 'other',
  type_confidence numeric not null default 0.0,
  urgency text not null default 'routine',
  matched_patient_id uuid references public.patient_roster(patient_id),
  match_confidence numeric,
  extracted jsonb not null default '{}'::jsonb,
  routed_to text,
  routed_reason text,
  ocr_text text not null default '',
  ai_summary text,
  model_used text,
  sha256_hash text,
  is_user_uploaded boolean not null default true,
  source_kind text default 'upload',
  created_by text default 'anon',
  created_at timestamptz not null default now()
);

create index if not exists idx_user_faxes_received_at
  on public.user_faxes (received_at desc);
create index if not exists idx_user_faxes_status
  on public.user_faxes (status);
create index if not exists idx_user_faxes_type
  on public.user_faxes (type);
create index if not exists idx_user_faxes_parent
  on public.user_faxes (parent_id) where parent_id is not null;
create index if not exists idx_user_faxes_sha256
  on public.user_faxes (sha256_hash) where sha256_hash is not null;

-- =============================================================================
-- match_results — one per fax, top-N candidates + decision
-- =============================================================================
create table if not exists public.match_results (
  match_id uuid primary key default gen_random_uuid(),
  fax_id text not null references public.user_faxes(id) on delete cascade,
  candidates jsonb not null default '[]'::jsonb,
  decision text not null default 'unmatched',
  threshold_snapshot jsonb not null default '{}'::jsonb,
  matcher_version text not null default 'v1',
  created_at timestamptz not null default now()
);

create index if not exists idx_match_results_fax_id
  on public.match_results (fax_id);

-- =============================================================================
-- user_fax_events — immutable audit trail (INSERT only)
-- =============================================================================
create table if not exists public.user_fax_events (
  id text primary key,
  fax_id text not null references public.user_faxes(id) on delete cascade,
  at timestamptz not null default now(),
  kind text not null,
  actor text not null default 'system',
  detail text not null,
  model text,
  latency_ms int,
  tokens_in int,
  tokens_out int,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_fax_events_fax_at
  on public.user_fax_events (fax_id, at desc);

-- =============================================================================
-- category_config — per-clinic per-category thresholds, versioned
-- =============================================================================
create table if not exists public.category_config (
  id uuid primary key default gen_random_uuid(),
  clinic_id text not null default 'tmg',
  version int not null default 1,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_category_config_clinic_version
  on public.category_config (clinic_id, version);

-- =============================================================================
-- critical_ack — acknowledgement rows for critical results
-- =============================================================================
create table if not exists public.critical_ack (
  id text primary key,
  fax_id text not null,
  acknowledged_by text not null,
  called_at timestamptz not null default now(),
  patient_response text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_critical_ack_fax_id
  on public.critical_ack (fax_id);

-- =============================================================================
-- patient_messages — AI-drafted patient-facing messages
-- =============================================================================
create table if not exists public.patient_messages (
  id text primary key,
  fax_id text not null,
  patient_id uuid references public.patient_roster(patient_id),
  subject text not null,
  body text not null,
  status text not null default 'draft',
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_patient_messages_fax_id
  on public.patient_messages (fax_id);

-- =============================================================================
-- fax_extractions — structured extraction output per fax (one per fax)
-- =============================================================================
create table if not exists public.fax_extractions (
  id text primary key,
  fax_id text not null references public.user_faxes(id) on delete cascade,
  category text not null,
  subcategory text,
  schema_version text not null default 'v1',
  extraction jsonb not null default '{}'::jsonb,
  model_used text,
  latency_ms int,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_fax_extractions_fax_id
  on public.fax_extractions (fax_id);
create index if not exists idx_fax_extractions_category
  on public.fax_extractions (category);

-- =============================================================================
-- webhook_config — registered webhook endpoints
-- =============================================================================
create table if not exists public.webhook_config (
  id text primary key,
  url text not null,
  secret text,
  events jsonb not null default '["fax.extracted"]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- webhook_deliveries — delivery log for webhook calls
-- =============================================================================
create table if not exists public.webhook_deliveries (
  id text primary key,
  webhook_id text not null references public.webhook_config(id) on delete cascade,
  event_type text not null,
  fax_id text not null,
  payload jsonb not null,
  status_code int,
  response_body text,
  delivered_at timestamptz not null default now(),
  success boolean not null default false
);

create index if not exists idx_webhook_deliveries_webhook
  on public.webhook_deliveries (webhook_id);

-- =============================================================================
-- RLS — enable on every table, allow anon read+write (dev/demo-safe)
-- =============================================================================
alter table public.patient_roster       enable row level security;
alter table public.user_faxes           enable row level security;
alter table public.match_results        enable row level security;
alter table public.user_fax_events      enable row level security;
alter table public.category_config      enable row level security;
alter table public.critical_ack         enable row level security;
alter table public.patient_messages     enable row level security;
alter table public.fax_extractions      enable row level security;
alter table public.webhook_config       enable row level security;
alter table public.webhook_deliveries   enable row level security;

-- Drop existing policies first (idempotent)
do $$
declare
  _table text;
begin
  for _table in values
    ('patient_roster'), ('user_faxes'), ('match_results'),
    ('user_fax_events'), ('category_config'), ('critical_ack'), ('patient_messages'),
    ('fax_extractions'), ('webhook_config'), ('webhook_deliveries')
  loop
    execute format('drop policy if exists "anon_read_%s" on public.%I', _table, _table);
    execute format('drop policy if exists "anon_write_%s" on public.%I', _table, _table);
  end loop;
end $$;

create policy "anon_read_patient_roster"    on public.patient_roster for select to anon using (true);
create policy "anon_write_patient_roster"   on public.patient_roster for all to anon with check (true);
create policy "anon_read_user_faxes"        on public.user_faxes for select to anon using (true);
create policy "anon_write_user_faxes"       on public.user_faxes for insert to anon with check (true);
create policy "anon_read_match_results"     on public.match_results for select to anon using (true);
create policy "anon_write_match_results"    on public.match_results for insert to anon with check (true);
create policy "anon_read_user_fax_events"   on public.user_fax_events for select to anon using (true);
create policy "anon_write_user_fax_events"  on public.user_fax_events for insert to anon with check (true);
create policy "anon_read_category_config"   on public.category_config for select to anon using (true);
create policy "anon_write_category_config"  on public.category_config for all to anon with check (true);
create policy "anon_read_critical_ack"      on public.critical_ack for select to anon using (true);
create policy "anon_write_critical_ack"     on public.critical_ack for insert to anon with check (true);
create policy "anon_read_patient_messages"      on public.patient_messages for select to anon using (true);
create policy "anon_write_patient_messages"     on public.patient_messages for insert to anon with check (true);
create policy "anon_read_fax_extractions"       on public.fax_extractions for select to anon using (true);
create policy "anon_write_fax_extractions"      on public.fax_extractions for insert to anon with check (true);
create policy "anon_read_webhook_config"        on public.webhook_config for select to anon using (true);
create policy "anon_write_webhook_config"       on public.webhook_config for all to anon with check (true);
create policy "anon_read_webhook_deliveries"    on public.webhook_deliveries for select to anon using (true);
create policy "anon_write_webhook_deliveries"   on public.webhook_deliveries for insert to anon with check (true);

-- =============================================================================
-- Grants
-- =============================================================================
grant usage on schema public to anon;
grant select, insert, update on public.patient_roster   to anon;
grant select, insert on public.user_faxes               to anon;
grant select, insert on public.match_results             to anon;
grant select, insert on public.user_fax_events           to anon;
grant select, insert, update on public.category_config   to anon;
grant select, insert on public.critical_ack              to anon;
grant select, insert on public.patient_messages          to anon;
grant select, insert on public.fax_extractions           to anon;
grant select, insert, update, delete on public.webhook_config to anon;
grant select, insert on public.webhook_deliveries        to anon;
