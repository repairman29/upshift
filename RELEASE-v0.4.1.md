# Release v0.4.1 — Platform readiness & polish (post–v0.4.0)

**Target version:** 0.4.1 (or patch release)  
**Theme:** CLI parity (Python/Ruby/Go), Node yarn/pnpm, audit events, GitHub App workflow, docs & UI polish  
**Status:** Shipped. Deploy: Vercel production.

---

## Summary

- **Ecosystems:** Batch upgrade + full AI explain for Python, Ruby, Go; Node single/batch upgrade supports Yarn and pnpm; Python `scan --licenses`.
- **Platform readiness:** Optional audit event emission (`UPSHIFT_AUDIT_URL`); GitHub App beta workflow for PR scan comments; custom migration templates (`--template-file`); Vite 4→5 template.
- **Polish:** Radar empty state and copy; GitHub Action PR comment (update existing, report-path, View in Radar link); docs quick start and env/audit sections.

---

## Delivered

### CLI — Ecosystems
- Batch upgrade (`--all` / `--all-minor` / `--all-patch`) for Python, Ruby, and Go with backup, test, rollback.
- Full AI explain (`explain <pkg> --ai`) for Python, Ruby, and Go (1 credit); ecosystem-specific prompts and changelog handling.
- Node upgrade: single-package and batch upgrade detect and use npm, Yarn, or pnpm from lockfile; shared package-manager helpers and lockfile backup/rollback.
- Python: `scan --licenses` lists license per direct dependency (PyPI API).

### CLI — Platform readiness
- **Audit events:** When `UPSHIFT_AUDIT_URL` is set, CLI POSTs events (fire-and-forget) after `upgrade`, `fix`, and `scan --report --upload`; see [docs/team-features.md](docs/team-features.md) and [docs/configuration.md](docs/configuration.md).
- **GitHub App beta:** [.github/workflows/upshift-app-scan.yml](.github/workflows/upshift-app-scan.yml) runs `upshift scan` on PRs with App token, posts/updates one comment with summary and “View in Radar” link; [docs/github-app.md](docs/github-app.md) updated.
- **Custom migration templates:** `upshift migrate --template-file <path>`; added [migrations/vite-4-5.json](migrations/vite-4-5.json).

### GitHub Action & Radar
- Action: finds/updates existing Upshift scan comment, adds “View in Radar” link, supports `report-path` input.
- Radar UI: clearer empty state and placeholder copy.

### Docs
- [docs/user-guide.md](docs/user-guide.md): “Quick start (5 minutes)” at top.
- [docs/configuration.md](docs/configuration.md): environment variables (Team / audit).
- [docs/team-features.md](docs/team-features.md): CLI readiness (audit, org, API token).
- [docs/cli-reference.md](docs/cli-reference.md): explain `--ai`, migrate `--template-file`, upgrade yarn/pnpm.
- [migrations/README.md](migrations/README.md): vite-4-5 template and `--template-file`.
- [ROADMAP.md](ROADMAP.md): “Still coming” and “Next (platform / v0.5.0)” updated.

### Tests
- E2E: Node/Python batch upgrade dry-run, status --json, migrate --template-file and --list, scan --licenses for Python; 16 cases passing.

---

## Backend in-repo (post–v0.4.1)

- **Platform audit endpoint** — `supabase/functions/audit-events` + migration `20250203120000_audit_logs.sql`. Set `UPSHIFT_AUDIT_URL` to the function URL.
- **Org-level credit pools** — Migration `20250203130000_org_credit_pools.sql` (orgs, org_members, credit_transactions). Platform (Next.js + Stripe) implements billing.
- **GitHub App webhook** — `supabase/functions/github-app-webhook` + migration `20250203140000_github_app_installations.sql`. Set `GITHUB_WEBHOOK_SECRET` and point App webhook at the function.
- **Enterprise** — [docs/enterprise.md](docs/enterprise.md): SSO, on-premise, SLA, contact.
