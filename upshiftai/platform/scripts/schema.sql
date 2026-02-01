-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS table
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SUBSCRIPTIONS table
create table if not exists subscriptions (
  user_id uuid references users(id) on delete cascade not null primary key,
  customer_id text,
  subscription_id text,
  status text default 'free',
  plan_tier text default 'free',
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- API KEYS table (Renamed column 'key' -> 'api_key_value' to avoid reserved word conflicts)
create table if not exists api_keys (
  api_key_value text primary key,
  user_id uuid references users(id) on delete cascade not null,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_used_at timestamp with time zone
);

-- AI USAGE LOGS table
create table if not exists ai_usage (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
  used_api_key text references api_keys(api_key_value),
  feature text not null,
  tokens_used int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- REPORTS table (Missing from previous schema but needed for store.js)
create table if not exists reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
  project_name text,
  ecosystem text,
  summary jsonb,
  markdown text,
  payload jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- MONTHLY USAGE VIEW
create or replace view usage_this_month as
select 
  user_id,
  count(*) as query_count
from ai_usage
where created_at > date_trunc('month', now())
group by user_id;
