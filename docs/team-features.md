# Team & org features (design)

Planned Pro/Team features that require platform or backend work. This doc is a design reference for implementers.

---

## Org-level credit pools

**Goal:** Team plan allows an org to have a shared credit pool; members (or CI) consume from the pool instead of per-user credits.

**Concepts:**

- **Org** — Billing entity (e.g. GitHub org or manual org). Has a **credit pool** (balance).
- **Members** — Users linked to the org (e.g. via GitHub OAuth or invite). Can use org credits when running `upshift explain --ai`, `upshift fix`, etc., if configured to use org context.
- **Usage** — Each AI call (explain --ai, fix) deducts from the pool (or from user’s personal credits if not using org).

**Schema (conceptual):**

- `orgs`: id, name, stripe_customer_id, credit_balance, plan (pro | team), created_at, updated_at
- `org_members`: org_id, user_id, role (admin | member), created_at
- `credit_transactions`: id, org_id (nullable), user_id, amount (negative = debit), reason (e.g. "fix", "explain_ai"), created_at

**CLI / API:**

- Auth context: user token can optionally include `org_id` (e.g. from `UPSHIFT_ORG` or selected org in dashboard).
- Billing API: when deducting credits, accept `org_id`; if present and user is member, debit org pool; otherwise debit user.

**Roadmap:** ROADMAP.md → Team Features → “Org-level credit pools”.

---

## Audit logs

**Goal:** Team/enterprise customers can see who ran which upgrades, when, and from where (CI vs user).

**Concepts:**

- **Audit event** — Immutable log entry: who (user_id or service_id), what (e.g. `upgrade`, `fix`, `scan --upload`), resource (e.g. repo, package), when, metadata (version, outcome, IP, user_agent).
- **Scope** — Per-org for Team plan; optionally per-user for Pro.

**Schema (conceptual):**

- `audit_logs`: id, org_id (nullable), user_id, event_type, resource_type, resource_id, metadata (jsonb), ip, user_agent, created_at

**Events to log (examples):**

- `upgrade` — package, from_version, to_version, cwd/repo, outcome (success | rollback | fail)
- `fix` — package, dry_run vs applied
- `scan_upload` — report_id, radar token (or org)
- `credit_debit` — amount, reason, org_id if org pool

**API:**

- `GET /api/audit-logs` — List logs (org scope for Team; require admin or viewer role). Query: since, until, event_type, limit.

**Roadmap:** ROADMAP.md → Team Features → “Audit logs”.

---

## CLI readiness (audit and org context)

The CLI is ready for the platform to plug in:

- **Audit events** — When `UPSHIFT_AUDIT_URL` is set, the CLI POSTs audit events (fire-and-forget) after:
  - **upgrade** — `event_type: "upgrade"`, `resource_type: "package"`, metadata: `from_version`, `to_version`, `outcome`
  - **fix** — `event_type: "fix"`, `resource_type: "package"`, metadata: `applied`, `fix_count`, `from_version`, `to_version`
  - **scan_upload** — `event_type: "scan_upload"`, `resource_type: "report"`, metadata: `outdated_count`, `cwd`
- **Org context** — When `UPSHIFT_ORG` is set, the CLI includes `org_id` in audit payloads (and future credit/billing calls). The platform can use this to attribute usage to the org.
- **Auth** — Optional `UPSHIFT_API_TOKEN` is sent as `Authorization: Bearer <token>` when POSTing to `UPSHIFT_AUDIT_URL`.

No events are sent if `UPSHIFT_AUDIT_URL` is not set. See [docs/configuration.md](configuration.md) for env vars.

## Implementation notes

- **Audit endpoint** — This repo includes a Supabase Edge Function and table: `supabase/functions/audit-events` and migration `20250203120000_audit_logs.sql`. Point `UPSHIFT_AUDIT_URL` at your deployed function (e.g. `https://<ref>.supabase.co/functions/v1/audit-events`) to store CLI events.
- **Org credit pools** — Migrations `20250203130000_org_credit_pools.sql` define `orgs`, `org_members`, and `credit_transactions`. The platform (e.g. Next.js + Stripe) implements billing and deducts from org balance; CLI sends `org_id` via `UPSHIFT_ORG`.
- **GitHub App webhook** — Edge Function `supabase/functions/github-app-webhook` and table `github_app_installations` receive installation events. Set `GITHUB_WEBHOOK_SECRET` in Supabase secrets and point your App’s webhook URL at the function.
- See [docs/configuration.md](configuration.md) for env vars and [docs/enterprise.md](enterprise.md) for Enterprise (SSO, on-premise, SLA).
