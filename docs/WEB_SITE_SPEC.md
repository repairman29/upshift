# Web site spec (the “new” site = upshiftai.dev)

**Canonical source:** `web/` in this repo. Deployed as Vercel project **web** → **https://upshiftai.dev**.

The **old** site (UpshiftAI branding, live scanner, “Ancient dependency lineage”) lives in **upshiftai/site/** and deploys to the **site** project (site-*.vercel.app). It is not what we serve on upshiftai.dev.

---

## Homepage (/)

- **Title:** “Upshift – AI-powered dependency upgrades”
- **Hero:** “Stop reading changelogs. Let AI tell you what breaks.” + “Scan for outdated dependencies. Get AI-powered migration guides. Upgrade with automatic rollback.”
- **Nav:** Demo, Radar, vs Dependabot, Pricing, Docs, Blog, GitHub
- **Logo:** “upshift” (lowercase)
- **Design:** Indistractable – soft dark background, blue accent (#3b82f6), Inter font
- **Sections:**
  - Trust bullets (AI explains, Radar, Scans npm/yarn/pnpm, Auto-rollback, Free tier)
  - Demo grid (Full Workflow + Scan, AI Explain, Safe Upgrade, Code Fix, Interactive)
  - “Not just another dependency bot” (Dependabot vs Upshift)
  - Problem / solution
  - “What you get today” (incl. Radar)
  - Pricing (Free / Pro $9 / Team $29)
  - FAQ
  - Footer

---

## Radar (/radar/)

- **Hero:** “Radar” – “See every repo’s dependency health in one place…”
- **Radar Pro block:** API URL + upload token inputs, “Load my reports” – persisted reports from CLI upload
- **Radar Free:** Paste/upload JSON, “Load report(s)”, summary cards + table
- Same header/footer and Indistractable styling as homepage

---

## Blog (/blog/)

- Same design system (Inter, soft dark, blue accent)
- Post: “When it breaks, guardrails, and HITL” (and others)
- Header/footer consistent with homepage

---

## Old site (for reference only)

**Source:** `upshiftai/site/`. **Not** what we serve at upshiftai.dev.

- Title: “UpshiftAI — Ancient dependency lineage, actually fixed”
- “AI-Powered Dependency Intelligence”
- Live scanner (paste package.json/requirements.txt)
- “UpshiftAI” logo
- Nav: How it works, Developers, Pricing, Blog

---

**When in doubt:** The **new** site = `web/` = upshiftai.dev. The **old** site = `upshiftai/site/` = site-*.vercel.app.
