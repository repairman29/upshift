# Kroger OAuth Service

Hosted OAuth callback service for Kroger API with automatic token refresh.

## Features

- **Hosted OAuth callback** - No localhost needed
- **Multi-user support** - Each user gets their own tokens
- **Automatic token refresh** - Weekly cron job keeps tokens alive
- **Supabase storage** - Persistent, scalable token storage

## Deploy to Railway

### 1. Create Supabase Table

Run `supabase-migration.sql` in your Supabase SQL editor.

### 2. Set Environment Variables in Railway

```
KROGER_CLIENT_ID=your_client_id
KROGER_CLIENT_SECRET=your_client_secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
SERVICE_URL=https://your-app.railway.app
KROGER_SERVICE_SECRET=generate_a_random_secret
```

### 3. Update Kroger Developer Portal

Add the **exact** callback URL to your Kroger app (no trailing slash):

- Production: `https://kroger-oauth-production.up.railway.app/callback`

Kroger rejects the token exchange if the redirect URI doesn’t match character-for-character.

### 4. Deploy

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

## API Endpoints

### Public

- `GET /` - Health check
- `GET /auth/url?user_id=xxx` - Get OAuth URL for a user
- `GET /callback` - OAuth callback (redirected from Kroger)

### Authenticated (requires `X-API-Secret` header)

- `GET /api/status/:userId` - Check if user is connected
- `GET /api/token/:userId` - Get access token for user
- `PUT /api/cart/:userId/add` - Add items to user's cart
- `DELETE /api/token/:userId` - Disconnect user

## Local Development

```bash
npm install

# Create .env file
cat > .env << EOF
KROGER_CLIENT_ID=your_client_id
KROGER_CLIENT_SECRET=your_client_secret
KROGER_SERVICE_SECRET=dev-secret
SERVICE_URL=http://localhost:3000
EOF

npm start
```

## Integration with Jarvis

The Kroger skill can use this service instead of local tokens:

```javascript
// In skill config
KROGER_SERVICE_URL=https://your-app.railway.app
KROGER_SERVICE_SECRET=your_secret
```

When a user tries to add to cart:
1. Skill calls service to get access token
2. If not authorized, service returns auth URL
3. User clicks URL, logs into Kroger
4. Service stores token, user can now add to cart

## Troubleshooting

**"We can't sign you in - Your browser is currently set to block cookies"**

This is Kroger’s login page (login.kroger.com). Kroger requires cookies to sign you in. Fix it in the browser:

- **Allow cookies** for `login.kroger.com` (and if needed, `api.kroger.com`). In Chrome: lock icon → Site settings → Cookies → Allow.
- **Don’t use Incognito/Private** for the Connect Kroger flow, or allow cookies for that session.
- **Turn off** cookie/tracking blockers (browser settings or extensions) for Kroger when connecting.
- Try a normal window or a different browser if one blocks third‑party cookies by default.

**"Still getting the callback URL" / connection fails after Kroger login**

1. **Redirect URI** – In [Kroger Developer Portal](https://developer.kroger.com/) → your app → Redirect URIs, add exactly:
   - `https://kroger-oauth-production.up.railway.app/callback`
   No trailing slash, no extra path. If you see `invalid_redirect_uri` or `invalid_grant`, this is usually the cause.

2. **Railway env** – In Railway, set `SERVICE_URL` to exactly:
   - `https://kroger-oauth-production.up.railway.app`
   The service uses this to build the redirect URI sent to Kroger; it must match what’s in the Kroger portal.

3. **One-time code** – The `code` in the callback is single-use. If you refresh the callback page or hit it twice, the second request will fail. Start a new "Connect Kroger" from your app instead.

4. **Credentials** – Ensure `KROGER_CLIENT_ID` and `KROGER_CLIENT_SECRET` in Railway match the Kroger app that has the redirect URI above.

After redeploying, try "Connect Kroger" again. If it still fails, the callback page will show the error and a hint; check Railway logs for `[exchangeCode]` and `[callback]` for the full Kroger response.
