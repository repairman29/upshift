# Release v0.4.0 — Innovation (stacked)

Single release plan stacking deliverables across all four innovation areas. Work can proceed in parallel; order within each section is suggested.

**Target version:** 0.4.0  
**Theme:** AI & intelligence, ecosystems & reach, workflow & platform, research & experiments  
**Status:** Shipped. Full list of completed items: [ROADMAP.md](ROADMAP.md) → Completed (v0.4.0). Radar (central, revenue) is live at [upshiftai.dev/radar](https://upshiftai.dev/radar).

---

## 1. AI & intelligence

- [x] **Context-aware explain** — Use codebase context (imports, usage patterns) so `explain` prioritizes breaking changes that actually affect this project. Flag “not used in your code” where applicable.
- [x] **Multi-step upgrade plan** — New command or mode: “Upgrade A first, then B” with dependency-order and compatibility reasoning; output ordered list of upgrades (`upshift plan`).
- [x] **Proactive suggestions (opt-in)** — `upshift suggest` or scan output: “We recommend upgrading X (low risk, high value).” Opt-in, privacy-preserving; no telemetry by default.
- [x] **Migration templates (first set)** — Ship at least one migration template (e.g. React 18→19 or Next.js major) and hook into `upgrade` / `fix` so users can apply template-driven changes.
- [x] **`upgrade --dry-run`** — Preview dependency and lockfile changes (and optionally generated code changes) without applying.

---

## 2. Ecosystems & reach

- [x] **Python (pip/poetry)** — `scan` and `explain` for Python projects (requirements.txt, pyproject.toml); same risk/explain model; optional `upgrade` + test + rollback when feasible.
- [x] **Ruby (bundler)** — Same as above for Gemfile/Gemfile.lock: scan, explain, optional upgrade path.
- [x] **Go modules** — Scan and explain for go.mod; version delta and risk; no code fix in v0.4.0 is fine.
- [x] **Monorepo / polyrepo view** — Extend `workspaces` or add a mode to aggregate “these N workspaces/repos all use lib-X” and surface a simple coordinated upgrade view (e.g. report or JSON).
- [x] **License / compliance (first step)** — Add optional `--licenses` (or similar) to scan/report output: list licenses for direct deps; no policy enforcement yet, just visibility.

---

## 3. Workflow & platform

- [x] **HITL: approval config** — Document and support `.upshiftrc` (or equivalent) for `approval.mode` and `approval.requireFor`; ensure major upgrades (and optionally all) can require explicit approval in CI/interactive.
- [x] **HITL: webhook or event hook** — Optional webhook/event when an upgrade or fix is proposed so an external system can approve/reject (align with upshiftai HITL docs).
- [x] **Radar / dashboard (MVP)** — Minimal multi-repo view: ingest scan results from multiple repos (e.g. CLI `--report` or upload), show list of repos and summary (outdated count, risk). Can be static page or simple server.
- [x] **GitHub App (scaffold)** — [docs/github-app.md](docs/github-app.md): permissions, webhook flow, example workflow. Beta (published App) still coming.
- [x] **VS Code: explain in editor** — “Explain dependency for current file”: detect package from imports, run explain, show in Upshift output channel. Fix/diff in editor still coming.

---

## 4. Research & experiments

- [x] **Changelog / commit intelligence** — Improve risk and explanation by using release notes and (where available) commit history or issue references; plug into existing `explain` and risk scoring.
- [x] **Regression signal (opt-in)** — When tests run after upgrade, optionally record outcome (pass/fail) and package/version; local-only or opt-in aggregate to improve “will this break?” over time.
- [x] **Community migration templates** — Docs and contribution path for community-contributed migration templates (e.g. Vue, Angular); at least one template in-repo and process in CONTRIBUTING.
- [x] **Optional anonymized insights** — Clear doc and opt-in flow (if any) for contributing anonymized upgrade/outcome data to improve models; no collection without explicit opt-in.

---

## Cross-cutting

- [x] **Docs** — Update README, ROADMAP, and “When it breaks & guardrails” to reference v0.4.0 capabilities, HITL webhook, and Radar. Add docs/radar.md, docs/opt-in-insights.md.
- [x] **Version bump** — Set package.json (and any other versioned artifacts) to 0.4.0; tag and release notes.

---

## How to use this doc

- Check off items as they land; move between sections as needed.
- “Stack and go” = work can proceed in parallel across sections; sync when features touch the same surface (e.g. Python + HITL).
- If scope gets heavy, split into v0.4.0 (core) and v0.5.0 (follow-on); this doc can be copied and trimmed for v0.5.0.
