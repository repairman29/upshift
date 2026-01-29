# Supabase + MCP Setup (Smuggler project)

Your **smuggler** app and **Clawdbot** can both use the same Supabase project. This doc ties env and MCP together without touching secrets.

---

## Your Supabase project (from smuggler `env.example`)

| What | Value |
|------|--------|
| **Project ref** | `rbfzlqmkwhbvrrfdcain` |
| **URL** | `https://rbfzlqmkwhbvrrfdcain.supabase.co` |
| **Dashboard** | https://supabase.com/dashboard/project/rbfzlqmkwhbvrrfdcain |

---

## Env vars your code expects

Set these **yourself** (in `.env` or system env). Never commit real values.

| Variable | Used by | Purpose |
|----------|---------|--------|
| `SUPABASE_URL` | smuggler root, smuggler-ai-gm | Project URL |
| `SUPABASE_ANON_KEY` | smuggler, ai-gm | Client-safe public key |
| `SUPABASE_SERVICE_ROLE_KEY` | smuggler server, ai-gm services | Server-side admin; keep secret |
| `SUPABASE_READ_REPLICA_1_URL` | ai-gm (optional) | Read replica |
| `SUPABASE_READ_REPLICA_2_URL` | ai-gm (optional) | Read replica |

**Where to set them**

- **Smuggler app:** `~/smuggler/.env` (copy from `~/smuggler/env.example`, fill keys from [Supabase Dashboard → Settings → API](https://supabase.com/dashboard/project/rbfzlqmkwhbvrrfdcain/settings/api)).
- **Smuggler AI GM:** `~/smuggler/consultant-package/technical/smuggler-ai-gm/.env` (same keys; see that folder’s `.env.example`).
- **Clawdbot / Cursor:** If a tool needs Supabase env (e.g. a custom skill), use `~/.clawdbot/.env` or your shell profile so one place feeds everything.

---

## Supabase MCP (AI ↔ Supabase)

Supabase’s **hosted MCP server** lets Cursor (and other MCP clients) talk to your project: query DB, list tables, run SQL (with your approval).

- **MCP URL:** `https://mcp.supabase.com/mcp`
- **Auth:** Browser login to Supabase when you first use it (no PAT required).
- **Project scope:** This workspace’s Cursor MCP config is scoped to `rbfzlqmkwhbvrrfdcain` so only that project is used.

**In Cursor**

1. **Settings → Cursor Settings → Tools & MCP** (or open `.cursor/mcp.json` in this project).
2. Supabase is already added in this repo (see `.cursor/mcp.json`).
3. Use the assistant and ask e.g. “What tables are in my Supabase database? Use MCP tools.” Cursor will prompt you to log in to Supabase once; after that, the MCP server can query your project.

**Security (from Supabase docs)**

- Prefer a **dev** Supabase project for MCP, not production.
- Keep **manual approval** for tool calls enabled in Cursor.
- You can use **read-only** and **project scoping** (already scoped to `rbfzlqmkwhbvrrfdcain` here).

---

## Clawdbot agent and Supabase

Clawdbot’s gateway uses **skills** and **plugins**; it doesn’t load Cursor’s `mcp.json`. So:

- **Cursor:** Uses Supabase MCP via `.cursor/mcp.json` (this project) → you get “AI + Supabase” in the IDE.
- **Clawdbot (Telegram/local agent):** To have the agent query Supabase you’d add a **skill** or **plugin** that talks to Supabase (e.g. using the same env vars). That’s a separate step; for now, Cursor + MCP gives you AI + Supabase while you code.

---

## Quick checklist

- [ ] Copy `env.example` → `.env` in `~/smuggler` and `~/smuggler/consultant-package/technical/smuggler-ai-gm`.
- [ ] Fill `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` from the [API settings](https://supabase.com/dashboard/project/rbfzlqmkwhbvrrfdcain/settings/api).
- [ ] In Cursor, open this project (CLAWDBOT); MCP is configured in `.cursor/mcp.json`.
- [ ] Ask Cursor: “What tables are in my Supabase database? Use MCP.” and complete the one-time Supabase login if prompted.

Done. Your folders (smuggler + env files) lead to this one Supabase project; MCP in Cursor is scoped to it.
