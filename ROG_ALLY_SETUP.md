# Running CLAWDBOT / JARVIS on ROG Ally (Windows)

This guide covers running your JARVIS assistant on an **ASUS ROG Ally** handheld (Windows 11). The main docs assume macOS; this doc fills in the Windows path.

**→ What JARVIS ROG Ed. can do for you:** [JARVIS_ROG_ED.md](./JARVIS_ROG_ED.md) — capabilities, quick start, and command cheat sheet.

---

## What Works on ROG Ally

| Feature | Supported |
|--------|------------|
| **Discord** | ✅ Yes |
| **Telegram** | ✅ Yes |
| **Cloud LLM** (Together, Groq, OpenAI, Anthropic) | ✅ Yes |
| **Gateway + CLI** | ✅ Yes |
| **Skills** (Spotify, Kroger, etc.) | ✅ Yes (same as macOS) |
| **iMessage** | ❌ No (macOS only) |
| **LaunchAgent / background service** | ❌ Use Windows Task Scheduler or run in terminal |
| **Local Ollama** | ⚠️ Possible but tight (16 GB shared RAM; AMD/Windows support varies) |

**Recommendation:** Use a **cloud LLM** (e.g. Groq free tier or Together AI) on the Ally. No GPU required for that; the Ally just runs the gateway and sends API requests.

---

## Prerequisites

- **ROG Ally** (or any Windows 11 PC)
- **Node.js 18+** — [nodejs.org](https://nodejs.org) (LTS)
- **An LLM API key** — Pick one:
  - [Groq](https://console.groq.com) — free tier, very fast
  - [Together AI](https://together.ai) — cheap, good quality
  - [OpenAI](https://platform.openai.com) or [Anthropic](https://console.anthropic.com)

---

## Quick Setup

### 1. Install Node.js

Download and install Node.js 18+ from [nodejs.org](https://nodejs.org). Restart the terminal (or the Ally) after install.

Verify:

```powershell
node --version   # v18.x or higher
npm --version
```

### 2. CLAWDBOT CLI (use npx — no global install required)

You don't need to install clawdbot globally. From the JARVIS repo folder, use:

```powershell
npx clawdbot gateway run
npx clawdbot agent --session-id "ally" --message "your message" --local
```

(Optional: `npm install -g clawdbot` if you prefer a global CLI; on Windows it can hit path limits.)

### 3. Config and workspace

Config lives under `%USERPROFILE%\.clawdbot\` (`.env` and `clawdbot.json`). Workspace can be `%USERPROFILE%\jarvis\` or the JARVIS repo; the start script uses the repo folder.

### 4. Add API key and gateway token

Edit (or create) `%USERPROFILE%\.clawdbot\.env`:

```env
# Required: gateway auth (generate with: openssl rand -hex 32)
CLAWDBOT_GATEWAY_TOKEN=your_gateway_token_here

# LLM — pick one
GROQ_API_KEY=your_groq_key
# TOGETHER_API_KEY=your_together_key
# OPENAI_API_KEY=your_openai_key
```

If you don’t have `openssl` on Windows, use PowerShell to generate a token:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]]) -replace '\+','-' -replace '/','_' -replace '=',''
```

Or use any 32+ character random string.

### 5. Configure model and gateway (optional)

Edit `%USERPROFILE%\.clawdbot\clawdbot.json`. Set your model and local gateway mode, e.g.:

```json
{
  "gateway": { "mode": "local" },
  "agents": {
    "defaults": {
      "model": {
        "primary": "groq/llama-3.3-70b-versatile"
      }
    }
  }
}
```

### 6. Run the gateway

From the JARVIS repo folder, either double-click **`scripts\start-jarvis-ally.bat`** or run:

```powershell
cd path\to\your\JARVIS-repo
npx clawdbot gateway run
```

Leave this running. In another terminal, test JARVIS:

```powershell
npx clawdbot agent --session-id "ally" --message "Hello JARVIS, introduce yourself" --local
```

If you get a response, you’re good. **To try a local model instead of cloud:** set GPU to 6 GB, install Ollama, pull a model, point `clawdbot.json` at it, then run the gateway — see [Local model quick test](#local-model-quick-test).

More commands and a full cheat sheet: [JARVIS_ROG_ED.md](./JARVIS_ROG_ED.md).

### 7. Add Discord (optional)

1. Create a bot at [Discord Developer Portal](https://discord.com/developers/applications).
2. Enable **Message Content Intent**.
3. Add the bot token to `%USERPROFILE%\.clawdbot\.env`:

   ```env
   DISCORD_BOT_TOKEN=your_discord_bot_token
   ```

4. Invite the bot to your server and pair (see [DISCORD_SETUP.md](./DISCORD_SETUP.md)).

---

## Running in the background (Windows)

The main docs use macOS LaunchAgent. On Windows you can:

- **Option A:** Run `clawdbot gateway run` in a terminal and leave it open (or use a tool like `pm2`).
- **Option B:** Create a scheduled task that runs at logon and starts the gateway (e.g. run a `.bat` or `node` script that starts the gateway).

Use the included **`scripts\start-jarvis-ally.bat`** (from the JARVIS repo), or create your own:

```batch
@echo off
cd /d path\to\your\JARVIS-repo
npx clawdbot gateway run
pause
```

Run from Startup folder or Task Scheduler if you want JARVIS to start with Windows.

---

## Local Ollama on ROG Ally (optional)

The ROG Ally has **16 GB unified memory** (shared between CPU and GPU) and an **AMD RDNA 3** integrated GPU. Running Ollama locally is possible but constrained:

- Use **small models** (e.g. 7B or smaller) to avoid OOM.
- Ollama’s AMD GPU support on Windows varies; check [Ollama docs](https://ollama.com) for current support.
- Prefer **cloud LLM** on the Ally for reliability; use Ollama for experiments or when offline.

If you do use Ollama on Windows:

1. Install [Ollama for Windows](https://ollama.com).
2. Pull a small model: `ollama pull llama3.2:3b` (or similar).
3. In `clawdbot.json`, set model to `ollama/llama3.2:3b` (or whatever you pulled).
4. Ensure no other heavy apps are using most of the 16 GB RAM.

---

## Using the Ally's VRAM / GPU

**Are we using it?** By default, **no**. The recommended setup uses a **cloud LLM** (Groq, Together, etc.); the Ally only runs the gateway and sends API requests, so no local GPU is used.

**Can we use it?** **Yes.** The ROG Ally has an **AMD RDNA 3** integrated GPU and **16 GB unified memory** (shared between CPU and GPU). You can use that for local inference with **Ollama**.

### How VRAM works on ROG Ally

- **Unified memory:** The 16 GB is shared. There is no separate “VRAM” chip; the GPU uses a portion of system RAM. You can influence how much the GPU gets.
- **Armoury Crate:** On the Ally, GPU memory is configured in **Armoury Crate → Settings (or Operating Mode) → GPU**. Default is often **4 GB**; you can raise it to **6 GB** or **8 GB** for better local LLM performance. Higher GPU allocation leaves less for the rest of the system, so 6 GB is a good balance.
- **Ollama:** On Windows, Ollama can use AMD GPUs (no ROCm install required—just install [Ollama for Windows](https://ollama.com) and recent AMD drivers). Support for **integrated** RDNA (like the Ally) is improving; if it works, Ollama will use the GPU automatically.

### Rough VRAM vs. model size (Ollama)

| VRAM (GPU allocation) | Typical use |
|------------------------|-------------|
| **4 GB** | 3B–4B models (e.g. `llama3.2:3b`), Q4 quantized |
| **6 GB** | 7B models (e.g. Llama 3.1 8B), good token throughput |
| **8 GB** | 7B–9B with room to spare; 12B may be tight |

To use the Ally’s GPU for JARVIS:

1. In Armoury Crate, set GPU memory to **6 GB** (or 8 GB if you have headroom).
2. Install Ollama and pull a small model: `ollama pull llama3.2:3b` (or `llama3.1:8b` if 6 GB+).
3. In `clawdbot.json`, set the model to `ollama/llama3.2:3b` (or the model you pulled).
4. Run the gateway as usual; Ollama will use the GPU when available.

If Ollama doesn’t use the GPU (e.g. integrated RDNA not yet fully supported), it will fall back to CPU; keep to 3B–7B models so it stays usable.

### Recommended local models (ROG Ally)

Models that fit the Ally’s 4–8 GB GPU allocation. Use **Armoury Crate** to set GPU memory to 6 GB (or 8 GB) before pulling 7B/8B models.

| VRAM | Model | Pull command | Use case |
|------|--------|--------------|----------|
| **4 GB** | Llama 3.2 3B | `ollama pull llama3.2:3b` | General chat, fast; ~2 GB download. |
| **4 GB** | Phi-3 mini | `ollama pull phi3:mini` | Small, capable; good for coding snippets. |
| **4 GB** | Gemma 2 2B | `ollama pull gemma2:2b` | Smallest; very low VRAM. |
| **4 GB** | Orca Mini 3B | `ollama pull orca-mini:3b` | General-purpose, Llama-based. |
| **6–8 GB** | Llama 3.1 8B | `ollama pull llama3.1:8b` | Best balance of quality and speed; most popular. |
| **6–8 GB** | Mistral 7B | `ollama pull mistral:7b` | Strong reasoning, compact. |
| **6–8 GB** | Qwen2.5 7B | `ollama pull qwen2.5:7b` | Good for code and instruction-following. |
| **6–8 GB** | Qwen2.5 Coder 7B | `ollama pull qwen2.5-coder:7b` | Optimized for coding (see [RUNBOOK.md](./RUNBOOK.md)). |
| **6–8 GB** | Orca Mini 7B | `ollama pull orca-mini:7b-v3` | General chat, Llama 2–based. |

**Suggested starting point:** Set GPU to **6 GB**, then run:

```powershell
ollama pull llama3.2:3b
ollama pull llama3.1:8b
```

In `clawdbot.json`, set `primary` to `ollama/llama3.2:3b` for lowest latency or `ollama/llama3.1:8b` for better quality. You can switch models by editing the config and restarting the gateway.

**Quantization:** Ollama serves pre-quantized models (e.g. Q4_K_M). Smaller variants (e.g. `:3b`, `:7b`) keep VRAM within 4–8 GB; avoid unquantized or 70B+ on the Ally.

### Local model quick test

1. **Armoury Crate** → GPU memory → **6 GB**.
2. Install [Ollama for Windows](https://ollama.com) if you haven’t already.
3. In PowerShell:
   ```powershell
   ollama pull llama3.2:3b
   ollama pull llama3.1:8b
   ```
4. Edit `%USERPROFILE%\.clawdbot\clawdbot.json`: set the primary model to `ollama/llama3.1` (or `ollama/llama3.2:3b`). If you get **Unknown model: ollama/llama3.1**, add `OLLAMA_API_KEY=ollama-local` to `%USERPROFILE%\.clawdbot\.env` and an explicit `models.providers.ollama` block (see [clawdbot Ollama docs](https://docs.clawd.bot/providers/ollama)); the gateway needs contextWindow ≥ 16000 (e.g. 16384).
5. Start the gateway (double-click `scripts\start-jarvis-ally.bat` or `npx clawdbot gateway run`).
6. In another terminal: `npx clawdbot agent --session-id "ally" --message "Hello, who are you?" --local`.

If you get a reply, the local model is working. If not, check that Ollama is running (it may start on first pull) and that the model name in `clawdbot.json` matches what you pulled (e.g. `ollama/llama3.1:8b`).

### Run the big one (Llama 3.1 8B)

Best quality/size balance on the Ally. Set GPU to **6 GB** (or 8 GB) in Armoury Crate, then:

```powershell
ollama pull llama3.1
ollama run llama3.1
```

If `ollama` isn’t in your PATH (e.g. fresh install), use the full path. Typical Windows install:

```powershell
& "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" pull llama3.1
& "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" run llama3.1
```

Type your messages and press Enter; `/bye` or Ctrl+D to exit. To use it with JARVIS: in `%USERPROFILE%\.clawdbot\clawdbot.json` set primary to `ollama/llama3.1`, then start the gateway (e.g. `scripts\start-jarvis-ally.bat`).

---

## Paths on Windows

| What | Path |
|------|------|
| Config | `%USERPROFILE%\.clawdbot\clawdbot.json` |
| Secrets | `%USERPROFILE%\.clawdbot\.env` |
| Workspace | `%USERPROFILE%\jarvis\` |
| Logs | `%USERPROFILE%\.clawdbot\logs\` |

---

## Troubleshooting

- **“clawdbot not found”** — Ensure Node.js and npm are in your PATH; try `npm install -g clawdbot` again and restart the terminal.
- **Gateway won’t start** — Check that `CLAWDBOT_GATEWAY_TOKEN` is set in `.env` and that the port (e.g. 3033) isn’t in use.
- **No reply from bot** — Verify your LLM API key in `.env` and that the model name in `clawdbot.json` matches your provider (e.g. `groq/llama-3.3-70b-versatile`).
- **"Context overflow: prompt too large"** — Add an explicit Groq provider in `clawdbot.json` under `models.providers.groq` with `baseUrl`, `apiKey`, and `contextWindow: 131072` for your models (see [JARVIS_ROG_ED.md](./JARVIS_ROG_ED.md) smooth setup). Restart the gateway.
- **Discord bot online but not replying** — Enable Message Content Intent in the Discord Developer Portal and confirm pairing (see [DISCORD_SETUP.md](./DISCORD_SETUP.md)).

For more detail on config, skills, and personality, see [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md).
