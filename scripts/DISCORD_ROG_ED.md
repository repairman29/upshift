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

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Bot never replies in DMs | See [DISCORD_SETUP.md — If the bot never replies](../DISCORD_SETUP.md); add reply guidance to `jarvis/AGENTS.md` if needed. |
| "No session found" in DMs | Add a session-store alias (see [DISCORD_SETUP.md — No session found](../DISCORD_SETUP.md)). |
| "Session Send: failed: timeout" | Reply may still appear in Discord; use a faster model or wait. |
| Stuck on "processing" / never replies | Your **primary model** may be too slow (e.g. local Ollama 8B). Set primary to a fast model like `groq/llama-3.1-8b-instant` in `%USERPROFILE%\.clawdbot\clawdbot.json` under `agents.defaults.model.primary`, then restart the gateway. |
| "Context overflow" / prompt too large (CLI or Discord) | Add an explicit **Groq** provider in `clawdbot.json` under `models.providers.groq` with `contextWindow: 131072` for your Groq models (see [JARVIS_ROG_ED.md](../JARVIS_ROG_ED.md) or ROG_ALLY_SETUP). Restart the gateway. |
| Private app / default link error | OAuth2 → Default Authorization Link → **None** → Save; use URL Generator to invite. |

Full details and optional config (guilds, channels): [DISCORD_SETUP.md](../DISCORD_SETUP.md).

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
