# Google Workspace Skill

Gmail (list, read, send, search) and Google Calendar (list events, create event) via **Google APIs**.

## Requirements

- Node 18+ (uses `fetch`)
- Env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` (one-time OAuth)

## Setup

### 1. Google Cloud Project

1. [Google Cloud Console](https://console.cloud.google.com) → Create project (or select one).
2. **APIs & Services** → **Library** → enable **Gmail API** and **Google Calendar API**.
3. **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**.
4. Application type: **Desktop app** (or **Web application** with redirect URI `http://localhost:3458/callback`).
5. Copy **Client ID** and **Client secret**.

### 2. OAuth Consent

- **OAuth consent screen**: Configure if not done (User type: External for personal Gmail; add your email as test user if in Testing).

### 3. Env and OAuth

1. Add to `~/.clawdbot/.env` (Windows: `%USERPROFILE%\.clawdbot\.env`):
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
2. Run once: `node skills/google-workspace/oauth-helper.js`
3. Sign in with Google in the browser; the script saves `GOOGLE_REFRESH_TOKEN` to `.env` (or copy from terminal).

### 4. Load the skill

Copy this folder to your workspace `skills/` or add the repo `skills` path to gateway `skills.load.extraDirs`. Restart the gateway.

## Tools

| Tool | Description |
|------|-------------|
| `gmail_list_mail` | List inbox (optional unread only, labelIds) |
| `gmail_read_mail` | Read a message by ID (full body) |
| `gmail_send_mail` | Send email (to, subject, body) |
| `gmail_search_mail` | Search Gmail by query |
| `calendar_list_events` | List events in a time range (default primary calendar) |
| `calendar_create_event` | Create event (summary, start, end; optional description, location, attendees) |

See `SKILL.md` for AI/assistant usage.
