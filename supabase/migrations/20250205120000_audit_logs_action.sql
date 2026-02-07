-- Ensure audit_logs has action (some deployments had it as NOT NULL; align and allow function to set it)
alter table public.audit_logs add column if not exists action text;
-- Allow null so existing rows and inserts without action still work
alter table public.audit_logs alter column action drop not null;
