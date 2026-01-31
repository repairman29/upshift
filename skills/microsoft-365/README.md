# Microsoft 365 Skill

Outlook mail (list, read, send, search) and Calendar (list events, create event) via **Microsoft Graph API**.

## Requirements

- Node 18+ (uses `fetch`)
- Env: `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_REFRESH_TOKEN` (one-time OAuth)

## Setup

### 1. Azure App Registration

1. [Azure Portal](https://portal.azure.com) → **Azure Active Directory** → **App registrations** → **New registration**.
2. Name: e.g. "JARVIS Outlook Calendar".
3. **Redirect URI**: Web → `http://localhost:3457/callback` (or set `MICROSOFT_REDIRECT_URI` and use that).
4. Register → copy **Application (client) ID** and create a **Client secret** (Certificates & secrets).
5. **API permissions**: Add delegated permissions for Microsoft Graph:
   - `User.Read`
   - `Mail.Read`, `Mail.Send`
   - `Calendars.Read`, `Calendars.ReadWrite`
   - (Consent for your org if required.)

### 2. Env and OAuth

1. Add to `~/.clawdbot/.env` (Windows: `%USERPROFILE%\.clawdbot\.env`):
   - `MICROSOFT_CLIENT_ID` = Application (client) ID
   - `MICROSOFT_CLIENT_SECRET` = Client secret value
2. Run once: `node skills/microsoft-365/oauth-helper.js`
3. Sign in with your Microsoft account in the browser; the script saves `MICROSOFT_REFRESH_TOKEN` to `.env` (or copy it from the terminal).

### 3. Load the skill

Copy this folder to your workspace `skills/` or add the repo `skills` path to gateway `skills.load.extraDirs`. Restart the gateway.

## Tools

| Tool | Description |
|------|-------------|
| `outlook_list_mail` | List inbox/sent/drafts (optional unread only) |
| `outlook_read_mail` | Read a message by ID (full body) |
| `outlook_send_mail` | Send email (to, subject, body) |
| `outlook_search_mail` | Search mail by query |
| `calendar_list_events` | List events in a date range |
| `calendar_create_event` | Create event (subject, start, end, optional body/location/attendees) |

See `SKILL.md` for AI/assistant usage.
