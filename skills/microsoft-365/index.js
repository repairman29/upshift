/**
 * Microsoft 365 skill: Outlook mail + Calendar via Graph API.
 * Env: MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_REFRESH_TOKEN (from oauth-helper.js).
 */

const fs = require('fs');
const path = require('path');

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';
const AUTH_BASE = 'https://login.microsoftonline.com/common/oauth2/v2.0';
const SCOPES = [
  'https://graph.microsoft.com/User.Read',
  'https://graph.microsoft.com/Mail.Read',
  'https://graph.microsoft.com/Mail.Send',
  'https://graph.microsoft.com/Calendars.Read',
  'https://graph.microsoft.com/Calendars.ReadWrite',
  'offline_access'
].join(' ');

function loadEnv() {
  const candidates = [
    process.env.CLAWDBOT_ENV,
    path.join(process.env.USERPROFILE || process.env.HOME || '', '.clawdbot', '.env'),
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
const refreshToken = process.env.MICROSOFT_REFRESH_TOKEN;

async function getAccessToken() {
  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error('Set MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, and MICROSOFT_REFRESH_TOKEN in ~/.clawdbot/.env. Run node skills/microsoft-365/oauth-helper.js once.');
  }
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    scope: SCOPES
  }).toString();
  const res = await fetch(`${AUTH_BASE}/token`, {
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

async function graphRequest(accessToken, method, pathname, body = null) {
  const url = pathname.startsWith('http') ? pathname : `${GRAPH_BASE}${pathname}`;
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  };
  if (body && (method === 'POST' || method === 'PATCH')) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = { value: text };
  }
  if (!res.ok) {
    throw new Error(data.error?.message || data.error_description || `Graph API error: ${res.status}`);
  }
  return data;
}

const MAIL_FOLDERS = { inbox: 'inbox', sentitems: 'sentitems', drafts: 'drafts' };

const tools = {
  outlook_list_mail: async ({ top = 10, unreadOnly = false, folder = 'inbox' }) => {
    try {
      const token = await getAccessToken();
      const folderId = MAIL_FOLDERS[folder] || 'inbox';
      let pathname = `/me/mailFolders/${folderId}/messages?$top=${Math.min(50, top)}&$select=id,subject,from,receivedDateTime,isRead,bodyPreview`;
      if (unreadOnly) {
        pathname += '&$filter=isRead eq false';
      }
      const data = await graphRequest(token, 'GET', pathname);
      const messages = (data.value || []).map((m) => ({
        id: m.id,
        subject: m.subject,
        from: m.from?.emailAddress?.address || m.from?.emailAddress?.name,
        receivedDateTime: m.receivedDateTime,
        isRead: m.isRead,
        bodyPreview: (m.bodyPreview || '').slice(0, 200)
      }));
      return {
        success: true,
        messages,
        folder,
        count: messages.length
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        folder
      };
    }
  },

  outlook_read_mail: async ({ messageId }) => {
    try {
      const token = await getAccessToken();
      const data = await graphRequest(token, 'GET', `/me/messages/${messageId}`);
      return {
        success: true,
        id: data.id,
        subject: data.subject,
        from: data.from?.emailAddress?.address || data.from?.emailAddress?.name,
        toRecipients: (data.toRecipients || []).map((r) => r.emailAddress?.address).filter(Boolean),
        receivedDateTime: data.receivedDateTime,
        body: data.body?.content || '',
        bodyPreview: data.bodyPreview,
        isRead: data.isRead
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        messageId
      };
    }
  },

  outlook_send_mail: async ({ to, subject, body, isHtml = false }) => {
    try {
      const token = await getAccessToken();
      const toRecipients = (to || '')
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean)
        .map((address) => ({ emailAddress: { address } }));
      if (!toRecipients.length) {
        return { success: false, message: 'At least one recipient (to) required.' };
      }
      await graphRequest(token, 'POST', '/me/sendMail', {
        message: {
          subject: subject || '(No subject)',
          body: {
            contentType: isHtml ? 'HTML' : 'Text',
            content: body || ''
          },
          toRecipients
        }
      });
      return {
        success: true,
        message: `Email sent to ${toRecipients.map((r) => r.emailAddress.address).join(', ')}`,
        subject: subject || '(No subject)'
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

  outlook_search_mail: async ({ query, top = 10 }) => {
    try {
      const token = await getAccessToken();
      const searchVal = encodeURIComponent('"' + (query || '').replace(/"/g, '') + '"');
      const pathname = `/me/messages?$search=${searchVal}&$top=${Math.min(50, top)}&$select=id,subject,from,receivedDateTime,isRead,bodyPreview`;
      const data = await graphRequest(token, 'GET', pathname);
      const messages = (data.value || []).map((m) => ({
        id: m.id,
        subject: m.subject,
        from: m.from?.emailAddress?.address || m.from?.emailAddress?.name,
        receivedDateTime: m.receivedDateTime,
        isRead: m.isRead,
        bodyPreview: (m.bodyPreview || '').slice(0, 200)
      }));
      return {
        success: true,
        messages,
        query,
        count: messages.length
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        query
      };
    }
  },

  calendar_list_events: async ({ startDate, endDate, top = 20 }) => {
    try {
      const token = await getAccessToken();
      const now = new Date();
      const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const end = endDate ? new Date(endDate) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      const pathname = `/me/calendar/calendarView?startDateTime=${start.toISOString()}&endDateTime=${end.toISOString()}&$top=${Math.min(50, top)}&$select=id,subject,start,end,location,organizer,isAllDay`;
      const data = await graphRequest(token, 'GET', pathname);
      const events = (data.value || []).map((e) => ({
        id: e.id,
        subject: e.subject,
        start: e.start?.dateTime,
        end: e.end?.dateTime,
        location: e.location?.displayName,
        organizer: e.organizer?.emailAddress?.address,
        isAllDay: e.isAllDay
      }));
      return {
        success: true,
        events,
        start: start.toISOString(),
        end: end.toISOString(),
        count: events.length
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  },

  calendar_create_event: async ({ subject, start, end, body, location, attendees, timeZone = 'UTC' }) => {
    try {
      const token = await getAccessToken();
      const payload = {
        subject: subject || '(No title)',
        start: {
          dateTime: start,
          timeZone: timeZone
        },
        end: {
          dateTime: end,
          timeZone: timeZone
        },
        body: body ? { contentType: 'Text', content: body } : undefined,
        location: location ? { displayName: location } : undefined,
        attendees: (attendees || []).length
          ? attendees.map((a) => ({ emailAddress: { address: a }, type: 'required' }))
          : undefined
      };
      const data = await graphRequest(token, 'POST', '/me/events', payload);
      return {
        success: true,
        message: `Event "${data.subject}" created`,
        id: data.id,
        subject: data.subject,
        start: data.start?.dateTime,
        end: data.end?.dateTime,
        webLink: data.webLink
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        subject
      };
    }
  }
};

module.exports = { tools };
