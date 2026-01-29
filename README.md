# JARVIS: Build Your Own AI Assistant

> Turn any LLM into a personal AI assistant you can chat with on Discord, iMessage, or Telegram. With memory, personality, and real superpowers.

![JARVIS](https://img.shields.io/badge/AI-JARVIS-blue?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-macOS-lightgrey?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## What Is This?

This repo contains everything you need to build your own JARVIS — a personal AI assistant that:

- **Chats with you** on Discord, iMessage, Telegram, or all three
- **Remembers everything** across conversations
- **Has a personality** that you define
- **Controls your life** — calendar, email, tasks, smart home, music
- **Helps you code** with AI pair programming, quality checks, deployments
- **Runs locally** on your Mac (or a server)

Think Tony Stark's JARVIS, but real and customizable.

---

## Quick Links

| Document | Description |
|----------|-------------|
| [**DEVELOPER_GUIDE.md**](./DEVELOPER_GUIDE.md) | Full setup guide — start here! |
| [DISCORD_SETUP.md](./DISCORD_SETUP.md) | Discord bot configuration |
| [RUNBOOK.md](./RUNBOOK.md) | Day-to-day operations |

---

## What Can JARVIS Do?

### Communication & Life Management
- 📧 **Gmail** — Read, search, send, reply to emails
- 📅 **Calendar** — View schedule, create events, get reminders
- ✅ **Tasks** — Manage to-do lists with due dates
- 📱 **Push Notifications** — Alerts to your phone

### Shopping & Home
- 🛒 **Kroger/Grocery** — Search products, check prices, build lists
- 💡 **Smart Home** — Control Philips Hue lights
- 🎵 **Spotify** — Play, pause, skip, search music

### Developer Tools
- 🤖 **AI Pair Programming** — Aider + any LLM
- ⚔️ **Quality Intelligence** — BEAST MODE checks
- 🚀 **Deployments** — Fly.io, Vercel, Railway
- 🔒 **Security Scanning** — Pre-deploy vulnerability checks

### Creative
- 🎨 **Image Generation** — Flux, DALL-E 3, Stable Diffusion
- 🗣️ **Voice** — Text-to-speech responses, speech-to-text input

### Multi-Agent
- 🐝 **Swarm Mode** — Spawn parallel agents for 3x speed
- 🔵/🟡 **Mode Switching** — Free (local) vs Premium (cloud) AI

---

## Quick Start

```bash
# 1. Install Clawdbot
npm install -g clawdbot

# 2. Initialize
mkdir ~/jarvis && cd ~/jarvis
clawdbot init

# 3. Add your LLM API key
echo "TOGETHER_API_KEY=your_key" >> ~/.clawdbot/.env

# 4. Generate gateway token
echo "CLAWDBOT_GATEWAY_TOKEN=$(openssl rand -hex 32)" >> ~/.clawdbot/.env

# 5. Test it
clawdbot gateway run &
clawdbot chat "Hello JARVIS, introduce yourself"
```

For the full setup (Discord, voice, skills, etc.), see [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOUR JARVIS                              │
├─────────────────────────────────────────────────────────────────┤
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                 │
│   │ Discord  │    │ iMessage │    │ Telegram │   ← Channels    │
│   └────┬─────┘    └────┬─────┘    └────┬─────┘                 │
│        └───────────────┼───────────────┘                        │
│                        ▼                                        │
│              ┌─────────────────┐                                │
│              │    Gateway      │  ← Routes messages             │
│              └────────┬────────┘                                │
│                       ▼                                         │
│              ┌─────────────────┐                                │
│              │     Agent       │  ← Your AI brain               │
│              │  (LLM + Memory  │                                │
│              │   + Skills)     │                                │
│              └────────┬────────┘                                │
│                       ▼                                         │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│   │ Spotify  │  │  Lights  │  │  Gmail   │  │  GitHub  │  ... │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│                        ↑                                        │
│                     Skills                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## LLM Options

| Provider | Cost | Speed | Notes |
|----------|------|-------|-------|
| **Together AI** | ~$0.001/msg | Fast | Recommended starter |
| **Groq** | FREE | Very fast | Great free tier |
| **Anthropic** | ~$0.01/msg | Fast | Best quality |
| **OpenAI** | ~$0.005/msg | Fast | GPT-4o |
| **Ollama** | Free | Varies | 100% local |

---

## Example Conversations

**Life Management:**
> **You:** "What's on my calendar today?"
> **JARVIS:** "You have 3 events: Team standup at 9am, Lunch with Mike at 1pm, Client call at 3:30pm"

**Shopping:**
> **You:** "What's the price of milk at King Soopers?"
> **JARVIS:** "2% milk is $3.39/gallon, whole milk also $3.39"

**Coding:**
> **You:** "Ship it"
> **JARVIS:** "Deploying to production..." *deploys* "Live. All systems operational."

**Casual:**
> **You:** "yo"
> **JARVIS:** "Hey. What's up?"

---

## Customization

### Personality

Edit `~/jarvis/SOUL.md`:

```markdown
# SOUL.md

**Name:** JARVIS
**Personality:** Sophisticated, capable, occasionally dry wit
**Signature Phrases:**
- "Done, sir."
- "Shall I...?"
- "I've taken the liberty of..."
```

### Skills

Add integrations by creating skill files in `~/jarvis/skills/`:

```
~/jarvis/skills/
├── google/SKILL.md      # Gmail, Calendar, Drive
├── kroger/SKILL.md      # Grocery shopping
├── spotify/SKILL.md     # Music control
├── imagegen/SKILL.md    # AI image generation
└── your-skill/SKILL.md  # Your custom skill
```

---

---

## The Ecosystem: Power Tools for JARVIS

JARVIS is even more powerful with these companion tools. Each one integrates seamlessly.

### ⚔️ BEAST MODE — Enterprise Quality Intelligence

> *"Ship quality code, every time."*

AI-powered development toolkit that catches issues before they become problems.

| Feature | What It Does |
|---------|--------------|
| **Quality Scoring** | 0-100 score for any codebase |
| **AI Janitor** | Overnight automated cleanup |
| **Vibe Restoration** | Rewind to last working state |
| **Architecture Enforcement** | Catch violations automatically |
| **Invisible CI/CD** | Silent quality gates |

```bash
beast-mode quality score      # Get quality score
beast-mode janitor enable     # Let AI clean overnight
beast-mode vibe restore       # Fix regressions
```

**[Learn more about BEAST MODE →](https://github.com/repairman29/BEAST-MODE)**

---

### 🔊 Echeo — The Resonant Engine

> *"Find where your code resonates with market needs."*

Scan your codebase to discover capabilities, then match them to paid bounties and opportunities.

| Feature | What It Does |
|---------|--------------|
| **Capability Scanning** | What can your code do? |
| **Bounty Matching** | Find paid opportunities |
| **GitHub Integration** | Scrape issues as bounties |
| **Deployment** | Ship matched solutions |

```bash
echeo --path ~/project              # Scan capabilities
echeo --scrape-github owner/repo    # Find bounties
echeo --match-needs bounties.json   # Match your skills
```

**[Learn more about Echeo →](https://github.com/repairman29/echeo)**

---

### 🪳 Code Roach — Self-Learning Code Quality

> *"A code quality expert that gets smarter with every fix."*

Analyzes PRs, learns patterns, and builds institutional knowledge.

| Feature | What It Does |
|---------|--------------|
| **PR Analysis** | Deep-dive code reviews |
| **Pattern Learning** | Gets smarter over time |
| **Health Scoring** | Track codebase health |
| **Integration** | GitHub, GitLab, Slack, Discord |

```bash
code-roach analyze pr         # Analyze pull request
code-roach health             # Check codebase health
code-roach crawl              # Build knowledge base
```

**[Learn more about Code Roach →](https://github.com/repairman29/code-roach)**

---

### 🎮 MythSeeker — AI Dungeon Master

> *"Infinite adventures, powered by AI."*

Full RPG with AI-generated narratives, dynamic quests, and persistent worlds.

**[Play MythSeeker →](https://github.com/repairman29/MythSeeker)**

---

### 📹 Echeovid — Async Video Communication

> *"Record your thoughts. Reduce meetings. Get to the point."*

Video companion for async communication with AI-powered editing and personas.

**[Learn more about Echeovid →](https://github.com/repairman29/echeovid)**

---

## Why These Tools Work Together

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR DEVELOPMENT FLOW                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   1. JARVIS                    "What should I work on?"      │
│      │                                                       │
│      ▼                                                       │
│   2. Echeo ────────────────►  Find bounties matching skills  │
│      │                                                       │
│      ▼                                                       │
│   3. Code (with JARVIS)        AI pair programming           │
│      │                                                       │
│      ▼                                                       │
│   4. BEAST MODE ───────────►  Quality check before shipping  │
│      │                                                       │
│      ▼                                                       │
│   5. Code Roach ───────────►  PR review + pattern learning   │
│      │                                                       │
│      ▼                                                       │
│   6. JARVIS                    "Ship it" → Deployed 🚀       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

All tools are designed to work together, with JARVIS as your command center.

---

## Requirements

- **macOS** (Intel or Apple Silicon)
- **Node.js 18+**
- **An LLM API key** (Together AI, OpenAI, Anthropic, or Ollama for local)

---

## Contributing

Found a bug? Want to add a feature? PRs welcome!

1. Fork this repo
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## License

MIT — do whatever you want with it.

---

## Credits

Built by humans who wanted their own JARVIS.

Powered by [Clawdbot](https://clawd.bot).

---

*Now go build your JARVIS and flex on your friends.*
