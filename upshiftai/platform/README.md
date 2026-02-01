# UpshiftAI Platform

Hosted dashboard, approval queue, and billing. We charge because we can.

**Spec:** [../docs/PLATFORM.md](../docs/PLATFORM.md)

## What this is

- **Auth** — NextAuth (credentials MVP: any email + password `demo`). Add GitHub OAuth via env.
- **Dashboard** — List reports; detail view for each report. Gated by subscription (Pro).
- **API** — `POST /api/reports` (push report from CLI with API key). `GET /api/reports` (list). `GET /api/me` (user + subscription). `POST /api/me` (create API key).
- **Stripe** — Pro checkout (`/api/stripe/checkout`); webhook (`/api/stripe/webhook`) to grant/revoke Pro. Set `STRIPE_PRO_PRICE_ID` to your Pro price id.

## Run locally

```bash
cd upshiftai/platform
cp .env.example .env
# Set NEXTAUTH_SECRET (e.g. openssl rand -base64 32). Optionally Stripe keys.
npm install
npm run dev
```

Open http://localhost:3001. Sign in with any email + password `demo`. Dashboard shows reports; "Upgrade to Pro" goes to Stripe Checkout when configured.

## Stripe setup (do this once)

Create products and prices, then wire the webhook.

### 1. Create Pro and Team products/prices (API)

```bash
cd upshiftai/platform
STRIPE_SECRET_KEY=sk_test_... npm run stripe:create
```

This creates **UpshiftAI Pro** ($19/mo) and **UpshiftAI Team** ($99/mo) and prints the price IDs. Add them to `.env`:

```
STRIPE_PRO_PRICE_ID=price_...
STRIPE_TEAM_PRICE_ID=price_...
```

### 2. Or create with Stripe CLI

```bash
# Pro
stripe products create --name="UpshiftAI Pro" --description="Hosted dashboard, approval queue, priority support."
stripe prices create --product=prod_XXX --unit-amount=1900 --currency=usd -d "recurring[interval]=month"

# Team
stripe products create --name="UpshiftAI Team" --description="Everything in Pro + SSO, org policies, SLA."
stripe prices create --product=prod_YYY --unit-amount=9900 --currency=usd -d "recurring[interval]=month"
```

Replace `prod_XXX` / `prod_YYY` with the product IDs from the first command. Add the printed price IDs to `.env` as above.

### 3. Webhook secret (local dev)

```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

Stripe prints a webhook signing secret (`whsec_...`). Add to `.env`:

```
STRIPE_WEBHOOK_SECRET=whsec_...
```

For production, create a webhook in Stripe Dashboard → Developers → Webhooks → Add endpoint: `https://your-app.com/api/stripe/webhook`, events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Use that endpoint’s signing secret in production `.env`.

## Env

| Var | Purpose |
|-----|---------|
| NEXTAUTH_URL | Base URL (e.g. http://localhost:3001) |
| NEXTAUTH_SECRET | NextAuth secret (required) |
| STRIPE_SECRET_KEY | Stripe secret key (required for checkout + script) |
| STRIPE_WEBHOOK_SECRET | Stripe webhook signing secret (required for webhook) |
| STRIPE_PRO_PRICE_ID | Stripe Price id for Pro $19/mo (from script or CLI) |
| STRIPE_TEAM_PRICE_ID | Optional: Team $99/mo price id |
| GITHUB_ID / GITHUB_SECRET | Optional GitHub OAuth |

## CLI → Platform

1. User signs up and creates an API key (dashboard: "Create API key" — add this UI, or `POST /api/me` with session).
2. Set `UPSHIFTAI_API_KEY=usk_...` or in `.upshiftai.json`: `apiKey: "usk_..."`.
3. CLI: `upshiftai-deps report . --upload` — POSTs report to platform (add `--upload` flag to CLI that POSTs to `NEXT_PUBLIC_PLATFORM_URL/api/reports` or config).

MVP store is in-memory; replace `lib/store.js` with DB (Supabase, Vercel Postgres) for production.
