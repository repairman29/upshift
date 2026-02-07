# GitHub App — testing (local vs CI)

Use this to catch bugs in the Upshift GitHub App workflow by **testing both ways**: run the scan in CI and run it locally, then compare.

---

## Why test both ways

- **CI** runs in a clean runner with `npm ci` + `upshift scan --json`. The workflow parses JSON for outdated/vuln counts and (on PRs) comments.
- **Local** you run `npm ci` (or install) then `upshift scan --json` in the same repo.
- If **CI reports 0/0 but local reports N outdated or M vulns**, the workflow or CLI has a bug (e.g. wrong parsing, missing install step, or stdout/stderr mixing).

---

## How to run

### 1. CI (already wired)

- Push to `main` or open a PR, or run **workflow_dispatch** for "Upshift Scan (GitHub App)".
- In the run, check the "Run scan" step log line: `Outdated: X, Vulnerabilities: Y`.

### 2. Local (same repo)

```bash
cd /path/to/repo
npm ci   # or yarn/pnpm equivalent so node_modules matches lockfile
npx upshift scan --json | jq '{outdated: (.outdated | length), vulns: (.vulnerabilities.items | length)}'
```

### 3. Compare

- CI and local counts should be in the same ballpark (exact match can vary if registry or lockfile changed between runs).
- If CI is 0/0 and local is not, investigate: missing install step, JSON parsing (e.g. stderr mixed into JSON), or wrong `jq` path.

---

## Bugs found and fixed (2026-02-07)

| Bug | Cause | Fix |
|-----|--------|-----|
| **CI always 0/0** (even with deps installed) | Workflow never ran `npm ci` before scan, so `npm outdated` / `npm audit` had no `node_modules`. | Add "Install dependencies" step (npm ci / yarn / pnpm) before "Run scan". |
| **CI still 0/0 after install** | `RESULT=$(upshift scan --json 2>&1)` merged stderr into stdout; ora spinner lines broke `jq`, so fallback was 0. | Capture only stdout: `upshift scan --json 2>/dev/null` so JSON is valid for `jq`. |
| **Install fails on out-of-sync lockfile** | Some repos have `package.json` and `package-lock.json` out of sync; `npm ci` fails (e.g. "Missing: yaml@2.8.2"). | Fallback: `npm ci \|\| npm install` (and same for yarn/pnpm) so scan still runs. |

---

## Local vs CI comparison (examples)

| Repo | Local (outdated, vulns) | CI (outdated, vulns) | Match |
|------|-------------------------|----------------------|------|
| upshift | 8, 1 | 7, 1 | ✓ |
| olive | 9, 11 | 9, 11 | ✓ |
| mythseeker2 | 25, 17 | 25, 17 | ✓ |
| echeovid | — | 36, 19 | — |
| slidemate | — | 6, 4 | — |
| trove-app | — | 28, 15 | — |
| postsub | 45, 26 | 45, 26 (after npm ci \|\| npm install) | ✓ |
| berry-avenue-codes | — | *fail* (no package.json in root) | not a Node root repo |

---

## Repos currently running the workflow

- **repairman29/upshift** — push to main, workflow_dispatch
- **repairman29/olive** — push, workflow_dispatch
- **repairman29/JARVIS** — push, workflow_dispatch
- **repairman29/echeovid** — push, workflow_dispatch
- **repairman29/slidemate** — push, workflow_dispatch
- **repairman29/mythseeker2** — push, workflow_dispatch
- **repairman29/postsub** — push, workflow_dispatch (install: npm ci \|\| npm install)
- **repairman29/trove-app** — push, workflow_dispatch
- **repairman29/berry-avenue-codes** — no package.json in root; workflow will fail at install until repo has Node at root or we add subdir support

To add another repo: copy `.github/workflows/upshift-app-scan.yml`, set secrets `APP_ID` and `APP_PRIVATE_KEY`, ensure the App is installed on that repo. Then run once and compare to a local scan.

**Rollback and tests:** The App workflow is **scan-only** (no upgrade, no rollback). Where rollback runs and what tests trigger it: [ROLLBACK_AND_TESTS.md](ROLLBACK_AND_TESTS.md).
