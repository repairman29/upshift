# Discord for JARVIS ROG Ed. (Quick Setup)

Use this checklist to get JARVIS in Discord (and on your phone via the Discord app).

---

## Checklist

### 1. Create the bot

1. Open **[Discord Developer Portal](https://discord.com/developers/applications)**.
2. **New Application** → name it (e.g. "JARVIS").
3. Left sidebar → **Bot** → **Add Bot** (if needed).
4. Under **Token**, click **Reset Token** or **Copy** → copy the token. You'll paste it in step 3. *(Keep it secret.)*

### 2. Enable intents

1. Still in **Bot** → scroll to **Privileged Gateway Intents**.
2. Turn on **Message Content Intent** (required so the bot can read your messages).
3. Turn on **Server Members Intent** (recommended for DMs).
4. **Save Changes**.

### 3. Add token to JARVIS

Edit **`%USERPROFILE%\.clawdbot\.env`** and set:

```env
DISCORD_BOT_TOKEN=paste_your_bot_token_here
```

Replace `paste_your_bot_token_here` with the token you copied. No quotes. Save the file.

### 4. Invite the bot to your server

1. In the Developer Portal: **OAuth2** → **URL Generator** (left sidebar under OAuth2).
2. **Scopes:** check `bot` and `applications.commands`.
3. **Bot Permissions:** check **Send Messages**, **Read Message History**, **View Channels** (and any others you want).
4. Copy the **Generated URL** at the bottom → open it in a browser → choose your server → **Authorize**.

**If you see "Private application cannot have a default authorization link":**  
Go to **OAuth2** → **Default Authorization Link** → set to **None** → Save. Then use URL Generator again.

### 5. Restart the gateway

- Stop the gateway: close its window or run `npx clawdbot gateway stop`.
- Start it again: double‑click **`scripts\start-jarvis-ally.bat`** or run `npx clawdbot gateway run` from the repo folder.

### 6. Pair with JARVIS (first DM)

1. In Discord, find your bot in the server member list (or in a channel) → **Message** to open a DM.
2. Send any message (e.g. "Hello").
3. If the bot replies with a **pairing code**, approve it on this machine:
   ```powershell
   cd path\to\your\JARVIS-repo
   npx clawdbot pairing approve discord YOUR_CODE
   ```
   Replace `YOUR_CODE` with the code from the bot's message.
4. Send another message; JARVIS should reply.

After that, you can chat with JARVIS from Discord (and from your phone if you use the Discord app).

---

## 3-question test (quick / medium / full-response offer)

Try these in order in a DM with the bot to verify: quick answer, one-sentence answer, and the “full response later” offer.

1. **Quick:** *What is 15% of 80?*  
   Expect: Short numeric answer (e.g. 12).

2. **One sentence:** *In one sentence: what is quantum computing?*  
   Expect: A single-sentence definition.

3. **Fuller pass offer:** *Summarize how photosynthesis works in 2–3 sentences. If you can do a fuller pass and deliver it here in a few minutes, say so and I'll say yes.*  
   Expect: A short summary, then an offer like *“I can do a fuller pass and have the full response delivered here in a few minutes—just say yes.”* Reply **yes** to get the full response in a few minutes (Ollama subagent).

You can also run the same three from the repo: `powershell -ExecutionPolicy Bypass -File scripts\test-3-questions.ps1` (gateway must be running; CLI may hit context limits—Discord often works better).

---

## Message hangs ("is typing..." forever)

If the bot shows "is typing..." but never sends a reply, **see what the gateway is doing**:

1. **Run the gateway in a terminal** (so you see logs):
   ```powershell
   cd path\to\your\JARVIS-repo
   npx clawdbot gateway run
   ```
2. **Send one short DM** to the bot (e.g. "Hi").
3. **Watch the terminal** (or open the latest file in `%USERPROFILE%\.clawdbot\logs\`):
   - **No new lines** → Discord isn’t reaching the gateway (token, intents, or pairing). Run `npx clawdbot doctor --fix`, turn on Message Content Intent in the Discord Developer Portal, restart gateway.
   - **"No session found" / session errors** → Add your Discord user ID as a session alias (see "Add your Discord user ID as session alias" below), then restart.
   - **"Context overflow"** → Prompt too large. In `%USERPROFILE%\.clawdbot\clawdbot.json`: set `agents.defaults.bootstrapMaxChars` to **3000**; remove any small-context fallback (e.g. Ollama) from `agents.defaults.model.fallbacks`; ensure primary and fallbacks use `contextWindow: 131072`. Restart.
   - **"429" / rate limit** → Primary or fallback hit rate limit. Switch primary to another provider (e.g. OpenRouter Trinity) or wait for reset; see [FREE_TIER_FALLBACKS.md](FREE_TIER_FALLBACKS.md).
   - **OpenRouter / API error** → Check `OPENROUTER_API_KEY` in `%USERPROFILE%\.clawdbot\.env`; try a different free model on OpenRouter if the current one is down or restricted.
   - **Activity but no error** → Reply may be generated but not delivered (e.g. wrong session). Add Discord user ID as session alias and ensure `jarvis/AGENTS.md` says to reply with normal text, not `sessions_send`.

**Quick CLI test (same machine):**  
If **CLI works** but Discord hangs, the issue is Discord/session/alias. If **CLI also hangs**, the issue is model/context/API:

```powershell
npx clawdbot agent --session-id "ally" --message "Hi" --local
```

If CLI hangs: try setting **only** one provider (e.g. primary = `openrouter/arcee-ai/trinity-mini:free`, no fallbacks) and `bootstrapMaxChars: 2000` in `clawdbot.json`, then restart and test again.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Bot never replies in DMs | See [DISCORD_SETUP.md — If the bot never replies](../DISCORD_SETUP.md); add reply guidance to `jarvis/AGENTS.md` if needed. |
| "No session found" in DMs | Add a session-store alias (see [DISCORD_SETUP.md — No session found](../DISCORD_SETUP.md)). |
| "Session Send: failed: timeout" | Reply may still appear in Discord; use a faster model or wait. |
| Stuck on "processing" / never replies | Your **primary model** may be too slow (e.g. local Ollama 8B). Set primary to a fast model like `groq/llama-3.1-8b-instant` in `%USERPROFILE%\.clawdbot\clawdbot.json` under `agents.defaults.model.primary`, then restart the gateway. |
| "Context overflow" / prompt too large (CLI or Discord) | 1) In `%USERPROFILE%\.clawdbot\clawdbot.json`: set `agents.defaults.bootstrapMaxChars` to **5000** (or 8000). 2) Set **Ollama** model `contextWindow` to **131072** in `models.providers.ollama.models` so the effective cap is 128K (not 16K). 3) Remove Ollama from `agents.defaults.model.fallbacks` and from `%USERPROFILE%\.clawdbot\agents\main\agent\models.json` (keep only Groq). 4) Restart the gateway. If 70B fallback hits **rate limit (429)**, wait for Groq TPD reset or upgrade tier; use only 8B until then. |
| **Over a minute, no reply** | 1) Check the **gateway terminal**: any activity when you send a DM? If nothing, Discord isn’t reaching the gateway (token, intents, or pairing). 2) If you see activity but no message: primary model may be slow or Groq may be rate-limited; ensure primary is `groq/llama-3.1-8b-instant` and `GROQ_API_KEY` is set. 3) First message or large context can take 30–60+ seconds; wait a bit longer or send a short message (e.g. “Hi”) to test. |
| **"is typing..." forever, no reply** | Usually **context overflow**: the run falls back to Ollama (16K) and the prompt is too big. In `%USERPROFILE%\.clawdbot\clawdbot.json` under `agents.defaults.model.fallbacks`, **remove** `ollama/llama3.1` so only Groq (128K) is used. Optionally add `agents.defaults.bootstrapMaxChars: 18000`. Restart the gateway. |
| Private app / default link error | OAuth2 → Default Authorization Link → **None** → Save; use URL Generator to invite. |

Full details and optional config (guilds, channels): [DISCORD_SETUP.md](../DISCORD_SETUP.md).

---

## Sent "test" (or any message) and nothing?

Run these in order. **Do step 1 first** — it tells you why the bot isn't replying.

1. **Gateway running with visible logs**  
   In a terminal: `cd` to your JARVIS repo, then run:
   ```powershell
   npx clawdbot gateway run
   ```
   Leave that window open. Send **test** again in the DM. Watch the terminal:
   - **No new lines** → Discord isn't reaching the gateway. Do step 2 (doctor + intents), then step 3 (alias).
   - **"No session found" or session errors** → Add your Discord user ID as an alias (step 3).
   - **Activity but no message in Discord** → Reply may still appear; if not, add the alias (step 3) and use a fast model (troubleshooting table above).

2. **Enable Discord and intents**  
   ```powershell
   npx clawdbot doctor --fix
   ```
   In [Discord Developer Portal](https://discord.com/developers/applications) → your app → **Bot** → **Message Content Intent** = **On** → Save. Restart the gateway.

3. **Add your Discord user ID as session alias**  
   Discord → Developer Mode on → in the DM with the bot, right-click **your** name → **Copy User ID**. Then:
   ```powershell
   node scripts\add-discord-alias.js YOUR_DISCORD_USER_ID
   ```
   Restart the gateway, then send **test** again.

---

## Authorized but no reply (step-by-step)

If the bot is in your server and you’ve paired but you get **no response** when you DM it, work through these in order.

### 1. See what the gateway does when you send a DM

1. Stop the gateway (close its window or `npx clawdbot gateway stop`).
2. In a terminal from the JARVIS repo folder, run:
   ```powershell
   cd path\to\your\JARVIS-repo
   npx clawdbot gateway run
   ```
3. Leave that window open. Send a DM to the bot in Discord (e.g. “Hi”).
4. Watch the terminal:
   - **Nothing at all** → Discord may not be reaching the gateway (see step 2).
   - **Errors about “session” or “No session found”** → Add the Discord alias (step 3).
   - **Activity then “Session Send” or timeout** → Reply might still show up in Discord; if not, the alias often fixes it.

### 2. Confirm Discord is enabled and can reach the gateway

- If the gateway said **"Discord configured, not enabled yet"**, run **`npx clawdbot doctor --fix`**, then restart the gateway so the Discord plugin is enabled.
- In [Discord Developer Portal](https://discord.com/developers/applications) → your app → **Bot**:
  - **Message Content Intent** = **On** (required for the bot to read your messages).
  - **Save Changes**.
- Restart the gateway after changing the token or intents.

### 3. Add your Discord user ID as a session alias

The gateway (and agent) may use your **Discord user ID** as the session key. If that ID isn’t in the session store, replies can fail. Add an alias so your ID maps to the same session as `main`.

1. **Get your Discord user ID**
   - Discord → User Settings → **App Settings** → **Advanced** → turn on **Developer Mode**.
   - Open your DM with the bot, right‑click your **own** name (your profile) in the chat → **Copy User ID**. You’ll get a long number (e.g. `1234567890123456789`).

2. **Add the alias** (pick one):

   **Option A – Script (easiest)**  
   From the repo folder, run (replace with your Discord user ID):
   ```powershell
   node scripts\add-discord-alias.js YOUR_DISCORD_USER_ID
   ```

   **Option B – Manual**  
   Open **`%USERPROFILE%\.clawdbot\agents\main\sessions\sessions.json`**, copy the whole `"agent:main:main"` object, then add a new key `"agent:main:YOUR_DISCORD_USER_ID"` with that same object. Save.

3. **Restart the gateway** and send another DM. Replies should start working if the issue was the missing alias.

### 4. Confirm reply behavior in AGENTS.md

Your workspace already has the right instruction in **`jarvis/AGENTS.md`** under “Replying in direct messages (Discord / etc.)”:

- Reply with **normal text** in your message; do **not** use `sessions_send` for the same conversation.

If you ever edit that file, keep that line so the agent doesn’t try to send via `sessions_send` in the same DM thread (which can fail or never deliver).
