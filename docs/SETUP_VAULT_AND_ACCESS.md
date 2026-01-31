# Set up JARVIS with Vault and full access

One-time setup so JARVIS can use **Supabase Vault** for secrets and has **elevated exec** (ship, deploy) and sensible **bootstrap size** (fewer context overflows).

---

## 1. Prerequisites

- **Supabase project** with Vault: run **docs/sql/001_app_secrets.sql** and **docs/sql/002_vault_helpers.sql** in Supabase SQL Editor once.
- **~/.clawdbot/.env** with at least:
  - `SUPABASE_URL` — your Supabase project URL
  - `SUPABASE_SERVICE_ROLE_KEY` — service role key (so scripts can read Vault)

---

## 2. Run the setup script

From the JARVIS repo root:

```bash
node scripts/setup-jarvis-vault-and-access.js
```

This script:

- Verifies Vault access (or warns if no secrets in Vault yet).
- Reads your **Discord user ID** from env `JARVIS_DISCORD_USER_ID` or from Vault (`env/clawdbot/JARVIS_DISCORD_USER_ID`).
- Merges into **~/.clawdbot/clawdbot.json**:
  - **tools.elevated** — `enabled: true`, `allowFrom.discord: [your Discord ID]` (so JARVIS can run git, deploy CLIs, repo scripts when you ask).
  - **agents.defaults.bootstrapMaxChars** — `5000` (reduces context overflow; adjust if needed).
- Prints a checklist of secrets to add to Vault and the command to start the gateway with Vault.

---

## 3. Add secrets to Vault

So the gateway (and JARVIS) can use them when you start with **start-gateway-with-vault.js**:

| Secret | Purpose |
|--------|--------|
| **GITHUB_TOKEN** | Repo read/write — push, issues, PRs, workflow_dispatch (needed for POV/shipping). |
| **DISCORD_BOT_TOKEN** | Discord bot (if not already in Vault). |
| **GROQ_API_KEY** | Groq chat (if not already). |
| **JARVIS_DISCORD_USER_ID** | Your Discord user ID — used by setup script to fill `tools.elevated.allowFrom.discord`. |
| **VERCEL_TOKEN** / **RAILWAY_API_KEY** | Optional — if POV (or other products) deploy to Vercel/Railway. |
| **BRAVE_API_KEY** | Optional — Brave Search API (web search). Required if JARVIS says "requires a Brave Search API key." Get at https://brave.com/search/api/ or https://api-dashboard.search.brave.com. |

Add each to Vault (once):

```bash
node scripts/vault-set-secret.js GITHUB_TOKEN <your_github_pat> "GitHub PAT for repo push"
node scripts/vault-set-secret.js JARVIS_DISCORD_USER_ID <your_discord_id> "Discord user for elevated"
# Optional:
node scripts/vault-set-secret.js VERCEL_TOKEN <token> "Vercel deploy"
node scripts/vault-set-secret.js RAILWAY_API_KEY <key> "Railway deploy"
```

Get your Discord user ID: Discord → User Settings → Advanced → Developer Mode → On. Right‑click your avatar → Copy User ID. After adding **JARVIS_DISCORD_USER_ID** to Vault (or .env), re-run **setup-jarvis-vault-and-access.js** so your ID is merged into `tools.elevated.allowFrom.discord`.

---

## 4. Start the gateway with Vault

Use this instead of `npx clawdbot gateway run` so secrets are loaded from Vault into ~/.clawdbot/.env (and ~/.openclaw/.env), then the gateway runs:

```bash
node scripts/start-gateway-with-vault.js
```

The script resolves: DISCORD_BOT_TOKEN, GROQ_API_KEY, GITHUB_TOKEN, SUPABASE_*, VERCEL_TOKEN, RAILWAY_API_KEY, JARVIS_DISCORD_USER_ID, and other keys listed in the script. It writes them to both .clawdbot and .openclaw .env, then runs `npx clawdbot gateway run`.

---

## 5. Verify

- **Vault:** `node scripts/vault-healthcheck.js`
- **Discord token:** `node scripts/check-discord-bot.js`
- **Gateway:** Open http://127.0.0.1:18789/ or DM JARVIS on Discord; ask “Deep work on POV” or “ship POV” (if you gave POV shipAccess).

---

## Quick reference

| Goal | Command |
|------|--------|
| One-time setup (Vault + elevated + bootstrap) | `node scripts/setup-jarvis-vault-and-access.js` |
| Add a secret to Vault | `node scripts/vault-set-secret.js KEY value "notes"` |
| Start gateway with Vault | `node scripts/start-gateway-with-vault.js` |
| Vault healthcheck | `node scripts/vault-healthcheck.js` |

**TL;DR:** Run **setup-jarvis-vault-and-access.js** once (with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in ~/.clawdbot/.env). Add **GITHUB_TOKEN** and **JARVIS_DISCORD_USER_ID** to Vault with **vault-set-secret.js**. Start the gateway with **start-gateway-with-vault.js** so JARVIS has access to Vault and can ship when you ask.
