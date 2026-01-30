# Build Your Own JARVIS: A Developer's Guide to CLAWDBOT

So you want your own AI assistant that you can chat with on Discord, iMessage, or Telegram? One that remembers your conversations, has a unique personality, and can control your smart home, play music, or help you code? This guide will get you there.

**CLAWDBOT** is an AI assistant framework that turns any LLM into a personal assistant accessible from your favorite messaging apps. Think JARVIS from Iron Man, but open and customizable.

---

## Table of Contents

1. [What You're Building](#what-youre-building)
2. [Prerequisites](#prerequisites)
3. [Quick Start (30 minutes)](#quick-start-30-minutes)
4. [Deep Dive: Configuration](#deep-dive-configuration)
5. [Personality & Identity](#personality--identity)
6. [Adding Skills](#adding-skills)
7. [Voice Support](#voice-support)
8. [Memory System](#memory-system)
9. [Multi-Channel Setup](#multi-channel-setup)
10. [Running as a Service](#running-as-a-service)
11. [Troubleshooting](#troubleshooting)
12. [Advanced: Building Custom Skills](#advanced-building-custom-skills)
13. [**The Good Stuff: Real-World Customizations**](#the-good-stuff-real-world-customizations)
    - [Grocery Shopping with Kroger](#grocery-shopping-with-krogerking-soopers)
    - [Google Workspace (Manage Your LIFE)](#google-workspace-integration-manage-your-life)
    - [AI Image Generation](#ai-image-generation)
    - [Multi-Agent Swarm Mode](#multi-agent-system-swarm-mode)
    - [Push Notifications](#push-notifications-to-phone)
    - [Security Scanning](#security-scanning)
    - [Operational Modes (Free vs Paid)](#operational-modes-free-vs-paid-stack)
    - [Developer Tools (BEAST MODE, Echeo)](#developer-tools-integration)
    - [Command Cheat Sheet](#the-jarvis-arsenal-command-cheat-sheet)
    - [Heartbeat Checks](#proactive-heartbeat-checks)
    - [Product Owner Mode](#building-products-together-product-owner-mode)
14. [Your Turn: Start Simple, Build Up](#your-turn-start-simple-build-up)

---

## What You're Building

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOUR JARVIS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                │
│   │ Discord  │    │ iMessage │    │ Telegram │   ← Channels   │
│   └────┬─────┘    └────┬─────┘    └────┬─────┘                │
│        │               │               │                       │
│        └───────────────┼───────────────┘                       │
│                        ▼                                        │
│              ┌─────────────────┐                               │
│              │    Gateway      │  ← Routes messages            │
│              └────────┬────────┘                               │
│                       ▼                                        │
│              ┌─────────────────┐                               │
│              │     Agent       │  ← Your AI brain              │
│              │  (LLM + Memory  │                               │
│              │   + Skills)     │                               │
│              └────────┬────────┘                               │
│                       ▼                                        │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│   │ Spotify  │  │  Lights  │  │  Notes   │  │  GitHub  │ ... │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│                        ↑                                       │
│                     Skills                                     │
└─────────────────────────────────────────────────────────────────┘
```

**Key features:**
- Chat via Discord, iMessage, Telegram, or all three
- Persistent memory across conversations
- Custom personality and behavior
- Extensible skills (Spotify, smart lights, GitHub, etc.)
- Voice input/output (optional)
- Runs locally on your Mac (or a server)

---

## Prerequisites

### Required

| Item | Why |
|------|-----|
| **macOS** (Intel or Apple Silicon) | Gateway runs as a macOS service. Linux support is possible but not covered here. |
| **Node.js 18+** | Runtime for the gateway |
| **Homebrew** | Package manager for dependencies |
| **An LLM API key** | Powers the AI brain (see options below) |

### LLM Options (pick one)

| Provider | Cost | Speed | Quality | Notes |
|----------|------|-------|---------|-------|
| **Together AI** | ~$0.001/msg | Fast | Excellent | Recommended. Llama 3.3 70B is great. |
| **Anthropic (Claude)** | ~$0.01/msg | Fast | Best | Most capable, but pricier |
| **OpenAI** | ~$0.005/msg | Fast | Excellent | GPT-4o works well |
| **Ollama (local)** | Free | Varies | Good | Requires decent GPU/RAM |
| **Groq** | Free tier | Very fast | Good | Great for testing |

### Optional (for full JARVIS experience)

| Item | Purpose |
|------|---------|
| **Discord Bot Token** | Chat via Discord |
| **ElevenLabs API Key** | Voice output (text-to-speech) |
| **Groq API Key** | Voice input (speech-to-text) |
| **Smart home APIs** | Control lights, etc. |

---

## Quick Start (30 minutes)

### Step 1: Install Clawdbot CLI

```bash
# Install via npm (recommended)
npm install -g clawdbot

# Or via Homebrew
brew tap clawdbot/tap
brew install clawdbot
```

Verify installation:

```bash
clawdbot --version
```

### Step 2: Initialize Your Workspace

```bash
# Create workspace directory
mkdir -p ~/jarvis
cd ~/jarvis

# Initialize clawdbot
clawdbot init
```

This creates:
- `~/.clawdbot/` — Config and secrets
- `~/jarvis/` — Your workspace (memory, identity, tools)

### Step 3: Add Your LLM API Key

```bash
# Open the env file
nano ~/.clawdbot/.env
```

Add your API key (pick one):

```bash
# Together AI (recommended)
TOGETHER_API_KEY=your_key_here

# Or Anthropic
ANTHROPIC_API_KEY=your_key_here

# Or OpenAI
OPENAI_API_KEY=your_key_here
```

### Step 4: Configure the Model

```bash
# Edit main config
nano ~/.clawdbot/clawdbot.json
```

Set your preferred model:

```json
{
  "agents": {
    "defaults": {
      "model": "together/meta-llama/Llama-3.3-70B-Instruct-Turbo"
    }
  }
}
```

**Model options:**

| Provider | Model String |
|----------|-------------|
| Together AI | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` |
| Anthropic | `anthropic/claude-sonnet-4-20250514` |
| OpenAI | `openai/gpt-4o` |
| Ollama (local) | `ollama/llama3.1` |

### Step 5: Generate Gateway Token

```bash
# Generate a secure token
openssl rand -hex 32
```

Add to `~/.clawdbot/.env`:

```bash
CLAWDBOT_GATEWAY_TOKEN=your_generated_token_here
```

### Step 6: Test It

```bash
# Run gateway in foreground (for testing)
clawdbot gateway run
```

Open another terminal and send a test message:

```bash
clawdbot chat "Hello JARVIS, introduce yourself"
```

If you get a response, you're live! Press `Ctrl+C` to stop the gateway.

---

## Deep Dive: Configuration

### Config File Structure

Main config lives at `~/.clawdbot/clawdbot.json`:

```json
{
  "gateway": {
    "mode": "local",
    "port": 3033
  },
  "agents": {
    "defaults": {
      "model": "together/meta-llama/Llama-3.3-70B-Instruct-Turbo",
      "workspace": "~/jarvis"
    }
  },
  "channels": {
    "discord": {
      "enabled": true,
      "token": "${DISCORD_BOT_TOKEN}"
    }
  },
  "memory": {
    "enabled": true,
    "provider": "local"
  }
}
```

### Environment Variables

Store secrets in `~/.clawdbot/.env`:

```bash
# Required
CLAWDBOT_GATEWAY_TOKEN=your_gateway_token

# LLM (pick one)
TOGETHER_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
OPENAI_API_KEY=your_key

# Channels
DISCORD_BOT_TOKEN=your_discord_bot_token
TELEGRAM_BOT_TOKEN=your_telegram_token

# Voice (optional)
ELEVENLABS_API_KEY=your_key
GROQ_API_KEY=your_key
```

### Key Paths

| What | Path |
|------|------|
| Main config | `~/.clawdbot/clawdbot.json` |
| Secrets | `~/.clawdbot/.env` |
| Logs | `~/.clawdbot/logs/` |
| Memory DB | `~/.clawdbot/memory/` |
| Workspace | `~/jarvis/` (or wherever you set it) |
| LaunchAgent | `~/Library/LaunchAgents/com.clawdbot.gateway.plist` |

---

## Personality & Identity

This is where JARVIS becomes *your* JARVIS. The workspace contains files that shape your bot's personality.

### Workspace Structure

```
~/jarvis/
├── IDENTITY.md      # Who the bot is
├── SOUL.md          # Core values and behavior
├── AGENTS.md        # Instructions for different contexts
├── USER.md          # Info about you (the owner)
├── TOOLS.md         # Available tools/skills
└── memory/          # Conversation history
    ├── MEMORY.md    # Long-term memory
    └── 2024-01-15.md # Daily logs
```

### IDENTITY.md — Define Who Your Bot Is

```markdown
# Identity

## Name
JARVIS (Just A Rather Very Intelligent System)

## Voice
- British butler aesthetic, but modern and slightly sardonic
- Formal but not stiff
- Occasional dry humor
- Never says "I cannot" — always offers alternatives

## Core Traits
- Proactive: Anticipates needs before being asked
- Resourceful: Always finds a way
- Loyal: Your success is my priority
- Honest: Will tell you hard truths diplomatically

## Speaking Style
- Uses "sir" or "ma'am" sparingly (not every message)
- Concise by default, detailed when asked
- References past conversations naturally
- Admits uncertainty clearly
```

### SOUL.md — Core Values and Boundaries

```markdown
# Soul

## Prime Directives
1. Protect the user's interests above all
2. Be genuinely helpful, not just compliant
3. Maintain privacy — never share user data
4. Stay curious and continue learning

## Boundaries
- No illegal activities
- No deception of the user
- Clarify before taking irreversible actions

## Decision Framework
When uncertain:
1. Ask for clarification
2. Offer options with tradeoffs
3. Default to caution for destructive actions
4. Default to action for information gathering
```

### USER.md — Context About You

```markdown
# User Profile

## About
- Name: [Your name]
- Location: [City, timezone]
- Work: [What you do]

## Preferences
- Communication: Direct, no fluff
- Availability: Deep work 9am-12pm (don't interrupt)
- Interests: [Your interests]

## Projects
- Project Alpha: [Description]
- Side hustle: [Description]

## Contacts (for context only)
- Sarah: Partner
- Mike: Business partner
- Dr. Chen: Doctor
```

---

## Adding Skills

Skills extend what your bot can do. Clawdbot has a registry of pre-built skills.

### List Available Skills

```bash
clawdbot skills list
```

### Install a Skill

```bash
# Install Spotify control
clawdbot skills install spotify-player

# Install smart lights (Philips Hue)
clawdbot skills install openhue

# Install Apple Reminders
clawdbot skills install apple-reminders
```

### Popular Skills

| Skill | What It Does | Requirements |
|-------|--------------|--------------|
| `kroger` | Search products, prices, stores, shopping list (Kroger/King Soopers) | Kroger API keys + store ID (see [Grocery](#grocery-shopping-with-krogerking-soopers)) |
| `spotify-player` | Play/pause/skip, search music | Spotify Premium |
| `openhue` | Control Philips Hue lights | Hue Bridge on network |
| `apple-reminders` | Create/manage reminders | macOS |
| `apple-notes` | Read/create notes | macOS |
| `github` | Manage repos, issues, PRs | GitHub token |
| `notion` | Access Notion workspace | Notion API key |
| `slack` | Send/read Slack messages | Slack app token |
| `weather` | Get weather info | Free API key |

### Skill Configuration

Some skills need API keys. Add them to `~/.clawdbot/.env`:

```bash
# Spotify
SPOTIFY_CLIENT_ID=your_id
SPOTIFY_CLIENT_SECRET=your_secret

# GitHub
GITHUB_TOKEN=your_token

# Notion
NOTION_API_KEY=your_key
```

---

## Voice Support

### Text-to-Speech (Bot Speaks)

Uses ElevenLabs for natural voice output.

1. Get API key from [elevenlabs.io](https://elevenlabs.io)
2. Add to `~/.clawdbot/.env`:
   ```bash
   ELEVENLABS_API_KEY=your_key
   ```
3. Configure voice in `clawdbot.json`:
   ```json
   {
     "voice": {
       "tts": {
         "provider": "elevenlabs",
         "voice": "adam",
         "model": "eleven_turbo_v2"
       }
     }
   }
   ```

### Speech-to-Text (Bot Listens)

Uses Groq's Whisper for fast transcription.

1. Get API key from [groq.com](https://groq.com)
2. Add to `~/.clawdbot/.env`:
   ```bash
   GROQ_API_KEY=your_key
   ```
3. Configure in `clawdbot.json`:
   ```json
   {
     "voice": {
       "stt": {
         "provider": "groq",
         "model": "whisper-large-v3"
       }
     }
   }
   ```

Now you can send voice messages on Discord/Telegram and get voice replies!

---

## Memory System

Your JARVIS remembers everything (that you want it to).

### How Memory Works

1. **Short-term**: Current conversation context
2. **Daily logs**: `~/jarvis/memory/YYYY-MM-DD.md` — auto-generated summaries
3. **Long-term**: `~/jarvis/MEMORY.md` — persistent knowledge
4. **Vector search**: Semantic search across all memory (requires embeddings)

### Memory Commands

```bash
# Check memory status
clawdbot memory status

# Search memory
clawdbot memory search "that restaurant we talked about"

# Reindex (after manual edits)
clawdbot memory index
```

### Embeddings for Semantic Search

Add Together AI embeddings (or another provider):

```json
{
  "memory": {
    "embeddings": {
      "provider": "together",
      "model": "BAAI/bge-large-en-v1.5"
    }
  }
}
```

---

## Multi-Channel Setup

### Discord

See [DISCORD_SETUP.md](./DISCORD_SETUP.md) for full details.

Quick version:

1. Create bot at [Discord Developer Portal](https://discord.com/developers/applications)
2. Enable Message Content Intent
3. Get bot token, add to `~/.clawdbot/.env`:
   ```bash
   DISCORD_BOT_TOKEN=your_token
   ```
4. Invite bot to your server
5. Configure in `clawdbot.json`:
   ```json
   {
     "channels": {
       "discord": {
         "enabled": true,
         "token": "${DISCORD_BOT_TOKEN}",
         "dm": { "enabled": true, "policy": "pairing" }
       }
     }
   }
   ```

### Telegram

1. Create bot via [@BotFather](https://t.me/botfather) on Telegram
2. Get token, add to `~/.clawdbot/.env`:
   ```bash
   TELEGRAM_BOT_TOKEN=your_token
   ```
3. Configure:
   ```json
   {
     "channels": {
       "telegram": {
         "enabled": true,
         "token": "${TELEGRAM_BOT_TOKEN}"
       }
     }
   }
   ```

### iMessage (macOS only)

1. Grant Terminal "Full Disk Access" (System Preferences → Privacy)
2. Grant Automation for Messages.app
3. Install imsg CLI:
   ```bash
   brew install imsg
   ```
4. Configure:
   ```json
   {
     "channels": {
       "imessage": {
         "enabled": true
       }
     }
   }
   ```

### Pairing (Security)

By default, new users must "pair" before chatting:

1. User sends DM to bot
2. Bot sends a pairing code
3. You approve:
   ```bash
   clawdbot pairing approve discord ABC123
   ```

To disable (allow anyone):

```json
{
  "channels": {
    "discord": {
      "dm": { "policy": "open" }
    }
  }
}
```

---

## Running as a Service

Don't want to keep a terminal open? Run the gateway as a background service.

### Install as LaunchAgent (macOS)

```bash
# Install the service
clawdbot gateway install

# Start it
clawdbot gateway start

# Check status
clawdbot status
```

### Service Management

```bash
# Stop gateway
clawdbot gateway stop

# Restart
clawdbot gateway restart

# View logs
clawdbot logs --follow

# Uninstall service
clawdbot gateway uninstall
```

### Manual launchctl commands

```bash
# Restart gateway
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway

# Stop
launchctl stop com.clawdbot.gateway

# Check if running
launchctl list | grep clawdbot
```

---

## Troubleshooting

### Bot doesn't respond

1. Check if gateway is running:
   ```bash
   clawdbot status
   ```
2. Check logs:
   ```bash
   clawdbot logs --follow
   ```
3. Verify API key is set:
   ```bash
   cat ~/.clawdbot/.env | grep API_KEY
   ```
4. Test locally:
   ```bash
   clawdbot chat "hello"
   ```

### Discord bot shows online but doesn't reply

1. Check Message Content Intent is enabled in Discord Developer Portal
2. Verify bot token is correct
3. Check pairing:
   ```bash
   clawdbot pairing list discord
   ```

### "No session found" error

This happens when the bot can't map your user ID to a session. Fix:

1. Check sessions:
   ```bash
   ls ~/.clawdbot/agents/main/sessions/
   ```
2. See [DISCORD_SETUP.md](./DISCORD_SETUP.md) for session alias fix

### Memory search returns nothing

1. Check status:
   ```bash
   clawdbot memory status
   ```
2. Reindex:
   ```bash
   clawdbot memory index
   ```
3. Verify embeddings API key is set

### Slow responses

1. Try a faster/smaller model:
   ```json
   { "model": "together/meta-llama/Llama-3.1-8B-Instruct-Turbo" }
   ```
2. Use Groq for near-instant responses (free tier available)
3. If using Ollama, ensure you have enough RAM/VRAM

### Run diagnostics

```bash
# Full health check
clawdbot doctor

# Auto-fix common issues
clawdbot doctor --fix

# Security audit
clawdbot security audit
```

---

## Advanced: Building Custom Skills

Want your bot to do something unique? Build a custom skill.

### Skill Structure

```
my-skill/
├── skill.json       # Manifest
├── index.js         # Main code
└── README.md        # Docs
```

### skill.json

```json
{
  "name": "my-awesome-skill",
  "version": "1.0.0",
  "description": "Does awesome things",
  "tools": [
    {
      "name": "do_awesome_thing",
      "description": "Does the awesome thing",
      "parameters": {
        "type": "object",
        "properties": {
          "input": {
            "type": "string",
            "description": "What to make awesome"
          }
        },
        "required": ["input"]
      }
    }
  ]
}
```

### index.js

```javascript
module.exports = {
  async do_awesome_thing({ input }) {
    // Your logic here
    const result = await makeItAwesome(input);
    return { success: true, result };
  }
};
```

### Install Local Skill

```bash
clawdbot skills install ./my-skill
```

---

## What's Next?

Now that you have your own JARVIS:

1. **Customize the personality** — Make it uniquely yours
2. **Add skills** — Start with one or two that you'll actually use
3. **Train it** — Chat naturally and it will learn your preferences
4. **Invite friends** — Set up pairing so they can use it too
5. **Build something cool** — Custom skills for your specific needs

---

## Resources

- [Clawdbot Documentation](https://docs.clawd.bot)
- [Skill Registry](https://clawdhub.com/skills)
- [Discord Community](https://discord.gg/clawdbot)
- [GitHub](https://github.com/clawdbot/clawdbot)

---

## The Good Stuff: Real-World Customizations

This section shows what's *actually* possible when you go all-in. These are real integrations built on top of the base JARVIS setup.

---

### Grocery Shopping with Kroger/King Soopers

Yes, JARVIS can check grocery prices and build shopping lists. For real.

**Setup:**
1. Register at [Kroger Developer Portal](https://developer.kroger.com)
2. Create an app, get Client ID and Secret
3. Add to `~/.clawdbot/.env`:
   ```bash
   KROGER_CLIENT_ID=your_client_id
   KROGER_CLIENT_SECRET=your_secret
   KROGER_LOCATION_ID=your_store_id  # 8 chars; find at kroger.com when you select a store (required for prices)
   ```
4. Install the Kroger skill (from this repo): `clawdbot skills install ./skills/kroger`  
   Or copy `skills/kroger` to `~/jarvis/skills/kroger`.
5. **Give JARVIS access:** Copy or merge the files in **`jarvis/`** (TOOLS.md, AGENTS.md) into your `~/jarvis/` workspace so the agent knows to use Kroger. See `jarvis/README.md` and `skills/kroger/JARVIS_ACCESS.md`.

**What you can do:**

```bash
# Search products with real-time prices
kroger search milk
# → "2% milk is $3.39/gallon, whole milk also $3.39"

# Build a shopping list
kroger shop tortillas beef cheese salsa
# → Lists all items with prices, totals it up

# Find nearby stores
kroger stores YOUR_ZIP_CODE

# Open cart in browser
kroger cart
```

**Example conversation:**

> **You:** "What's the price of eggs at King Soopers?"
> 
> **JARVIS:** *runs search* "Kroger Cage Free eggs are $2.09/dozen, Large Grade A are $1.89"
>
> **You:** "Make me a shopping list for tacos"
>
> **JARVIS:** "Here's your list:
> - Mission flour tortillas: $2.99
> - Ground beef 80/20: $5.49/lb
> - Shredded cheddar: $3.29
> - Pace chunky salsa: $2.79
> **Total: ~$14.56**"

---

### Google Workspace Integration (Manage Your LIFE)

Full access to Gmail, Calendar, Drive, Tasks, Docs, and Contacts. JARVIS becomes your executive assistant.

**Setup:**
1. Install the `gog` CLI (Google CLI tool)
2. Run `gog auth login` and complete OAuth
3. Create skill file at `~/jarvis/skills/google/SKILL.md`

**What you can do:**

#### Gmail
```bash
# Check unread emails
gog gmail search 'is:unread' --max 10

# Important emails from today
gog gmail search 'is:unread is:important newer_than:1d'

# Send an email
gog gmail send --to boss@company.com --subject "Project Update" --body "Here's the status..."

# Reply to a thread
gog gmail send --to person@email.com --subject "Re: Meeting" --body "Sounds good!" --reply-to-message-id <msgId>
```

#### Calendar
```bash
# Today's schedule
gog calendar events primary --from $(date -I) --to $(date -v+1d -I)

# This week
gog calendar events primary --from $(date -I) --to $(date -v+7d -I)

# Create a meeting
gog calendar create primary --summary "Lunch with Sarah" --from "2026-01-30T12:00:00" --to "2026-01-30T13:00:00"

# All-day event
gog calendar create primary --summary "Vacation" --from "2026-02-01" --to "2026-02-05"
```

#### Tasks
```bash
# List tasks
gog tasks list @default

# Add a task
gog tasks add @default --title "Buy groceries"

# Add with due date
gog tasks add @default --title "Submit report" --due "2026-01-31"

# Complete a task
gog tasks update @default <taskId> --status completed
```

#### Drive & Docs
```bash
# Search files
gog drive search "quarterly report" --max 10

# Create a new doc
gog docs create "Meeting Notes"

# Export as PDF
gog docs export <docId> --format pdf
```

**Example conversation:**

> **You:** "What's on my calendar today?"
>
> **JARVIS:** "You have 3 events:
> - 9:00 AM: Team standup (30 min)
> - 1:00 PM: Lunch with Mike
> - 3:30 PM: Client call - Project Alpha"
>
> **You:** "Any urgent emails?"
>
> **JARVIS:** "2 unread flagged as important:
> 1. From: accounting@company.com - 'Invoice Due Tomorrow'
> 2. From: boss@company.com - 'Need your input ASAP'"
>
> **You:** "Schedule a dentist appointment for next Tuesday at 2pm"
>
> **JARVIS:** "Done. Added 'Dentist Appointment' to your calendar for Tuesday, February 4th at 2:00 PM."

#### Morning Briefing

Set up a heartbeat check that runs automatically:

```bash
echo "=== 📧 Unread Important Emails ==="
gog gmail search 'is:unread is:important' --max 5

echo ""
echo "=== 📅 Today's Schedule ==="
gog calendar events primary --from $(date -I) --to $(date -v+1d -I)

echo ""
echo "=== ✅ Due Tasks ==="
gog tasks list @default | grep -i "due"
```

---

### AI Image Generation

Generate images on demand using the best AI models.

**Setup:**
```bash
# Add API keys to ~/.clawdbot/.env
REPLICATE_API_TOKEN=your_token
OPENAI_API_KEY=your_key  # For DALL-E 3
STABILITY_API_KEY=your_key  # For Stable Diffusion
```

**Quick generation:**
```bash
# Fast (2-5 seconds, $0.003)
imagine "a robot butler serving coffee in a futuristic kitchen"

# High quality (10-20 seconds, $0.03)
imagine --hq "detailed portrait of a cyberpunk hacker"

# DALL-E 3 (follows prompts exactly)
imagine --dalle "a logo for a tech startup called Echeo"
```

**Models available:**

| Model | Speed | Quality | Cost | Best For |
|-------|-------|---------|------|----------|
| Flux Schnell | ⚡ 2-5s | ★★★★ | $0.003 | Quick drafts |
| Flux Dev | 🕐 10-20s | ★★★★★ | $0.03 | High quality |
| DALL-E 3 | 🕐 10-15s | ★★★★ | $0.08 | Following prompts exactly |
| SDXL | 🕐 10-15s | ★★★★ | $0.02 | Versatile |

---

### Multi-Agent System (Swarm Mode)

Spawn specialized sub-agents for parallel work. 3x faster than sequential.

**Available agents:**

| Agent | Specialty | Best For |
|-------|-----------|----------|
| `main` | Full JARVIS | Everything |
| `coder` | Code specialist | Writing, refactoring, tests |
| `ops` | DevOps | Deployments, monitoring |
| `researcher` | Research | Analysis, docs, finding info |

**Commands:**
```bash
# Single agent
spawn coder "implement user authentication"
spawn ops "deploy to production"
spawn researcher "find best caching libraries for Node.js"

# Parallel (SWARM MODE) - 3 agents working simultaneously
swarm "coder:add tests" "ops:check logs" "researcher:find examples"

# Agent-to-agent handoff (waits for response)
a2a researcher "what's the best approach for this?"
```

**Real workflow example:**
```bash
# Parallel feature development
swarm \
  "researcher:find best auth libraries for Node.js" \
  "coder:scaffold auth module structure" \
  "ops:prepare staging environment"

# All three work simultaneously, then you combine results
```

---

### Push Notifications to Phone

Get alerts when things happen.

**Setup:**
1. Install [ntfy app](https://ntfy.sh) on your phone
2. Subscribe to your topic (e.g., `jarvis-abc123`)
3. Add to `~/.clawdbot/.env`:
   ```bash
   NTFY_TOPIC=jarvis-abc123
   ```

**Usage:**
```bash
# Simple notification
notify "Deploy complete!" "JARVIS"

# Urgent (loud sound)
notify "🚨 Production error!" "ALERT" urgent
```

**Auto-notify on events:**
- Deploy finished
- CI/CD failed
- Long-running task complete
- Error detected in logs
- PR needs review

---

### Security Scanning

Scan code for vulnerabilities before shipping.

```bash
# Full security scan
security-scan ~/my-project

# Just semgrep (fast)
semgrep scan --config auto .

# npm audit
npm audit
```

**What it checks:**
- Code vulnerabilities (SQL injection, XSS, etc.)
- Dependency issues
- Secrets in code
- Known CVEs

---

### Operational Modes (Free vs Paid Stack)

Switch between free and paid AI backends depending on your needs.

#### 🔵 Blue Mode (FREE)

**Blue Cloud** — Free cloud APIs:
```bash
# Groq: FREE, 70B model, ~0.4 second responses!
aider --model groq/llama-3.3-70b-versatile

# Together AI: FREE tier
aider --model together_ai/meta-llama/Llama-3.3-70B-Instruct-Turbo

# Gemini: FREE, generous limits
aider --model gemini/gemini-1.5-pro
```

**Blue Offline** — 100% local, no internet:
```bash
# Local Ollama models
aider --model ollama/qwen2.5-coder:7b
```

**Cost: $0/month** — Everything free!

#### 🟡 Yellow Mode (Premium)

Full Cursor with GPT-5.2, Claude 4.5 Opus:
```bash
cursor agent --model opus-4.5-thinking --workspace ~/project "implement feature"
```

**When to use each:**
- **Blue Cloud**: Default for most tasks (free + fast)
- **Blue Offline**: No internet, max privacy
- **Yellow**: Complex multi-file changes, advanced reasoning

---

### Developer Tools Integration

#### BEAST MODE — Quality Intelligence
```bash
# Initialize in project
beast-mode init

# Quality score (0-100)
beast-mode quality score

# AI Janitor (overnight cleanup)
beast-mode janitor enable

# Vibe Restoration (rewind to last working state)
beast-mode vibe restore

# Architecture enforcement
beast-mode architecture check
```

#### Echeo — Code-to-Opportunity Matching
```bash
# Scan codebase for capabilities
echeo --path ~/my-project

# Find bounties that match your skills
echeo --scrape-github ethereum/go-ethereum
echeo --match-needs bounties.json
```

#### Code Roach — Self-Learning Quality
```bash
# Analyze PRs
code-roach analyze pr

# Code health scoring
code-roach health
```

---

### The JARVIS Arsenal (Command Cheat Sheet)

| Command | What It Does |
|---------|--------------|
| `imagine "prompt"` | Generate images with Flux (1-3 seconds) |
| `aider` | AI pair programming |
| `lazygit` | Visual git TUI |
| `fly deploy` | Deploy to edge globally |
| `gh pr create` | Create pull requests |
| `beast-mode quality` | Run quality checks |
| `echeo scan` | Find capabilities in code |
| `say "message"` | Speak responses (macOS TTS) |
| `notify "msg"` | Push notification to phone |
| `security-scan .` | Scan for vulnerabilities |
| `spawn agent "task"` | Spawn sub-agent |
| `swarm "a:task" "b:task"` | Run agents in parallel |
| `kroger search term` | Search grocery products |
| `gog gmail search` | Check Gmail |
| `gog calendar events` | Check Calendar |

---

### Proactive Heartbeat Checks

JARVIS doesn't just respond — it proactively monitors and alerts you.

**Create `~/jarvis/HEARTBEAT.md`:**

```markdown
# Heartbeat Tasks

## Check 2-3x Daily
- [ ] Important unread emails
- [ ] Upcoming calendar events (next 2 hours)
- [ ] Urgent keywords in inbox

## Weekly
- [ ] Review stale PRs
- [ ] Check failing CI/CD
- [ ] Update memory files

## Alert Me When
- 📧 Urgent/important unread email
- 📅 Event starting in < 30 minutes  
- 🚨 CI/CD failing on priority project
- 💰 Found bounty matching my skills
```

---

### Building Products Together (Product Owner Mode)

JARVIS isn't just an assistant — it's a development partner that tracks your projects.

**Strategic files:**

| File | Purpose |
|------|---------|
| `PRODUCTS.md` | Deep knowledge of each product |
| `PRIORITIES.md` | What matters NOW |
| `DECISIONS.md` | Architecture decisions |

**Voice commands:**

| Say | JARVIS Does |
|-----|-------------|
| "update priorities" | Edit PRIORITIES.md together |
| "what's the status?" | Summarize products + priorities |
| "what should I work on?" | Suggest based on priorities |
| "health check" | Run beast-mode on project |
| "document this decision" | Add to DECISIONS.md |

---

## Your Turn: Start Simple, Build Up

Don't try to build everything at once. Here's a suggested progression:

### Week 1: Core Setup
- [ ] Install Clawdbot
- [ ] Connect one LLM (Together AI is easy)
- [ ] Get Discord working
- [ ] Customize IDENTITY.md

### Week 2: Productivity
- [ ] Add Google Workspace integration
- [ ] Set up push notifications
- [ ] Create heartbeat checks

### Week 3: Developer Tools
- [ ] Install BEAST MODE
- [ ] Add security scanning
- [ ] Set up Blue/Yellow modes

### Week 4: Go Wild
- [ ] Kroger/grocery integration
- [ ] Image generation
- [ ] Multi-agent swarm
- [ ] Custom skills for YOUR needs

---

## Resources

- [Clawdbot Documentation](https://docs.clawd.bot)
- [Skill Registry](https://clawdhub.com/skills)
- [Discord Community](https://discord.gg/clawdbot)
- [GitHub](https://github.com/clawdbot/clawdbot)

---

## From The Creator: Tools That Make JARVIS Unstoppable

I built JARVIS to be the command center for my development workflow. Along the way, I built some serious power tools that plug right in. If you want the full Tony Stark experience, check these out:

### ⚔️ BEAST MODE — Enterprise Quality Intelligence

The quality layer that keeps your code clean. Think of it as an AI janitor + architect + QA team.

**Why it's powerful:**
- **Quality Scoring (0-100)** — Know exactly where you stand
- **AI Janitor** — Enable it at night, wake up to cleaner code
- **Vibe Restoration** — Regressions happen. Undo them in one command
- **Architecture Enforcement** — Catch violations before PR review
- **Invisible CI/CD** — Quality gates that don't slow you down

**JARVIS integration:**
```bash
# Before shipping
beast-mode quality score
# → "Quality: 87/100. 3 issues found. Shall I fix them?"

# Overnight cleanup
beast-mode janitor enable
# → Next morning: "Janitor completed. Fixed 12 issues, improved score to 92."
```

**[GitHub: repairman29/BEAST-MODE](https://github.com/repairman29/BEAST-MODE)**

---

### 🔊 Echeo — The Resonant Engine

Scans your codebase to understand what you can build, then finds paying opportunities that match.

**Why it's powerful:**
- **Capability Detection** — AST parsing with tree-sitter, understands your code deeply
- **Bounty Scraping** — GitHub issues, Gitcoin, and more
- **Semantic Matching** — Uses embeddings to find real matches
- **Deployment** — Ship matched solutions directly

**JARVIS integration:**
```bash
# What can I build with my skills?
echeo --path ~/my-project --generate-loadout

# Find bounties that match
echeo --scrape-github ethereum/go-ethereum
echeo --match-needs bounties.json
# → "Found 3 bounties matching your TypeScript + API skills. Highest: $2,500"
```

**[GitHub: repairman29/echeo](https://github.com/repairman29/echeo)** (Public, Rust CLI)

---

### 🪳 Code Roach — Self-Learning Code Quality

An expert system that learns from your codebase and gets smarter with every fix.

**Why it's powerful:**
- **PR Analysis** — Deep code review, not just linting
- **Pattern Learning** — Absorbs your team's best practices
- **Knowledge Base** — Institutional memory that doesn't quit
- **Integrations** — GitHub, GitLab, Slack, Discord, VS Code

**JARVIS integration:**
```bash
code-roach analyze pr --number 123
# → Detailed analysis with specific suggestions

code-roach health
# → Codebase health report with trends
```

**[GitHub: repairman29/code-roach](https://github.com/repairman29/code-roach)**

---

### 🎮 Smugglers RPG & MythSeeker — AI Game Master

A complete RPG platform with AI-generated narratives. The AI Dungeon Master creates dynamic stories that respond to player choices.

**Features:**
- AI-generated quests and storylines
- Persistent worlds and characters
- Multiplayer support
- Dynamic economy simulation

**[MythSeeker Demo (Public)](https://github.com/repairman29/MythSeeker)** — Try it yourself

---

### 📹 Echeovid — Async Video Platform

Record your thoughts, reduce meetings, get to the point. Video companion for async communication.

**Features:**
- Quick video recording
- AI-powered editing
- 7 different AI personas for content
- YouTube publishing integration

**[GitHub: repairman29/echeovid](https://github.com/repairman29/echeovid)**

---

### 📊 Project Forge — OKR Platform

Modern project management with OKRs. Track objectives, key results, and team alignment.

**[GitHub: repairman29/project-forge](https://github.com/repairman29/project-forge)**

---

## The Full Stack

When you combine everything:

```
┌────────────────────────────────────────────────────────────────┐
│                    THE JARVIS ECOSYSTEM                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  JARVIS (Command Center)                                       │
│    ├── Google Workspace (life management)                      │
│    ├── Kroger (shopping)                                       │
│    ├── Push Notifications (alerts)                             │
│    ├── Voice (TTS/STT)                                        │
│    └── Multi-Agent Swarm (parallel processing)                │
│                                                                │
│  BEAST MODE (Quality)                                          │
│    ├── Quality scoring                                         │
│    ├── AI Janitor                                             │
│    ├── Architecture enforcement                                │
│    └── Vibe restoration                                        │
│                                                                │
│  Echeo (Opportunities)                                         │
│    ├── Capability scanning                                     │
│    ├── Bounty matching                                        │
│    └── Solution deployment                                     │
│                                                                │
│  Code Roach (Learning)                                         │
│    ├── PR analysis                                            │
│    ├── Pattern learning                                        │
│    └── Knowledge base                                          │
│                                                                │
│  Creative Tools                                                │
│    ├── Image generation (Flux, DALL-E)                        │
│    ├── Echeovid (video)                                       │
│    └── MythSeeker (games)                                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**This is what "AI-native development" looks like.** JARVIS orchestrates, the tools execute, and you ship faster than ever.

---

## Get In Touch

Built something cool with JARVIS? Have questions? Want to collaborate?

- **GitHub:** [@repairman29](https://github.com/repairman29)
- **Twitter/X:** (add your handle)
- **Discord:** (add your server)

---

*Built with love by humans (and a little help from AI). Now go build your JARVIS and chase your friends!*
