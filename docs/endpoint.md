# Credits Endpoint (Jarvis Integration)

Upshift can validate credits against a lightweight endpoint. This is intended
for use with Jarvis or any other automation service.

## Run the server

Copy `.env.example` to `.env` and set values. Then:

```
npm run build && npm run server
```

Optional: `UPSHIFT_CORS_ORIGIN=https://your-app.com` or `*` to allow browser calls.

## Environment Variables (CLI)

```
UPSHIFT_CREDITS_ENDPOINT=http://localhost:8787
UPSHIFT_API_TOKEN=dev-token-1
```

## Endpoints

### GET /health

Returns `{ "status": "ok", "stripe": "configured" | "partial" | "missing" }`. `stripe` indicates: `missing` = no Stripe secret key; `partial` = key set but webhook or price IDs missing; `configured` = key, webhook secret, and at least one price ID set.

### GET /api

Returns a short JSON description of the API: endpoint list and auth note. No auth required.

### GET /billing/status

Auth: `Authorization: Bearer <token>`

Response:
```
{ "tier": "free", "balance": 10, "bonusMultiplier": 1 }
```

### POST /credits/consume

Auth: `Authorization: Bearer <token>`

Body:
```
{ "action": "explain" }
```

Response:
```
{ "balance": 9 }
```

If credits are exhausted: HTTP 402.

### POST /credits/refill

Auth: `Authorization: Bearer <token>`

Body:
```
{ "amount": 50 }
```

Response:
```
{ "balance": 59, "appliedBonus": 0 }
```

### POST /credits/purchase

Auth: `Authorization: Bearer <token>`

Body:
```
{ "amount": 50 }
```

Response:
```
{ "balance": 60, "appliedBonus": 10 }
```

If the account is Pro/Team, a 20% bonus is applied automatically.

### POST /billing/subscription

Auth: `Authorization: Bearer <token>`

Body:
```
{ "tier": "pro", "token": "user-token" }
```

Response:
```
{ "tier": "pro", "bonusMultiplier": 1.2 }
```

### POST /billing/checkout/subscription

Auth: `Authorization: Bearer <token>`

Body:
```
{ "tier": "pro", "token": "user-token" }
```

Response:
```
{ "url": "https://checkout.stripe.com/..." }
```

### POST /billing/checkout/credits

Auth: `Authorization: Bearer <token>`

Body:
```
{ "pack": "small", "token": "user-token" }
```

Response:
```
{ "url": "https://checkout.stripe.com/..." }
```

### GET /billing/success

HTML page shown after successful Stripe checkout. Link back uses `UPSHIFT_PUBLIC_BASE_URL` or upshiftai.dev.

### GET /billing/cancel

HTML page shown when user cancels Stripe checkout.

### POST /stripe/webhook

Raw Stripe webhook endpoint. Requires `STRIPE_WEBHOOK_SECRET`.

## Rate limiting

120 requests per minute per IP. `/health`, `/api`, and `/stripe/webhook` are not limited. When exceeded, the server responds with HTTP 429 and `{ "error": "too_many_requests" }`.

## Logging

Each request is logged to stdout: `METHOD path statusCode durationMs`.
