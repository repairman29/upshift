/**
 * Kroger OAuth Service
 * Handles OAuth callbacks, token storage, and automatic token refresh.
 * Deploy to Railway with Supabase for persistent multi-user token storage.
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');

const app = express();
app.use(express.json());

// Config from environment
const PORT = process.env.PORT || 3000;
const KROGER_CLIENT_ID = process.env.KROGER_CLIENT_ID;
const KROGER_CLIENT_SECRET = process.env.KROGER_CLIENT_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const SERVICE_URL = process.env.SERVICE_URL || `http://localhost:${PORT}`;
const API_SECRET = process.env.KROGER_SERVICE_SECRET || 'dev-secret'; // For authenticating Jarvis requests

const KROGER_BASE = 'https://api.kroger.com/v1';
const TOKEN_URL = `${KROGER_BASE}/connect/oauth2/token`;
const AUTH_URL = `${KROGER_BASE}/connect/oauth2/authorize`;
const SCOPES = 'cart.basic:write profile.compact';

// Supabase client
let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

// In-memory fallback for local dev (single user)
const memoryStore = {};

// ============ Token Storage ============

async function saveToken(userId, tokenData) {
  const record = {
    user_id: userId,
    refresh_token: tokenData.refresh_token,
    access_token: tokenData.access_token,
    expires_at: new Date(Date.now() + (tokenData.expires_in || 1800) * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  if (supabase) {
    const { error } = await supabase
      .from('kroger_tokens')
      .upsert(record, { onConflict: 'user_id' });
    if (error) throw new Error(`Supabase save error: ${error.message}`);
  } else {
    memoryStore[userId] = record;
  }
  return record;
}

async function getToken(userId) {
  if (supabase) {
    const { data, error } = await supabase
      .from('kroger_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw new Error(`Supabase get error: ${error.message}`);
    return data;
  } else {
    return memoryStore[userId] || null;
  }
}

async function getAllTokens() {
  if (supabase) {
    const { data, error } = await supabase.from('kroger_tokens').select('*');
    if (error) throw new Error(`Supabase list error: ${error.message}`);
    return data || [];
  } else {
    return Object.values(memoryStore);
  }
}

async function deleteToken(userId) {
  if (supabase) {
    await supabase.from('kroger_tokens').delete().eq('user_id', userId);
  } else {
    delete memoryStore[userId];
  }
}

// ============ Kroger API ============

async function exchangeCode(code, redirectUri) {
  const auth = Buffer.from(`${KROGER_CLIENT_ID}:${KROGER_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }).toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.error || 'Token exchange failed');
  return data;
}

async function refreshToken(refreshTokenValue) {
  const auth = Buffer.from(`${KROGER_CLIENT_ID}:${KROGER_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshTokenValue,
    }).toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.error || 'Token refresh failed');
  return data;
}

async function getValidAccessToken(userId) {
  const token = await getToken(userId);
  if (!token) return null;
  
  // Check if access token is still valid (with 5 min buffer)
  const expiresAt = new Date(token.expires_at);
  if (expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
    return token.access_token;
  }
  
  // Refresh the token
  try {
    const newTokenData = await refreshToken(token.refresh_token);
    await saveToken(userId, newTokenData);
    return newTokenData.access_token;
  } catch (e) {
    console.error(`Failed to refresh token for ${userId}:`, e.message);
    return null;
  }
}

// ============ Routes ============

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'kroger-oauth',
    supabase: !!supabase,
  });
});

// Allowed hosts for return_url (avoid open redirect)
const ALLOWED_RETURN_HOSTS = ['shopolive.xyz', 'www.shopolive.xyz', 'localhost', '127.0.0.1'];

function isAllowedReturnUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    if (u.protocol === 'http:' && u.hostname !== 'localhost') return false;
    return ALLOWED_RETURN_HOSTS.some(h => u.hostname === h || u.hostname.endsWith('.' + h));
  } catch (_) {
    return false;
  }
}

// Generate auth URL for a user
app.get('/auth/url', (req, res) => {
  const userId = req.query.user_id || 'default';
  const returnUrl = req.query.return_url && isAllowedReturnUrl(req.query.return_url) ? req.query.return_url : null;
  const state = Buffer.from(JSON.stringify({ userId, ts: Date.now(), return_url: returnUrl })).toString('base64');
  const redirectUri = `${SERVICE_URL}/callback`;
  
  const url = `${AUTH_URL}?` + new URLSearchParams({
    client_id: KROGER_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    state,
  }).toString();
  
  res.json({ url, userId });
});

// OAuth callback from Kroger
app.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;
  
  if (error) {
    return res.status(400).send(`<h1>Error</h1><p>${error}</p>`);
  }
  
  if (!code) {
    return res.status(400).send('<h1>Error</h1><p>No authorization code received</p>');
  }
  
  let userId = 'default';
  let returnUrl = null;
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    userId = stateData.userId || 'default';
    if (stateData.return_url && isAllowedReturnUrl(stateData.return_url)) {
      returnUrl = stateData.return_url;
    }
  } catch (_) {}
  
  try {
    const redirectUri = `${SERVICE_URL}/callback`;
    const tokenData = await exchangeCode(code, redirectUri);
    await saveToken(userId, tokenData);
    
    const returnSection = returnUrl
      ? `
        <p style="margin-top: 1.5rem;">
          <a href="${returnUrl}" style="display: inline-block; background: #2d3a1f; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600;">Return to Olive</a>
        </p>
        <p style="margin-top: 1rem; font-size: 0.9rem; color: #666;">Redirecting in 3 seconds…</p>
        <script>
          setTimeout(function(){ window.location.href = ${JSON.stringify(returnUrl)}; }, 3000);
        </script>
      `
      : '<p>You can close this window and return to your app.</p>';
    
    res.send(`
      <html>
      <head><title>Kroger Connected!</title></head>
      <body style="font-family: system-ui; max-width: 600px; margin: 50px auto; text-align: center;">
        <h1 style="color: green;">✓ Kroger Connected!</h1>
        <p>Your Kroger account is now linked.</p>
        <p>User ID: <code>${userId}</code></p>
        ${returnSection}
      </body>
      </html>
    `);
  } catch (e) {
    res.status(500).send(`<h1>Error</h1><p>${e.message}</p>`);
  }
});

// Get token status for a user (authenticated)
app.get('/api/status/:userId', async (req, res) => {
  if (req.headers['x-api-secret'] !== API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { userId } = req.params;
  const token = await getToken(userId);
  
  if (!token) {
    return res.json({ 
      connected: false, 
      authUrl: `${SERVICE_URL}/auth/url?user_id=${encodeURIComponent(userId)}` 
    });
  }
  
  // Test if token is valid
  const accessToken = await getValidAccessToken(userId);
  
  res.json({
    connected: !!accessToken,
    expiresAt: token.expires_at,
    authUrl: !accessToken ? `${SERVICE_URL}/auth/url?user_id=${encodeURIComponent(userId)}` : null,
  });
});

// Get access token for a user (authenticated)
app.get('/api/token/:userId', async (req, res) => {
  if (req.headers['x-api-secret'] !== API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { userId } = req.params;
  const accessToken = await getValidAccessToken(userId);
  
  if (!accessToken) {
    return res.status(401).json({ 
      error: 'Not authorized or token expired',
      authUrl: `${SERVICE_URL}/auth/url?user_id=${encodeURIComponent(userId)}`,
    });
  }
  
  res.json({ accessToken });
});

// Proxy cart operations (authenticated)
app.put('/api/cart/:userId/add', async (req, res) => {
  if (req.headers['x-api-secret'] !== API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { userId } = req.params;
  const accessToken = await getValidAccessToken(userId);
  
  if (!accessToken) {
    return res.status(401).json({ 
      error: 'Not authorized',
      needsAuth: true,
      authUrl: `${SERVICE_URL}/auth/url?user_id=${encodeURIComponent(userId)}`,
    });
  }
  
  try {
    const krogerRes = await fetch(`${KROGER_BASE}/cart/add`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    
    if (krogerRes.status === 204) {
      return res.json({ success: true });
    }
    
    if (!krogerRes.ok) {
      const text = await krogerRes.text();
      return res.status(krogerRes.status).json({ error: text });
    }
    
    const data = await krogerRes.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Disconnect user
app.delete('/api/token/:userId', async (req, res) => {
  if (req.headers['x-api-secret'] !== API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { userId } = req.params;
  await deleteToken(userId);
  res.json({ success: true });
});

// ============ Background Token Refresh ============

// Refresh all tokens every 7 days to keep them alive
async function refreshAllTokens() {
  console.log('[cron] Starting token refresh job...');
  const tokens = await getAllTokens();
  
  for (const token of tokens) {
    try {
      const newTokenData = await refreshToken(token.refresh_token);
      await saveToken(token.user_id, newTokenData);
      console.log(`[cron] Refreshed token for ${token.user_id}`);
    } catch (e) {
      console.error(`[cron] Failed to refresh token for ${token.user_id}:`, e.message);
    }
    // Small delay between refreshes
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('[cron] Token refresh job complete');
}

// Run every Sunday at 3am
cron.schedule('0 3 * * 0', refreshAllTokens);

// ============ Start Server ============

app.listen(PORT, () => {
  console.log(`Kroger OAuth Service running on port ${PORT}`);
  console.log(`Callback URL: ${SERVICE_URL}/callback`);
  console.log(`Supabase: ${supabase ? 'connected' : 'not configured (using memory)'}`);
  
  if (!KROGER_CLIENT_ID || !KROGER_CLIENT_SECRET) {
    console.warn('WARNING: KROGER_CLIENT_ID or KROGER_CLIENT_SECRET not set');
  }
});
