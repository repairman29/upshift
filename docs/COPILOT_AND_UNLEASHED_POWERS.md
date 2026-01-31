# Super Powers Not Yet Unleashed & Copilot ↔ JARVIS

Quick reference: what’s still on the roadmap and how to get **Microsoft Copilot** (or other apps) to talk to JARVIS.

---

## 1. Super powers not yet unleashed

From [JARVIS_ROADMAP.md](../JARVIS_ROADMAP.md) and [JARVIS_BADASSERY.md](../JARVIS_BADASSERY.md):

| Area | Item | Status | Notes |
|------|------|--------|--------|
| **Phase 1** | “Open anything” (file + app + URL) in SOUL/AGENTS | ⬜ Todo | Prefer file_search + launch + open_url when user says “open X” |
| **Phase 2** | **Focus mode** (mute + Windows Focus Assist) | ⬜ Todo | Launcher: `focus_mode` on/off or document workflow |
| **Phase 3** | **Timers & reminders** | ⬜ Todo | “In 20 min” / “at 3pm” → Task Scheduler or in-process |
| **Phase 3** | **get_active_window** on Windows | ⬜ Todo | Launcher or Window Manager: PowerShell/UI Automation → { app, title } |
| **Phase 3** | Pre-built “Make it so” workflows | ⬜ Todo | Meeting/streaming/EOD workflows; document in ROG_ED |
| **Phase 3** | Clipboard history Windows edges | ⬜ Todo | Verify monitoring + paste; JARVIS vs Win+V |
| **Phase 4** | Quick access tray app (Win+J) | ⬜ Todo | Tray icon + hotkey opens dashboard |
| **Phase 4** | Color picker (cursor pixel → hex) | ⬜ Todo | Stretch: PowerShell + .NET or helper exe |
| **Phase 4** | Workspace save/restore on Windows | ⬜ Todo | Window Manager: workspace_save/restore |

**Already in the repo but need setup:**

- **Microsoft 365 (Outlook + Calendar):** [skills/microsoft-365/](../skills/microsoft-365/) — OAuth once with `node scripts/auth-office-email.js microsoft`, then “Show inbox”, “What’s on my calendar?”, “Send email”.
- **Google Workspace (Gmail + Calendar):** [skills/google-workspace/](../skills/google-workspace/) — Same idea with `auth-office-email.js google`.
- **Repo-knowledge (cross-repo search):** Index is running; ask JARVIS things like “search all repos for OAuth” or “summarize BEAST-MODE”.
- **Push notifications (ntfy):** Add `NTFY_TOPIC=your-topic` to `~/.clawdbot/.env` and use `notify "msg"`; see [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md) → Push Notifications.
- **Voice:** Voice control skill exists; wake word / TTS depends on your platform and config.

---

## 2. Can MS Copilot talk to JARVIS?

**Yes.** JARVIS’s gateway (OpenClaw/Clawdbot) can expose an HTTP API that Copilot (or any REST client) can call. Two main approaches:

### Option A: Copilot Studio → JARVIS via REST (recommended)

Microsoft Copilot Studio can call **custom REST APIs** (OpenAPI v2 + auth). The gateway can serve **OpenResponses**-compatible `POST /v1/responses`: send a user message, get JARVIS’s reply.

**Steps (high level):**

1. **Enable the endpoint** in your gateway config (e.g. `~/.clawdbot/clawdbot.json` or workspace config):
   ```json
   {
     "gateway": {
       "http": {
         "endpoints": {
           "responses": { "enabled": true }
         }
       }
     }
   }
   ```
2. **Auth:** Use Gateway token auth. Set `gateway.auth.mode: "token"` and `gateway.auth.token` (or `OPENCLAW_GATEWAY_TOKEN`). Copilot will send `Authorization: Bearer <token>`.
3. **Expose the gateway** so Copilot (cloud) can reach it:
   - **Tunnel:** ngrok, Cloudflare Tunnel, or Tailscale Funnel: expose `http://127.0.0.1:18789` as a public HTTPS URL.
   - Or run a **small bridge** in the cloud (e.g. Railway) that forwards Copilot requests to your tunnel or to a gateway you host.
4. **OpenAPI spec:** Describe `POST /v1/responses` in OpenAPI 2.0 (Swagger): one operation that accepts a body with `input` (e.g. user message) and returns the response. See [OpenClaw OpenResponses HTTP API](https://docs.clawd.bot/gateway/openresponses-http-api) for request/response shape (e.g. `input`, `model: "openclaw:main"`, optional `user` for session, `stream` for SSE).
5. **Copilot Studio:** Create a custom connector from that OpenAPI definition, add auth (Bearer token), then add an action that calls “send message to JARVIS” and use the reply in your Copilot flow.

**Caveats:**

- The `/v1/responses` endpoint is **disabled by default**; you must enable it as above.
- Gateway must be **running** (locally or wherever you tunnel from).
- Copilot runs in the cloud, so your gateway must be reachable via **HTTPS** (tunnel or bridge).

### Option B: JARVIS in Microsoft Teams (same JARVIS, different entry point)

Clawdbot supports an **MS Teams channel**. You add JARVIS as a bot in Teams; users chat with JARVIS in Teams. That’s “JARVIS in Teams,” not “Copilot calling JARVIS.” For setup, see Clawdbot docs: [Channels → Msteams](https://docs.clawd.bot/channels/msteams). Copilot in Teams is a separate product; to have Copilot *invoke* JARVIS, use Option A.

---

## 3. Quick reference: gateway HTTP APIs

| Endpoint | Purpose | Doc |
|----------|---------|-----|
| `POST /v1/responses` | Send message, get JARVIS reply (OpenResponses). **Disabled by default.** | [openresponses-http-api](https://docs.clawd.bot/gateway/openresponses-http-api) |
| `POST /tools/invoke` | Invoke a single tool (e.g. `sessions_list`). | [tools-invoke-http-api](https://docs.clawd.bot/gateway/tools-invoke-http-api) |

Default gateway port in this repo: **18789** (e.g. `http://127.0.0.1:18789/`).

---

## 4. Next actions

- **Unleash more powers:** Pick the next ⬜ from [JARVIS_ROADMAP.md](../JARVIS_ROADMAP.md) (e.g. Focus mode or Timers & reminders).
- **Office/email:** Run `node scripts/auth-office-email.js microsoft` (and/or `google`) and add the skill to `extraDirs`; see [docs/JARVIS_OFFICE_EMAIL_CALENDAR.md](JARVIS_OFFICE_EMAIL_CALENDAR.md).
- **Copilot → JARVIS:** Enable `gateway.http.endpoints.responses`, expose gateway via HTTPS (tunnel or bridge), define OpenAPI v2 for `POST /v1/responses`, then add a custom connector in Copilot Studio that calls JARVIS and returns the reply.
