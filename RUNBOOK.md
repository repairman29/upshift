# Clawdbot Runbook

Quick reference for operating your Clawdbot setup.

## Status & Health

```bash
# Full status
clawdbot status

# Channel status
clawdbot channels list

# Deep status with probes
clawdbot status --deep

# Live logs
clawdbot logs --follow
```

## Gateway Management

```bash
# Restart gateway
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway

# Stop gateway
launchctl stop com.clawdbot.gateway

# Start gateway
launchctl start com.clawdbot.gateway

# Check if running
launchctl list | grep clawdbot
```

## Logs

```bash
# Gateway logs
tail -f ~/.clawdbot/logs/gateway.log

# Error logs
cat ~/.clawdbot/logs/gateway.err.log

# Detailed daily log
tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log
```

## Channels

### Discord
- Bot: @YourBotName
- Token: stored in `~/.clawdbot/.env` as `DISCORD_BOT_TOKEN`
- DM policy: pairing (new users get a code)

### iMessage
- CLI: `/opt/homebrew/bin/imsg`
- DB: `~/Library/Messages/chat.db`
- DM policy: pairing

**Pairing commands:**
```bash
# List pending
clawdbot pairing list discord
clawdbot pairing list imessage

# Approve
clawdbot pairing approve discord <CODE>
clawdbot pairing approve imessage <CODE>
```

## Memory

```bash
# Check memory status
clawdbot memory status

# Reindex memory files
clawdbot memory index

# Search memory
clawdbot memory search "query"
```

Memory files:
- Long-term: `~/jarvis/MEMORY.md`
- Daily logs: `~/jarvis/memory/YYYY-MM-DD.md`

## Skills

```bash
# List skills
clawdbot skills list

# Check skill requirements
clawdbot skills info <skill-name>
```

**Ready skills:** 1password, apple-notes, apple-reminders, github, imsg, notion, openhue, slack, spotify-player, video-frames, weather

**Needs API key:** sag (ELEVENLABS_API_KEY)

## Configuration

Main config: `~/.clawdbot/clawdbot.json`
Secrets: `~/.clawdbot/.env`
Workspace: `~/jarvis`

```bash
# Validate config
clawdbot doctor

# Apply fixes
clawdbot doctor --fix

# Security audit
clawdbot security audit --deep
```

## Troubleshooting

### No replies from bot
1. Check logs: `clawdbot logs --follow`
2. Look for "No reply from agent" or timeout errors
3. Verify model is responding: check Together AI dashboard
4. Restart gateway: `launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway`

### iMessage not working
1. Grant Full Disk Access to Terminal
2. Grant Automation permission for Messages.app
3. Check: `imsg chats --limit 5` (should list recent chats)

### Memory search not working
1. Check status: `clawdbot memory status`
2. Reindex: `clawdbot memory index`
3. Verify Together API key is set

### Session issues
```bash
# List sessions
clawdbot status | grep -A10 Sessions

# Clear a stuck session (if needed)
# Sessions are in ~/.clawdbot/agents/main/sessions/
```

## Product Owner Mode

Clawdbot is set up as a product owner and development partner.

### Strategic Files

| File | Purpose |
|------|---------|
| `~/jarvis/PRODUCTS.md` | Product knowledge (vision, roadmap, tech) |
| `~/jarvis/PRIORITIES.md` | Active work queue, what matters now |
| `~/jarvis/DECISIONS.md` | Architecture Decision Records |
| `~/jarvis/HEARTBEAT.md` | Proactive monitoring tasks |

### Voice Commands

| Say | Effect |
|-----|--------|
| "update priorities" | Edit PRIORITIES.md together |
| "update products" | Edit PRODUCTS.md with new info |
| "document this decision" | Add to DECISIONS.md |
| "what's the status?" | Summarize from products + priorities |
| "health check" | Run beast-mode/code-roach on project |
| "what should I work on?" | Get prioritized suggestions |

### Custom Tools

| Tool | Command | Purpose |
|------|---------|---------|
| echeo | `echeo` | Code/market matching |
| beast-mode | `beast-mode` | Quality intelligence |
| code-roach | `code-roach` | Code quality |

## Model Info

- **Primary:** ollama/llama3.1 (local, free)
- **Fallbacks:** ollama/qwen2.5-coder:7b, ollama/beast-mode-code-v3, together/Llama-3.3-70B
- **Embeddings:** BAAI/bge-large-en-v1.5 (Together AI)

## Repo index & Supabase Vault

Cross-repo search uses Supabase (repo_sources, repo_chunks, repo_summaries). Secrets come from `~/.clawdbot/.env` or Supabase Vault (app_secrets + `get_vault_secret_by_name`).

```bash
# Index one repo (needs GITHUB_TOKEN in .env or Vault for HTTPS clone)
node scripts/index-repos.js --repo JARVIS --limit 1

# Index all repos from repos.json
node scripts/index-repos.js

# Safety net (health + repo index freshness)
node scripts/jarvis-safety-net.js

# Vault healthcheck
node scripts/vault-healthcheck.js
```

- **Ollama:** Indexer uses `nomic-embed-text` for embeddings. Run `ollama pull nomic-embed-text` once.
- **Vault:** See `docs/VAULT_MIGRATION.md` and `docs/sql/002_vault_helpers.sql`.
- **Token rotation:** If `GITHUB_TOKEN` was ever used in a command or pasted in chat, rotate it in [GitHub → Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens): revoke the old one, create a new token (repo scope), then update `GITHUB_TOKEN` in `~/.clawdbot/.env` (and in Vault if you migrated that key).
- **Discord notifications:** The scheduled task runs `scripts/run-repo-index.bat`, which notifies when the job **starts** and **finishes** (or **fails**). Set `JARVIS_ALERT_WEBHOOK_URL` (or `DISCORD_WEBHOOK_URL`) in `~/.clawdbot/.env` to a [Discord channel webhook](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks) to receive JARVIS job alerts there. Same webhook is used for safety-net alerts.

## Key Paths

| What | Path |
|------|------|
| Config | `~/.clawdbot/clawdbot.json` |
| Secrets | `~/.clawdbot/.env` |
| Logs | `~/.clawdbot/logs/` |
| Sessions | `~/.clawdbot/agents/main/sessions/` |
| Memory DB | `~/.clawdbot/memory/main.sqlite` |
| Workspace | `~/jarvis/` |
| LaunchAgent | `~/Library/LaunchAgents/com.clawdbot.gateway.plist` |
