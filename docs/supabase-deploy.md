# Supabase: deploy migrations and Edge Functions (CLI & APIs)

This doc covers running SQL migrations and deploying Edge Functions using the **Supabase CLI**, with optional **I/O monitoring** via `supabase inspect db`, and programmatic options via the **Management API**.

---

## 1. Supabase CLI upgrade

Use a recent CLI so `db push`, `inspect db`, and `functions deploy` work correctly.

**If installed via npm (project or global):**

```bash
# Project (recommended: pin version in package.json devDependencies)
npm install -D supabase@latest
# Then use: npx supabase <command>

# Global
npm update -g supabase
```

**If installed via Homebrew (macOS):**

```bash
brew upgrade supabase
```

**Check version:**

```bash
supabase --version
# or
npx supabase --version
```

Requires **Node.js 18+** (20+ recommended for latest CLI). For `supabase link` and `db push` you need a linked project or `--db-url`.

---

## 2. Run migrations (exec SQL) via CLI

Migrations in `supabase/migrations/` are applied with **`supabase db push`**. This executes the SQL in each new migration file against the linked (or specified) database and records them in `supabase_migrations.schema_migrations`.

**Link project (once):**

```bash
supabase login
supabase link --project-ref YOUR_REF
# When prompted, enter database password or set SUPABASE_DB_PASSWORD
```

**Push migrations (exec SQL):**

```bash
# From repo root (where supabase/ lives)
supabase db push --linked
```

**Dry-run (see what would be applied, no changes):**

```bash
supabase db push --linked --dry-run
```

**Self-hosted or custom DB URL:**

```bash
supabase db push --db-url "postgresql://user:pass@host:5432/db"
```

**List migration status (local vs remote):**

```bash
supabase migration list --linked
```

Other useful commands:

- `supabase migration up --linked` — Apply pending migrations (alternative to `db push`).
- `supabase db reset --linked` — **Destructive:** reset remote DB and re-apply all migrations from scratch (drops user data).
- `supabase db lint --linked` — Lint schema (plpgsql_check).

---

## 3. I/O and monitoring: `supabase inspect db`

After running migrations (or anytime), you can use **`supabase inspect db`** to monitor database I/O, long-running queries, bloat, and locks. These use PostgreSQL stats (`pg_stat_*`, `pg_statio_*`) and work with a linked project or `--db-url`.

**Table I/O (read/write activity):**

```bash
supabase inspect db traffic-profile --linked
```

Shows blocks read/write and activity ratio (read-heavy, write-heavy, balanced) per table. Useful after migrations to see which objects get traffic.

**Other inspect commands:**

| Command | What it shows |
|--------|----------------|
| `supabase inspect db long-running-queries --linked` | Queries running &gt; 5 minutes |
| `supabase inspect db bloat --linked` | Estimated table/index bloat (dead tuples) |
| `supabase inspect db vacuum-stats --linked` | Last vacuum, dead rows, autovacuum expectation |
| `supabase inspect db blocking --linked` | Statements holding locks and blocked statements |
| `supabase inspect db locks --linked` | Exclusive locks on relations |
| `supabase inspect db outliers --linked` | Statements by total execution time and sync I/O |
| `supabase inspect db calls --linked` | Statements by call count |
| `supabase inspect db table-stats --linked` | Table statistics |
| `supabase inspect db index-stats --linked` | Index statistics |

**Full report (CSV exports):**

```bash
supabase inspect report --linked --output-dir ./supabase-inspect
```

Use **traffic-profile** and **outliers** for I/O-focused monitoring after applying migrations.

---

## 4. Deploy Edge Functions

After migrations, deploy Edge Functions so Radar Pro, audit, and GitHub App webhook work:

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy radar-upload
supabase functions deploy radar-reports
supabase functions deploy radar-report
supabase functions deploy radar-alert-settings
supabase functions deploy audit-events
supabase functions deploy github-app-webhook
supabase functions deploy jarvis
```

Set secrets (e.g. for GitHub App webhook) before or after deploy:

```bash
supabase secrets set GITHUB_WEBHOOK_SECRET=your_app_webhook_secret
```

---

## 5. One-shot: migrations + I/O check (scripts)

From repo root you can use npm scripts (if Supabase CLI is installed):

```bash
# Push migrations to linked project
npm run supabase:push

# Dry-run only
npm run supabase:push:dry

# After push: show table I/O profile
npm run supabase:inspect
```

See `package.json` scripts: `supabase:push`, `supabase:push:dry`, `supabase:inspect`, `supabase:deploy`. When `supabase` is in devDependencies, `npm run` uses the project’s CLI; run from repo root after `supabase link`.

---

## 6. Management API (programmatic SQL / migrations)

For CI or automation you can run SQL or apply migrations via the **Supabase Management API** instead of the CLI.

**Auth:** Use a [Personal Access Token](https://supabase.com/dashboard/account/tokens) in the header:

```http
Authorization: Bearer <access_token>
```

**Apply a migration (Beta):**

```http
POST https://api.supabase.com/v1/projects/{ref}/database/migrations
Content-Type: application/json

{
  "query": "create table if not exists ...",
  "name": "optional_migration_name",
  "rollback": "optional_rollback_sql"
}
```

**Run a SQL query (Beta):**

```http
POST https://api.supabase.com/v1/projects/{ref}/database/query
Content-Type: application/json

{
  "query": "select 1",
  "parameters": [],
  "read_only": false
}
```

**List applied migrations (Beta):**

```http
GET https://api.supabase.com/v1/projects/{ref}/database/migrations
```

Rate limits apply (see [Management API](https://supabase.com/docs/reference/api/introduction)). For local or scripted use, the CLI (`db push` + `inspect db`) is usually simpler.

---

## 7. Order of operations (this repo)

1. **Upgrade CLI** — `npm install -D supabase@latest` or `brew upgrade supabase`.
2. **Link** — `supabase link --project-ref YOUR_REF` (once).
3. **Push migrations** — `supabase db push --linked` (applies all files in `supabase/migrations/` in order).
4. **Optional: I/O check** — `supabase inspect db traffic-profile --linked` (or `npm run supabase:inspect`).
5. **Deploy functions** — `supabase functions deploy` (or deploy individually).
6. **Secrets** — `supabase secrets set GITHUB_WEBHOOK_SECRET=...` for the GitHub App webhook.

Migrations in this repo: `radar_reports`, `radar_alert_settings`, `audit_logs`, `org_credit_pools`, `github_app_installations`.
