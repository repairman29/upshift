# JARVIS on the edge (Supabase)

JARVIS is callable from **Supabase Edge Functions** so you can invoke it from the site, blog workflow, or CLI without going through the full platform app.

## Where it lives

- **Repo:** `supabase/functions/jarvis/index.ts`
- **URL (after deploy):** `https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/jarvis`

Use the same Supabase project as the platform (same `SUPABASE_URL`). Link once:

```bash
cd /path/to/upshift
supabase link --project-ref YOUR_REF
```

## Deploy the Edge Function

```bash
supabase functions deploy jarvis
```

Set secrets in **Supabase Dashboard → Edge Functions → jarvis → Secrets** (or CLI):

| Secret | Purpose |
|--------|--------|
| `JARVIS_PLATFORM_API_URL` | Platform API base (e.g. `https://api.upshiftai.dev`). Defaults to that if unset. |
| `UPSHIFTAI_SERVICE_KEY` | Optional service key for server-side calls (no user API key). |

## How to call it

**From browser or script (with user API key):**

```bash
curl -X POST "https://YOUR_REF.supabase.co/functions/v1/jarvis" \
  -H "Content-Type: application/json" \
  -d '{"task": "track_usage", "apiKey": "uai_pro_xxx", "feature": "analyze_dependencies"}'
```

**From server (with service key in Edge secrets):**

```bash
curl -X POST "https://YOUR_REF.supabase.co/functions/v1/jarvis" \
  -H "Content-Type: application/json" \
  -d '{"task": "add_blog_media", "post": "when-it-breaks-guardrails-hitl.html", "instructions": "Add a GIF showing the upgrade flow"}'
```

**Tasks:**

- `track_usage` — Forwards to platform `POST /api/ai/track-usage` (quota).
- Anything else (e.g. `add_blog_media`) — Forwards to `POST /api/jarvis` on the platform when you add that route; until then the Edge Function returns a stub so you can wire it.

## Adding a platform route for JARVIS tasks

To handle `add_blog_media` and similar tasks on the platform:

1. In `upshiftai/platform/app/api/`, add `jarvis/route.js`.
2. Accept `POST` with `{ task, ...params }`, verify API key or service auth, call your JARVIS/LLM flow, return the result.
3. The Edge Function already forwards to `POST /api/jarvis` for any task other than `track_usage`.

## Local dev

```bash
supabase functions serve jarvis --no-verify-jwt
# Invoke: http://localhost:54321/functions/v1/jarvis
```

You can access JARVIS on the edge from Cursor, scripts, or the blog pipeline by calling this URL with the appropriate `task` and auth.
