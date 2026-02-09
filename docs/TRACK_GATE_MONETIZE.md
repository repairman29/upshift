# Track, gate, and monetize — Upshift platform

How we **track** usage, **gate** features by tier, and **monetize** the product. Use this to align implementation with [STRATEGY_AND_FEEDBACK.md](STRATEGY_AND_FEEDBACK.md) and move forward as in [BACKLOG.md](../BACKLOG.md).

---

## 1. Track (how we know who’s using what)

| What we track | Where it lives | How to see it |
|---------------|----------------|----------------|
| **CLI AI usage** (explain --ai, fix) | Local: `~/.upshift/credits.json` (balance). Optional: platform `UPSHIFT_CREDITS_ENDPOINT` + `UPSHIFT_API_TOKEN` → server deducts and can log. | Local file; or platform DB if endpoint is used. |
| **Audit events** (upgrade, fix, scan_upload) | Supabase `audit_logs` when `UPSHIFT_AUDIT_URL` is set. Fields: org_id, event_type, resource_type, metadata, ip, user_agent, created_at. | Query `audit_logs` in Supabase (or build a dashboard). |
| **GitHub App installs** | Supabase `github_app_installations`. One row per installation (org/repo). | Query table; count installs; later link to billing. |
| **Radar usage** | Supabase `radar_reports` (uploaded reports), `radar_alert_settings`. | Count reports per token/org; alert webhook calls. |
| **Subscriptions / payments** | Stripe (Customers, Subscriptions, Payments). Platform (Next.js) can store subscription tier and map to Stripe. | Stripe Dashboard; platform DB if running. |

**Summary:** Today, **audit_logs** and **github_app_installations** are the main cross-user signals. Credits are local unless you point CLI at a platform endpoint. To “see who’s using the platform,” use Supabase tables + Stripe.

---

## 2. Gate (who gets what)

| Tier | Scan / upgrade | Explain --ai / fix (AI) | GitHub App | Radar Pro | Audit URL |
|------|----------------|--------------------------|-------------|-----------|-----------|
| **Free** | Unlimited | 10 free credits (local); then buy packs or subscribe | Yes (scan on PR) | No (paste only) | No (can set own URL) |
| **Pro** | Unlimited | 100 credits/mo + packs; platform can enforce | Same | Yes (persisted, history, alerts) | Optional |
| **Team** | Unlimited | 500 credits/mo + packs; org pool later | Same | Yes org-wide | Yes (compliance); we provide endpoint |

**Where gating happens today:**

- **Credits:** CLI `consumeCredit()` — uses local `~/.upshift/credits.json` or, if `UPSHIFT_CREDITS_ENDPOINT` + `UPSHIFT_API_TOKEN` are set, calls platform to deduct. Platform can reject (402) when balance is zero or subscription lapsed.
- **Radar Pro:** Upload and report list require a valid token (e.g. from platform); Edge Functions `radar-upload`, `radar-reports`, `radar-report` validate token. No token = free tier only (paste in browser).
- **GitHub App:** Not gated by subscription today. Anyone can install; workflow runs scan and comments. **Next:** link installation to Pro/Team (e.g. require subscription for private repos or for more than N repos).
- **Audit endpoint:** Open by design (no JWT). Anyone with the URL can POST. Gating is “we only give the URL to Team customers” or we add optional `UPSHIFT_API_TOKEN` validation and map token → org.

**To tighten gating:** (1) Platform validates subscription before refilling credits or allowing consume. (2) GitHub App webhook or a periodic job checks `github_app_installations` against paid orgs and limits or prompts upgrade. (3) Audit endpoint optionally validates Bearer token and rejects unknown orgs.

---

## 3. Monetize (how we make money)

**Current model (from [web](https://upshiftai.dev/#pricing) and strategy):**

- **Free:** 10 credits, unlimited scan/upgrade, GitHub App scan. Converts to paid when they hit the ceiling or want Radar Pro / audit.
- **Pro — $9/mo:** 100 credits/mo, Radar Pro, +20% on credit packs, priority support.
- **Team — $29/mo:** 500 credits/mo, Radar Pro org-wide, audit logs (we give `UPSHIFT_AUDIT_URL`), SSO later.

**Revenue levers:**

1. **Credit packs** — One-off: 100/$5, 300/$15, 1000/$40. CLI `upshift buy-credits`; platform Stripe checkout when platform is running.
2. **Subscriptions** — Pro/Team via `upshift subscribe --tier pro|team`; platform creates Stripe subscription and ties to user/org.
3. **GitHub App as entry** — Install is free; we monetize when teams want more (private repos, higher limits, or “required” for Team). Link install to subscription (see “Next” below).
4. **Audit / compliance** — Team tier includes audit; we provide the endpoint. Positions us for fintech/healthtech (“compliance automation”).

**Strategy (from STRATEGY_AND_FEEDBACK):** Monetize the **fix** (and explain --ai), not the scan. Keep scan free; charge for the solution. Consider **seats over credits** for Team to reduce “usage anxiety” (BACKLOG P2 #8).

---

## 4. Move forward (as outlined)

**Already done:** GitHub App (one-click install, scan on PR), audit endpoint (live), Radar PDF export, confidence score, fix --dry-run diff, silent auto-merge. Track: `audit_logs`, `github_app_installations`. Gate: credits (local or platform), Radar Pro token. Monetize: credits + subscribe when platform is used.

**Next (BACKLOG order):**

| Priority | Item | Track / gate / monetize angle |
|----------|------|-------------------------------|
| **P2 #8** | Seats vs credits (Pro/Team) | Gate: unlimited usage per seat instead of credit cap. Track: same; monetize: per-seat subscription. |
| **P2 #9** | VS Code “Fix with Upshift” in package.json | Track: usage from VS Code; gate: same credits. Monetize: more fix usage → more conversions. |
| **P2 #10** | “Why it broke” content series | GTM; supports positioning and SEO. |
| **P3 #11** | Org-level credit pools | Track: `credit_transactions`, `orgs`. Gate: deduct from org pool when `UPSHIFT_ORG` set. Monetize: Team billing per org. |
| **Checklist** | Link GitHub App install to Pro/Team | Gate: require subscription for private repos or >N repos; or show “Upgrade to Team” in app. Track: `github_app_installations` + Stripe. |

**Concrete next steps:**

1. **Link GitHub App to subscription** — In webhook or a cron job: resolve installation → account/org; check Stripe (or platform) for active Pro/Team; if not paid, limit (e.g. public repos only) or prompt upgrade. See [GITHUB_APP_SHIP_CHECKLIST.md](GITHUB_APP_SHIP_CHECKLIST.md) “Next (after ship).”
2. **Org credit pools** — Platform (Next.js + Stripe) implements billing for `orgs`; CLI sends `UPSHIFT_ORG`; platform deducts from org balance on consume. Migrations exist (`20250203130000_org_credit_pools.sql`); see [team-features.md](team-features.md).
3. **Seats vs credits (explore)** — Decide whether Team (or Pro) moves to per-seat unlimited AI usage; update pricing copy and platform logic.

**References:** [BACKLOG.md](../BACKLOG.md) · [STRATEGY_AND_FEEDBACK.md](STRATEGY_AND_FEEDBACK.md) · [team-features.md](team-features.md) · [GITHUB_APP_SHIP_CHECKLIST.md](GITHUB_APP_SHIP_CHECKLIST.md)
