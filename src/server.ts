import express from "express";
import Stripe from "stripe";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import os from "os";

type CreditEntry = {
  balance: number;
  updatedAt: string;
  tier?: "free" | "pro" | "team";
  bonusMultiplier?: number;
};

type CreditStore = Record<string, CreditEntry>;

const app = express();
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
  res.json({ status: "ok" });
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

app.listen(port, () => {
  process.stdout.write(`Upshift billing server listening on ${port}\n`);
});

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
