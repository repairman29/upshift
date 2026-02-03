-- GitHub App installations: store installs from webhook for one-click App backend
create table if not exists public.github_app_installations (
  id uuid primary key default gen_random_uuid(),
  installation_id bigint not null unique,
  account_login text,
  account_id bigint,
  target_type text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_github_app_installations_account on public.github_app_installations(account_id);

comment on table public.github_app_installations is 'GitHub App: installations from webhook (installation.created/deleted)';
