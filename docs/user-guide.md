# Upshift User Guide

For product users: getting started, core workflow, and features. See [Docs index](README.md) for all documentation (product + devs).

## Getting started

1. **Install:** `npm install -g upshift-cli`
2. **Run in a project:** `cd your-project && upshift scan`
3. **Explain a package:** `upshift explain react --risk` or `upshift explain react --ai` (AI costs 1 credit)
4. **Upgrade:** `upshift upgrade react` (runs tests, rolls back on failure)

See [CLI reference](cli-reference.md) for all commands and options.

## Core workflow

**Scan → Explain → Upgrade → Fix (if needed)**

1. **Scan** — See what’s outdated and vulnerable:
   ```bash
   upshift scan
   upshift scan --json
   upshift scan --licenses
   upshift scan --report report.json   # for Radar
   ```

2. **Explain** — Understand breaking changes before upgrading:
   ```bash
   upshift explain <package>
   upshift explain <package> --risk
   upshift explain <package> --changelog
   upshift explain <package> --ai    # AI analysis (1 credit)
   ```
   Output includes “Used in your code” (import/require scan) and risk (low/medium/high).

3. **Upgrade** — Apply the upgrade and run tests; roll back if tests fail:
   ```bash
   upshift upgrade <package>
   upshift upgrade <package> --to 19.0.0
   upshift upgrade <package> --dry-run
   upshift upgrade --all              # batch (minor/patch by default)
   upshift upgrade --all-minor
   upshift upgrade --all --dry-run
   ```

4. **Fix** — If code breaks, get AI-suggested code changes:
   ```bash
   upshift fix <package>
   upshift fix <package> --dry-run
   ```

5. **Rollback** — Restore previous state if something went wrong:
   ```bash
   upshift rollback
   ```

## Suggest and plan

- **Suggest** — Get recommended upgrades (low risk, high value):
  ```bash
  upshift suggest
  upshift suggest --limit 10 --json
  ```

- **Plan** — Get an ordered upgrade plan (dependency order + risk):
  ```bash
  upshift plan
  upshift plan --mode minor --json
  ```

## Migration templates

Apply curated migration steps (e.g. React 18→19, Vue 2→3):

```bash
upshift migrate <package> --list       # list templates
upshift migrate react --dry-run       # preview
upshift migrate react                  # apply
upshift migrate next --template next-13-to-14
```

Templates live in `migrations/`. See [migrations/README.md](../migrations/README.md) and [CONTRIBUTING.md](../CONTRIBUTING.md#migration-templates) to add more.

## Radar (central view)

See dependency health across all your repos:

1. In each repo: `upshift scan --report report.json`
2. Open [upshiftai.dev/radar](https://upshiftai.dev/radar/) or run `upshift radar`
3. Paste or upload the JSON; view summary (repos, outdated, vulns)

**Radar Pro** (Pro/Team): persisted dashboard, history, alerts, upload from CLI/CI. See [Radar](radar.md).

## Configuration

Create `.upshiftrc.json` with `upshift init`. Key options:

- **Approval (HITL)** — `approval.mode`: `prompt` (default), `none`, or `webhook`; `approval.requireFor`: `["major"]` or `["all"]`; `approval.webhookUrl` for external approval.
- **Upgrade policy** — `upgradePolicy: { blockRisk: ["high"] }` blocks high-risk upgrades; use `-y` to override.
- **Auto** — `autoConfirm: true` skips prompts; `autoTest: true` runs tests after upgrade.

Full reference: [Configuration](configuration.md).

## Python, Ruby, Go

- **Scan** — In a Python/Ruby/Go project, `upshift scan` detects the ecosystem and runs the right scanner (pip/poetry, bundler, go list).
- **Explain (Python)** — In a Python project, `upshift explain <pkg>` shows version delta and “pip install -U <pkg>”. No AI yet.
- **Explain (Ruby/Go)** — Not yet; use `upshift scan` for version overview.

## VS Code

- **Scan** — Click status bar or run “Upshift: Scan Dependencies”.
- **Explain for current file** — Right-click in a .ts/.tsx/.js/.jsx file → “Upshift: Explain dependency for current file” (detects package from imports, shows result in Upshift output channel).
- **Fix for current file** — Right-click → “Upshift: Fix dependency for current file” (dry-run in channel; option to run in terminal to apply).
- **Explain / Upgrade / Audit** — Command palette: “Upshift: Explain Package”, “Upshift: Upgrade Package”, etc.

## CI/CD

- **GitHub Action** — Add a workflow that runs `upshift scan` (or `upshift upgrade`) on PRs. See [.github/workflows/example-scan.yml](../.github/workflows/example-scan.yml).
- **Approval in CI** — Use `-y` to skip prompts, or set `approval.mode: "none"`. For webhook approval, set `approval.webhookUrl` and have your CI call the webhook or use `approval.mode: "webhook"`.
- **Regression recording** — Set `UPSHIFT_RECORD_OUTCOMES=1` to append upgrade outcomes to `.upshift/outcomes.json` (local only).

## When it breaks and guardrails

Upgrades break at **upgrade time** when tests run. Tests are the guardrail; we roll back on failure. LLM-generated fixes should be reviewed (e.g. `upshift fix --dry-run`). See [When it breaks & guardrails](when-it-breaks-and-guardrails.md) and [Opt-in insights](opt-in-insights.md).

## Credits and billing

- **Explain --ai** costs 1 credit; **fix** costs 3 credits. You get 10 free credits by default.
- **Credits:** `upshift credits` — check balance; `upshift buy-credits` / `upshift subscribe` for more.
- See [API Endpoints](endpoint.md) for billing API reference.
