# CLAWDBOT Roadmap

Where we are and what’s next. Do things in order; each phase unblocks the next.

---

## Current state

| Item | Status |
|------|--------|
| **CLI** | Installed (`clawdbot`) |
| **Workspace** | `~/clawd` with AGENTS, SOUL, TOOLS, USER, etc. |
| **Gateway mode** | `local` |
| **Gateway auth** | **Set** (token in `~/.clawdbot/.env` as `CLAWDBOT_GATEWAY_TOKEN`) |
| **Gateway service** | Not installed (not running in background) |
| **Model** | **Together AI** – primary: Llama 3.3 70B; fallbacks: Qwen 2.5 72B, DeepSeek R1 (key in `~/.clawdbot/.env` as `TOGETHER_API_KEY`) |
| **Discord** | Config ready; add `DISCORD_BOT_TOKEN` to `~/.clawdbot/.env` |
| **Voice (TTS/STT)** | Not configured |
| **Supabase MCP** | Optional; doc + Cursor config in this repo if you want it |

So: gateway auth + Together are set; next step is install gateway service and add Telegram (or another channel) to chat.

---

## Phase 1: Get it running (do this first)

Goal: Gateway running locally, one channel working, agent replying with Claude.

1. **Gateway auth** – Generate a token and set it so the gateway can start.
2. **Install gateway service** – Run the gateway as a background service (launchd on macOS).
3. **Claude** – Add Anthropic API key or Claude setup-token (required for the agent).
4. **One channel** – Easiest: add Telegram bot token and open a chat with your bot.

**Outcome:** You can DM the bot or @mention it in a server and get Together AI–powered replies.

**You provide:** Discord bot token (add to `~/.clawdbot/.env` as `DISCORD_BOT_TOKEN`). Gateway token + Together AI are already set.

---

## Phase 2: Make it “best of the best”

Goal: Voice in/out, optional image generation, daily memory, personality.

1. **Voice**
   - **TTS:** ElevenLabs API key → voice replies (e.g. Eleven v3 or Turbo for real-time).
   - **STT:** Groq API key → transcribe your voice messages (Whisper).
2. **Images** – Gemini API key → agent can generate images (e.g. Nano Banana Pro).
3. **Identity / SOUL** – Edit `~/clawd/IDENTITY.md` and `SOUL.md` so the agent matches how you want it to sound and behave.
4. **Memory** – Daily memory notes are automatic; optionally point the memory folder somewhere you like (e.g. Obsidian).

**Outcome:** Voice in/out, images on request, consistent personality, durable memory.

---

## Phase 3: Automate and integrate

Goal: Scheduled tasks, hooks, optional MCP/skills.

1. **Cron** – Use built-in cron (e.g. daily briefing, HEARTBEAT.md checks).
2. **Webhooks** – Optional Gmail or custom webhooks to wake the agent.
3. **Skills** – Install skills from Clawdhub (e.g. Spotify, Notion, Todoist) if you use them.
4. **Supabase / MCP** – Only if you want the agent or Cursor to talk to Supabase; otherwise leave as “stack option” as you said.

**Outcome:** Agent can run on a schedule and plug into your tools.

---

## What we should do next

**Option A (recommended):** Finish Phase 1 on the machine:

- Set gateway auth token (generated securely).
- Install the gateway service so it runs in the background.
- Add a one-page “credentials checklist” (e.g. in CLAWDBOT) listing exactly which keys to add and where (env vs `clawdbot config` / onboarding), so you can paste and go.

After that, the only thing left for you is to add your Anthropic and Telegram tokens and send a message.

**Option B:** Only document: keep ROADMAP as-is and add a short “Credentials checklist” so you can do Phase 1 yourself when ready.

**Option C:** Something else (e.g. focus on Phase 2 voice, or on your 50+ repos / echeo integration).

Tell me which option you want (or “do Option A” / “just the checklist”) and we’ll do that next.
