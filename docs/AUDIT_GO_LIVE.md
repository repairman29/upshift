# Audit endpoint — go-live checklist (P0)

Get the **platform audit endpoint** live so the CLI can send events when `UPSHIFT_AUDIT_URL` is set. Positions Upshift for **compliance automation** (fintech/healthtech). See [STRATEGY_AND_FEEDBACK.md](STRATEGY_AND_FEEDBACK.md) and [team-features.md](team-features.md).

**Quick path:** From repo root, run `./scripts/ship-audit.sh` to apply migrations, deploy the function, and print the URL. Then complete section 3–4 below.

---

## Pre-requisites

- [x] Supabase project linked
- [x] You have Supabase **service role** key (Dashboard → Settings → API) for the Edge Function

---

## 1. Database

- [x] Run migrations so `audit_logs` exists:  
  `supabase db push`  
  (Uses [supabase/migrations/20250203120000_audit_logs.sql](../supabase/migrations/20250203120000_audit_logs.sql))

---

## 2. Deploy Edge Function

**Optional — run the script** (from repo root; runs db push, deploys function, prints URL):

```bash
./scripts/ship-audit.sh
# Or with project ref: SUPABASE_PROJECT_REF=<ref> ./scripts/ship-audit.sh
```

**Or do it manually:**

- [x] Deploy:  
  `supabase functions deploy audit-events --project-ref <ref>`
- [x] Function uses auto-injected `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; no extra secrets required for basic flow

---

## 3. Public URL

- [x] Audit endpoint URL:  
  `https://<project-ref>.supabase.co/functions/v1/audit-events`
- [x] Document for customers (e.g. in [team-features.md](team-features.md) and [configuration.md](configuration.md)):  
  Set **UPSHIFT_AUDIT_URL** to this URL. Optional: **UPSHIFT_ORG**, **UPSHIFT_API_TOKEN**.

---

## 4. CLI and docs

- [x] [configuration.md](configuration.md) already documents `UPSHIFT_AUDIT_URL`, `UPSHIFT_ORG`, `UPSHIFT_API_TOKEN`
- [x] In [team-features.md](team-features.md) or pricing page, add one line: *"Team tier: set UPSHIFT_AUDIT_URL to our audit endpoint for compliance-ready logs."*

---

## Done when

- [x] `audit-events` is deployed and returns 200 for valid POSTs.
- [x] Customers can set `UPSHIFT_AUDIT_URL` and see events in `audit_logs` (or your platform UI if you build one).

---

## Optional later

- Platform UI to view/filter/export audit logs.
- Validate `UPSHIFT_API_TOKEN` in the Edge Function and map to org_id.
