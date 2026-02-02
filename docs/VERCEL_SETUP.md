# Vercel CLI & project setup (upshift repo)

**Verified:** Vercel CLI 44.6.3, logged in as **repairman29** (team: jeff-adkins-projects).

---

## 1. Local link map

This repo has **three** deploy roots, each with its own `.vercel/project.json`:

| Directory | Project ID (from .vercel) | Linked project (from deploy output) | Production URL |
|-----------|---------------------------|--------------------------------------|----------------|
| **upshiftai/site/** | `prj_JfgraZiCruTL00L1TgIr6i1FrcmZ` | **site** | https://site-ochre-iota.vercel.app |
| **web/** | `prj_FDqOIAvyzlu3GB1QVnyDWXeiHGTb` | **web** | **https://upshiftai.dev** |
| **Repo root** | `prj_pE7ZFhMCRIN5UcSW05u3HQmfKLyD` | (unknown – run `vercel --prod` from root to see) | (varies) |

- **`vercel --prod` from `upshiftai/site`** deploys to the **site** project (site-*.vercel.app).
- **upshiftai.dev** is the production domain for the **web** project, not for **site**.

**Which site is “the” site:** The **new** site (Upshift branding, “Stop reading changelogs”, Radar, pricing) lives in **web/** and is deployed as the **web** project → **upshiftai.dev**. The **old** site (UpshiftAI branding, live scanner, “Ancient dependency lineage”) lives in **upshiftai/site/** and deploys to **site** (site-*.vercel.app). See [WEB_SITE_SPEC.md](WEB_SITE_SPEC.md) for the full spec.

---

## 2. vercel.json locations

| Path | Purpose |
|------|--------|
| **Root** `vercel.json` | `outputDirectory: "web"`, redirects/rewrites for blog, headers. Used when deploying from repo root. |
| **upshiftai/site/vercel.json** | Static site from current dir (`.`), favicon + blog redirects. |
| **web/vercel.json** | Redirects, rewrites, headers (no outputDirectory; dir is the root). |

---

## 3. Project list (jeff-adkins-projects)

Upshift-related:

- **site** → https://site-ochre-iota.vercel.app (source: upshiftai/site)
- **web** → https://upshiftai.dev (source: web or root with outputDirectory web)
- **platform** → https://api.upshiftai.dev
- **upshift** → https://upshift-psi.vercel.app
- **upshift-v2-launch** → upshift-v2-launch.vercel.app
- **upshiftai-marketing** → upshiftai-marketing.vercel.app

**Which to keep:** **web** (upshiftai.dev) = canonical marketing site. **platform** (api.upshiftai.dev) = API. **upshift** = keep if separate product. **upshiftai-marketing**, **upshift-v2-launch**, **site** = safe to archive once **web** is the only marketing site.

Other projects (cartpilot, olive, smugglers, playsmuggler, echeo-landing, beast-mode, etc.) are unrelated to this repo’s “upshift website” setup.

---

## 4. upshiftai.dev = web/ (the new site)

**upshiftai.dev** is the production domain for the **web** project, which deploys from **web/**. That is the canonical “new” site (Upshift, “Stop reading changelogs”, Radar, pricing). To update the live site:

```bash
cd web && vercel --prod
```

The **site** project (from **upshiftai/site/**) is the **old** site (UpshiftAI, live scanner). Do not point upshiftai.dev at it unless you intend to switch back.

---

## 5. Cleanup (optional)

- **Repo root** `.vercel`: If you never deploy from root, you can remove it (`rm -rf .vercel`) and rely on `web/` or `upshiftai/site/` only.  
- **Duplicate projects**: **upshift-v2-launch**, **upshiftai-marketing**, and **site** can be archived or deleted in Vercel if you only need **web** for marketing.  
- **Single “website” source**: The canonical marketing site for upshiftai.dev is **web/** (see [WEB_SITE_SPEC.md](WEB_SITE_SPEC.md)). **upshiftai/site/** is the old site; keep it only if you need the legacy content elsewhere.

---

## 6. Quick commands

```bash
# Deploy the new site (web/) → upshiftai.dev
cd web && vercel --prod

# Deploy the old site (upshiftai/site) to "site" project (site-*.vercel.app)
cd upshiftai/site && vercel --prod

# Deploy from repo root (uses root vercel.json, outputDirectory: web)
vercel --prod

# Check linked project from a directory
cat web/.vercel/project.json
vercel project ls   # list all projects
```

---

## 7. Troubleshooting: upshiftai.dev shows the old site

If **https://upshiftai.dev** shows “UpshiftAI — Ancient dependency lineage” and the live scanner (old site) instead of “Stop reading changelogs” and Radar (new site), do this:

**A. Check which project has the domain**

1. Go to [Vercel Dashboard](https://vercel.com) → **web** project → **Settings** → **Domains**.
2. If **upshiftai.dev** is not listed under **web**, it’s on another project (likely **site**).

**B. Point upshiftai.dev at the new site (web/)**

1. In the project that currently has **upshiftai.dev** (e.g. **site**): **Settings** → **Domains** → remove **upshiftai.dev**.
2. In the **web** project: **Settings** → **Domains** → add **upshiftai.dev** (production).
3. Deploy the new site so **web** serves the right files:
   - **Option 1 (CLI):** `cd web && vercel --prod`
   - **Option 2 (Git):** In **web** project → **Settings** → **General** → set **Root Directory** to `web`, then push to your connected branch so Vercel builds from `web/`.

**C. If the web project uses Git**

- In **web** → **Settings** → **General**, set **Root Directory** to **web** (not empty, not `upshiftai/site`). Otherwise Git deployments will serve the wrong folder.
- After changing Root Directory, trigger a redeploy (e.g. push a commit or **Deployments** → … → Redeploy).

After this, **upshiftai.dev** should show the new site (Upshift, “Stop reading changelogs”, Radar, pricing).

---

**Last verified:** 2026-02-02 (Vercel CLI 44.6.3).
