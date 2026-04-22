-- Cevi demo schema — Texas Physicians Group
-- Apply this in the Supabase SQL editor (https://supabase.com/dashboard → SQL Editor → New query → paste → Run).
-- Idempotent: safe to re-run. All tables live under the public schema with permissive-for-anon RLS.

-- =============================================================================
-- user_faxes — faxes uploaded by end users (inbox seed data stays in-memory)
-- =============================================================================
create table if not exists public.user_faxes (
  id text primary key,
  received_at timestamptz not null default now(),
  pages int not null default 1,
  from_number text,
  from_org text,
  fax_number_to text default '817-860-2704',
  to_clinic text,
  status text not null default 'needs_review',
  type text not null default 'unknown',
  type_confidence numeric not null default 0.0,
  urgency text not null default 'routine',
  matched_patient_id text,
  match_confidence numeric,
  extracted jsonb not null default '{}'::jsonb,
  routed_to text,
  routed_reason text,
  ocr_text text not null,
  ai_summary text,
  model_used text,
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

-- =============================================================================
-- user_fax_events — audit trail for uploaded faxes
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
-- critical_ack — acknowledgement rows for critical lab results
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
-- patient_messages — drafted patient-facing notes (from "Draft patient message")
-- =============================================================================
create table if not exists public.patient_messages (
  id text primary key,
  fax_id text not null,
  patient_id text,
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
-- RLS — enable on every table, allow anon to read and insert (demo-safe).
-- In production, tighten to per-clinic / per-user policies.
-- =============================================================================
alter table public.user_faxes        enable row level security;
alter table public.user_fax_events   enable row level security;
alter table public.critical_ack      enable row level security;
alter table public.patient_messages  enable row level security;

drop policy if exists "anon_read_user_faxes"        on public.user_faxes;
drop policy if exists "anon_write_user_faxes"       on public.user_faxes;
drop policy if exists "anon_read_user_fax_events"   on public.user_fax_events;
drop policy if exists "anon_write_user_fax_events"  on public.user_fax_events;
drop policy if exists "anon_read_critical_ack"      on public.critical_ack;
drop policy if exists "anon_write_critical_ack"     on public.critical_ack;
drop policy if exists "anon_read_patient_messages"  on public.patient_messages;
drop policy if exists "anon_write_patient_messages" on public.patient_messages;

create policy "anon_read_user_faxes"
  on public.user_faxes for select to anon using (true);
create policy "anon_write_user_faxes"
  on public.user_faxes for insert to anon with check (true);

create policy "anon_read_user_fax_events"
  on public.user_fax_events for select to anon using (true);
create policy "anon_write_user_fax_events"
  on public.user_fax_events for insert to anon with check (true);

create policy "anon_read_critical_ack"
  on public.critical_ack for select to anon using (true);
create policy "anon_write_critical_ack"
  on public.critical_ack for insert to anon with check (true);

create policy "anon_read_patient_messages"
  on public.patient_messages for select to anon using (true);
create policy "anon_write_patient_messages"
  on public.patient_messages for insert to anon with check (true);

-- =============================================================================
-- grants — publishable (anon) role needs usage on schema + select/insert on tables.
-- Supabase does this by default; explicit grants below are defensive.
-- =============================================================================
grant usage on schema public to anon;
grant select, insert on public.user_faxes         to anon;
grant select, insert on public.user_fax_events    to anon;
grant select, insert on public.critical_ack       to anon;
grant select, insert on public.patient_messages   to anon;
