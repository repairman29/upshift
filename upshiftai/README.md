# upshiftai — AI-Powered Dependency Intelligence

**Find ancient dependencies. Let AI tell you what matters.**

UpshiftAI analyzes dependency trees across **npm**, **pip**, and **Go**. It surfaces ancient/deprecated packages, detects security vulnerabilities, and provides automated fixes.

**Live Platform:** [upshiftai.dev](https://upshiftai.dev)  
**Dashboard:** [api.upshiftai.dev](https://api.upshiftai.dev)

## Pricing & Business Model

UpshiftAI operates on a **Freemium** model:

| Tier | Price | Features |
| :--- | :--- | :--- |
| **CLI (Self-Hosted)** | **Free** (MIT) | Unlimited local analysis, manual fixes, full reports. You run it. |
| **Pro Cloud** | **$19/mo** | **1,000 AI queries/mo**. JARVIS conversational analysis, smart risk assessment, priority support. |
| **Team Cloud** | **$99/mo** | **10,000 AI queries/mo**. Custom ML models, SSO, audit logs. |

**The CLI is always free.** You only pay for hosted AI intelligence and cloud convenience.

---

## Quick start

```bash
# Analyze your project (zero install)
npx upshiftai-deps@0.2.1 analyze .
```

Use `--no-registry` to skip registry lookups (faster). Use `--markdown` to append a markdown report, or `--csv` for spreadsheet output (includes replacement suggestions). Use `--summary` to print only the one-pager. Use `--exit-code` with `--max-ancient=N` and/or `--max-deprecated=N` to exit 1 when thresholds are exceeded (CI gates). Use `--no-audit` to skip npm audit. Use `--ecosystem=npm|pip|go` to force; otherwise auto-detects. Registry metadata is **cached** in `.upshiftai-tmp/cache` (24h TTL) and fetched **in parallel** (10 at a time) for speed.

### Full “deep throat” report (pip)

For a **full dependency report** (direct deps + transitive tree + “something old” chains), use `report`:

```bash
upshiftai-deps report /path/to/python-project
```

For **pip projects**, `report` defaults to attempting a full transitive tree: it will try to create a venv, install the project with `pip install -e ".[dev]"`, run `pipdeptree -o json`, and merge that into the report. So one command gives you:

- **“Something old” chains** — which transitive packages are ancient or declare old Python, and who pulls them in
- **Full pipdeptree output** (in a collapsible block)
- **Direct dependencies** (UpshiftAI table with age/deprecated/fork hints)

Options:

- `--output FILE` — write markdown to a file (default: stdout)
- `--summary` — print only the one-pager
- `--json` — output structured JSON (summary, chains, entries); use with `--diff` to include comparison to last run
- `--pdf` — also generate a PDF (requires `npx md-to-pdf`)
- `--licenses` — add a Licenses section (npm/pip)
- `--no-full-tree` — skip automatic pipdeptree; report direct deps only
- `--full-tree` — explicitly request full tree (default for pip)
- `--pip-tree FILE.json` — use existing `pipdeptree -o json` output instead of running it
- `--project-name NAME` / `--project-url URL` — override title and link (for pip, name/url are read from `pyproject.toml` when not set)

If no Python 3.10–3.12 is available, the CLI prints instructions to generate the tree yourself and pass `--pip-tree=tree.json`.

### Checkpoint and rollback (for automations)

Before running any automation that changes manifests or lockfiles, create a **checkpoint** so you can roll back:

```bash
upshiftai-deps checkpoint /path/to/project
upshiftai-deps checkpoint /path/to/project --reason "before upgrade"
```

Checkpoint copies `package.json` + `package-lock.json` (npm) or `pyproject.toml` + `requirements*.txt` (pip) into `.upshiftai-tmp/checkpoints/<timestamp>/`.

To restore the last checkpoint:

```bash
upshiftai-deps rollback /path/to/project
upshiftai-deps rollback /path/to/project --dry-run   # show what would be restored
upshiftai-deps rollback /path/to/project --checkpoint 2026-01-29T12-00-00   # restore specific checkpoint
```

List checkpoints: `upshiftai-deps checkpoint --list`

### Health (one-line status)

```bash
upshiftai-deps health [path]
upshiftai-deps health . --exit-code   # exit 1 if not OK (CI)
upshiftai-deps health . --json       # machine-readable
```

Prints **OK** / **WARN** / **FAIL** with counts (ancient, deprecated, high/critical vulns). Use `--exit-code` to fail CI when status is not OK.

Design for **who benefits**, **suggestions**, **automations**, and **rollbacks** is in [docs/DESIGN-SUGGESTIONS-AUTOMATIONS.md](docs/DESIGN-SUGGESTIONS-AUTOMATIONS.md).

### Apply with HITL, webhooks & rollback

Apply an **upgrade** or **replace** with checkpoint, verify, and automatic rollback on failure. Actions that need “hand-holding” (replace, major upgrade) go through an **approval gate**; everything else can run automatically with **listeners** and **webhooks** so you can observe or trigger your own revert.

```bash
# Upgrade one package (patch/minor: auto; major: approval if config says so). Works for npm and pip (auto-detected).
upshiftai-deps apply upgrade <pkg> [path] [--version latest] [--dry-run] [--yes]

# Replace package (always requires approval unless --yes). Works for npm and pip.
upshiftai-deps apply replace <old> <new> [path] [--version latest] [--dry-run] [--yes]

# Apply all suggested fixes for direct ancient/deprecated deps (npm; one checkpoint for the whole run)
upshiftai-deps apply fix [path] [--dry-run] [--yes] [--limit N]

# One-shot: suggest + apply for a single package (npm)
upshiftai-deps fix <pkg> [path] [--dry-run] [--yes]
```

- **HITL**: Put `.upshiftai.json` in the project (or use `--config`). Set `approval.mode` to `prompt` (CLI “y/n”), `webhook` (POST to your URL; you respond `{ "approved": true }`), or `none`. Set `approval.requireFor` to `["replace", "major"]` so replace and major upgrades require approval; patch/minor can run without.
- **Webhooks**: Set `webhooks: ["https://your-server.com/hooks/upshiftai"]`. We POST every event: `checkpoint.created`, `apply.started`, `apply.completed`, `apply.failed`, `rollback.triggered`, `rollback.completed`. Your endpoint can run `upshiftai-deps rollback` or your own revert when it receives `rollback.triggered` or `apply.failed`.
- **Rollback**: On verify failure after apply we restore the latest checkpoint and emit `rollback.triggered` / `rollback.completed`. Use `upshiftai-deps rollback` anytime to restore manually.

Copy [.upshiftai.example.json](.upshiftai.example.json) to `.upshiftai.json` and set your webhook URLs and approval policy.

### Human-in-the-loop: I want oversight

If you **don’t** want fully automatic upgrades and prefer to approve risky changes:

| Mode | When to use |
|------|-------------|
| **`approval.mode: "prompt"`** | CLI asks “Apply? (y/n)” for major upgrades and replaces. Patch/minor can still run without asking. |
| **`approval.mode: "webhook"`** | We POST to your URL; you respond `{ "approved": true }` or `false`. Use for CI, team gates, or custom tooling. |
| **`approval.mode: "none"`** | No approval (e.g. CI with `--yes`). Use only when you’re sure. |

**Quick setup (prompt for major/replace):** copy [.upshiftai.example.json](.upshiftai.example.json) to `.upshiftai.json`. Defaults are already `approval.mode: "prompt"` and `approval.requireFor: ["replace", "major"]`, so you get a prompt for major upgrades and package replaces; patch/minor apply without asking.

**Override per run:** use `--yes` to skip approval for that run; omit `--yes` to respect config (prompt or webhook).

See [docs/HITL.md](docs/HITL.md) for webhook payloads, response format, and a sample approval server.

---

## What it reports

For each package in the tree (direct + transitive):

| Signal | Meaning |
|--------|--------|
| **age** | Time since last publish (e.g. >2 years = ancient) |
| **deprecated** | npm `deprecated` field set |
| **unmaintained** | Heuristic: no release in N months, no repo activity |
| **fork_hint** | Package name/repo suggests a community fork (e.g. `-fork`, `-legacy`) |
| **depth** | How deep in the tree (root = 0) |
| **why** | Which direct dep pulled it in |

Output is JSON (for pipelines) and optional markdown for humans.

---

## Integration

- **upshiftai.dev**: Call the CLI or `import { analyze, applyNpmUpgrade, ... } from 'upshiftai-deps'`; use JSON and events for upgrade suggestions, replace flows, or PR automation.
- **JARVIS / CLAWDBOT**: 🤖 **Pro Required**. Install the skill, set your API key, and ask JARVIS to "analyze dependencies" or "check health".
- **CI**: Run `analyze` and gate on ancient/deprecated count; run `apply` with `--yes` and webhooks for observability and rollback.

---

## Roadmap

- [x] npm lockfile + registry metadata
- [x] Ancient/legacy/fork heuristics
- [x] pip (requirements.txt + pyproject.toml; PyPI metadata)
- [x] go mod (go.mod require blocks; no registry)
- [x] Suggest replacements (built-in map + CSV export)
- [x] Full report + transitive “something old” chains
- [x] Checkpoint & rollback
- [x] Apply upgrade/replace + HITL + webhooks
- [x] pip apply (upgrade/replace); apply fix (batch); fix \<pkg\> (one-shot)
- [x] analyze --summary, --exit-code, --max-ancient/--max-deprecated, --no-audit
- [x] report --summary, --json, --diff, --licenses; npm audit; latest vs installed; blast radius; checkpoint --list, rollback --checkpoint
- [x] Go proxy metadata (GOPROXY lastPublish for age); pip-audit in report; pip apply fix + fix \<pkg\>; JARVIS/CLAWDBOT skill (analyze_dependencies, dependency_health)