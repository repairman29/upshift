# Upshift Pricing

This document defines the pricing tiers and what is gated behind billing.

## Tiers

| Tier | Price | Limits | Features |
|------|-------|--------|----------|
| Free | $0 | 1 repo, manual upgrades | Scan, Explain |
| Pro | $19/mo | Unlimited repos | Auto-upgrades, AI migration, rollback |
| Team | $79/mo | Org-wide | Team policies, audit logs, priority support |

## Gating Rules

- Free: `upshift scan`, `upshift explain` (credits apply)
- Pro: `upshift upgrade`, AI migration, test + rollback automation
- Team: org-level settings, shared dashboards, centralized billing

## Credits

`upshift explain` consumes 1 credit per run. Free tier starts with 10 credits.
When credits are exhausted, the CLI outputs `C` and exits with code 2.

### Credit Packs

- 50 credits ($5)
- 200 credits ($15)
- 1,000 credits ($50)

### Subscriber Bonus

Active Pro/Team subscribers receive **20% extra credits** on pack purchases.

### Rollover

Unused credits **roll over** indefinitely.

## Env Overrides

- `UPSHIFT_CREDITS`: Seed the local credit bank (default 10)
- `UPSHIFT_CREDITS_ENDPOINT`: Remote credit validation endpoint
- `UPSHIFT_API_TOKEN`: Auth token for remote endpoint

## Billing Data Model (minimal)

- `customer_id`: Stripe customer ID
- `subscription_id`: Stripe subscription ID
- `tier`: free/pro/team
- `status`: active/past_due/canceled
- `expires_at`: optional for grace period

## CLI Enforcement (MVP)

The CLI can enforce billing in two ways:

1. License key stored locally (`~/.upshift/config.json`)
2. API token validated against a hosted billing endpoint

This MVP assumes license-key based gating while backend is built.

