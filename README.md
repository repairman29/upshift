# Upshift

[![npm version](https://img.shields.io/npm/v/upshift-cli.svg)](https://www.npmjs.com/package/upshift-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![VS Code Extension](https://img.shields.io/visual-studio-marketplace/v/jeffadkins10463.upshift-vscode)](https://marketplace.visualstudio.com/items?itemName=jeffadkins10463.upshift-vscode)

**AI-powered dependency upgrades.** Stop reading changelogs—let AI tell you what breaks.

Upshift scans for outdated and vulnerable packages, explains breaking changes with AI, generates code fixes, and upgrades safely with automatic rollback.

> **Dependabot tells you *what* to upgrade. Upshift tells you *why*, *what breaks*, and *fixes the code*.**

## Status

Supports npm, yarn, and pnpm. See [ROADMAP.md](ROADMAP.md) for what's next.

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

upshift explain react --ai            # AI explains breaking changes
upshift explain react --from 18 --to 19
upshift explain react --risk          # low/medium/high risk score
upshift explain react --changelog     # Fetch changelog from GitHub
```

### Upgrade & Fix
```bash
upshift upgrade react                 # Upgrade with tests + auto-rollback
upshift upgrade react --to 19.0.0
upshift upgrade --all                 # Batch upgrade all packages
upshift upgrade --all-minor           # Only minor/patch updates

upshift fix react                     # AI generates code fixes
upshift fix react --dry-run           # Preview changes without applying

upshift rollback                      # Restore previous state
upshift rollback --list               # See available backups
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

See [ROADMAP.md](ROADMAP.md) for the full plan.

## Website

The landing page lives in `web/`. Deploy at **upshiftai.dev**:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/repairman29/upshift)

After importing, set **Root Directory** to `web`, then add domains `upshiftai.dev` and `www.upshiftai.dev` in Project → Settings → Domains. See `web/README.md`.

## Documentation

- [Roadmap](ROADMAP.md) — planned features
- [Contributing](CONTRIBUTING.md) — how to contribute
- [API Endpoints](docs/endpoint.md) — billing API reference
- [Blog Post](docs/blog-post.md) — introduction article

