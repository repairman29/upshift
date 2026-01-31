# JARVIS — Reference for Later

Quick reference for what’s in this repo and how to use it. Use this when you come back to the project later.

---

## 1. Office, Email & Calendar (live.com / gmail.com)

### Skills

| Skill | Path | What it does |
|-------|------|--------------|
| **Microsoft 365** | `skills/microsoft-365/` | Outlook mail (list, read, send, search) + Calendar (list events, create event) via Graph API. Works with **live.com**, **outlook.com**, work/school. |
| **Google Workspace** | `skills/google-workspace/` | Gmail (list, read, send, search) + Google Calendar (list events, create event). Works with **gmail.com**. |

### Auth (one-time per provider)

- **Env file:** `%USERPROFILE%\.clawdbot\.env` (Windows) or `~/.clawdbot/.env`.
- **Microsoft:** Add `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`. Azure app → redirect `http://localhost:3457/callback`. Then run:
  ```bash
  node scripts/auth-office-email.js microsoft
  ```
  or `node skills/microsoft-365/oauth-helper.js`. Sign in with live.com/outlook.com → script saves `MICROSOFT_REFRESH_TOKEN`.
- **Google:** Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Google Cloud → enable Gmail + Calendar API, OAuth client with redirect `http://localhost:3458/callback`. Then run:
  ```bash
  node scripts/auth-office-email.js google
  ```
  or `node skills/google-workspace/oauth-helper.js`. Sign in with gmail.com → script saves `GOOGLE_REFRESH_TOKEN`.

**Full auth steps (Azure/Google setup, troubleshooting):** [scripts/AUTH_OFFICE_EMAIL.md](../scripts/AUTH_OFFICE_EMAIL.md)

**Broader Office/Email/Calendar guide:** [docs/JARVIS_OFFICE_EMAIL_CALENDAR.md](JARVIS_OFFICE_EMAIL_CALENDAR.md)

---

## 2. Other Skills (Windows / ROG Ed.)

| Skill | Path | Notes |
|-------|------|--------|
| **Launcher** | `skills/launcher/` | Launch apps, open URL, screenshot, lock, sleep, volume, **daily_brief**, **insert_symbol**, get_system_info (incl. battery + power plan on Windows). |
| **Window Manager** | `skills/window-manager/` | **Windows:** snap_window (Win+Arrow). macOS: full. |
| **File Search** | `skills/file-search/` | **Windows:** open, reveal in Explorer, copy path. |
| **Quick Notes** | `skills/quick-notes/` | “Remember: …”, “What did I note about X?”, list by tag/date. Data: `~/.jarvis/quick-notes/notes.json`. |
| **Calculator, Clipboard, Snippets, Performance Monitor, etc.** | `skills/` | See repo `skills/` folder. |

---

## 3. Key Paths & Commands

| What | Where / Command |
|------|------------------|
| **Gateway env** | `%USERPROFILE%\.clawdbot\.env` |
| **Start gateway** | From repo: `npx clawdbot gateway run` or `scripts\start-jarvis-ally.bat` |
| **Web UI** | http://127.0.0.1:18789/ (when gateway is running) |
| **Auth Office/Email** | `node scripts/auth-office-email.js microsoft` or `google` (from repo root) |
| **Skills load** | Gateway config `skills.load.extraDirs`: include repo `skills/` or `jarvis/skills/`. Restart gateway after adding skills. |

---

## 4. Docs to Open Later

| Doc | Purpose |
|-----|---------|
| [JARVIS_ROG_ED.md](../JARVIS_ROG_ED.md) | What JARVIS ROG Ed. can do, quick start, skills table. |
| [JARVIS_ROADMAP.md](../JARVIS_ROADMAP.md) | Roadmap phases and status (badassery, Windows polish). |
| [JARVIS_BADASSERY.md](../JARVIS_BADASSERY.md) | Ideas: one-liners, quick notes, timers, focus mode, etc. |
| [scripts/AUTH_OFFICE_EMAIL.md](../scripts/AUTH_OFFICE_EMAIL.md) | **Auth now** for live.com and gmail.com (Azure/Google setup). |
| [docs/JARVIS_OFFICE_EMAIL_CALENDAR.md](JARVIS_OFFICE_EMAIL_CALENDAR.md) | Office suite, email, calendar — what works and how to connect. |
| [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md) | Full setup (Discord, voice, etc.). |

---

## 5. One-Line Reminders

- **Auth live.com / gmail.com later:** Open [scripts/AUTH_OFFICE_EMAIL.md](../scripts/AUTH_OFFICE_EMAIL.md), add client ID/secret to `.clawdbot\.env`, run `node scripts/auth-office-email.js microsoft` and/or `google`.
- **Load Office/Email skills:** Ensure `skills/microsoft-365` and `skills/google-workspace` are in `skills.load.extraDirs` (or in `jarvis/skills/`), restart gateway.
- **ROG Ally:** Use [JARVIS_ROG_ED.md](../JARVIS_ROG_ED.md) and [ROG_ALLY_SETUP.md](../ROG_ALLY_SETUP.md) for setup; [scripts/DISCORD_ROG_ED.md](../scripts/DISCORD_ROG_ED.md) for Discord.
