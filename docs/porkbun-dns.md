# Porkbun DNS for upshiftai.dev

One-time setup: point the domain at your host using the Porkbun API.

## 1. Run the script (keys from env only)

```bash
cd /path/to/upshift
PORKBUN_API_KEY=pk1_xxx PORKBUN_SECRET_KEY=sk1_xxx node scripts/setup-dns-porkbun.js
```

This creates:

- **Apex** `upshiftai.dev` → A record to `76.76.21.21` (Vercel)
- **www** `www.upshiftai.dev` → CNAME to `cname.vercel-dns.com`

If the apex already has an ALIAS record (common on new Porkbun domains), the script removes it first so the A record can be added.

## 2. Use a different host

Set targets before running:

```bash
# Netlify
DNS_TARGET_CNAME=apex-loadbalancer.netlify.com DNS_TARGET_A=75.2.60.5 \
  PORKBUN_API_KEY=... PORKBUN_SECRET_KEY=... node scripts/setup-dns-porkbun.js
```

## 3. Add domain in your host

- **Vercel:** Project → Settings → Domains → Add `upshiftai.dev` and `www.upshiftai.dev`
- **Netlify:** Site → Domain management → Add custom domain

## Security

- Do not commit API keys. Use env vars or a local `.env` that is gitignored.
- If keys were ever pasted in chat, rotate them in [Porkbun API](https://porkbun.com/account/api).
