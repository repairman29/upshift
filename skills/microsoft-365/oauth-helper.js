#!/usr/bin/env node
/**
 * One-time OAuth helper: get Microsoft 365 refresh_token for Graph API (Outlook + Calendar).
 * 1. Azure Portal → App registrations → New → Redirect URI: http://localhost:3457/callback
 * 2. Add MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET to ~/.clawdbot/.env
 * 3. Run: node skills/microsoft-365/oauth-helper.js
 * 4. Log in with your Microsoft account; refresh token is saved to .env
 * 5. Add MICROSOFT_REFRESH_TOKEN to .env if not auto-saved (Windows: check %USERPROFILE%\.clawdbot\.env)
 */

const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.MICROSOFT_OAUTH_PORT) || 3457;
const REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || `http://localhost:${PORT}/callback`;
const AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const SCOPES = [
  'https://graph.microsoft.com/User.Read',
  'https://graph.microsoft.com/Mail.Read',
  'https://graph.microsoft.com/Mail.Send',
  'https://graph.microsoft.com/Calendars.Read',
  'https://graph.microsoft.com/Calendars.ReadWrite',
  'offline_access'
].join(' ');

function loadEnv() {
  const home = process.env.USERPROFILE || process.env.HOME || '';
  const candidates = [
    path.join(home, '.clawdbot', '.env'),
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '..', '.env'),
    path.join(process.cwd(), '..', '..', '.env')
  ].filter(Boolean);
  for (const p of candidates) {
    try {
      const content = fs.readFileSync(p, 'utf8');
      content.split('\n').forEach((line) => {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
      });
    } catch (_) {}
  }
}

loadEnv();

const clientId = process.env.MICROSOFT_CLIENT_ID;
const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

if (!clientId || !clientSecret || clientId.startsWith('your_')) {
  console.error('Set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in ~/.clawdbot/.env');
  console.error('Azure Portal → App registrations → New → Redirect URI: ' + REDIRECT_URI);
  process.exit(1);
}

const state = require('crypto').randomBytes(16).toString('hex');
const authLink = `${AUTH_URL}?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPES)}&state=${state}&prompt=consent`;

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url || '', `http://localhost:${PORT}`);
  if (u.pathname !== '/callback') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<p>Open the link printed in the terminal to authorize Microsoft 365.</p>');
    return;
  }
  const code = u.searchParams.get('code');
  const returnedState = u.searchParams.get('state');
  if (returnedState !== state) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Invalid state. Try again.');
    return;
  }
  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('No code in callback. Did you deny access?');
    return;
  }
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES
  }).toString();
  const tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const tokenData = await tokenRes.json().catch(() => ({}));
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  if (!tokenRes.ok) {
    res.end(`<pre>Token exchange failed: ${tokenRes.status}\n${JSON.stringify(tokenData, null, 2)}</pre>`);
    server.close();
    return;
  }
  const refresh = tokenData.refresh_token;
  const home = process.env.USERPROFILE || process.env.HOME || '';
  const envPath = path.join(home, '.clawdbot', '.env');
  let saved = false;
  try {
    let content = '';
    try {
      content = fs.readFileSync(envPath, 'utf8');
    } catch (_) {}
    const lines = content.split('\n');
    let found = false;
    const updated = lines.map((line) => {
      if (line.startsWith('MICROSOFT_REFRESH_TOKEN=')) {
        found = true;
        return `MICROSOFT_REFRESH_TOKEN=${refresh}`;
      }
      return line;
    });
    if (!found) updated.push(`MICROSOFT_REFRESH_TOKEN=${refresh}`);
    fs.mkdirSync(path.dirname(envPath), { recursive: true });
    fs.writeFileSync(envPath, updated.join('\n'), 'utf8');
    saved = true;
  } catch (e) {
    console.error('Failed to auto-save:', e.message);
  }
  if (saved) {
    res.end('<h2>Success!</h2><p style="color:green;">Microsoft 365 refresh token saved to ~/.clawdbot/.env</p><p>You can close this window. Outlook and Calendar are ready.</p>');
    console.log('\n✓ Refresh token saved to ' + envPath + '\n');
  } else {
    res.end('<h2>Success</h2><p>Copy the refresh token from the terminal and add to ~/.clawdbot/.env:</p><p><code>MICROSOFT_REFRESH_TOKEN=...</code></p>');
    console.log('\n--- Add to ~/.clawdbot/.env ---\n');
    console.log('MICROSOFT_REFRESH_TOKEN=' + refresh);
    console.log('\n--- Then restart the gateway ---\n');
  }
  server.close();
});

server.listen(PORT, () => {
  console.log('Redirect URI (add in Azure Portal): ' + REDIRECT_URI);
  console.log('\nOpen this URL in your browser to sign in with Microsoft:\n\n' + authLink + '\n');
  const open = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  require('child_process').exec(`${open} "${authLink}"`, () => {});
});
