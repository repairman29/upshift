-- Org-level credit pools (Team plan): orgs, members, credit transactions
-- Platform (e.g. Next.js + Stripe) implements billing; CLI sends org_id via UPSHIFT_ORG

create table if not exists public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stripe_customer_id text,
  credit_balance int not null default 0,
  plan text not null default 'pro' check (plan in ('pro', 'team')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz default now(),
  unique(org_id, user_id)
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.orgs(id) on delete set null,
  user_id text,
  amount int not null,
  reason text,
  created_at timestamptz default now()
);

-- Ensure columns exist when tables were created elsewhere
alter table public.orgs add column if not exists updated_at timestamptz default now();
alter table public.org_members add column if not exists org_id uuid;
alter table public.org_members add column if not exists user_id text;
alter table public.org_members add column if not exists role text default 'member';
alter table public.org_members add column if not exists created_at timestamptz default now();
alter table public.credit_transactions add column if not exists org_id uuid;
alter table public.credit_transactions add column if not exists user_id text;
alter table public.credit_transactions add column if not exists created_at timestamptz default now();

create index if not exists idx_org_members_org on public.org_members(org_id);
create index if not exists idx_org_members_user on public.org_members(user_id);
create index if not exists idx_credit_transactions_org_created on public.credit_transactions(org_id, created_at desc);
create index if not exists idx_credit_transactions_user_created on public.credit_transactions(user_id, created_at desc);

comment on table public.orgs is 'Team/Pro orgs; credit_balance used for Team plan pool';
comment on table public.org_members is 'Org membership; user_id from auth provider';
comment on table public.credit_transactions is 'Credit debits (amount < 0) and top-ups (amount > 0); reason e.g. fix, explain_ai';
