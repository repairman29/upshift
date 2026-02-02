-- Radar Pro: persisted scan reports (upload from CLI/CI, view in dashboard)
create table if not exists public.radar_reports (
  id uuid primary key default gen_random_uuid(),
  upload_token text not null,
  payload jsonb not null,
  name text,
  created_at timestamptz default now()
);

create index if not exists idx_radar_reports_upload_token_created_at
  on public.radar_reports (upload_token, created_at desc);

comment on table public.radar_reports is 'Radar Pro: scan reports uploaded via CLI/CI (X-Upload-Token)';
