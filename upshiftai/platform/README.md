# UpshiftAI Platform

Hosted dashboard, team visibility, and billing for UpshiftAI Pro and Team.

**Spec:** [../docs/PLATFORM.md](../docs/PLATFORM.md)

## What this is

- **Auth** — NextAuth: credentials (any email + password `demo`) and optional GitHub OAuth when `GITHUB_ID` / `GITHUB_SECRET` are set.
- **Dashboard** — List reports; detail view for each report. Gated by subscription (Pro). AI Usage page shows real usage when Supabase is configured.
- **API** — `POST /api/reports` (push report from CLI with API key). `GET /api/me` (user + subscription). `POST /api/me` (create API key). AI usage: `POST /api/ai/track-usage`, `GET /api/ai/track-usage`.
- **Stripe** — Pro checkout (`/api/stripe/checkout`); webhook (`/api/stripe/webhook`) to grant/revoke Pro.
- **Supabase** — When `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, subscriptions, api_keys, reports, and ai_usage are persisted. Run `scripts/schema.sql` in Supabase SQL Editor once.

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
stripe products create --name="UpshiftAI Pro" --description="Centralized reports, higher AI quotas, priority support."
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

## Supabase setup (production persistence)

1. Create a project at [supabase.com](https://supabase.com).
2. In Supabase SQL Editor, run the contents of `scripts/schema.sql` to create tables: `subscriptions`, `api_keys`, `reports`, `ai_usage`.
3. In Supabase → Settings → API: copy **Project URL** and **service_role** key (keep secret).
4. Add to `.env` (or Vercel env):
   ```
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
5. (Optional) Manually grant Pro: `insert into public.subscriptions (user_id, status) values ('1', 'active') on conflict (user_id) do update set status = 'active';` — use the same `user_id` your auth provides (e.g. `1` for credentials demo, or the GitHub user id).

## Env

| Var | Purpose |
|-----|---------|
| NEXTAUTH_URL | Base URL (e.g. http://localhost:3001 or https://api.upshiftai.dev) |
| NEXTAUTH_SECRET | NextAuth secret (required) |
| STRIPE_SECRET_KEY | Stripe secret key (required for checkout + script) |
| STRIPE_WEBHOOK_SECRET | Stripe webhook signing secret (required for webhook) |
| STRIPE_PRO_PRICE_ID | Stripe Price id for Pro $19/mo (from script or CLI) |
| STRIPE_TEAM_PRICE_ID | Optional: Team $99/mo price id |
| GITHUB_ID / GITHUB_SECRET | Optional: GitHub OAuth (sign-in with GitHub) |
| SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY | Optional: persist subscriptions, api_keys, reports, ai_usage |
| NEXT_PUBLIC_SITE_URL | Optional: marketing site URL for footer links (e.g. https://upshiftai.dev) |

## Deploy checklist

See [DEPLOY.md](./DEPLOY.md) for Vercel env and deploy steps.

## CLI → Platform

1. User signs up and creates an API key (dashboard: "Create API key" — add this UI, or `POST /api/me` with session).
2. Set `UPSHIFTAI_API_KEY=usk_...` or in `.upshiftai.json`: `apiKey: "usk_..."`.
3. CLI: `upshiftai-deps report . --upload` — POSTs report to platform (add `--upload` flag to CLI that POSTs to `NEXT_PUBLIC_PLATFORM_URL/api/reports` or config).

When Supabase is configured, `lib/store.js` uses it for subscriptions, api_keys, reports, and ai_usage. Without Supabase, data is in-memory (resets on restart).
