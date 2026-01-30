import express from "express";
import Stripe from "stripe";
import { Resend } from "resend";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import os from "os";

// Resend for transactional emails
const resendApiKey = process.env.RESEND_API_KEY ?? "";
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const emailFrom = process.env.EMAIL_FROM ?? "Upshift <hello@upshiftai.dev>";

type CreditEntry = {
  balance: number;
  updatedAt: string;
  tier?: "free" | "pro" | "team";
  bonusMultiplier?: number;
};

type CreditStore = Record<string, CreditEntry>;

const app = express();

// CORS: set UPSHIFT_CORS_ORIGIN to comma-separated origins or * to allow browser calls
const corsOrigin = process.env.UPSHIFT_CORS_ORIGIN?.trim();
if (corsOrigin) {
  const origins = corsOrigin === "*" ? ["*"] : corsOrigin.split(",").map((o) => o.trim()).filter(Boolean);
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origins.includes("*") || (origin && origins.includes(origin))) {
      res.setHeader("Access-Control-Allow-Origin", origins.includes("*") ? "*" : origin!);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });
}

// Request logging: method, path, status, duration (ms)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLine = `${req.method} ${req.path} ${res.statusCode} ${duration}ms`;
    process.stdout.write(logLine + "\n");
  });
  next();
});

// Rate limit: 120 requests per minute per IP (skip /health, /api, /stripe/webhook)
const rateLimitWindowMs = 60 * 1000;
const rateLimitMax = 120;
const rateLimitByIp = new Map<string, { count: number; resetAt: number }>();
app.use((req, res, next) => {
  const path = req.path;
  if (path === "/health" || path === "/api" || path === "/stripe/webhook") {
    next();
    return;
  }
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket?.remoteAddress ?? "unknown";
  const now = Date.now();
  let entry = rateLimitByIp.get(ip);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + rateLimitWindowMs };
    rateLimitByIp.set(ip, entry);
  }
  entry.count += 1;
  if (entry.count > rateLimitMax) {
    res.status(429).json({ error: "too_many_requests" });
    return;
  }
  next();
});

app.use((req, _res, next) => {
  if (req.originalUrl === "/stripe/webhook") {
    next();
    return;
  }
  express.json()(req, _res, next);
});

const port = Number(process.env.UPSHIFT_SERVER_PORT ?? 8787);
const apiKeys = new Set(
  (process.env.UPSHIFT_API_KEYS ?? "").split(",").map((s) => s.trim()).filter(Boolean)
);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-06-20",
});
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
const stripePricePro = process.env.STRIPE_PRICE_PRO ?? "";
const stripePriceTeam = process.env.STRIPE_PRICE_TEAM ?? "";
const stripePricePackSmall = process.env.STRIPE_PRICE_PACK_SMALL ?? "";
const stripePricePackMedium = process.env.STRIPE_PRICE_PACK_MEDIUM ?? "";
const stripePricePackLarge = process.env.STRIPE_PRICE_PACK_LARGE ?? "";
const publicBaseUrl = process.env.UPSHIFT_PUBLIC_BASE_URL ?? "http://localhost:8787";

app.get("/health", (_req, res) => {
  const hasStripeKey = Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  const hasWebhookSecret = Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim());
  const hasAnyPrice =
    Boolean(process.env.STRIPE_PRICE_PRO?.trim()) ||
    Boolean(process.env.STRIPE_PRICE_TEAM?.trim()) ||
    Boolean(process.env.STRIPE_PRICE_PACK_SMALL?.trim());
  const stripe =
    !hasStripeKey
      ? "missing"
      : hasWebhookSecret && hasAnyPrice
        ? "configured"
        : "partial";
  res.json({ status: "ok", stripe });
});

app.get("/api", (_req, res) => {
  res.json({
    name: "Upshift Billing API",
    auth: "Bearer token in Authorization header. Token must be in UPSHIFT_API_KEYS.",
    endpoints: [
      "GET  /health",
      "GET  /api",
      "POST /waitlist (no auth)",
      "GET  /waitlist/count (no auth)",
      "GET  /billing/status",
      "GET  /billing/success",
      "GET  /billing/cancel",
      "POST /credits/consume",
      "POST /credits/refill",
      "POST /credits/purchase",
      "POST /billing/subscription",
      "POST /billing/checkout/subscription",
      "POST /billing/checkout/credits",
      "POST /stripe/webhook (raw body)",
    ],
    docs: "See docs/endpoint.md in the repo.",
  });
});

// Waitlist: collect emails (no auth required)
type WaitlistEntry = { email: string; createdAt: string; source?: string };

function waitlistPath(): string {
  return path.join(os.homedir(), ".upshift", "waitlist.json");
}

function loadWaitlist(): WaitlistEntry[] {
  const file = waitlistPath();
  if (!existsSync(file)) return [];
  try {
    return JSON.parse(readFileSync(file, "utf8")) as WaitlistEntry[];
  } catch {
    return [];
  }
}

function saveWaitlist(entries: WaitlistEntry[]): void {
  const file = waitlistPath();
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(entries, null, 2));
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

app.post("/waitlist", async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const source = String(req.body?.source ?? "website").trim();

  if (!email || !isValidEmail(email)) {
    res.status(400).json({ error: "invalid_email" });
    return;
  }

  const entries = loadWaitlist();
  const exists = entries.some((e) => e.email === email);

  if (!exists) {
    entries.push({ email, createdAt: new Date().toISOString(), source });
    saveWaitlist(entries);

    // Send welcome email
    if (resend) {
      try {
        await resend.emails.send({
          from: emailFrom,
          to: email,
          subject: "You're on the Upshift waitlist!",
          html: getWelcomeEmailHtml(email),
          text: getWelcomeEmailText(email),
        });
      } catch (e) {
        console.error("Failed to send welcome email:", e);
      }
    }
  }

  res.json({ success: true, message: "You're on the list!" });
});

function getWelcomeEmailHtml(email: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Upshift</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0d1117; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0d1117; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="520" cellpadding="0" cellspacing="0" style="max-width: 520px;">
          <tr>
            <td style="padding-bottom: 24px;">
              <span style="font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: 500; color: #e6edf3;">upshift</span>
            </td>
          </tr>
          <tr>
            <td style="background-color: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 32px;">
              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #e6edf3;">You're in! Here's how to get started</h1>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #8b949e;">
                Thanks for signing up for Upshift. You're ready to start scanning and upgrading dependencies safely.
              </p>
              
              <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #e6edf3;">Step 1: Install the CLI</p>
              <div style="background-color: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 12px 16px; margin: 0 0 20px; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #7ee787;">
                npm install -g upshift-cli
              </div>
              
              <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #e6edf3;">Step 2: Scan your project</p>
              <div style="background-color: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 12px 16px; margin: 0 0 20px; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #7ee787;">
                cd your-project<br>
                upshift scan
              </div>
              
              <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #e6edf3;">Step 3: Understand breaking changes</p>
              <div style="background-color: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 12px 16px; margin: 0 0 20px; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #7ee787;">
                upshift explain react --risk<br>
                <span style="color: #8b949e;"># or for AI-powered deep analysis:</span><br>
                upshift explain react --ai
              </div>
              
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #8b949e;">
                <strong style="color: #e6edf3;">Scans, upgrades, and basic explanations are free.</strong><br>
                AI analysis (<code style="background: #0d1117; padding: 2px 6px; border-radius: 4px; font-size: 13px;">--ai</code>) costs 1 credit. You get 10 free credits to start.
              </p>
              
              <a href="https://upshiftai.dev/start" style="display: inline-block; padding: 12px 24px; background-color: #2ea043; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; margin-right: 8px;">Full Getting Started Guide</a>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 24px; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #8b949e;">
                <a href="https://upshiftai.dev" style="color: #8b949e; text-decoration: none;">upshiftai.dev</a> · <a href="https://github.com/repairman29/upshift" style="color: #8b949e; text-decoration: none;">GitHub</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function getWelcomeEmailText(email: string): string {
  return `You're in! Here's how to get started with Upshift.

STEP 1: Install the CLI
npm install -g upshift-cli

STEP 2: Scan your project
cd your-project
upshift scan

STEP 3: Understand breaking changes
upshift explain react --risk
# or for AI-powered deep analysis:
upshift explain react --ai

WHAT'S FREE:
- Scans, upgrades, and basic explanations are unlimited

WHAT COSTS CREDITS:
- AI analysis (--ai flag) costs 1 credit per package
- You get 10 free credits to start

Need more credits?
- upshift buy-credits --pack small  → 100 credits for $5
- upshift subscribe --tier pro      → $9/mo (100 credits included)

Full guide: https://upshiftai.dev/start
GitHub: https://github.com/repairman29/upshift

---
upshiftai.dev
`.trim();
}

app.get("/waitlist/count", (_req, res) => {
  const entries = loadWaitlist();
  res.json({ count: entries.length });
});

app.post("/billing/checkout/subscription", authMiddleware, async (req, res) => {
  const tier = req.body?.tier as "pro" | "team";
  const token = req.body?.token as string | undefined;
  if (!tier || !["pro", "team"].includes(tier)) {
    res.status(400).json({ error: "invalid_tier" });
    return;
  }
  if (!token) {
    res.status(400).json({ error: "token_required" });
    return;
  }
  const priceId = tier === "pro" ? stripePricePro : stripePriceTeam;
  if (!priceId || !stripe) {
    res.status(500).json({ error: "stripe_not_configured" });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: token,
      metadata: {
        priceId,
      },
      success_url: `${publicBaseUrl}/billing/success`,
      cancel_url: `${publicBaseUrl}/billing/cancel`,
    });
    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: "stripe_error" });
  }
});

app.post("/billing/checkout/credits", authMiddleware, async (req, res) => {
  const pack = req.body?.pack as "small" | "medium" | "large";
  const token = req.body?.token as string | undefined;
  const priceId =
    pack === "small"
      ? stripePricePackSmall
      : pack === "medium"
        ? stripePricePackMedium
        : pack === "large"
          ? stripePricePackLarge
          : "";

  if (!token) {
    res.status(400).json({ error: "token_required" });
    return;
  }
  if (!priceId) {
    res.status(400).json({ error: "invalid_pack" });
    return;
  }

  const credits = pack === "small" ? 50 : pack === "medium" ? 200 : 1000;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: token,
      metadata: {
        credits: String(credits),
      },
      success_url: `${publicBaseUrl}/billing/success`,
      cancel_url: `${publicBaseUrl}/billing/cancel`,
    });
    res.json({ url: session.url });
  } catch {
    res.status(500).json({ error: "stripe_error" });
  }
});

app.get("/billing/status", authMiddleware, (req, res) => {
  const token = (req as any).token as string;
  const store = loadStore();
  const entry = normalizeEntry(store[token]);
  store[token] = entry;
  saveStore(store);
  res.json({
    tier: entry.tier ?? "free",
    balance: entry.balance,
    bonusMultiplier: entry.bonusMultiplier ?? 1,
  });
});

app.post("/credits/consume", authMiddleware, (req, res) => {
  const token = (req as any).token as string;
  const store = loadStore();
  const entry = normalizeEntry(store[token]);
  if (entry.balance <= 0) {
    res.status(402).json({ error: "credits_exhausted" });
    return;
  }
  entry.balance -= 1;
  entry.updatedAt = new Date().toISOString();
  store[token] = entry;
  saveStore(store);
  res.json({ balance: entry.balance });
});

app.post("/credits/refill", authMiddleware, (req, res) => {
  const token = (req as any).token as string;
  const amount = Number(req.body?.amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: "invalid_amount" });
    return;
  }
  const store = loadStore();
  const entry = normalizeEntry(store[token]);
  entry.balance += amount;
  entry.updatedAt = new Date().toISOString();
  store[token] = entry;
  saveStore(store);
  res.json({ balance: entry.balance, appliedBonus: 0 });
});

app.post("/credits/purchase", authMiddleware, (req, res) => {
  const token = (req as any).token as string;
  const amount = Number(req.body?.amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: "invalid_amount" });
    return;
  }
  const store = loadStore();
  const entry = normalizeEntry(store[token]);
  const bonusMultiplier = entry.bonusMultiplier ?? 1;
  const credited = Math.floor(amount * bonusMultiplier);
  const appliedBonus = credited - amount;

  entry.balance += credited;
  entry.updatedAt = new Date().toISOString();
  store[token] = entry;
  saveStore(store);
  res.json({ balance: entry.balance, appliedBonus });
});

app.post("/billing/subscription", authMiddleware, (req, res) => {
  const token = (req as any).token as string;
  const tier = req.body?.tier as "free" | "pro" | "team";
  if (!tier || !["free", "pro", "team"].includes(tier)) {
    res.status(400).json({ error: "invalid_tier" });
    return;
  }
  const store = loadStore();
  const entry = normalizeEntry(store[token]);
  entry.tier = tier;
  entry.bonusMultiplier = tier === "free" ? 1 : 1.2;
  entry.updatedAt = new Date().toISOString();
  store[token] = entry;
  saveStore(store);
  res.json({ tier: entry.tier, bonusMultiplier: entry.bonusMultiplier });
});

app.post("/stripe/webhook", express.raw({ type: "application/json" }), (req, res) => {
  if (!stripeWebhookSecret) {
    res.status(500).send("stripe_webhook_secret_missing");
    return;
  }
  let event: Stripe.Event;
  try {
    const signature = req.headers["stripe-signature"] as string;
    event = stripe.webhooks.constructEvent(req.body, signature, stripeWebhookSecret);
  } catch {
    res.status(400).send("invalid_signature");
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const token = session.client_reference_id;
    if (token) {
      if (session.mode === "subscription") {
        const priceId = session.metadata?.priceId ?? "";
        const tier = priceId === stripePriceTeam ? "team" : "pro";
        updateTier(token, tier);
      }
      if (session.mode === "payment") {
        const credits = Number(session.metadata?.credits ?? 0);
        if (credits > 0) {
          applyCreditPurchase(token, credits);
        }
      }
    }
  }

  res.json({ received: true });
});

// Billing redirect targets (Stripe success_url / cancel_url)
app.get("/billing/success", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  const landing = process.env.UPSHIFT_PUBLIC_BASE_URL ?? "https://upshiftai.dev";
  res.status(200).send(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Payment successful</title></head><body><h1>Thank you</h1><p>Your payment was successful. Credits have been added to your account.</p><p><a href="${landing}">Back to Upshift</a></p></body></html>`
  );
});
app.get("/billing/cancel", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  const landing = process.env.UPSHIFT_PUBLIC_BASE_URL ?? "https://upshiftai.dev";
  res.status(200).send(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Payment cancelled</title></head><body><h1>Cancelled</h1><p>Your payment was cancelled. No charges were made.</p><p><a href="${landing}">Back to Upshift</a></p></body></html>`
  );
});

const server = app.listen(port, () => {
  process.stdout.write(`Upshift billing server listening on ${port}\n`);
});

function shutdown(signal: string) {
  process.stdout.write(`${signal} received, shutting down gracefully...\n`);
  server.close(() => {
    process.stdout.write("Server closed.\n");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

function authMiddleware(req: any, res: any, next: any) {
  if (apiKeys.size === 0) {
    res.status(500).json({ error: "UPSHIFT_API_KEYS not configured" });
    return;
  }
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || !apiKeys.has(token)) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  req.token = token;
  next();
}

function storePath(): string {
  return path.join(os.homedir(), ".upshift", "credits-store.json");
}

function loadStore(): CreditStore {
  const file = storePath();
  if (!existsSync(file)) {
    return {};
  }
  const raw = readFileSync(file, "utf8");
  try {
    return JSON.parse(raw) as CreditStore;
  } catch {
    return {};
  }
}

function saveStore(store: CreditStore): void {
  const file = storePath();
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(store, null, 2));
}

function normalizeEntry(entry?: CreditEntry): CreditEntry {
  if (!entry) {
    return {
      balance: 0,
      updatedAt: new Date().toISOString(),
      tier: "free",
      bonusMultiplier: 1,
    };
  }
  return {
    balance: typeof entry.balance === "number" ? entry.balance : 0,
    updatedAt: entry.updatedAt ?? new Date().toISOString(),
    tier: entry.tier ?? "free",
    bonusMultiplier: typeof entry.bonusMultiplier === "number" ? entry.bonusMultiplier : 1,
  };
}

function updateTier(token: string, tier: "pro" | "team"): void {
  const store = loadStore();
  const entry = normalizeEntry(store[token]);
  entry.tier = tier;
  entry.bonusMultiplier = 1.2;
  entry.updatedAt = new Date().toISOString();
  store[token] = entry;
  saveStore(store);
}

function applyCreditPurchase(token: string, amount: number): void {
  const store = loadStore();
  const entry = normalizeEntry(store[token]);
  const bonusMultiplier = entry.bonusMultiplier ?? 1;
  const credited = Math.floor(amount * bonusMultiplier);
  entry.balance += credited;
  entry.updatedAt = new Date().toISOString();
  store[token] = entry;
  saveStore(store);
}
