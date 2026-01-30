# Upshift

Upshift is a CLI that upgrades dependencies safely. It scans for outdated and vulnerable packages, explains breaking changes with risk assessment, applies upgrades, runs tests, and can roll back if something fails.

**Wedge:** Dependabot tells you *what* to upgrade; UpShift tells you *why*, *what breaks*, and *fixes the code*.

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

```
upshift scan
upshift scan --json

upshift explain react --from 18.2.0 --to 19.0.0
upshift explain react --json
upshift explain react --risk          # low/medium/high risk score
upshift explain react --changelog     # fetch changelog from GitHub

upshift upgrade react
upshift upgrade react --to 19.0.0
upshift upgrade react --dry-run

upshift credits
upshift credits --json
upshift credits --add 5
upshift credits --reset 10

upshift buy-credits --pack small
upshift subscribe --tier pro
upshift subscribe --tier team

upshift status
upshift status --json
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

## What is coming next

- AI migration steps for breaking changes (code fixes)
- VS Code extension
- GitHub App for repo-level scanning
- Multi-repo dashboard (Radar)

See [ROADMAP.md](ROADMAP.md) for the full plan.

## Website

The landing page lives in `web/`. Deploy at **upshiftai.dev**:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/repairman29/upshift)

After importing, set **Root Directory** to `web`, then add domains `upshiftai.dev` and `www.upshiftai.dev` in Project → Settings → Domains. See `web/README.md`.

## Docs

- Roadmap: `ROADMAP.md`
- API endpoints: `docs/endpoint.md`
- Pricing: `docs/pricing.md`
- Stripe setup: `docs/stripe-setup.md`
- Launch pack: `docs/launch.md`
- Landing page copy: `docs/landing-page.md`
- One-pager: `docs/one-pager.md`
- Video script: `docs/video-script.md`
- Blog post: `docs/blog-post.md`

