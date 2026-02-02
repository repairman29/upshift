# Using JARVIS from Cursor

Use JARVIS anywhere in Cursor when you need dependency intelligence, blog media, or other JARVIS capabilities—without leaving the editor.

---

## One-time setup (do this once)

### 1. Run the setup script

From repo root:

```bash
scripts/setup-jarvis-cursor.sh
```

This creates `.env` from `.env.example` if it doesn’t exist.

### 2. Edit `.env` with your values

- **JARVIS_EDGE_URL** — `https://YOUR_REF.supabase.co/functions/v1/jarvis`  
  Get `YOUR_REF` from Supabase Dashboard (project URL). Deploy the Edge function first: `supabase functions deploy jarvis` (see `upshiftai/docs/JARVIS-EDGE-SUPABASE.md`).
- **UPSHIFTAI_API_KEY** — Your API key from [upshiftai.dev/pricing](https://upshiftai.dev/pricing) or the platform dashboard (e.g. `uai_pro_xxx`).

### 3. (Optional) Cursor environment

If Cursor doesn’t load `.env` automatically, add `JARVIS_EDGE_URL` and `UPSHIFTAI_API_KEY` in **Cursor Settings → Features → Environment** so the agent can use them when calling JARVIS.

---

## When to use JARVIS from Cursor

Use JARVIS when the user or the task needs:

- **Dependency analysis** — “Analyze dependencies,” “what’s old/risky,” “what should I upgrade first” for this repo or a path.
- **Blog media** — Add or edit GIFs, videos, or code examples in UpshiftAI blog posts; use the classes in `upshiftai/site/blog/BLOG-MEDIA.md`.
- **UpshiftAI skill** — Anything the `skills/upshiftai/` skill is meant for (see `skills/upshiftai/SKILL.md`).

Invoke JARVIS via the Edge URL (POST with `task` and `apiKey` or service auth) when that’s the right tool for the job.

---

## How to invoke (from Cursor / agent)

**Option A — Use the script (easiest):**

```bash
node scripts/call-jarvis.js <task> '<json params>'
```

Examples:

```bash
node scripts/call-jarvis.js track_usage '{"feature":"analyze_dependencies"}'
node scripts/call-jarvis.js add_blog_media '{"post":"when-it-breaks-guardrails-hitl.html","instructions":"Add a GIF"}'
```

The script reads `JARVIS_EDGE_URL` and `UPSHIFTAI_API_KEY` from `.env` at repo root.

**Option B — POST from code:**

POST to the Edge URL (from `.env` or env) with body:

```json
{
  "task": "<task_name>",
  "apiKey": "<UPSHIFTAI_API_KEY from env>",
  ...optional params
}
```

Use the user’s `UPSHIFTAI_API_KEY` from `.env` or the environment when making requests from Cursor.

---

## Cursor rule

The rule in **`.cursor/rules/jarvis.mdc`** tells the agent to use JARVIS when needed and points to this doc. With that rule enabled, any Cursor session can call JARVIS (Edge URL + API key from env) whenever the task fits.

---

## Optional: MCP later

If you add an MCP server that wraps the JARVIS Edge URL, you can connect it in Cursor (MCP settings) and get JARVIS tools directly in the UI. Until then, the agent uses the Edge URL via HTTP as described above.
