# Connecting JARVIS to Office Suite, Email & Calendar

How to connect JARVIS to **Microsoft 365** (Outlook, Teams, Word, Excel), **Google Workspace** (Gmail, Calendar, Drive), and **office apps** in practice.

**Built-in skills in this repo:** `skills/microsoft-365` (Outlook mail + Calendar via Graph API) and `skills/google-workspace` (Gmail + Google Calendar). Run each skill's `oauth-helper.js` once, add tokens to `~/.clawdbot/.env`, then load the skill via `skills.load.extraDirs`. See README in each skill folder.

**→ Auth now (live.com / gmail.com):** [scripts/AUTH_OFFICE_EMAIL.md](../scripts/AUTH_OFFICE_EMAIL.md) — step-by-step Azure/Google setup and `node scripts/auth-office-email.js microsoft` or `google`.

---

## What Works Today (No Extra Skills)

| Need | How |
|------|-----|
| **Open Outlook / Teams / Word / Excel** | Launcher: *"Launch Outlook"*, *"Open Teams"*, *"Open Excel"* (Windows: `Start-Process`). |
| **Open a specific file** | File search: *"Find budget.xlsx"* → then *"Open it"* (file_operations open). |
| **Draft email text** | Chat: *"Draft a short email to my manager about the delay"* → copy reply. Or **Snippets**: *"Insert my email signature"* → expand to clipboard, paste in Outlook/Gmail. |
| **Open calendar in browser** | Launcher: *"Open outlook.office.com/calendar"* or *"Open calendar.google.com"*. |
| **Meeting mode** | Launcher: mute + (optional) Focus Assist; open_url to Teams or calendar. |

So you can **launch** Office/email/calendar apps, **open** documents, and use **snippets + chat** for drafts and signatures without any extra integration.

---

## Option 1: Community & Hub Skills (Install Ready-Made)

Skills that talk to Gmail, Calendar, or Outlook usually use OAuth + APIs. You can search and install from the **OpenClaw/ClawHub** registry or the **community marketplace**.

### ClawHub (OpenClaw skill registry)

| Step | Command / action |
|------|-------------------|
| Search | `clawhub search "calendar"` or `clawhub search "gmail"` or `npx clawhub@latest search "outlook"` |
| Install | `clawhub install <slug>` or `npx clawhub@latest install <slug>` (e.g. after you find a calendar or email skill) |
| Where skills go | Default: `./skills`; ensure this path (or your workspace `skills` folder) is in gateway `skills.load.extraDirs` |
| Restart | Restart the gateway so it loads the new skill |

Example skills mentioned in the ecosystem: **Calendar Wizard**, **Inbox Zero Pro**, **Notion Sync**. Exact slugs and availability are on [clawhub.ai](https://clawhub.ai) / [clawhub.com](https://clawhub.com).

### Community marketplace

- **Browse / install:** [Community Skills & Plugins (howtouseclawdbot.com)](https://howtouseclawdbot.com/community.html) — categories include Productivity, Communication.
- **JARVIS showcase / premium:** [repairman29.github.io/JARVIS](https://repairman29.github.io/JARVIS/) — may list Office/email/calendar skills.

After installing any skill, add the env vars and (if required) complete OAuth as described in that skill’s README.

---

## Option 2: Microsoft 365 (Outlook, Calendar, Teams, Office)

To go beyond “launch app” and **read/send email, list events, open files in OneDrive**, etc., a skill must use **Microsoft Graph API** with OAuth.

### What you’d need (for a custom or community skill)

| Item | Details |
|------|--------|
| **App registration** | [Azure Portal](https://portal.azure.com) → Azure Active Directory → App registrations → New. |
| **Redirect URI** | e.g. `http://localhost:3456/callback` (or your OAuth callback URL). |
| **Permissions (Graph)** | e.g. `Mail.Read`, `Mail.Send`, `Calendars.Read`, `User.Read`, `Files.Read` (depending on what the skill does). |
| **Env vars** | Typically `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, and after one-time login: `MICROSOFT_REFRESH_TOKEN` (or similar). |
| **OAuth flow** | Same idea as Kroger: local callback server or Postman-style steps to get auth code → exchange for tokens → store refresh token in `.env`. |

### Example capabilities (if such a skill exists or you build it)

- **Outlook:** List inbox, read message, send/reply, search.
- **Calendar:** Today’s events, create event, accept/decline.
- **Teams:** Presence, maybe send message (Graph or Bot Framework).
- **OneDrive / Office:** List files, open in browser, maybe edit via Graph (depending on skill).

**Built-in skill:** This repo includes **`skills/microsoft-365/`** — Outlook mail (list, read, send, search) and Calendar (list events, create event) via Microsoft Graph API. Setup: Azure app + redirect `http://localhost:3457/callback`, env `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET`, then run `node skills/microsoft-365/oauth-helper.js` once. See `skills/microsoft-365/README.md`.

---

## Option 3: Google Workspace (Gmail, Calendar, Drive)

**Built-in skill:** This repo includes **`skills/google-workspace/`** — Gmail (list, read, send, search) and Google Calendar (list events, create event) via Google APIs.

### Setup (google-workspace skill)

| Item | Details |
|------|--------|
| **Google Cloud project** | [Google Cloud Console](https://console.cloud.google.com) → create project → enable Gmail API, Calendar API, Drive API (as needed). |
| **OAuth consent** | Configure OAuth consent screen, add test users if app is “Testing”. |
| **Credentials** | Create OAuth 2.0 Client ID (e.g. Desktop app or localhost). |
| **Env vars** | e.g. `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and after one-time OAuth: `GOOGLE_REFRESH_TOKEN`. |
| **Scopes** | e.g. `https://www.googleapis.com/auth/gmail.readonly`, `gmail.send`, `calendar.events`, `drive.readonly`, etc. |

### Example capabilities (if such a skill exists or you build it)

- **Gmail:** List/search messages, read, send, reply.
- **Calendar:** List events, create/update events.
- **Drive:** List/open files, search.

The main README lists “Gmail” and “Calendar” as things JARVIS can do **when the right skills are available** (e.g. from the hub or showcase). This repo does **not** include a Google skill; use ClawHub/community or build one.

---

## Option 4: Office Apps (Word, Excel, PowerPoint) — Deep Integration

| Level | How |
|-------|-----|
| **Launch + open file** | Already supported: launcher opens Word/Excel; file-search finds a file → file_operations open (e.g. `budget.xlsx` opens in Excel). |
| **Edit content via API** | Would require a skill that uses **Microsoft Graph** (Office 365) to open/edit documents in the cloud, or **automation** (e.g. PowerShell COM on Windows to drive Word/Excel). Not in this repo. |
| **Create / edit locally** | Possible with a skill that runs scripts (e.g. PowerShell + COM, or a small server that uses Office APIs). Advanced; usually a custom or community skill. |

So: **open app + open file** is supported now; **create/edit document content from JARVIS** needs an extra skill (Graph-based or automation).

---

## Quick Reference: “I want to…”

| Goal | Approach |
|------|----------|
| Open Outlook / Gmail / Calendar app | **Launcher:** *"Launch Outlook"* / *"Open Chrome"* then *"Open calendar.google.com"*. |
| Open a specific email or calendar in browser | **Launcher:** `open_url` to Outlook Web or Google Calendar. |
| Draft email / signature | **Chat** for body; **Snippets** for signature (expand to clipboard, paste in client). |
| Read/send email or list calendar from JARVIS | **Use built-in skills:** `skills/microsoft-365` (Outlook + Calendar) and `skills/google-workspace` (Gmail + Calendar). Run each skill’s `oauth-helper.js` once and add tokens to `.env`. Or install a community skill from ClawHub. |
| Open a Word/Excel file | **File search** → *"Open [file]"* (file_operations open). |
| Edit Word/Excel from JARVIS | **Custom/community skill** (Graph or local automation); not built-in. |
| Use same OAuth pattern as Kroger | See `skills/kroger/` (oauth-helper, refresh token in `.env`, tools that call APIs with token). |

---

## Summary

- **No extra setup:** Launch Office/email/calendar apps, open files, use snippets + chat for drafts/signatures.
- **Full read/send email + calendar:** Use **built-in skills** `skills/microsoft-365` (Outlook + Calendar) and `skills/google-workspace` (Gmail + Calendar). Run each skill's `oauth-helper.js` once and add tokens to `.env`. Or use a community/ClawHub skill.
- **Office suite (Word/Excel):** Open app + open file is supported; editing from JARVIS requires a skill that uses Graph or local automation.

For ROG Ed. / Windows, Launcher already supports *"Launch Outlook"*, *"Open Teams"*, *"Open Excel"*; combine with file-search and snippets for a solid “quick connect” until you add a dedicated email/calendar skill.
