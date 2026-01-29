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
- Bot: @JEFF BOT
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
- Long-term: `~/clawd/MEMORY.md`
- Daily logs: `~/clawd/memory/YYYY-MM-DD.md`

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
Workspace: `~/clawd`

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
| `~/clawd/PRODUCTS.md` | Product knowledge (vision, roadmap, tech) |
| `~/clawd/PRIORITIES.md` | Active work queue, what matters now |
| `~/clawd/DECISIONS.md` | Architecture Decision Records |
| `~/clawd/HEARTBEAT.md` | Proactive monitoring tasks |

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
| echeo | `/opt/homebrew/bin/echeo` | Code/market matching |
| beast-mode | `beast-mode` | Quality intelligence |
| code-roach | `node ~/smuggler-code-roach/cli/code-roach.js` | Code quality |

### Products Being Built

- **Echeo** - The Resonant Engine
- **BEAST MODE** - Enterprise Quality Intelligence
- **Code Roach** - Self-learning code quality
- **Smugglers RPG** - AI game master
- **Project Forge** - OKR platform
- **Echeovid** - Video content platform

## Model Info

- **Primary:** ollama/llama3.1 (local, free)
- **Fallbacks:** ollama/qwen2.5-coder:7b, ollama/beast-mode-code-v3, together/Llama-3.3-70B
- **Embeddings:** BAAI/bge-large-en-v1.5 (Together AI)

## Key Paths

| What | Path |
|------|------|
| Config | `~/.clawdbot/clawdbot.json` |
| Secrets | `~/.clawdbot/.env` |
| Logs | `~/.clawdbot/logs/` |
| Sessions | `~/.clawdbot/agents/main/sessions/` |
| Memory DB | `~/.clawdbot/memory/main.sqlite` |
| Workspace | `~/clawd/` |
| LaunchAgent | `~/Library/LaunchAgents/com.clawdbot.gateway.plist` |
