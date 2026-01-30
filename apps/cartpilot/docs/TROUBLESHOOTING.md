# Olive – Troubleshooting

## Production 401 / wrong Supabase (Vercel CLI)

**Already done via CLI:** `NEXT_PUBLIC_SUPABASE_URL` is set to `https://rbfzlqmkwhbvrrfdcain.supabase.co` for Production. The old project (`mgeydloygmoiypnwaqmn`) vars were removed.

**You still need to set the anon key** (from [rbfzlqmkwhbvrrfdcain → API](https://supabase.com/dashboard/project/rbfzlqmkwhbvrrfdcain/settings/api), copy **anon public**):

```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY='eyJ...' npm run vercel:set-supabase-key
```

Then redeploy: `vercel --prod` or Vercel Dashboard → Redeploy.

---

## Console errors

### "Unchecked runtime.lastError: Could not establish connection" / "message port closed"
**Cause:** Browser extensions (Cursor, password managers, ad blockers, etc.) injecting into the page.  
**Fix:** Ignore them, or disable extensions when testing Olive. They are not from the Olive app.

### "utils.js / extensionState.js / heuristicsRedefinitions.js – Failed to load resource"
**Cause:** Same as above – extension scripts.  
**Fix:** Ignore, or run in an incognito window with extensions disabled.

### "icon-192.png / icon-512.png – 404"
**Cause:** PWA manifest asks for icons; either they weren’t deployed or the browser cached an old manifest.  
**Fix:** `public/icon-192.png` and `public/icon-512.png` exist in the repo. If you see 404 on **shopolive.xyz**, commit and push, then trigger a new Vercel deploy so `public/` is updated. Hard-refresh (Ctrl+Shift+R / Cmd+Shift+R) or clear site data for shopolive.xyz to drop the old manifest cache.

---

## Sign up / Sign in returns 401

**Error:** Supabase `/auth/v1/signup` or `/token` returns **401 Unauthorized**, or **Failed to fetch** / **net::ERR_INTERNET_DISCONNECTED**.

Olive uses project **rbfzlqmkwhbvrrfdcain**: [Dashboard](https://supabase.com/dashboard/project/rbfzlqmkwhbvrrfdcain).

If the error URL shows **mgeydloygmoiypnwaqmn** instead, the app is still pointed at the old project. Update env (see below) and redeploy.

**Checks:**

1. **Supabase Dashboard → Authentication → Providers → Email**
   - "Enable Email provider" is **ON**.
   - If "Confirm email" is ON, users must click the confirmation link before signing in.

2. **Env vars (e.g. `.env.local` / Vercel)**
   - `NEXT_PUBLIC_SUPABASE_URL` = **https://rbfzlqmkwhbvrrfdcain.supabase.co** (Olive’s project).
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the **anon public** key from [rbfzlqmkwhbvrrfdcain → API](https://supabase.com/dashboard/project/rbfzlqmkwhbvrrfdcain/settings/api) (not the service_role key).
   - **Vercel:** Project Settings → Environment Variables. Set both for Production (and Preview if you use it), then **redeploy** so the new URL is baked into the build.

3. **Project status**
   - Supabase Dashboard: project not paused and no billing/usage blocks.

4. **URL configuration**
   - Authentication → URL Configuration: **Site URL** and **Redirect URLs** include your app (e.g. `https://shopolive.xyz`, `http://localhost:3001`).

After changing Auth or env, restart the dev server or redeploy.

---

## 500 on `/api/memory/usuals`, `/api/memory/settings`, or `/api/kroger/add-to-cart`

**Cause:** Server-side APIs need env vars that are **not** exposed to the client. If they’re missing on Vercel, you get 500 (or 503 after recent changes).

**Required on Vercel (Project → Settings → Environment Variables):**

| Variable | Used by | Where to get it |
|----------|---------|-----------------|
| `SUPABASE_URL` | Memory APIs, add-to-cart (preferences) | Same as `NEXT_PUBLIC_SUPABASE_URL` (e.g. `https://rbfzlqmkwhbvrrfdcain.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Memory APIs, add-to-cart (events/preferences) | Supabase Dashboard → API → **service_role** (secret; server only) |
| `NEXT_PUBLIC_KROGER_SERVICE_URL` | Add-to-cart, Connect Kroger | e.g. `https://kroger-oauth-production.up.railway.app` |
| `KROGER_SERVICE_SECRET` | Add-to-cart (calls Kroger service) | Same secret as your Railway Kroger OAuth service |
| `KROGER_CLIENT_ID` / `KROGER_CLIENT_SECRET` | Add-to-cart (product search) | Kroger Developer Portal – same app as OAuth |

**If memory tables don’t exist:** Run the SQL in `supabase/memory.sql` and `supabase/settings.sql` in the Supabase SQL Editor (project rbfzlqmkwhbvrrfdcain). Otherwise usuals/settings queries can still return 500 with a “relation does not exist”–style error.

**After adding or changing these:** Redeploy (Vercel Dashboard → Deployments → ⋮ → Redeploy, or `vercel --prod`).
