# UpshiftAI Platform — Deploy checklist

Use this when deploying the platform (e.g. to Vercel as `api.upshiftai.dev`).

## 1. Vercel project

- Create a project linked to your repo; set **Root Directory** to `upshiftai/platform` (or the path that contains `package.json` and `app/`).
- Framework: **Next.js**. Build command: `npm run build`. Output: default.

## 2. Environment variables (Vercel → Settings → Environment Variables)

Set these for **Production** (and optionally Preview):

| Variable | Required | Example / notes |
|----------|----------|------------------|
| `NEXTAUTH_URL` | Yes | `https://api.upshiftai.dev` |
| `NEXTAUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `STRIPE_SECRET_KEY` | Yes (for checkout) | `sk_live_...` or `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Yes (for webhook) | `whsec_...` from Stripe Dashboard |
| `STRIPE_PRO_PRICE_ID` | Yes (for Pro) | `price_...` from Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes (for checkout UI) | `pk_live_...` or `pk_test_...` |
| `STRIPE_TEAM_PRICE_ID` | No | `price_...` for Team tier |
| `GITHUB_ID` | No | OAuth App Client ID |
| `GITHUB_SECRET` | No | OAuth App Client Secret |
| `SUPABASE_URL` | No (recommended for prod) | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | No (with SUPABASE_URL) | Service role key from Supabase |
| `NEXT_PUBLIC_SITE_URL` | No | `https://upshiftai.dev` (for footer links) |

## 3. Supabase (recommended for production)

1. Run `scripts/schema.sql` in Supabase SQL Editor once.
2. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel as above.
3. To grant Pro to a user: in SQL Editor run  
   `insert into public.subscriptions (user_id, status) values ('YOUR_USER_ID', 'active') on conflict (user_id) do update set status = 'active';`  
   Use the same `user_id` your auth provides (e.g. GitHub id or `1` for credentials demo).

## 4. Stripe webhook (production)

1. Stripe Dashboard → Developers → Webhooks → Add endpoint.
2. URL: `https://api.upshiftai.dev/api/stripe/webhook`.
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
4. Copy the signing secret and set `STRIPE_WEBHOOK_SECRET` in Vercel.

## 5. Deploy

- Push to your main branch; Vercel will build and deploy.
- Or: `vercel --prod` from the `platform` directory if using Vercel CLI.

## 6. Post-deploy

- Open `https://api.upshiftai.dev` and sign in (credentials: any email + password `demo`, or GitHub if configured).
- Confirm dashboard loads; if Supabase is set, Pro status and AI usage persist across restarts.
