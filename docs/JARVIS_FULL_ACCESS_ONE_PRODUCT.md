# Give JARVIS full access to ship one product

Checklist to let JARVIS **ship updates and run the operation** for a single product: commit, push, deploy, and run scripts/CLIs for that product’s repo.

---

## 1. Mark the product as “JARVIS can ship”

In **products.json** (repo root), set **`"shipAccess": true`** on the product you want JARVIS to have full access over.

Example (BEAST-MODE):

```json
{
  "name": "BEAST-MODE",
  "repo": "BEAST-MODE",
  "description": "Quality intelligence, AI Janitor, ...",
  "status": "active",
  "shipAccess": true
}
```

Only products with `shipAccess: true` are ones JARVIS is allowed to commit/push/deploy/run ops for (within guardrails). You can add `shipAccess: true` to more than one product if you want.

---

## 2. Allow elevated exec (gateway)

JARVIS needs **elevated exec** so it can run `git`, deploy CLIs (Vercel, Railway, etc.), and repo scripts.

1. Get your **Discord user ID**: Discord → User Settings → Advanced → Developer Mode → On. Right‑click your avatar → **Copy User ID**.
2. Edit **`%USERPROFILE%\.clawdbot\clawdbot.json`** (or `~/.openclaw/openclaw.json`). Under `"tools"` (create if missing):

```json
"tools": {
  "elevated": {
    "enabled": true,
    "allowFrom": {
      "discord": ["YOUR_DISCORD_USER_ID"]
    }
  }
}
```

Replace `YOUR_DISCORD_USER_ID` with your numeric ID. Add more IDs if others should be allowed.  
If you use **web dashboard** or **CLI**, ensure those channels are allowed for elevated (per Clawdbot docs).  
3. **Restart the gateway** after saving.

See **DISCORD_SETUP.md** for more detail.

---

## 3. Credentials JARVIS will use

JARVIS runs as the gateway process and uses env (or Vault) for secrets.

| Purpose | Env / Vault | Notes |
|--------|-------------|--------|
| **Git push** | `GITHUB_TOKEN` | GitHub PAT with `repo` (read/write). In `~/.clawdbot/.env` or Supabase Vault. |
| **Deploy (e.g. Vercel)** | `VERCEL_TOKEN` | If that product deploys to Vercel. Same env/Vault. |
| **Deploy (e.g. Railway)** | `RAILWAY_API_KEY` | If that product deploys to Railway. Same env/Vault. |
| **Other deploy** | Product-specific | Add the token for whatever platform that product uses. |

Gateway loads from `~/.clawdbot/.env` (and optionally Vault via `scripts/start-gateway-with-vault.js`). Ensure the token has **write** access to the repo you gave `shipAccess` to.

---

## 4. Where the repo lives (so JARVIS can run git / scripts)

- **JARVIS repo (this repo):** If the product is **JARVIS** and the gateway workspace is this repo, JARVIS can run `git` and scripts in the current directory. No extra path needed.
- **Other product repos:** For any other product (e.g. BEAST-MODE), JARVIS must run git/scripts **inside that repo**. Options:
  - **Clone to a fixed path** (e.g. `~/.jarvis/repos-cache/BEAST-MODE`) and run commands there. The indexer already uses a cache dir; you could reuse that path or document a “ship workspace” path.
  - **Trigger via CI:** JARVIS uses GitHub (issues, PRs, `workflow_dispatch`) to trigger builds/deploys in that repo instead of running git locally. Then “ship” = open PR + merge or trigger workflow; actual push/build runs in GitHub Actions.

For “full access” to **run the operation** in a non-JARVIS repo, either: (a) clone that repo to a known path and have JARVIS run git/scripts there, or (b) use GitHub API + workflow_dispatch and treat “ship” as “trigger CI/deploy.” Document which you use for that product (e.g. in PRODUCTS.md or a `shipInstructions` field).

---

## 5. What “full access” means for JARVIS

When a product has **`shipAccess: true`** and the user says “ship [product],” “you have full access to [product],” or “run the operation for [product]”:

- JARVIS may **commit, push, and deploy** for that product’s repo (using the credentials above and the repo path or CI flow you set up).
- JARVIS still follows **guardrails**: no destructive actions (e.g. force-push, delete branch) unless you explicitly ask; never commit secrets; prefer repo scripts over ad‑hoc commands when they exist.
- For that product, JARVIS can run: `git pull`, `git add`, `git commit`, `git push`, deploy CLIs (Vercel, Railway, etc.), and any repo-specific scripts you’ve documented (e.g. `npm run build`, `npm run deploy`).

See **docs/REPAIRMAN29_OPERATIONS.md** (Shipping Flow, Guardrails) and **jarvis/AGENTS.md** (Robust Ops, Platform CLIs).

---

## 6. Quick checklist

- [ ] **products.json** — `"shipAccess": true` on the product.
- [ ] **clawdbot.json** — `tools.elevated.enabled: true` and your Discord (and/or web/CLI) ID in `allowFrom`.
- [ ] **Credentials** — `GITHUB_TOKEN` (and any deploy tokens) in `~/.clawdbot/.env` or Vault; gateway started so it loads them (e.g. `scripts/start-gateway-with-vault.js` if you use Vault).
- [ ] **Repo location** — Either product = JARVIS (current workspace) or other repo cloned to a known path / “ship via CI” documented.
- [ ] **Restart gateway** after config changes.

**TL;DR:** Set `shipAccess: true` on the product in products.json, allow elevated exec for your user in clawdbot.json, put GITHUB_TOKEN (and deploy tokens) where the gateway can use them, and ensure JARVIS can run git/scripts in that repo (same workspace or cloned path or CI). Then JARVIS can ship updates and run the operation for that one product within the guardrails.
