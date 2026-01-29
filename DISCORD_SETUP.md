# Discord channel setup

Clawdbot is configured to use **Discord** (not Telegram). Add your bot token and you’re set.

---

## If you see “Private application cannot have a default authorization link”

Discord shows this when the app is **private** but still has a **Default Authorization Link** set.

**Fix:**

1. In [Discord Developer Portal](https://discord.com/developers/applications) → your app → **OAuth2** (left sidebar).
2. Under **Default Authorization Link**, set it to **None** (not “In-app authorization” or a custom URL).
3. Save.

You can keep the app private. To invite the bot, use **OAuth2 → URL Generator** (see step 3 below) to build an invite URL—that does not use the default link and works for private apps.

---

## 1. Create the Discord bot

1. Open [Discord Developer Portal](https://discord.com/developers/applications) → **Applications** → **New Application** (name it e.g. “Clawdbot”).
2. In the app: **Bot** → **Add Bot**.
3. Copy the **Bot Token** (under “Token”). You’ll put this in `~/.clawdbot/.env` as `DISCORD_BOT_TOKEN`.

---

## 2. Enable intents

In **Bot** → **Privileged Gateway Intents**, turn on:

- **Message Content Intent** (required so the bot can read message text).
- **Server Members Intent** (recommended for DMs and allowlists).

Save.

---

## 3. Invite the bot to a server

**Option A – Use the Discord API (direct URL)**

With your **Application ID** (Developer Portal → your app → **General Information** → Application ID), you can build the invite URL yourself:

```
https://discord.com/api/oauth2/authorize?client_id=APPLICATION_ID&permissions=117824&scope=bot%20applications.commands
```

Replace `APPLICATION_ID` with your app’s ID (e.g. `YOUR_APPLICATION_ID`). The `permissions=117824` value gives: View Channels, Send Messages, Read Message History, Embed Links, Attach Files, Add Reactions. [Permission calculator](https://discordapi.com/permissions.html) if you want a different set.

**For your app (Application ID `YOUR_APPLICATION_ID`):**

[Invite this bot to a server](https://discord.com/api/oauth2/authorize?client_id=YOUR_APPLICATION_ID&permissions=117824&scope=bot%20applications.commands)

Open that link in a browser, choose your server, and authorize.

**Option B – URL Generator in the portal**

1. In the app: **OAuth2** → **URL Generator** (in the left sidebar under OAuth2).
2. **Scopes:** check `bot` and `applications.commands`.
3. **Bot Permissions:** check the permissions you want.
4. Copy the **Generated URL** at the bottom and open it in a browser.

---

## App ID vs Public Key vs Bot Token

| What | Where | Used for |
|------|--------|----------|
| **Application ID** | General Information → Application ID | Invite URL (`client_id`), API calls. |
| **Public Key** | General Information → Public Key | Verifying interactions (e.g. slash commands / webhooks). **Not** used by Clawdbot. |
| **Bot Token** | Bot → Token (Reset Token / Copy) | Clawdbot needs this to connect to Discord. Put it in `~/.clawdbot/.env` as `DISCORD_BOT_TOKEN`. |

You **cannot** derive the Bot Token from the Application ID or Public Key. The Bot Token is a separate secret; get it from **Bot** → **Reset Token** (or **Copy**) in the Developer Portal. Keep it secret.

---

## 4. Add the Bot Token to Clawdbot

In `~/.clawdbot/.env`, add:

```bash
DISCORD_BOT_TOKEN=your_bot_token_here
```

Use the **Bot Token** from **Bot** → Token in the Developer Portal (step 1), not the Application ID or Public Key. No quotes needed.

---

## 5. Start the gateway

```bash
clawdbot gateway install   # install as background service (launchd)
clawdbot gateway start     # start it
```

Or run once in the foreground to test:

```bash
clawdbot gateway run
```

---

## 6. Use the bot

- **DMs:** Send a DM to the bot. First time uses **pairing**: the bot will send a pairing code; approve it with:
  ```bash
  clawdbot pairing approve discord <code>
  ```
- **Server:** In any channel the bot can see, mention it (e.g. `@YourBotName hello`). If you didn’t add a guild allowlist, the default may block guild messages until you add `channels.discord.guilds`; see [Discord channel docs](https://docs.clawd.bot/channels/discord) for `guilds` and `groupPolicy`.

---

## If you see "No session found: &lt;user id&gt;" in DMs

This can happen when the agent replies to a Discord DM using your **Discord user ID** as the session key. With the default `dm` policy (`pairing`) and `session.dmScope: "main"`, DMs use the **main** session key (`agent:main:main`), but the agent may infer the user ID from the message and call `sessions_send` with that ID, which the gateway does not store as a key.

**Fix (one-time):** Add a **session-store alias** so the gateway can resolve your user ID to the main session.

1. Open the session store: `~/.clawdbot/agents/main/sessions/sessions.json`
2. Find your main session entry (key `"agent:main:main"`). Note its `sessionId`, `sessionFile`, `deliveryContext`, `origin`, `lastChannel`, `lastTo`, `lastAccountId`.
3. Add a second key `"agent:main:YOUR_DISCORD_USER_ID"` (e.g. `"agent:main:123456789012345678"`) with an object that has the same `sessionId`, `sessionFile`, `deliveryContext`, `origin`, `lastChannel`, `lastTo`, `lastAccountId` (and optionally `updatedAt`). This aliases your Discord user ID to the same session so `sessions_send` with that ID resolves correctly.

After adding the alias, send another DM; the bot should be able to reply. If you add more Discord users (or use another bot account), repeat with their user IDs as needed.

---

## If the bot never replies in DMs

If the bot receives your message but you never get a reply, the agent may be using **sessions_send** to reply to the same conversation. That path uses an "announce" step that can fail or be skipped, so nothing gets sent.

**Fix:** In your **workspace** (e.g. `~/jarvis`), add to `AGENTS.md` under a section like "Replying in the current conversation":

- When replying in a **direct message** or the conversation you are in, **reply with normal text** in your message. Do **not** use the `sessions_send` tool for the same conversation—that is for other sessions only. Your normal text reply will be delivered automatically.

After saving `AGENTS.md`, restart the gateway (`clawdbot gateway restart`) and try again.

---

## If you see "Session Send: … failed: timeout"

The agent uses **sessions_send** to reply to your DM. By default it waits up to **30 seconds** for that reply run to finish. With a large model (e.g. 70B), the first reply can take longer than 30s, so the tool reports "timeout" even though the run is still going.

- **Check Discord:** The reply often still gets sent. Wait a few more seconds and look for the message in the DM.
- **If timeouts are frequent:** Use a smaller/faster model in `agents.defaults.model` (e.g. a 8B/32B variant) for quicker replies, or accept that the first reply may show up shortly after the timeout message.

There is no config to change the 30s default for `sessions_send`; the run continues in the background and delivery is best-effort.

---

## Optional: restrict to one server or channel

To allow only specific servers/channels, add to `~/.clawdbot/clawdbot.json` under `channels.discord`:

- **Guild ID:** Discord → User Settings → Advanced → Developer Mode → right‑click server name → Copy Server ID.
- **Channel ID:** Right‑click channel → Copy Channel ID.

Example (single server, single channel, mention required):

```json
"channels": {
  "discord": {
    "enabled": true,
    "token": "${DISCORD_BOT_TOKEN}",
    "dm": { "enabled": true, "policy": "pairing" },
    "groupPolicy": "allowlist",
    "guilds": {
      "YOUR_GUILD_ID": {
        "requireMention": true,
        "channels": {
          "YOUR_CHANNEL_ID_OR_SLUG": { "allow": true }
        }
      }
    }
  }
}
```

If you only set `DISCORD_BOT_TOKEN` and don’t add `guilds`, the default is open for guilds; use `groupPolicy` and `guilds` to lock it down.
