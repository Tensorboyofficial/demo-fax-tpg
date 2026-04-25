-- =============================================================================
-- Migration 001: Analytics & Tracking Enhancements
-- Adds: auto-incrementing IDs, timestamps, processing metrics, analytics views
-- Safe to run on existing data — all additions are non-breaking.
-- =============================================================================

-- ─── 1. Auto-increment sequence for user_faxes ───
-- Gives every fax a stable numeric ID for analytics (FAX #1, #2, #3...)
-- The text `id` remains the primary key for app-level references.
alter table public.user_faxes
  add column if not exists seq_id bigint;

create sequence if not exists public.user_faxes_seq_id_seq;
alter table public.user_faxes
  alter column seq_id set default nextval('public.user_faxes_seq_id_seq');

-- Backfill existing rows that have null seq_id
do $$
begin
  update public.user_faxes
  set seq_id = nextval('public.user_faxes_seq_id_seq')
  where seq_id is null;
end $$;

create unique index if not exists idx_user_faxes_seq_id
  on public.user_faxes (seq_id);

-- ─── 2. Tracking timestamps on user_faxes ───
alter table public.user_faxes
  add column if not exists updated_at timestamptz default now(),
  add column if not exists classified_at timestamptz,
  add column if not exists matched_at timestamptz,
  add column if not exists routed_at timestamptz,
  add column if not exists processed_at timestamptz,
  add column if not exists opened_at timestamptz;

-- Auto-update updated_at on any change
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_user_faxes_updated_at on public.user_faxes;
create trigger trg_user_faxes_updated_at
  before update on public.user_faxes
  for each row execute function public.set_updated_at();

-- ─── 3. Processing metrics on user_faxes ───
alter table public.user_faxes
  add column if not exists classification_latency_ms int,
  add column if not exists extraction_latency_ms int,
  add column if not exists total_tokens_in int,
  add column if not exists total_tokens_out int,
  add column if not exists processing_duration_ms int;

-- ─── 4. Auto-increment for user_fax_events ───
alter table public.user_fax_events
  add column if not exists seq_id bigint;

create sequence if not exists public.user_fax_events_seq_id_seq;
alter table public.user_fax_events
  alter column seq_id set default nextval('public.user_fax_events_seq_id_seq');

do $$
begin
  update public.user_fax_events
  set seq_id = nextval('public.user_fax_events_seq_id_seq')
  where seq_id is null;
end $$;

create unique index if not exists idx_user_fax_events_seq_id
  on public.user_fax_events (seq_id);

-- ─── 5. Indexes for analytics queries ───
create index if not exists idx_user_faxes_created_at
  on public.user_faxes (created_at desc);
create index if not exists idx_user_faxes_type_status
  on public.user_faxes (type, status);
create index if not exists idx_user_faxes_matched_patient
  on public.user_faxes (matched_patient_id) where matched_patient_id is not null;
create index if not exists idx_user_faxes_model
  on public.user_faxes (model_used) where model_used is not null;

-- ─── 6. Analytics views ───

-- Daily fax volume by type
create or replace view public.v_daily_fax_volume as
select
  date_trunc('day', received_at)::date as day,
  type,
  count(*) as total,
  count(*) filter (where status = 'unopened') as unopened,
  count(*) filter (where status = 'opened') as opened,
  count(*) filter (where status = 'archived') as archived,
  count(*) filter (where status = 'needs_review') as needs_review,
  avg(type_confidence) as avg_confidence,
  avg(classification_latency_ms) as avg_classification_ms
from public.user_faxes
group by 1, 2
order by 1 desc, 2;

-- Processing pipeline metrics
create or replace view public.v_processing_metrics as
select
  date_trunc('day', created_at)::date as day,
  count(*) as faxes_processed,
  avg(classification_latency_ms)::int as avg_classify_ms,
  avg(extraction_latency_ms)::int as avg_extract_ms,
  avg(processing_duration_ms)::int as avg_total_ms,
  sum(total_tokens_in) as total_tokens_in,
  sum(total_tokens_out) as total_tokens_out,
  count(*) filter (where matched_patient_id is not null) as auto_matched,
  count(*) filter (where matched_patient_id is null) as unmatched,
  avg(type_confidence) as avg_confidence,
  count(*) filter (where type_confidence < 0.7) as low_confidence_count
from public.user_faxes
group by 1
order by 1 desc;

-- Model usage breakdown
create or replace view public.v_model_usage as
select
  model_used,
  count(*) as total_faxes,
  avg(classification_latency_ms)::int as avg_latency_ms,
  sum(total_tokens_in) as tokens_in,
  sum(total_tokens_out) as tokens_out,
  avg(type_confidence) as avg_confidence
from public.user_faxes
where model_used is not null
group by 1
order by 2 desc;

-- Category distribution
create or replace view public.v_category_distribution as
select
  type,
  count(*) as total,
  avg(type_confidence) as avg_confidence,
  count(*) filter (where matched_patient_id is not null) as matched,
  count(*) filter (where status = 'needs_review') as needs_review,
  min(received_at) as first_seen,
  max(received_at) as last_seen
from public.user_faxes
group by 1
order by 2 desc;

-- Patient match rate
create or replace view public.v_patient_match_rate as
select
  date_trunc('day', created_at)::date as day,
  count(*) as total,
  count(*) filter (where matched_patient_id is not null) as matched,
  count(*) filter (where matched_patient_id is null) as unmatched,
  round(
    100.0 * count(*) filter (where matched_patient_id is not null) / nullif(count(*), 0),
    1
  ) as match_rate_pct,
  avg(match_confidence) filter (where match_confidence is not null) as avg_match_score
from public.user_faxes
group by 1
order by 1 desc;

-- ─── 7. Grant access to views ───
grant select on public.v_daily_fax_volume to anon;
grant select on public.v_processing_metrics to anon;
grant select on public.v_model_usage to anon;
grant select on public.v_category_distribution to anon;
grant select on public.v_patient_match_rate to anon;

-- ─── 8. Allow updates on user_faxes (needed for new timestamp columns) ───
drop policy if exists "anon_update_user_faxes" on public.user_faxes;
create policy "anon_update_user_faxes" on public.user_faxes for update to anon using (true) with check (true);
grant update on public.user_faxes to anon;
