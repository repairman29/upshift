# Test deep work with JARVIS — POV (echeovid)

Quick checklist to verify the POV/echeovid setup and run a deep-work test with JARVIS.

---

## Check (done)

- **products.json** — POV is listed with `repo: "echeovid"`, `shipAccess: true`, `deepWorkAccess: true`, description: last-mile work, branding POV.
- **repos.json** — `echeovid` exists (repairman29/echeovid).
- **jarvis/AGENTS.md** — Deep work section references products.json and DEEP_WORK_PRODUCT.md.
- **jarvis/DEEP_WORK_PRODUCT.md** — Trigger phrases and planning → development → execution flow are defined.

---

## Before you test

1. **Gateway running** — JARVIS needs the Clawdbot gateway so it can read the workspace (AGENTS.md, TOOLS.md, products.json).
   ```bash
   npx clawdbot gateway run
   ```
   Or, if you use Vault for secrets:
   ```bash
   node scripts/start-gateway-with-vault.js
   ```
2. **Workspace** — Gateway should use the JARVIS repo as workspace (so it can read products.json and jarvis/*).
3. **Optional:** Index echeovid so JARVIS can use repo_search/repo_summary on it:
   ```bash
   node scripts/index-repos.js --repo echeovid --limit 1
   ```

---

## How to test

### Option A: Web dashboard (good for longer back-and-forth)

1. Open **http://127.0.0.1:18789/** (with gateway running).
2. Say one of:
   - **"Deep work on POV"**
   - **"Full product cycle for POV — it's nearly done, focus on last-mile polish and launch readiness."**
   - **"Do deep work on POV (echeovid repo). Focus on last-mile work to make it hum: polish, UX, launch readiness. Branding is now POV."**

### Option B: CLI (one-shot or multi-turn with same session)

```powershell
# One turn
npx clawdbot agent --session-id "pov-deep-work" --message "Deep work on POV. It's nearly finished; focus on last-mile polish, UX, and launch readiness. Branding is POV (repo: echeovid)." --local

# Same session for follow-up (run again with a new message)
npx clawdbot agent --session-id "pov-deep-work" --message "What's the next action?" --local
```

### Option C: Discord DM

1. Ensure your Discord user ID is in `tools.elevated.allowFrom.discord` in clawdbot.json (for exec/ship if JARVIS pushes or runs commands).
2. In a DM with JARVIS, say:
   - **"Deep work on POV — last mile work to make it hum."**

---

## What to expect

- **Planning:** JARVIS should scope to POV (echeovid), then outline or produce: problem → users → outcomes; PRD/roadmap/milestones; success metrics; launch checklist (last-mile focused).
- **Development:** Next, or when you say "continue," JARVIS may propose/issues/PRs, use repo_search if echeovid is indexed, and suggest concrete tasks (polish, UX, launch).
- **Execution:** If you ask JARVIS to ship, it will use shipAccess for echeovid (commit/push/deploy) per guardrails.
- **Checkpoints:** JARVIS should give a short summary after each phase and a **next action**.

If JARVIS doesn’t see products.json (e.g. wrong workspace), it won’t know POV has deepWorkAccess; fix the workspace and try again.

---

## What JARVIS needs from you (to keep working + shipping POV)

From a live CLI run and the full-access docs, JARVIS will need:

| Need | Purpose |
|------|--------|
| **Elevated exec** (clawdbot.json) | So JARVIS can run `git`, deploy CLIs, and repo scripts when you say "ship" or "run the operation." Your Discord/user ID in `tools.elevated.allowFrom.discord` (and web/CLI if you use those). |
| **GITHUB_TOKEN** (env or Vault) | So JARVIS can push to repairman29/echeovid, create/update issues and PRs, and trigger workflow_dispatch. Token needs `repo` scope (read/write). |
| **Deploy credentials** (if POV deploys somewhere) | e.g. Vercel, Railway, Netlify — add the token for that platform to `~/.clawdbot/.env` or Vault so JARVIS can run deploy commands. |
| **sessions_spawn** (if JARVIS says so) | For long deep-work runs JARVIS may ask to spawn a subagent. If Clawdbot has an allowlist for spawn (e.g. allowed agent IDs), add what it asks for so it can run background passes. |
| **Bootstrap / context** | AGENTS.md and TOOLS.md are large; they get truncated (e.g. 2000 chars). If you see "context overflow," increase `agents.defaults.bootstrapMaxChars` in clawdbot.json or trim workspace files. |
| **Rate limits** | Groq/OpenRouter free tiers have daily limits. If you hit 429, wait for reset or use a paid tier; JARVIS will still reply once a fallback model succeeds. |

**TL;DR:** For JARVIS to *keep* working on POV and *publish/ship* updates: **elevated exec** + **GITHUB_TOKEN** (and any deploy tokens for POV). Optional: allow spawn if JARVIS requests it; tune bootstrap/limits if you hit context or rate errors.

---

## Quick commands reference

| Goal              | Command / action |
|-------------------|------------------|
| Start gateway     | `npx clawdbot gateway run` or `node scripts/start-gateway-with-vault.js` |
| Open web UI       | http://127.0.0.1:18789/ |
| Index echeovid    | `node scripts/index-repos.js --repo echeovid --limit 1` |
| CLI deep work     | `npx clawdbot agent --session-id "pov-deep-work" --message "Deep work on POV..." --local` |
