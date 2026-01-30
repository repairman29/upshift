# UpShift Roadmap

**Mission:** Own "dependency intelligence" — the single place developers go before and during upgrades.

**Wedge:** `explain` is the habit. Dependabot tells you *what* to upgrade; UpShift tells you *why*, *what breaks*, and *fixes the code*.

---

## Phase 1: Explain as the habit (Now – 3 months)

### Goals
- Make `explain` the default first step in every upgrade workflow
- Expand to yarn and pnpm so we're not npm-only
- Get into CI pipelines via GitHub Action

### Features
- [x] `explain <pkg>` — version delta, breaking-change warning, links
- [x] `explain --json` — scripting support
- [x] `explain --risk` — one-line risk score (low / medium / high) from major delta + CVEs + popularity
- [x] `explain --changelog` — fetch and summarize real changelog/Release Notes from GitHub or npm
- [x] `scan` for yarn and pnpm (same UX, same output)
- [x] GitHub Action: `uses: repairman29/upshift@main` — scan on schedule or PR, comment with results

### Outcome
"Check with UpShift before you upgrade" becomes the habit. Credits and Pro usage grow from that.

---

## Phase 2: Upgrade that changes code (3 – 6 months)

### Goals
- Move past "bump + test + rollback" to **suggest or apply code changes**
- Curate migration templates for big upgrades (React 18→19, Next 13→14, etc.)

### Features
- [ ] `upgrade --dry-run` — print suggested code edits (files + snippets), no write
- [ ] `upgrade --apply` — write edits with clear diff; run tests and rollback on failure
- [ ] Migration templates: curated rules for major framework upgrades
- [ ] AI-assisted migration: use LLM to generate code fixes for breaking changes

### Outcome
UpShift is "the tool that upgrades *and* fixes the code." That's the moat.

---

## Phase 3: Where developers work (6 – 9 months)

### Goals
- Meet developers in their repo and editor, not just CLI

### Features
- [ ] GitHub App: "UpShift" bot opens explain/upgrade from issue/PR links; posts upgrade summaries
- [ ] VS Code extension: scan workspace, click dep → explain, "Upgrade" with diff in editor
- [ ] Radar MVP: multi-repo dashboard — "all my repos, one place" — with UpShift upgrade per repo
- [ ] JARVIS skill: "Scan my project," "Explain react," "Upgrade lodash" via chat/voice

### Outcome
Usage grows from "I run the CLI sometimes" to "UpShift is in my repo and my editor."

---

## Phase 4: Team + business engine (9 – 12 months)

### Goals
- Predictable MRR with clear upgrade path from individual → team → org

### Features
- [ ] Team tier: org-level credit pool, "who used what" audit log
- [ ] Policy: block upgrades with risk ≥ high unless approved
- [ ] Annual pricing: 2 months free for annual Pro/Team
- [ ] "UpShift for Python" (pip/poetry) as add-on or separate SKU

### Outcome
Revenue scales with teams; LTV improves with annual; you're not npm-only.

---

## Phase 5: Enterprise + category leadership (12 – 18 months)

### Goals
- Sell to security-conscious and compliance-heavy teams
- Own the "safe dependency upgrades" category in content and SEO

### Features
- [ ] Enterprise tier: SSO (SAML/OIDC), SLA, dedicated support, optional on-prem
- [ ] Content: "How to migrate to React 19 / Next 14 / Vite 6" using UpShift
- [ ] Weekly "UpShift digest" email: "Your repos: N outdated, M vulnerable"
- [ ] Second product (Forge or Radar full) once UpShift hits $10k MRR

### Outcome
Category leadership. When people search "safe way to upgrade dependencies," UpShift is the default answer.

---

## How we win

| Lever | What it means |
|-------|---------------|
| **Habit** | "Before any upgrade, I run `upshift explain`." |
| **Moat** | UpShift doesn't just bump versions — it suggests or applies the code changes. |
| **Distribution** | In repo (Action/App), in editor (VS Code), in chat (JARVIS). |
| **Business** | Credits + Pro/Team + annual + enterprise, clear upgrade path. |
| **Category** | Own "dependency intelligence" in content and positioning. |

---

## Contributing

See `CONTRIBUTING.md` (coming soon). PRs for yarn/pnpm support, migration templates, and GitHub Action are especially welcome.
