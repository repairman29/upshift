# Backlog — ordered next steps

Prioritized list of next steps derived from [ROADMAP.md](ROADMAP.md) and [docs/STRATEGY_AND_FEEDBACK.md](docs/STRATEGY_AND_FEEDBACK.md). Use for sprint planning and ownership.

**Track / gate / monetize:** How we measure usage, restrict by tier, and make money → [docs/TRACK_GATE_MONETIZE.md](docs/TRACK_GATE_MONETIZE.md).

---

## P0 — Ship for growth

| # | Item | Owner | Notes |
|---|------|--------|------|
| 1 | **Ship published GitHub App** | ✅ Done | **Get started:** [docs/GITHUB_APP_SHIP_CHECKLIST.md](docs/GITHUB_APP_SHIP_CHECKLIST.md). One-click install; scan on PR, comment. Backend: `github-app-webhook` + `github_app_installations`. |
| 2 | **Landing messaging** | ✅ Done | Hero: "Let AI fix what breaks." Compare: "We did your chores for you. Here's the receipt." (Web + README updated.) |
| 3 | **Platform audit endpoint live** | ✅ Done | **Get started:** [docs/AUDIT_GO_LIVE.md](docs/AUDIT_GO_LIVE.md). Deploy `audit-events`, run migration, set `UPSHIFT_AUDIT_URL`. Position as compliance automation. |

---

## P1 — Product differentiation

| # | Item | Owner | Notes |
|---|------|--------|------|
| 4 | **Confidence score for AI fixes** | ✅ Done | In UI/CLI: green = high confidence (tests passed, deterministic); yellow = heuristic. Reduces churn when model is wrong. |
| 5 | **`upshift fix --dry-run` polish** | ✅ Done | Clear, reviewable diff for PR approval before any code is touched. Required for enterprise trust. |
| 6 | **Radar PDF Health Report** | ✅ Done | Export Radar (or summary) as PDF for CTOs, consultants, client reporting. |
| 7 | **Silent mode / auto-merge** | ✅ Done | When scan is clean (0 outdated, 0 vulns), optional auto-merge via repo secret ENABLE_AUTOMERGE=true. "Maintenance on autopilot." |

---

## P2 — Monetization & scale

| # | Item | Owner | Notes |
|---|------|--------|------|
| 8 | **Seats vs credits (Pro/Team)** | — | Explore unlimited per-seat usage for Pro/Team to remove "usage anxiety." See strategy doc. |
| 9 | **VS Code: "Fix with Upshift" in package.json** | — | When user opens package.json, highlight 1–2 critical vulns and offer one-click Fix with Upshift. |
| 10 | **"Why it broke" content series** | — | When major framework (Next, React, Angular) ships breaking changes, publish post showing how `upshift fix` handles it. |

---

## P3 — Platform & enterprise

| # | Item | Owner | Notes |
|---|------|--------|------|
| 11 | **Org-level credit pools** | — | Migrations + platform billing; CLI `UPSHIFT_ORG`. |
| 12 | **SSO (SAML/OIDC)** | — | Enterprise. |
| 13 | **On-premise / SLA** | — | Per [docs/enterprise.md](docs/enterprise.md). |

---

## How to use this

- **Owner** — Assign when work starts.
- **Done** — Move to ROADMAP "Completed" or archive the row.
- **Re-prioritize** — Update P0–P3 as strategy or capacity changes.

*Last updated when strategy feedback was incorporated.*
