# Repo index — Upshift

Map of the repo: where things live, key docs, and apps.

---

## 30-second map

| Area | Path | What it is |
|------|------|------------|
| **Main CLI & Radar** | `src/`, `action/` | Upshift CLI (scan, upgrade, fix, plan, radar). GitHub Action in `action/`. |
| **Skills (JARVIS)** | `skills/` | JARVIS skills: `skills/upshiftai/` = UpshiftAI dependency intelligence; `skills/SKILL.md` = root skill. |
| **UpshiftAI** | `upshiftai/` | Dependency intelligence sub-project: CLI (`bin/`, `src/`), **site** (marketing + blog), **platform** (Next.js dashboard, Stripe, Supabase). |
| **Site (upshiftai.dev)** | `upshiftai/site/` | Static site: index, docs, dev, pricing, blog. Brand voice: `BRAND-VOICE.md`. Blog media: `blog/BLOG-MEDIA.md`. |
| **Platform (API + dashboard)** | `upshiftai/platform/` | Next.js: auth, dashboard, Stripe, Supabase (subscriptions, api_keys, ai_usage). |
| **Edge / JARVIS on Supabase** | `supabase/functions/jarvis/` | Edge Function: call JARVIS from one URL (proxy to platform). See `upshiftai/docs/JARVIS-EDGE-SUPABASE.md`. |
| **Web (other)** | `web/` | Other web assets (e.g. blog HTML, gifs). |
| **Docs** | `docs/` | Repo-level docs: when-it-breaks, radar, endpoint, blog posts, **REPO_INDEX.md**, **CURSOR_SESSION_ONBOARDING.md**. |
| **UpshiftAI docs** | `upshiftai/docs/`, `upshiftai/*.md` | HITL, JARVIS-AI-SETUP, JARVIS-EDGE-SUPABASE, design, capabilities. |

---

## Key files

- **README.md** (root) — Upshift CLI overview, install, usage.
- **ROADMAP.md** (root) — What’s next for main CLI.
- **docs/when-it-breaks-and-guardrails.md** — When it breaks, CI/CD guardrails, HITL.
- **upshiftai/README.md** — UpshiftAI overview, CLI, platform, JARVIS.
- **upshiftai/JARVIS-AI-SETUP.md** — JARVIS API key, quotas, skill usage.
- **upshiftai/docs/JARVIS-EDGE-SUPABASE.md** — JARVIS on the edge: deploy, secrets, how to call.
- **upshiftai/site/BRAND-VOICE.md** — Customer-centric voice for all site copy.
- **upshiftai/site/blog/BLOG-MEDIA.md** — How to add GIFs, videos, code examples to blog posts (JARVIS adds media using these classes).
- **skills/upshiftai/SKILL.md** — What the UpshiftAI JARVIS skill does and when to use it.

---

## Apps & deploy

- **Site:** Static; deploy `upshiftai/site/` (e.g. Vercel, publish dir `upshiftai/site`).
- **Platform:** Next.js; deploy `upshiftai/platform/` (e.g. Vercel). Needs Stripe + Supabase env.
- **Edge:** `supabase functions deploy jarvis`; set secrets in Supabase Dashboard.

---

## JARVIS in Cursor

- **docs/JARVIS_IN_CURSOR.md** — Use JARVIS from Cursor when needed: setup (Edge URL, API key), when to use it, how to call it.
- **.cursor/rules/jarvis.mdc** — Cursor rule (always on): use JARVIS for dependency analysis, blog media, UpshiftAI skill; points to the doc.

## One-line cheat sheet

**Map** → docs/REPO_INDEX.md | **UpshiftAI** → upshiftai/README.md | **JARVIS** → upshiftai/JARVIS-AI-SETUP.md + skills/upshiftai/SKILL.md | **Edge** → upshiftai/docs/JARVIS-EDGE-SUPABASE.md | **JARVIS in Cursor** → docs/JARVIS_IN_CURSOR.md + .cursor/rules/jarvis.mdc | **Site voice** → upshiftai/site/BRAND-VOICE.md | **Blog media** → upshiftai/site/blog/BLOG-MEDIA.md.
