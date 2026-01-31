# 🧠 JARVIS - Open Source Conversational Productivity

> The world's most intelligent open source productivity platform. Transform your workflow with AI-powered conversational computing.

[![GitHub stars](https://img.shields.io/github/stars/repairman29/JARVIS.svg?style=social&label=Star)](https://github.com/repairman29/JARVIS)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Website](https://img.shields.io/badge/website-jarvis.ai-brightgreen.svg)](https://repairman29.github.io/JARVIS/)
[![Discord](https://img.shields.io/badge/discord-join-7289da.svg)](https://discord.gg/jarvis-ai)

---

## 🚀 **Conversational Computing Revolution**

JARVIS transforms traditional command-based productivity into intelligent conversation. Instead of memorizing shortcuts and chaining commands, simply talk to your computer like a human assistant.

**Core Capabilities:**
- 🎙️ **Natural Language Interface**: Talk naturally, get intelligent responses  
- 🔗 **Skill Orchestration**: 10+ skills work together for complex automation
- 🤖 **Workflow Intelligence**: AI learns your patterns and suggests optimizations
- 📱 **Cross-Platform**: Works on macOS, Windows, Linux with full feature parity
- 🌐 **Community Ecosystem**: Open platform for shared innovation and development

**Example**: *"Find my React project, open it in VS Code, arrange windows for development, and start monitoring performance"* → **Complete workspace setup in one sentence**

## 💎 **Open Core Model**

**🆓 Open Source Core** (This Repository):
Complete productivity platform with 10 core skills, voice control, workflow automation, and community marketplace infrastructure.

**💰 Premium Skills** ([Marketplace](https://repairman29.github.io/JARVIS/)):
Advanced AI-powered skills for professionals: Notion Advanced Pro, GitHub Copilot++, Focus Pro, and enterprise solutions.

---

## 🎯 **10 Core Skills Included (Open Source)**

| Skill | Purpose | Key Features |
|-------|---------|--------------|
| 🚀 **Launcher** | App management & system control | Launch apps, control system, quick calculations |
| 🪟 **Window Manager** | Advanced workspace control | Window snapping, workspace presets, multi-display |
| 📁 **File Search** | Intelligent file discovery | Content search, smart categorization, duplicates |
| 📋 **Clipboard History** | Smart clipboard management | Unlimited history, privacy controls, sync |
| ✏️ **Snippets** | Dynamic text expansion | Templates, variables, smart suggestions |
| 🧮 **Calculator** | Advanced mathematical computing | Units, currency, programming, scientific |
| 🤖 **Workflow Automation** | AI-powered task orchestration | Command chaining, pattern learning, scheduling |
| 🏪 **Skill Marketplace** | Community ecosystem platform | Skill discovery, installation, publishing |
| 🎙️ **Voice Control** | Hands-free operation | Wake word detection, natural speech processing |
| 📊 **Performance Monitor** | System optimization | Health monitoring, automated cleanup, analytics |

## 💎 **Premium Skills Available**

**Professional AI-powered skills for advanced productivity:**

- **💼 Notion Advanced Pro** ($14.99/month): AI page generation, smart databases, workspace sync
- **⚡ GitHub Copilot++ Pro** ($19.99/month): Advanced code analysis, PR automation, repo intelligence  
- **🎯 Focus Pro** ($9.99/month): AI focus optimization, productivity analytics, wellness integration

[**Explore Premium Skills →**](https://repairman29.github.io/JARVIS/)

## 🚀 **Quick Start**

| Document | Description |
|----------|-------------|
| [**Installation Guide**](https://repairman29.github.io/JARVIS/getting-started/) | Get JARVIS running in 5 minutes |
| [**GETTING_STARTED_MODES.md**](./GETTING_STARTED_MODES.md) | 🔵 Blue (free + fallback) · 🟡 Yellow (premium fallback) · 🔴 Hot Rod (paid) |
| [**JARVIS_WINDOWS_EPIC.md**](./JARVIS_WINDOWS_EPIC.md) | Make JARVIS epic on Windows (Raycast-style, quick access, marketplace) |
| [**ROG_ALLY_SETUP.md**](./ROG_ALLY_SETUP.md) / [JARVIS_ROG_ED.md](./JARVIS_ROG_ED.md) | Run JARVIS on ASUS ROG Ally (handheld) |
| [**DEVELOPER_GUIDE.md**](./DEVELOPER_GUIDE.md) | Complete setup and development guide |
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
- 🔵/🟡/🔴 **Mode Switching** — Blue (free + fallback), Yellow (premium fallback), Hot Rod (paid) — [GETTING_STARTED_MODES.md](GETTING_STARTED_MODES.md)

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
├── kroger/SKILL.md      # Grocery shopping (see skills/kroger in this repo)
├── spotify/SKILL.md     # Music control
├── imagegen/SKILL.md    # AI image generation
└── your-skill/SKILL.md  # Your custom skill
```

**🆓 Open Source Core**: This repository contains the complete open source JARVIS productivity platform with 10+ core skills, AI workflow automation, voice control, and community infrastructure.

**💎 Premium Skills Available**: Advanced AI-powered skills for professionals are available through our [marketplace](https://repairman29.github.io/JARVIS/) including Notion Advanced Pro, GitHub Copilot++ Pro, and Focus Pro.

**📦 Installation**: Get started with the one-command installer: `curl -sSL https://install.jarvis.ai | bash` or follow the [complete setup guide](https://repairman29.github.io/JARVIS/getting-started/).

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

### 📦 UpshiftAI — Ancient Dependency Lineage

> *"When dependencies fork back to ancient sub-branches of projects of yore."*

Analyze dependency trees and surface ancient/legacy/forked packages for [upshiftai.dev](https://upshiftai.dev).

| Feature | What It Does |
|---------|--------------|
| **Tree resolution** | npm lockfile → full tree with depth and "why" |
| **Ancient detection** | Age since publish, deprecated, fork-name hints |
| **Report output** | JSON + optional markdown for pipelines or JARVIS |

```bash
cd upshiftai && node bin/upshiftai-deps.js analyze /path/to/project [--markdown] [--no-registry]
```

**[See `upshiftai/README.md` →](./upshiftai/README.md)** · **Landing:** deploy `upshiftai/site/` to [upshiftai.dev](https://upshiftai.dev). **JARVIS skill:** `clawdbot skills install ./skills/upshiftai`

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
