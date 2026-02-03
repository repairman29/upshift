# Upshift Roadmap

This document outlines planned features and improvements for Upshift.

---

## ✅ Completed (v0.3.0)

- [x] `upshift scan` — scan for outdated dependencies (npm, yarn, pnpm)
- [x] `upshift explain` — version delta, breaking-change warnings, links
- [x] `upshift explain --ai` — AI-powered deep analysis of breaking changes
- [x] `upshift explain --risk` — risk score (low / medium / high)
- [x] `upshift explain --changelog` — fetch changelog from GitHub
- [x] `upshift upgrade` — upgrade with test and auto-rollback
- [x] `upshift upgrade --all` — batch upgrade all packages
- [x] `upshift fix` — AI-powered code fixes for breaking changes
- [x] `upshift interactive` — TUI for selecting packages
- [x] `upshift workspaces` — monorepo support
- [x] `upshift audit` — security vulnerability scanning
- [x] `upshift notify` — Slack/Discord/webhook notifications
- [x] `upshift rollback` — restore previous state
- [x] GitHub Action for CI/CD integration
- [x] VS Code extension

---

## ✅ Completed (v0.4.0 — Innovation Release)

### AI & intelligence
- [x] **Context-aware explain** — `explain` reports “Used in your code” (import/require scan) so you see what actually affects your project
- [x] **Multi-step upgrade plan** — `upshift plan` outputs ordered list of upgrades (dependency order + risk); `--mode all|minor|patch`
- [x] **Proactive suggestions** — `upshift suggest` recommends low-risk, high-value upgrades; `--limit N`, `--json`
- [x] **Migration templates (first set)** — `migrations/react-18-19.json` + `migrations/README.md`; CONTRIBUTING path for community templates
- [x] **`upgrade --dry-run`** — Preview planned changes (command, backup dir, tests) without modifying files; batch upgrade supports `--dry-run` too

### Ecosystems & reach
- [x] **Python (pip/poetry)** — `upshift scan` in Python projects uses `pip list --outdated` or `poetry show --outdated`
- [x] **Ruby (bundler)** — `upshift scan` in Gemfile projects uses `bundle outdated --strict --parseable`
- [x] **Go modules** — `upshift scan` in go.mod projects uses `go list -m -u -json all`
- [x] **Monorepo / polyrepo report** — `upshift scan --report path.json` writes JSON for multiple repos; Radar aggregates
- [x] **License visibility** — `upshift scan --licenses` lists license per direct dependency (npm)

### Workflow & platform
- [x] **HITL: approval config** — `.upshiftrc.json` supports `approval.mode` (prompt | none | webhook), `approval.requireFor` (major | all), `approval.webhookUrl`
- [x] **HITL: webhook** — POST proposed upgrade to `approval.webhookUrl`; 200 = approve, non-200 = reject
- [x] **Radar (Free)** — Central view at [upshiftai.dev/radar](https://upshiftai.dev/radar): paste/upload scan reports, summary cards (repos / outdated / vulns), table per repo; no account
- [x] **`upshift radar`** — CLI command opens Radar in browser (or prints URL with `--no-open`)
- [x] **Regression recording (opt-in)** — `UPSHIFT_RECORD_OUTCOMES=1` appends upgrade outcome (package, versions, testsPassed) to `.upshift/outcomes.json`

### Research & experiments
- [x] **Changelog / commit in explain** — Existing `--changelog` and risk scoring use release notes; JSON output includes `usageInCodebase`
- [x] **Regression signal** — Local outcome recording (above) for “will this break?” over time
- [x] **Community migration templates** — CONTRIBUTING + `migrations/README.md`; first template (React 18→19) in repo
- [x] **Opt-in insights doc** — [docs/opt-in-insights.md](docs/opt-in-insights.md): no telemetry by default; `UPSHIFT_RECORD_OUTCOMES` local only; future anonymized opt-in described

### Docs & version
- [x] **README** — Radar, suggest, plan, scan --licenses/--report, approval webhook, opt-in insights link
- [x] **ROADMAP** — v0.4.0 block, Innovation section, Radar (central, revenue)
- [x] **When it breaks & guardrails** — v0.4.0 HITL webhook and Radar reference
- [x] **Version** — package.json 0.4.0

---

## 🔜 Coming Soon

### Code Migrations
- [x] **Apply migration template from CLI** — `upshift migrate <package>` with `--list`, `--template`, `--dry-run`; templates in `migrations/` (React 18→19, Next.js 13→14, Vue 2→3)
- [x] **Additional migration templates** — Angular 16→17 (`@angular/core`), TypeScript 4→5 (`typescript`); more (Jest, etc.) welcome via CONTRIBUTING

### Integrations
- [x] **GitHub App scaffold** — [docs/github-app.md](docs/github-app.md): how to build an App (permissions, webhook flow, example workflow with App token)
- [x] **GitHub App (beta)** — Workflow [.github/workflows/upshift-app-scan.yml](.github/workflows/upshift-app-scan.yml): scan on PR with App token (private repos), post/update comment; docs in [docs/github-app.md](docs/github-app.md). Published installable Upshift App (one-click) still coming.
- [x] **Radar Pro (MVP)** — Persisted dashboard (Supabase `radar_reports`), report history (list + load), upload from CLI; dashboard UI (Radar Pro section). **Alerts:** `radar_alert_settings` table + webhook when report exceeds thresholds; Edge Function `radar-alert-settings` (GET/PUT); dashboard UI for webhook URL and max outdated/vulns.

### Language Support
- [x] **Python explain (minimal)** — In Python projects, `upshift explain <pkg>` shows version delta (pip show / PyPI), upgrade hint (`pip install -U <pkg>`); no AI yet
- [x] **Python (pip/poetry) full parity** — `upshift upgrade <pkg>` in Python projects: pip/poetry upgrade, backup, test, rollback
- [x] **Ruby/Go upgrade parity** — `upshift upgrade <pkg>` in Ruby (Gemfile) and Go (go.mod) projects: backup (Gemfile/Gemfile.lock or go.mod/go.sum), bundle update / go get, run tests, rollback on failure
- [x] **Batch upgrade (Python/Ruby/Go)** — `upshift upgrade --all` / `--all-minor` / `--all-patch` in Python, Ruby, and Go projects: list outdated, filter by mode, run upgrades with tests and rollback tip
- [x] **Ruby/Go full explain** — In Ruby/Go projects, `upshift explain <pkg> --risk` and `--changelog` show risk (major-delta based) and changelog (GitHub from RubyGems source_code_uri or Go module path); JSON output includes risk and changelog

### Team Features
- [x] **Upgrade policies** — `.upshiftrc.json`: `upgradePolicy: { blockRisk: ["high"] }` blocks high (or medium) risk upgrades; single and batch upgrade respect policy; use `-y` to override
- [ ] **Org-level credit pools** — Shared credit pool per org (Team plan); design: [docs/team-features.md](docs/team-features.md). CLI ready: `UPSHIFT_ORG` for org context when platform is live.
- [ ] **Audit logs** — Who ran which upgrade/fix, when, from where; design: [docs/team-features.md](docs/team-features.md). **CLI ready:** set `UPSHIFT_AUDIT_URL` (and optional `UPSHIFT_ORG`, `UPSHIFT_API_TOKEN`); CLI POSTs events after upgrade, fix, scan_upload. Platform implements endpoint and storage.

### IDE & UX
- [x] **VS Code: Explain for current file** — Right-click in .ts/.tsx/.js/.jsx → “Upshift: Explain dependency for current file”; detects package from imports, runs explain, shows result in Upshift output channel
- [x] **VS Code: Fix for current file** — Right-click → “Upshift: Fix dependency for current file”; runs `upshift fix <pkg> --dry-run --json`, shows fix list in channel; **Apply in editor** (WorkspaceEdit) or Run in terminal
- [x] **VS Code: show diff in editor, apply fix from editor** — Fix command shows fixes and offers “Apply in editor” to apply edits in place

### Enterprise
- [ ] SSO (SAML/OIDC)
- [ ] On-premise deployment option
- [ ] SLA and dedicated support

---

## 🚀 v0.4.0 — Innovation Release (shipped)

v0.4.0 stacked deliverables across all four innovation areas. **Full checklist:** [RELEASE-v0.4.0.md](RELEASE-v0.4.0.md). **Shipped items:** see **Completed (v0.4.0)** above.

| Section | Shipped in v0.4.0 | Still coming (platform / v0.5.0) |
|--------|-------------------|----------------------------------|
| **1. AI & intelligence** | Context-aware explain, `upshift plan`, `upshift suggest`, migration templates (React, Next, Vue, Angular, TS, Jest), `upgrade --dry-run`, `upshift migrate`, **custom template** (`--template-file`) | Custom migration generators (learn from code style) |
| **2. Ecosystems & reach** | Python/Ruby/Go scan, explain (minimal + risk/changelog + **--ai**), upgrade (single + batch), `scan --report`, `scan --licenses` | — |
| **3. Workflow & platform** | HITL approval + webhook, Radar Free + Pro (MVP), `upshift radar`, GitHub App (beta) workflow, VS Code explain/fix in editor, regression recording, CLI audit emission | Published one-click GitHub App, platform audit/credit endpoints |
| **4. Research & experiments** | Changelog in explain, regression signal (opt-in), community templates, opt-in insights doc | — |

### Next (platform / v0.5.0)

- **Published GitHub App** — One-click installable Upshift App (scan on PR, comment). **Backend in-repo:** Edge Function `github-app-webhook` + table `github_app_installations`; set `GITHUB_WEBHOOK_SECRET` and point App webhook URL at the function. See [docs/github-app.md](docs/github-app.md). Marketplace listing when ready.
- **Platform audit endpoint** — **In-repo:** Edge Function `audit-events` + table `audit_logs`; set `UPSHIFT_AUDIT_URL` to the function URL. See [docs/team-features.md](docs/team-features.md).
- **Org-level credit pools** — **In-repo:** Migrations for `orgs`, `org_members`, `credit_transactions`; platform (Next.js + Stripe) implements billing; CLI sends `UPSHIFT_ORG` when set.
- **Enterprise** — SSO (SAML/OIDC), on-premise deployment option, SLA and dedicated support. See [docs/enterprise.md](docs/enterprise.md).

---

## 🧭 Roadmap for Innovation

Longer-term directions and experiments—beyond incremental features—where we're exploring and investing. Many items below **shipped in v0.4.0** (see Completed v0.4.0); the rest are ongoing.

### AI & intelligence
- **Smarter breaking-change detection** — Use codebase context (imports, usage patterns) to prioritize and explain only what actually affects your project. *(v0.4.0: “Used in your code” in explain.)*
- **Proactive upgrade suggestions** — “Upgrade X now; we’ve seen low risk and high value across similar repos” (opt-in, privacy-preserving). *(v0.4.0: `upshift suggest`.)*
- **Custom migration generators** — Learn from your code style and past fixes to generate migrations that match your patterns.
- **Multi-step upgrade plans** — “Upgrade A first, then B; order matters” with dependency-order and compatibility reasoning. *(v0.4.0: `upshift plan`.)*

### Ecosystems & reach
- **Beyond Node** — Python (pip/poetry), Ruby (bundler), Go modules as first-class targets with the same explain/fix/guardrail model. *(v0.4.0: scan for Python/Ruby/Go; explain/upgrade parity coming.)*
- **Monorepo & polyrepo** — Cross-workspace and cross-repo views: “These 12 repos all use lib-X; here’s a coordinated upgrade plan.” *(v0.4.0: `scan --report` + Radar.)*
- **Supply-chain and compliance** — SBOM integration, license and policy checks, and “why this version” lineage as part of the upgrade story. *(v0.4.0: `scan --licenses`.)*

### Workflow & platform
- **Human-in-the-loop (HITL) at scale** — Approval gates, webhooks, and event streams so teams can adopt AI fixes with the right level of control (see [When it breaks & guardrails](docs/when-it-breaks-and-guardrails.md)). *(v0.4.0: approval.webhookUrl.)*
- **Radar (central, revenue)** — Central view of dependency health across all repos. Free: paste/upload reports at [upshiftai.dev/radar](https://upshiftai.dev/radar). Radar Pro (Pro/Team): persisted dashboard, history, alerts, upload from CLI/CI. *(v0.4.0: Radar Free + `upshift radar`.)*
- **IDE and CI-native** — Deeper VS Code (and other editors) integration; GitHub App and native CI UX so upgrades and fixes feel built-in, not bolted-on.

### Research & experiments
- **Changelog and commit intelligence** — Better use of release notes, commit history, and issue trackers to improve risk scoring and explanation quality. *(v0.4.0: changelog in explain + risk.)*
- **Regression prediction** — Correlate upgrade choices with test outcomes (where available) to improve “will this break?” signals. *(v0.4.0: UPSHIFT_RECORD_OUTCOMES + .upshift/outcomes.json.)*
- **Community and open source** — Shared migration templates, contribution workflows for framework upgrades, and optional anonymized insights to improve models for everyone. *(v0.4.0: migrations/ + CONTRIBUTING + docs/opt-in-insights.md.)*

*These are directions we care about, not promises or dates. We’ll update this section as we learn and ship.*

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Areas we'd love help with:**
- Migration templates for popular frameworks (React, Next.js, Vue, Angular)
- Package manager improvements (yarn, pnpm edge cases) — *Node single-package upgrade and batch upgrade now support yarn and pnpm.*
- GitHub Action enhancements
- Radar: dashboard UX, report format, future Radar Pro backend
- Documentation: [User guide](docs/user-guide.md), [CLI reference](docs/cli-reference.md), [Configuration](docs/configuration.md), [Development](docs/development.md); examples and tutorials welcome
