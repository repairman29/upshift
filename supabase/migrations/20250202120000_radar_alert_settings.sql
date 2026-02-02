-- Radar Pro: alert settings per upload token (webhook when thresholds exceeded)
create table if not exists public.radar_alert_settings (
  upload_token text primary key,
  webhook_url text,
  max_outdated int,
  max_vulns int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.radar_alert_settings is 'Radar Pro: optional webhook + thresholds; when report exceeds, POST to webhook_url';
