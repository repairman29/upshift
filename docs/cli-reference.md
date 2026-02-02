# CLI Reference

Quick reference for all Upshift commands and options. Run `upshift --help` or `upshift <command> --help` for the latest.

## Global

```bash
upshift [options] [command]
  -V, --version   output version
  -h, --help      display help
```

## Core

### scan

Scan dependencies for updates and vulnerabilities.

```bash
upshift scan [options]
  --json           Output as JSON
  --licenses       Include license per direct dependency (npm)
  --report <path>  Write JSON report to file (for Radar)
  --cwd <path>     Project directory (default: .)
```

Supports **Node** (npm/yarn/pnpm), **Python** (pip/poetry), **Ruby** (bundler), **Go** (go.mod). Auto-detects ecosystem.

### explain

Explain breaking changes for a dependency.

```bash
upshift explain <package> [options]
  --json       Output as JSON
  --risk       Show risk (low/medium/high)
  --changelog  Fetch changelog from GitHub
  --ai         AI analysis (1 credit)
  --from <v>   Current version
  --to <v>     Target version
  --cwd <path> Project directory
```

In **Python** projects: version delta + “pip install -U <pkg>”. No AI yet for non-Node.

### fix

AI-powered code fixes for breaking changes (3 credits).

```bash
upshift fix <package> [options]
  --dry-run   Preview changes without applying
  --cwd <path>
```

### upgrade

Upgrade a dependency (single or batch). Runs tests; rolls back on failure.

```bash
upshift upgrade [package] [options]
  --to <version>   Target version (default: latest)
  --all            Upgrade all outdated
  --all-minor     Only minor/patch
  --all-patch      Only patch
  --dry-run        Show planned changes, no file changes
  -y, --yes        Skip confirmation prompts
  --skip-tests     Skip tests after upgrade
  --cwd <path>
```

### rollback

Restore previous state after an upgrade.

```bash
upshift rollback [options]
  --list   List available backups
  --cwd <path>
```

### audit

Security audit with optional AI remediation.

```bash
upshift audit [options]
  --ai       AI remediation suggestions (2 credits)
  --cwd <path>
```

## Suggest & plan

### suggest

Proactive upgrade suggestions (low risk, high value).

```bash
upshift suggest [options]
  --json       Output as JSON
  --limit <n>  Max suggestions (default: 5)
  --cwd <path>
```

### plan

Multi-step upgrade plan (dependency order + risk).

```bash
upshift plan [options]
  --json        Output as JSON
  --mode <m>    all | minor | patch (default: all)
  --cwd <path>
```

## Migrate

Apply migration templates (e.g. React 18→19, Vue 2→3).

```bash
upshift migrate <package> [options]
  --template <name>  Template id (e.g. react-18-19)
  --dry-run          Preview, no file changes
  --list             List templates for package
  --cwd <path>
```

## Radar

Open Radar (central dependency view) in browser.

```bash
upshift radar [options]
  --no-open   Only print URL, don’t open browser
```

## Interactive & monorepo

### interactive

TUI to select packages to upgrade.

```bash
upshift interactive [options]
  --cwd <path>
```

### workspaces

Scan monorepo workspaces for outdated dependencies.

```bash
upshift workspaces [options]
  --cwd <path>
```

## Notifications

```bash
upshift notify --slack <url>
upshift notify --discord <url>
upshift notify --webhook <url>
  --cwd <path>
```

## Setup & billing

### init

Create `.upshiftrc.json`.

```bash
upshift init [options]
  --force   Overwrite existing config
```

### credits

Check credit balance.

```bash
upshift credits
```

### buy-credits

Purchase credit packs.

```bash
upshift buy-credits --pack <size>
```

### subscribe

Open Stripe checkout for Pro/Team.

```bash
upshift subscribe --tier pro
```

### status

Subscription and credit status.

```bash
upshift status
```

## Environment

- **OPENAI_API_KEY** — For AI explain/fix (or use credits with Upshift API).
- **UPSHIFT_RECORD_OUTCOMES=1** — Append upgrade outcomes to `.upshift/outcomes.json` (local only).
- **UPSHIFT_CREDITS_ENDPOINT** / **UPSHIFT_API_TOKEN** — Override credits API (dev/self-hosted).

## Config file

Options can be set in `.upshiftrc.json` (see [Configuration](configuration.md)). CLI flags override config.
