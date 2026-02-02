# Cursor session onboarding — Upshift / UpshiftAI / JARVIS

**Use this when teaching another Cursor session (or yourself) how to work in this repo.**

---

## Current state (for handoff — update when session ends)

- **Canonical site (new):** `web/` — Indistractable design (soft dark, blue accent, Inter), hero “Stop reading changelogs”, Radar + Radar Pro section, pricing, blog. Deploy: Vercel with `vercel.json` → `outputDirectory: "web"`, `buildCommand` no-op.
- **Domain:** upshiftai.dev is still pointing at the **old** site (from `upshiftai/site/` — “UpshiftAI — Ancient dependency lineage”, live scanner). To show the new site, point upshiftai.dev in Vercel Dashboard to the project that deploys this repo with output `web/`.
- **Verify:** `npm run verify-site` (local web/ only); `npm run verify-site:live` (local + curl upshiftai.dev). When domain is fixed, verify-site:live should pass.
- **Radar Pro MVP:** Supabase `radar_reports` table, Edge Functions `radar-upload`, `radar-reports`, `radar-report`; CLI `upshift scan --report out.json --upload` (env: UPSHIFT_RADAR_TOKEN, UPSHIFT_RADAR_UPLOAD_URL); Radar page has “Radar Pro” section (API URL + token, Load my reports).
- **Python full parity:** `upshift upgrade <pkg>` in Python projects (pip/poetry): backup, upgrade, test (pytest or config `testCommand`), rollback on failure. See `src/lib/upgrade-python.ts`, ROADMAP.
- **E2E:** `npm run e2e` — CLI e2e (scan, suggest, plan, migrate, radar) + Python fixture (scan, upgrade --dry-run). Fixtures: `tests/fixtures/minimal` (Node), `tests/fixtures/minimal-python` (pip).

---

## 30-second model

- **This repo** = Upshift: main CLI (scan, upgrade, fix, plan, radar) + UpshiftAI (dependency intelligence, JARVIS skill, site, platform).
- **UpshiftAI** = dependency intelligence: CLI (`upshiftai-deps`), marketing site (upshiftai.dev), Next.js platform (dashboard, Stripe, Supabase), JARVIS skill.
- **JARVIS** = conversational productivity; UpshiftAI skill lives in `skills/upshiftai/`. JARVIS can add blog media (GIFs, videos, examples) using `upshiftai/site/blog/BLOG-MEDIA.md`.
- **Edge / Supabase:** JARVIS behind a public URL via Supabase Edge Function (proxy to platform). Code: `supabase/functions/jarvis/`.

---

## What to read first (in order)

| Read | Purpose |
|------|---------|
| **docs/REPO_INDEX.md** | Map of the repo: where things live, key docs, apps. |
| **upshiftai/README.md** | UpshiftAI overview: CLI, platform, JARVIS, site. |
| **skills/upshiftai/SKILL.md** | What the UpshiftAI JARVIS skill does and when to use it. |

Optional next: **upshiftai/JARVIS-AI-SETUP.md** (API key, quotas), **upshiftai/site/BRAND-VOICE.md** (site copy), **docs/when-it-breaks-and-guardrails.md** (guardrails, HITL).

---

## JARVIS in Cursor (use JARVIS when needed)

To use **JARVIS from Cursor** whenever the task needs it:

| Doc | Use |
|-----|-----|
| **docs/JARVIS_IN_CURSOR.md** | Setup (Edge URL, API key), when to use JARVIS, how to call it from Cursor. |
| **.cursor/rules/jarvis.mdc** | Cursor rule (always on): use JARVIS for dependency analysis, blog media, UpshiftAI skill. |

Set `UPSHIFTAI_API_KEY` in your env (or Cursor) and optionally `JARVIS_EDGE_URL`; then the agent can invoke JARVIS via the Edge URL when needed.

## Edge / Supabase (hosted JARVIS, UI → Edge)

When the work touches **hosted JARVIS** or **calling JARVIS from the edge**:

| Doc | Use |
|-----|-----|
| **upshiftai/docs/JARVIS-EDGE-SUPABASE.md** | Deploy `jarvis` Edge Function, set secrets, call from anywhere (REST). |
| **supabase/functions/jarvis/index.ts** | Edge Function: forwards `track_usage` to platform; other tasks to `POST /api/jarvis` when you add that route. |

Code: **supabase/functions/jarvis/** = Edge Function. Set **JARVIS_PLATFORM_API_URL** (and optional **UPSHIFTAI_SERVICE_KEY**) in Supabase Edge secrets.

---

## Site & blog

| Doc | Use |
|-----|-----|
| **web/** | **Canonical marketing site (new):** index, Radar, blog; Indistractable design. Deploy via Vercel (outputDirectory: web). |
| **docs/VERCEL_SETUP.md**, **vercel.json** | Vercel: outputDirectory `web`, buildCommand no-op. |
| **scripts/verify-site.mjs** | Verify local web/ and optionally live URL: `npm run verify-site`, `npm run verify-site:live`. |
| **upshiftai/site/** | **Old site** (still at upshiftai.dev until domain is repointed): “UpshiftAI — Ancient dependency lineage”, live scanner. |
| **upshiftai/site/BRAND-VOICE.md** | Customer-centric voice for site copy. |
| **upshiftai/site/blog/BLOG-MEDIA.md** | How to add GIFs, videos, code examples to blog posts. JARVIS adds media using these classes. |

---

## Rules that apply in Cursor

- If you have **.cursor/rules/** (e.g. `product-manager.mdc`), those are always applied when configured.
- For more context, you can @ other rules or docs in chat.

---

## Good @ mentions when starting a session

Paste or reference in the first message so the session has context:

- `@docs/REPO_INDEX.md` — repo map
- `@docs/CURSOR_SESSION_ONBOARDING.md` — this onboarding
- `@upshiftai/README.md` — UpshiftAI overview
- `@skills/upshiftai/SKILL.md` — JARVIS UpshiftAI skill

Or: *"Read docs/CURSOR_SESSION_ONBOARDING.md and use REPO_INDEX as the source of truth."*

---

## One-line cheat sheet

**Map** → REPO_INDEX | **UpshiftAI** → upshiftai/README.md | **JARVIS skill** → skills/upshiftai/SKILL.md | **JARVIS in Cursor** → docs/JARVIS_IN_CURSOR.md + .cursor/rules/jarvis.mdc | **Edge/Supabase** → upshiftai/docs/JARVIS-EDGE-SUPABASE.md | **Site (new)** → web/ + verify-site | **Site voice** → upshiftai/site/BRAND-VOICE.md | **Blog media** → upshiftai/site/blog/BLOG-MEDIA.md.
