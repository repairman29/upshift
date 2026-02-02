# Upshift

[![npm version](https://img.shields.io/npm/v/upshift-cli.svg)](https://www.npmjs.com/package/upshift-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![VS Code Extension](https://img.shields.io/visual-studio-marketplace/v/jeffadkins10463.upshift-vscode)](https://marketplace.visualstudio.com/items?itemName=jeffadkins10463.upshift-vscode)

**AI-powered dependency upgrades.** Stop reading changelogs—let AI tell you what breaks.

Upshift scans for outdated and vulnerable packages, explains breaking changes with AI, generates code fixes, and upgrades safely with automatic rollback. **Radar** is the central view of dependency health across all your repos—one dashboard for your whole stack (free: paste reports; Pro/Team: persisted dashboard, history, alerts).

> **Dependabot tells you *what* to upgrade. Upshift tells you *why*, *what breaks*, and *fixes the code*.**

## Status

Supports npm, yarn, and pnpm. See [ROADMAP.md](ROADMAP.md) for what's next.

**When does it break?** At upgrade time: when you or CI run `upshift upgrade`, we run your tests and roll back if they fail. CI/CD and your existing smoke/integration tests are the guardrail—we don't replace them. See [When it breaks & guardrails](docs/when-it-breaks-and-guardrails.md).

## Install

```bash
npm install -g upshift-cli
```

Then run:
```bash
upshift --help
```

### From source (dev)

```bash
git clone https://github.com/repairman29/upshift.git
cd upshift
npm install
npm run build
node dist/cli.js --help
```

## Usage

### Scan & Explain
```bash
upshift scan                          # See all outdated packages
upshift scan --json                   # Machine-readable output
upshift scan --licenses               # Include license per direct dep (npm)
upshift scan --report report.json     # Write JSON for Radar (central dashboard)
upshift radar                         # Open Radar in browser

upshift explain react --ai            # AI explains breaking changes
upshift explain react --from 18 --to 19
upshift explain react --risk          # low/medium/high risk score
upshift explain react --changelog     # Fetch changelog from GitHub
```

### Upgrade & Fix
```bash
upshift upgrade react                 # Upgrade with tests + auto-rollback
upshift upgrade react --to 19.0.0
upshift upgrade react -y              # Skip approval prompt (e.g. CI)
upshift upgrade --all                 # Batch upgrade all packages
upshift upgrade --all-minor           # Only minor/patch updates

upshift fix react                     # AI generates code fixes
upshift fix react --dry-run           # Preview changes without applying

upshift rollback                      # Restore previous state
upshift rollback --list               # See available backups
```

### Suggest & Plan
```bash
upshift suggest                      # Recommended upgrades (low risk, high value)
upshift suggest --limit 10           # Top 10 suggestions
upshift plan                         # Multi-step upgrade order (dependency + risk)
upshift plan --mode minor            # Only minor/patch upgrades
upshift migrate react --list         # List migration templates for react
upshift migrate react --dry-run     # Preview template application
upshift migrate next                # Apply Next.js 13→14 template
upshift migrate vue --list          # List Vue templates
```

### Interactive & Monorepo
```bash
upshift interactive                   # TUI for selecting packages
upshift workspaces                    # Scan monorepo workspaces
```

### Notifications
```bash
upshift notify --slack https://...    # Send report to Slack
upshift notify --discord https://...  # Send report to Discord
```

### Credits & Billing
```bash
upshift credits                       # Check credit balance
upshift buy-credits --pack small      # Purchase credits
upshift subscribe --tier pro          # Subscribe to Pro
upshift status                        # Check subscription status
```

## Human-in-the-loop (oversight)

Self-healing via **LLM-generated code fixes** should be reviewed, not applied blindly. Use `upshift fix --dry-run` to preview changes, then review before applying. For automated pipelines, use approval gates (see below).

If you want to **approve** risky upgrades (and optionally code fixes) instead of running fully automatic:

- **Single upgrade:** By default, major version upgrades prompt `Upgrade X from A to B (major)? [y/N]` when run interactively. Use `-y` to skip (e.g. CI).
- **Config:** Create `.upshiftrc.json` with `upshift init`. Set `approval.mode` to `"prompt"` (default), `"none"`, or `"webhook"` (POST proposed upgrade to `approval.webhookUrl`; 200 = approve). Set `approval.requireFor` to `["major"]` (default) or `["all"]`. Set `upgradePolicy: { blockRisk: ["high"] }` to block high-risk upgrades (use `-y` to override). Set `autoConfirm: true` to skip all prompts.
- **Batch:** `upshift upgrade --all` (or `--all-minor`) already asks for confirmation before applying; use `-y` to skip.

For full HITL (webhooks, event stream, approval server), see [upshiftai](https://github.com/repairman29/upshift/tree/main/upshiftai) and `.upshiftai.json` with `approval.mode: "webhook"` and [docs/HITL.md](upshiftai/docs/HITL.md). See also [When it breaks & guardrails](docs/when-it-breaks-and-guardrails.md).

## What it does today

- Scan dependencies for outdated packages (npm, yarn, pnpm)
- Fetch metadata and detect major version bumps
- Risk assessment: low / medium / high based on major delta, CVEs, popularity
- Fetch changelog from GitHub releases or CHANGELOG.md
- Upgrade a dependency and run tests (if configured)
- Roll back on failure (package.json + lockfile)

## Credits

`upshift explain` uses a credit bank (10 free credits by default). When credits
run out, the CLI outputs `C` and exits with code 2. Credits are stored in
`~/.upshift/credits.json`.

Credit packs are available, and Pro/Team subscribers receive a 20% bonus on
credit purchases. Unused credits roll over.

You can also validate credits remotely by setting:

```
UPSHIFT_CREDITS_ENDPOINT=http://localhost:8787
UPSHIFT_API_TOKEN=dev-token-1
```

## GitHub Action

Add to your repo for automated scanning on PRs:

```yaml
# .github/workflows/upshift.yml
name: UpShift Scan
on: [pull_request]
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: repairman29/upshift@main
        with:
          comment-on-pr: "true"
          fail-on-vulnerabilities: "false"
```

See `.github/workflows/example-scan.yml` for a full example.

## What's available now

- ✅ AI-powered explanations (`upshift explain --ai`)
- ✅ AI code fixes (`upshift fix`)
- ✅ VS Code extension ([install](https://marketplace.visualstudio.com/items?itemName=jeffadkins10463.upshift-vscode))
- ✅ GitHub Action for CI/CD
- ✅ Interactive mode (`upshift interactive`)
- ✅ Monorepo support (`upshift workspaces`)
- ✅ Slack/Discord notifications (`upshift notify`)

## Coming next

- GitHub App for repo-level scanning
- Multi-repo dashboard (Radar)
- Python support (pip/poetry)

See [ROADMAP.md](ROADMAP.md) for the full plan and [Roadmap for Innovation](ROADMAP.md#-roadmap-for-innovation) for longer-term R&D and vision.

## Radar

**Radar** is the central view of dependency health across all your repos. Free: paste or upload scan reports at [upshiftai.dev/radar](https://upshiftai.dev/radar/). Pro/Team: persisted dashboard, history, alerts. See [docs/radar.md](docs/radar.md).

```bash
upshift scan --report report.json   # in each repo
upshift radar                      # open Radar in browser
```

## Website

The landing page lives in `web/`. Deploy at **upshiftai.dev**:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/repairman29/upshift)

After importing, set **Root Directory** to `web`, then add domains `upshiftai.dev` and `www.upshiftai.dev` in Project → Settings → Domains. See `web/README.md`.

## JARVIS in Cursor

Use **JARVIS** from Cursor when you need dependency analysis, blog media, or UpshiftAI skill work. One-time setup:

```bash
scripts/setup-jarvis-cursor.sh
cd upshiftai/platform && node ../../scripts/create-upshift-api-key.cjs
```

Then put **JARVIS_EDGE_URL** in `vault/jarvis.json` (or run the create script with `--edge-url https://YOUR_REF.supabase.co/functions/v1/jarvis`). Deploy Edge first: `supabase functions deploy jarvis`. See [docs/JARVIS_IN_CURSOR.md](docs/JARVIS_IN_CURSOR.md). The Cursor rule in `.cursor/rules/jarvis.mdc` tells the agent to use JARVIS when needed; invoke via `node scripts/call-jarvis.js <task> '<json>'`.

## Documentation

**Product / users:** [User guide](docs/user-guide.md) · [CLI reference](docs/cli-reference.md) · [Configuration](docs/configuration.md) · [Radar](docs/radar.md) · [When it breaks & guardrails](docs/when-it-breaks-and-guardrails.md) · [Opt-in insights](docs/opt-in-insights.md)

**Developers:** [Development guide](docs/development.md) · [GitHub App (scaffold)](docs/github-app.md) · [Contributing](CONTRIBUTING.md)

**Reference:** [API Endpoints](docs/endpoint.md) · [Roadmap](ROADMAP.md) · [Release v0.4.0](RELEASE-v0.4.0.md) · [Docs index](docs/README.md)

**Blog:** [When it breaks, guardrails, and HITL](docs/blog-when-it-breaks-guardrails-hitl.md) · [Introduction](docs/blog-post.md)

