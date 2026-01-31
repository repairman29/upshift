/**
 * Google Workspace skill: Gmail + Calendar via Google APIs.
 * Env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN (from oauth-helper.js).
 */

const fs = require('fs');
const path = require('path');

const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1';
const CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3';
const AUTH_BASE = 'https://oauth2.googleapis.com/token';
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar'
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

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

async function getAccessToken() {
  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error('Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN in ~/.clawdbot/.env. Run node skills/google-workspace/oauth-helper.js once.');
  }
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken
  }).toString();
  const res = await fetch(AUTH_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error_description || data.error || `Token refresh failed: ${res.status}`);
  }
  return data.access_token;
}

function base64urlEncode(str) {
  return Buffer.from(str, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function parseGmailHeaders(headers) {
  const out = {};
  (headers || []).forEach((h) => {
    out[h.name.toLowerCase()] = h.value;
  });
  return out;
}

function getBody(message) {
  if (message.payload?.body?.data) {
    return Buffer.from(message.payload.body.data, 'base64').toString('utf8');
  }
  const parts = message.payload?.parts || [];
  for (const p of parts) {
    if (p.mimeType === 'text/plain' && p.body?.data) {
      return Buffer.from(p.body.data, 'base64').toString('utf8');
    }
  }
  for (const p of parts) {
    if (p.body?.data) {
      return Buffer.from(p.body.data, 'base64').toString('utf8');
    }
  }
  return '';
}

const tools = {
  gmail_list_mail: async ({ maxResults = 10, unreadOnly = false, labelIds }) => {
    try {
      const token = await getAccessToken();
      const labels = labelIds && labelIds.length ? labelIds.join(',') : 'INBOX';
      let url = `${GMAIL_BASE}/users/me/messages?maxResults=${Math.min(50, maxResults)}&labelIds=${encodeURIComponent(labels)}`;
      if (unreadOnly) {
        url += '&q=is:unread';
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error?.message || `Gmail API error: ${res.status}`);
      }
      const list = data.messages || [];
      const results = [];
      for (const m of list.slice(0, Math.min(50, maxResults))) {
        const msgRes = await fetch(`${GMAIL_BASE}/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const msg = await msgRes.json().catch(() => ({}));
        const headers = parseGmailHeaders(msg.payload?.headers);
        results.push({
          id: msg.id,
          threadId: msg.threadId,
          subject: headers.subject || '(No subject)',
          from: headers.from || '',
          date: headers.date || msg.internalDate,
          snippet: (msg.snippet || '').slice(0, 200),
          labelIds: msg.labelIds || []
        });
      }
      return {
        success: true,
        messages: results,
        count: results.length
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  },

  gmail_read_mail: async ({ messageId }) => {
    try {
      const token = await getAccessToken();
      const res = await fetch(`${GMAIL_BASE}/users/me/messages/${messageId}?format=full`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const msg = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(msg.error?.message || `Gmail API error: ${res.status}`);
      }
      const headers = parseGmailHeaders(msg.payload?.headers);
      const body = getBody(msg);
      return {
        success: true,
        id: msg.id,
        threadId: msg.threadId,
        subject: headers.subject || '(No subject)',
        from: headers.from || '',
        to: headers.to || '',
        date: headers.date || msg.internalDate,
        body,
        snippet: msg.snippet
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        messageId
      };
    }
  },

  gmail_send_mail: async ({ to, subject, body }) => {
    try {
      const token = await getAccessToken();
      const toList = (to || '').split(',').map((e) => e.trim()).filter(Boolean);
      if (!toList.length) {
        return { success: false, message: 'At least one recipient (to) required.' };
      }
      const lines = [
        `To: ${toList.join(', ')}`,
        `Subject: ${subject || '(No subject)'}`,
        'Content-Type: text/plain; charset=UTF-8',
        '',
        body || ''
      ];
      const raw = base64urlEncode(lines.join('\r\n'));
      const res = await fetch(`${GMAIL_BASE}/users/me/messages/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error?.message || `Gmail API error: ${res.status}`);
      }
      return {
        success: true,
        message: `Email sent to ${toList.join(', ')}`,
        subject: subject || '(No subject)',
        id: data.id
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        to,
        subject
      };
    }
  },

  gmail_search_mail: async ({ query, maxResults = 10 }) => {
    try {
      const token = await getAccessToken();
      const url = `${GMAIL_BASE}/users/me/messages?maxResults=${Math.min(50, maxResults)}&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error?.message || `Gmail API error: ${res.status}`);
      }
      const list = data.messages || [];
      const results = [];
      for (const m of list.slice(0, maxResults)) {
        const msgRes = await fetch(`${GMAIL_BASE}/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const msg = await msgRes.json().catch(() => ({}));
        const headers = parseGmailHeaders(msg.payload?.headers);
        results.push({
          id: msg.id,
          subject: headers.subject || '(No subject)',
          from: headers.from || '',
          date: headers.date || msg.internalDate,
          snippet: (msg.snippet || '').slice(0, 200)
        });
      }
      return {
        success: true,
        messages: results,
        query,
        count: results.length
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        query
      };
    }
  },

  calendar_list_events: async ({ timeMin, timeMax, maxResults = 20, calendarId = 'primary' }) => {
    try {
      const token = await getAccessToken();
      const now = new Date();
      const start = timeMin ? new Date(timeMin) : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const end = timeMax ? new Date(timeMax) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      const url = `${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${start.toISOString()}&timeMax=${end.toISOString()}&maxResults=${Math.min(50, maxResults)}&singleEvents=true&orderBy=startTime`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error?.message || `Calendar API error: ${res.status}`);
      }
      const events = (data.items || []).map((e) => ({
        id: e.id,
        summary: e.summary,
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
        location: e.location,
        organizer: e.organizer?.email,
        htmlLink: e.htmlLink
      }));
      return {
        success: true,
        events,
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        count: events.length
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  },

  calendar_create_event: async ({ summary, start, end, description, location, attendees, calendarId = 'primary' }) => {
    try {
      const token = await getAccessToken();
      const payload = {
        summary: summary || '(No title)',
        start: { dateTime: start, timeZone: 'UTC' },
        end: { dateTime: end, timeZone: 'UTC' },
        description: description || undefined,
        location: location || undefined,
        attendees: (attendees || []).map((email) => ({ email }))
      };
      const res = await fetch(`${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error?.message || `Calendar API error: ${res.status}`);
      }
      return {
        success: true,
        message: `Event "${data.summary}" created`,
        id: data.id,
        summary: data.summary,
        start: data.start?.dateTime,
        end: data.end?.dateTime,
        htmlLink: data.htmlLink
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        summary
      };
    }
  }
};

module.exports = { tools };
