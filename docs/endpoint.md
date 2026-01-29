# Credits Endpoint (Jarvis Integration)

Upshift can validate credits against a lightweight endpoint. This is intended
for use with Jarvis or any other automation service.

## Run the server

```
UPSHIFT_API_KEYS=dev-token-1,dev-token-2 \
UPSHIFT_SERVER_PORT=8787 \
npm run build && npm run server
```

## Environment Variables (CLI)

```
UPSHIFT_CREDITS_ENDPOINT=http://localhost:8787
UPSHIFT_API_TOKEN=dev-token-1
```

## Endpoints

### GET /health

Returns `{ "status": "ok" }`

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

### POST /stripe/webhook

Raw Stripe webhook endpoint. Requires `STRIPE_WEBHOOK_SECRET`.
