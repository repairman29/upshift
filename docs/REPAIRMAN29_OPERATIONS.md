# Repairman29 Ops Playbook (JARVIS)

This guide turns JARVIS into a robust, 24/7 ops assistant for **repairman29**. It defines how to run CLIs, background agents, and ship products safely and consistently.

---

## Goals

- **Always-on execution:** background agents for long tasks
- **Fast iteration:** short replies, concrete actions
- **Safe shipping:** commits, pushes, releases, deploys
- **Clear state:** checkpoints + final summary
- **Work top-down:** master product list in priority order (see **products.json** + **PRODUCTS.md**)

---

## Preferred CLIs / Scripts

**Master product list:** `products.json` (repo root) — ordered list of products; **array order = top-down priority**. See **PRODUCTS.md**. Use for “what should I work on?”, “work top down”, and heartbeat “next product.”

Use the most specific script for the job (see `jarvis/TOOLS.md`):

- `node scripts/jarvis-admin.js` — full deployment + repo configuration
- `node scripts/jarvis-autonomous-build.js` — **autonomous build**: pull, validate skills, run subproject builds (non-interactive; for scheduling)
- `node scripts/manage-website.js` — GitHub Pages status + site health
- `node scripts/optimize-jarvis.js` — cleanup + performance
- `node scripts/setup-wizard.js` — machine setup
- `bash scripts/deploy-jarvis.sh` — end‑to‑end deploy (Linux/macOS)
- `npx clawdbot ...` — gateway, agent runs, message delivery

---

## Autonomous Build (scheduled)

To have JARVIS **build for you autonomously** (pull, validate, build) without manual steps:

1. **Run once:**  
   `node scripts/jarvis-autonomous-build.js` — pull latest, validate all skills (JSON + JS), run `optimize-jarvis --quick`, then build any **in-repo** subprojects that have a `package.json` with a `build` script (discovered automatically; apps in their own repos are not built here).
2. **Schedule (Windows):**  
   `powershell -ExecutionPolicy Bypass -File scripts\add-autonomous-build-schedule.ps1` — adds a daily task at 4 AM. Remove via Task Scheduler → "JARVIS Autonomous Build" → Delete.
3. **Options:**  
   `--dry-run` (no changes), `--skip-pull`, `--skip-build`, `--log path` (write log to file).

Use **autonomous build** when you want the repo to stay validated and built on a schedule; use **jarvis-admin deploy** when you want to commit, push, and deploy (interactive or with explicit confirmation).

---

## Background Agents (24/7 work)

Use `sessions_spawn` for long tasks (multi‑step research, refactors, product builds). The agent should:

1. **Announce** the background run: “Running a fuller pass; I’ll report back.”
2. **Define** scope + outputs (e.g., PR, release notes, deploy).
3. **Checkpoint** after each phase.
4. **Deliver** a concise final summary + next steps.

Keep background runs **bounded** and **auditable**: log commands, links, and files touched.

---

## Shipping Flow (default)

Use this standard flow unless the user says otherwise:

1. **Prep**
   - Pull latest (`git pull`)
   - Run quick sanity checks (e.g., CLI test)
2. **Work**
   - Edit files
   - Run targeted tests if available
3. **Commit**
   - Add relevant files only
   - Clear commit message (why > what)
4. **Push**
   - `git push origin main`
5. **Deploy**
   - If docs/site changed → GitHub Pages workflow runs
   - Otherwise, use `scripts/jarvis-admin.js` or `scripts/deploy-jarvis.sh`

---

## Fast, Robust Behavior (response shape)

- **Short, decisive replies**
- **Commands executed** (not just suggested)
- **Summaries** with paths, status, and next step
- **No waiting on uncertainty** — choose a reasonable path, execute, and adjust

---

## Full access to ship one product

To give JARVIS **full access** over one product (commit, push, deploy, run ops): set **`shipAccess: true`** on that product in products.json, allow **elevated exec** for your user in clawdbot.json, and ensure **GITHUB_TOKEN** (and any deploy tokens) are available to the gateway. See **docs/JARVIS_FULL_ACCESS_ONE_PRODUCT.md** for the full checklist.

## Deep work (planning, development, execution)

To have JARVIS do **deep work** on a product — full-cycle planning (PRD, roadmap, metrics), development (issues, PRs, implementation, tests), and execution (ship, run operation): set **`deepWorkAccess: true`** on that product in products.json (and **`shipAccess: true`** if JARVIS should also push/deploy). Trigger with “deep work on [product],” “full product cycle for [product],” or “plan, develop, and execute [product].” See **jarvis/DEEP_WORK_PRODUCT.md**.

---

## Guardrails

- **No destructive actions** unless explicitly asked
- **Never commit secrets**
- **Prefer reproducible scripts** over manual commands
- **Document changes** (paths + purpose)

---

## Quick Ops Checklist

- Gateway running
- Discord DM delivery tested (CLI send works)
- Repo clean or changes staged
- Tests (if any) run or explicitly skipped

