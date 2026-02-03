-- Platform audit logs: CLI posts events when UPSHIFT_AUDIT_URL is set (Team/Enterprise)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id text,
  user_id text,
  event_type text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb,
  ip text,
  user_agent text,
  created_at timestamptz default now()
);

-- Ensure columns exist when table was created elsewhere (e.g. different migration)
alter table public.audit_logs add column if not exists org_id text;
alter table public.audit_logs add column if not exists user_id text;
alter table public.audit_logs add column if not exists event_type text;
alter table public.audit_logs add column if not exists resource_type text;
alter table public.audit_logs add column if not exists resource_id text;
alter table public.audit_logs add column if not exists metadata jsonb;
alter table public.audit_logs add column if not exists ip text;
alter table public.audit_logs add column if not exists user_agent text;
alter table public.audit_logs add column if not exists created_at timestamptz default now();

create index if not exists idx_audit_logs_org_created
  on public.audit_logs (org_id, created_at desc);
create index if not exists idx_audit_logs_event_created
  on public.audit_logs (event_type, created_at desc);

comment on table public.audit_logs is 'Platform: audit events from CLI (upgrade, fix, scan_upload); scope by org_id for Team';
