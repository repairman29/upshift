# JARVIS ROG Ed. — What It Can Do for You

**JARVIS ROG Ed.** is JARVIS tuned for the **ASUS ROG Ally** (Windows 11): cloud-powered AI, no global install, and a clear set of things that work great on the handheld.

**→ Make JARVIS epic on Windows (Raycast-style, marketplace, quick access):** [JARVIS_WINDOWS_EPIC.md](./JARVIS_WINDOWS_EPIC.md)  
**→ Cool badassery ideas (one-liners, quick notes, timers, ROG tweaks):** [JARVIS_BADASSERY.md](./JARVIS_BADASSERY.md)  
**→ Roadmap (phases + status):** [JARVIS_ROADMAP.md](./JARVIS_ROADMAP.md)  
**→ Office, email, calendar (Outlook, Gmail, M365, Google):** [docs/JARVIS_OFFICE_EMAIL_CALENDAR.md](./docs/JARVIS_OFFICE_EMAIL_CALENDAR.md) · **Auth now (live.com / gmail.com):** [scripts/AUTH_OFFICE_EMAIL.md](./scripts/AUTH_OFFICE_EMAIL.md)  
**→ Reference for later (paths, auth, skills, docs):** [docs/JARVIS_REFERENCE.md](./docs/JARVIS_REFERENCE.md)

---

## Quick Start (Already Set Up)

| Action | Command |
|--------|--------|
| **Start gateway** | Double-click `scripts\start-jarvis-ally.bat` or run `npx clawdbot gateway run` from the JARVIS folder |
| **Chat (terminal)** | `npx clawdbot agent --session-id "ally" --message "your message" --local` |
| **Web UI** | Open http://127.0.0.1:18789/ (when gateway is running) |

Keep the gateway running in one terminal; use a second terminal or the web UI to chat.

---

## What JARVIS ROG Ed. Can Do

### ✅ Always Available (No Extra Setup)

| Use | Example prompts |
|-----|------------------|
| **Chat & reasoning** | "Explain X in simple terms", "Draft a short email for…", "Summarize this idea" |
| **Math & units** | "What's 15% of 240?", "Convert 5 miles to km", "100 USD to EUR" |
| **Quick answers** | "What's the weather in Seattle?", "Current time in Tokyo" |
| **Coding help** | "Write a PowerShell one-liner to…", "Explain this regex" |

These use the **Groq cloud LLM** only; they work as soon as the gateway is running.

### ✅ Best on Ally (Skills That Fit Handheld Use)

| Skill | What it does | Example |
|-------|----------------|---------|
| **Launcher** | Launch apps, volume, screenshots, open URLs, **daily brief**, **insert symbol**, battery + power plan | "Launch Chrome", "Good morning", "Insert shrug", "Open github.com" |
| **Quick notes** | Remember things, search notes | "Remember: buy milk", "What did I note about the project?" |
| **Calculator** | Math, units, currency, date/time | "15% tip on $45", "Convert 80 F to C" |
| **File search** | Find files by name, content, date | "Find PDFs from last week", "Search for 'API key' in my docs" |
| **Clipboard history** | Recent clipboard items | "Show clipboard history", "Paste item 3" |
| **Snippets** | Text templates and expansion | "Insert my email signature" |
| **Performance monitor** | CPU, memory, disk, cleanup | "What's using the most RAM?", "Summarize system health" |

**Adding skills:** [scripts/SKILLS_ROG_ED.md](scripts/SKILLS_ROG_ED.md) — extraDirs, entries, CLI list/check, best practices.

Skills are in `jarvis/skills/` and loaded via config (`skills.load.extraDirs`). Launcher has **Windows support** (launch, quit, open URL, screenshot, lock, sleep, process list/kill, system info). See [JARVIS_ROG_ED_EXPERIENCE.md](./JARVIS_ROG_ED_EXPERIENCE.md) and [JARVIS_WINDOWS_EPIC.md](./JARVIS_WINDOWS_EPIC.md) for the full Windows experience and how we’re developing the experience.

### ✅ Chat From Anywhere

| Channel | Setup | Use case |
|---------|--------|----------|
| **Discord** | Add `DISCORD_BOT_TOKEN` to `.env`, invite bot, pair | Chat from phone or PC while Ally runs the gateway |
| **Telegram** | Add Telegram bot token, pair | Same as Discord |
| **Web dashboard** | None | Browser on the Ally at http://127.0.0.1:18789/ |

### ⚠️ Possible but Constrained

| Feature | Note |
|---------|------|
| **Local Ollama** | 16 GB shared RAM — use small models (e.g. 3B–7B) only; cloud LLM is simpler and more reliable. See [Using the Ally's VRAM/GPU](#using-the-allys-vram--gpu-local-models) below. |
| **Kroger / OAuth skills** | Work if you complete OAuth in a browser; same as on other platforms. |
| **Voice control** | Depends on skill + mic; test on Ally to confirm latency and accuracy. |

### Using the Ally's VRAM / GPU (local models)

You can run **local LLMs** on the Ally using its AMD RDNA 3 GPU and configurable VRAM (4–8 GB in Armoury Crate). By default we use a cloud LLM; local is optional for offline use or privacy. **Setup and recommended models:** [ROG_ALLY_SETUP.md — Using the Ally's VRAM/GPU](./ROG_ALLY_SETUP.md#using-the-allys-vram--gpu) and [Recommended local models](./ROG_ALLY_SETUP.md#recommended-local-models-rog-ally).

### ❌ Not on ROG Ed.

| Feature | Why |
|---------|-----|
| **iMessage** | macOS only. |
| **LaunchAgent / background service** | Use Task Scheduler or leave a terminal open (see [ROG_ALLY_SETUP.md](./ROG_ALLY_SETUP.md)). |

---

## Streamlined Command Cheat Sheet

Run these from the **JARVIS repo folder** in PowerShell (gateway must be running).

```powershell
# One-off chat
npx clawdbot agent --session-id "ally" --message "What can you do?" --local

# Calculator-style
npx clawdbot agent --session-id "ally" --message "What's 20% of 89?" --local

# Launcher-style (if Launcher skill is installed)
npx clawdbot agent --session-id "ally" --message "Take a screenshot" --local
npx clawdbot agent --session-id "ally" --message "Open github.com" --local
```

Use the same `--session-id "ally"` to keep context in one conversation.

**Run the big one (Ollama, local):** Set GPU to 6 GB in Armoury Crate, then `ollama pull llama3.1` and `ollama run llama3.1`. For JARVIS, set primary model to `ollama/llama3.1` in `clawdbot.json` — see [ROG_ALLY_SETUP.md — Run the big one](./ROG_ALLY_SETUP.md#run-the-big-one-llama-31-8b).

**Model split (chat vs background):** Use **Groq** for fast interactive chat (Discord, web, CLI) and **Ollama** for background agents and tasks (more economical, local). In `clawdbot.json`: set `agents.defaults.model.primary` to `groq/llama-3.1-8b-instant` (or another Groq model) and `agents.defaults.subagents.model` to `ollama/llama3.1`. Chat uses the primary model; subagents (e.g. `sessions_spawn`, background research) use the subagent model. Requires `GROQ_API_KEY` in `.env` and Ollama running for subagent tasks.

**Free-tier fallbacks:** When Groq hits context overflow or rate limit (429), you can add **OpenRouter** (free models, ~50 req/day) and **Together** (free Llama 3.3 70B) as fallbacks. See **[scripts/FREE_TIER_FALLBACKS.md](scripts/FREE_TIER_FALLBACKS.md)** for step-by-step: add `OPENROUTER_API_KEY` and `TOGETHER_API_KEY` to `.env`, add the provider blocks and fallbacks to `clawdbot.json`, then restart the gateway.

**Smooth replies (no "Context overflow"):** If you see *"Context overflow: prompt too large for the model"* in CLI or Discord, the gateway may be using a small default context for Groq. Add an explicit **Groq** provider in `clawdbot.json` under `models.providers.groq` with your models and **`contextWindow: 131072`** (128k) so the system prompt fits. Example: see the `groq` block in your current `clawdbot.json`; restart the gateway after editing.

**Quick first, full response later:** JARVIS is instructed (in `jarvis/AGENTS.md`) to answer **immediate needs briefly** (minimal Groq), then offer: *"I can do a fuller pass and have the full response delivered here in a few minutes—just say yes. Or say 'email it to me' and I’ll send it when it’s ready."* If they say yes, a background subagent (Ollama) produces the full response and it’s delivered in the same chat. For **email delivery**, install a Gmail or Outlook skill (e.g. from ClawHub) and give your address; JARVIS can then send the full response by email when the subagent finishes.

---

## Paths (ROG Ed.)

| What | Path |
|------|------|
| Config | `%USERPROFILE%\.clawdbot\clawdbot.json` |
| Secrets (API keys, token) | `%USERPROFILE%\.clawdbot\.env` |
| Start script | `JARVIS\scripts\start-jarvis-ally.bat` |
| Logs | `%USERPROFILE%\.clawdbot\logs\` |

---

## What's next (in order)

Do these in order; **Discord is last.**

| Order | What | Where |
|-------|------|--------|
| **1** | **Use local model in JARVIS** | Set `primary` to `ollama/llama3.1` in `%USERPROFILE%\.clawdbot\clawdbot.json`, start gateway, chat. [Run the big one](ROG_ALLY_SETUP.md#run-the-big-one-llama-31-8b) |
| **2** | **On Ally: GPU + Ollama** | Armoury Crate → 6 GB GPU. Install Ollama, pull `llama3.1`, same `clawdbot.json`. [ROG_ALLY_SETUP.md](ROG_ALLY_SETUP.md) |
| **3** | **Auto-start** | Run once: `powershell -ExecutionPolicy Bypass -File scripts\add-jarvis-to-startup.ps1`. JARVIS starts at logon (task "JARVIS ROG Ed"). To remove: Task Scheduler → delete task. |
| **4** | **Skills** | Install Launcher and Calculator (then File search, Clipboard, etc.) so “Launch Chrome”, “15% of 45” work. Each skill’s `README.md` and `SKILL.md` |
| **5** | **Discord** (last) | Create bot, add token to `.env`, invite bot, restart gateway, pair. [scripts/DISCORD_ROG_ED.md](scripts/DISCORD_ROG_ED.md) or [DISCORD_SETUP.md](DISCORD_SETUP.md) |

For install, config, and troubleshooting, see [ROG_ALLY_SETUP.md](./ROG_ALLY_SETUP.md).

---

## Next Steps

See **What's next (in order)** above. For Discord (last step), use [scripts/DISCORD_ROG_ED.md](./scripts/DISCORD_ROG_ED.md) (short) or [DISCORD_SETUP.md](./DISCORD_SETUP.md) (full).

---

## Making JARVIS the John Wick of AI

Precise. Reliable. Always on. No half measures.

| Trait | What it means for JARVIS | You've got / Next |
|-------|---------------------------|-------------------|
| **Precision** | Does exactly what you ask; tools that work every time | Local model + Groq fallback, skills loaded (Launcher, Calculator, etc.), clear tool descriptions |
| **Reliability** | No flaky replies; fallback when primary fails | `ollama/llama3.1` primary, Groq fallbacks, OLLAMA + explicit provider in config |
| **Always on** | Ready when you boot, no fumbling | Task Scheduler: "JARVIS ROG Ed" at logon ([scripts/add-jarvis-to-startup.ps1](scripts/add-jarvis-to-startup.ps1)) |
| **Deadly toolkit** | One assistant, many skills — launch, calculate, search, screenshot, clipboard, marketplace | `jarvis/skills` + `skills/` in config; [ClawHub](https://clawhub.ai) + [Community hub](https://howtouseclawdbot.com/community.html) for more |
| **Reach** | Same JARVIS from terminal, web, phone | Web UI (18789), CLI; **next:** Discord/Telegram ([scripts/DISCORD_ROG_ED.md](scripts/DISCORD_ROG_ED.md)) |
| **Memory** | Remembers you and context across sessions | If your stack supports it, enable persistent memory; polish `jarvis/USER.md` (name, timezone, projects). For MCP vs Clawdbot memory and “lightning fast” setup, see [scripts/MEMORY_AND_SPEED.md](scripts/MEMORY_AND_SPEED.md). |
| **No mercy on errors** | Clear feedback, retries, no silent failures | Good model + fallbacks; check gateway logs (`.clawdbot/logs`) and [ROG_ALLY_SETUP.md](ROG_ALLY_SETUP.md) troubleshooting |

**Keep going:** Discord (last step), then USER.md polish, memory if available, and voice on the Ally when you want hands-free. Every piece you add makes JARVIS one step closer to that "John Wick" level — precise, relentless, and always ready.

---

## Elevating JARVIS ROG Ed. — Make It the Best It Can Be

Concrete ways to level up this version:

| Priority | What | Why |
|----------|------|-----|
| **1. Personality & workspace** | Use the repo `jarvis/` as the agent workspace (IDENTITY, SOUL, AGENTS, TOOLS, USER). | JARVIS speaks and behaves like JARVIS, knows your tools and context. **Done:** workspace set in config; IDENTITY, SOUL, USER added to `jarvis/`. |
| **2. Skills in the gateway** | Install/register skills (Launcher, Calculator, File search, etc.) so the gateway exposes tools. | "Launch Chrome", "Take a screenshot", "What's 15% of 240?" actually run instead of failing. See clawdbot/openclaw docs for `skills` config and `skills install`. |
| **3. Auto-start** | Task Scheduler: run `scripts\start-jarvis-ally.bat` at user logon. | JARVIS is running as soon as you boot the Ally. |
| **4. Discord (or Telegram)** (last) | Add `DISCORD_BOT_TOKEN` to `.env`, invite bot, pair. | Chat from phone or any device; see [scripts/DISCORD_ROG_ED.md](scripts/DISCORD_ROG_ED.md). |
| **5. Web dashboard** | Use http://127.0.0.1:18789/ when the gateway is running. | Rich UI, history, no terminal needed. |
| **6. Model & reliability** | Optional: add a fallback model in config, or a faster model for quick replies. | Fewer "no reply" or timeouts; better for handheld. |
| **7. Memory** | Enable OpenClaw memory + compaction for faster, context-aware replies: merge [scripts/clawdbot-memory-and-compaction.example.json](scripts/clawdbot-memory-and-compaction.example.json) into `%USERPROFILE%\.clawdbot\clawdbot.json` and set an embedding key (e.g. `OPENAI_API_KEY`). See [scripts/MEMORY_AND_SPEED.md](scripts/MEMORY_AND_SPEED.md). | More coherent, personalized conversations; smaller context → faster delivery. |
| **8. USER.md** | Edit `jarvis/USER.md` with your name, timezone, projects, preferences. | JARVIS can reference you and your work. |
| **9. HEARTBEAT (optional)** | Add a short `jarvis/HEARTBEAT.md` checklist for periodic runs. | Proactive checks (e.g. "anything needing attention today?"). |
| **10. Voice (experimental)** | Try the voice-control skill on the Ally; tune wake word and latency. | Hands-free "Hey JARVIS" on the handheld. |
| **11. Local model (optional)** | Set GPU to 6 GB in Armoury Crate, install Ollama, pull e.g. `llama3.2:3b` or `llama3.1:8b`. | Offline/private chat; see [ROG_ALLY_SETUP.md — Recommended local models](./ROG_ALLY_SETUP.md#recommended-local-models-rog-ally). |

**Already in place:** workspace at `jarvis/`, IDENTITY.md, SOUL.md, USER.md, HEARTBEAT.md, skills in `jarvis/skills/`, model fallback in config, auto-start task "JARVIS ROG Ed", Discord guide in `scripts/DISCORD_ROG_ED.md`. Restart the gateway after any config change so the agent picks up updates.
