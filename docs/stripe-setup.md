# Stripe Setup (MVP)

This guide sets up Stripe products for Upshift.

## Products

Create three products in Stripe:

1. Upshift Free (optional, for tracking only)
2. Upshift Pro
3. Upshift Team

## Prices

Create monthly recurring prices:

- Pro: $19/month
- Team: $79/month

Record the price IDs and add them to `.env` and `pricing.json`.

## Required Env Vars

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_TEAM=price_...
STRIPE_PRICE_PACK_SMALL=price_...
STRIPE_PRICE_PACK_MEDIUM=price_...
STRIPE_PRICE_PACK_LARGE=price_...
UPSHIFT_PUBLIC_BASE_URL=https://your-domain.com
```

## Webhook Events (MVP)

Subscribe to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Checkout Metadata

When creating checkout sessions, include:

- `client_reference_id`: user token (UPSHIFT_API_TOKEN)
- `metadata.priceId`: Stripe price ID for subscription tier
- `metadata.credits`: credits amount for pack purchases (e.g. 50/200/1000)

## Next Step

Implement a minimal billing service:

- Create checkout session
- Store subscription status
- Expose `/billing/status` for CLI validation
- Handle Stripe webhook events

