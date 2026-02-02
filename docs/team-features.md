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

## Implementation notes

- Credit pools and audit logs live in the **platform** (e.g. upshiftai/platform with Stripe + Supabase), not in the CLI. The CLI sends usage and context (org_id, user token) to the platform.
- This repo can document the intended behavior and API shape; actual tables and endpoints are implemented in the platform repo or backend services.
