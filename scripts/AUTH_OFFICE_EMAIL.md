# Auth Now: live.com (Outlook) and gmail.com

One-time OAuth so JARVIS can read/send email and list/create calendar events. Do each provider once.

---

## Quick run (after you have client ID + secret)

From the **JARVIS repo root** (where this `scripts` folder lives):

```powershell
# Microsoft (live.com / outlook.com / work account)
node skills/microsoft-365/oauth-helper.js

# Google (gmail.com)
node skills/google-workspace/oauth-helper.js
```

Or use the helper script:

```powershell
node scripts/auth-office-email.js microsoft
node scripts/auth-office-email.js google
```

A browser will open → sign in with your **live.com** / **outlook.com** or **gmail.com** account → the script saves the refresh token to `%USERPROFILE%\.clawdbot\.env`. Restart the gateway after adding tokens.

---

## 1. Microsoft (live.com / outlook.com / Microsoft 365)

### 1.1 Create app in Azure

1. Go to **[Azure Portal](https://portal.azure.com)** → **Azure Active Directory** → **App registrations** → **New registration**.
2. **Name:** e.g. `JARVIS Outlook`.
3. **Supported account types:** "Accounts in any organizational directory and personal Microsoft accounts" (so live.com, outlook.com, and work/school work).
4. **Redirect URI:** Web → `http://localhost:3457/callback` → **Register**.
5. On the app page:
   - Copy **Application (client) ID** → you’ll use this as `MICROSOFT_CLIENT_ID`.
   - Go to **Certificates & secrets** → **New client secret** → copy the **Value** (not Secret ID) → you’ll use this as `MICROSOFT_CLIENT_SECRET`.
6. **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated** → add:
   - `User.Read`
   - `Mail.Read`, `Mail.Send`
   - `Calendars.Read`, `Calendars.ReadWrite`
   - **Grant admin consent** if your org requires it.

### 1.2 Add to .env

Open or create `%USERPROFILE%\.clawdbot\.env` (e.g. `C:\Users\YourName\.clawdbot\.env`) and add:

```env
MICROSOFT_CLIENT_ID=your-application-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret-value
```

### 1.3 Run OAuth

From JARVIS repo root:

```powershell
node skills/microsoft-365/oauth-helper.js
```

Browser opens → sign in with your **live.com** or **outlook.com** (or work) account → approve access. The script will write `MICROSOFT_REFRESH_TOKEN` to `.env`. If it doesn’t, it will print the token in the terminal; copy it into `.env` yourself.

---

## 2. Google (gmail.com)

### 2.1 Create project and OAuth client

1. Go to **[Google Cloud Console](https://console.cloud.google.com)**.
2. Create a project (or pick one) → **APIs & Services** → **Library** → enable **Gmail API** and **Google Calendar API**.
3. **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**.
4. If asked, configure **OAuth consent screen**: User type **External** (for gmail.com), add your gmail address as a test user if the app is in **Testing**.
5. **Application type:** **Desktop app** (or **Web application**; if Web, set redirect URI to `http://localhost:3458/callback`).
6. Copy **Client ID** and **Client secret**.

### 2.2 Add to .env

In `%USERPROFILE%\.clawdbot\.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 2.3 Run OAuth

From JARVIS repo root:

```powershell
node skills/google-workspace/oauth-helper.js
```

Browser opens → sign in with your **gmail.com** account → approve. The script will write `GOOGLE_REFRESH_TOKEN` to `.env`, or print it for you to copy.

---

## 3. After auth

- **Restart the gateway** so it picks up the new tokens.
- Ensure **`skills/microsoft-365`** and/or **`skills/google-workspace`** are in your gateway `skills.load.extraDirs` (or in `jarvis/skills/`).
- In chat: *"Show my Outlook inbox"*, *"What's on my calendar today?"*, *"Send email to X"*, *"List Gmail unread"*, etc.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Set MICROSOFT_CLIENT_ID..." | Add `MICROSOFT_CLIENT_ID` and `MICROSOFT_CLIENT_SECRET` to `%USERPROFILE%\.clawdbot\.env` (see 1.2). |
| "Redirect URI mismatch" | In Azure, set redirect URI to exactly `http://localhost:3457/callback`. |
| "Set GOOGLE_CLIENT_ID..." | Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env` (see 2.2). |
| Google "redirect_uri_mismatch" | In Google Console, add `http://localhost:3458/callback` to the OAuth client’s redirect URIs. |
| Token not saved (Windows) | Check `%USERPROFILE%\.clawdbot\.env`; if the script printed the token, paste it in as `MICROSOFT_REFRESH_TOKEN=...` or `GOOGLE_REFRESH_TOKEN=...`. |
