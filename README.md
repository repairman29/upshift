# Upshift

Upshift is a CLI that upgrades dependencies safely. It scans for outdated and vulnerable packages, explains breaking changes, applies upgrades, runs tests, and can roll back if something fails.

## Status

MVP: npm support only (yarn and pnpm planned).

## Install (local dev)

```
npm install
npm run build
node dist/cli.js --help
```

## Usage

```
upshift scan
upshift scan --json

upshift explain react --from 18.2.0 --to 19.0.0

upshift upgrade react
upshift upgrade react --to 19.0.0
upshift upgrade react --dry-run

upshift credits
upshift credits --add 5
upshift credits --reset 10
```

## What it does today

- Scan npm dependencies for outdated packages
- Fetch npm metadata and detect major version bumps
- Upgrade a dependency and run tests (if configured)
- Roll back on failure (package.json + package-lock.json)

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

## What is coming next

- AI migration steps for breaking changes
- Yarn and pnpm support
- Multi-repo support
- License-based gating for Pro/Team tiers

## Docs

- Pricing: `docs/pricing.md`
- Stripe setup: `docs/stripe-setup.md`
- Launch pack: `docs/launch.md`

