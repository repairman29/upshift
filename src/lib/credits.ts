import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import os from "os";

type CreditState = {
  balance: number;
  updatedAt: string;
};

const DEFAULT_CREDITS = 10;

export async function consumeCredit(action: "explain"): Promise<void> {
  const endpoint = process.env.UPSHIFT_CREDITS_ENDPOINT;
  const token = process.env.UPSHIFT_API_TOKEN;

  if (endpoint && token) {
    const ok = await consumeRemote(endpoint, token, action);
    if (ok) return;
  }

  const state = loadCredits();
  if (state.balance <= 0) {
    process.stdout.write("C\n");
    process.exit(2);
  }

  const next = {
    balance: state.balance - 1,
    updatedAt: new Date().toISOString(),
  };
  saveCredits(next);
}

export function getCreditBalance(): number {
  return loadCredits().balance;
}

export function addCredits(amount: number): void {
  const state = loadCredits();
  const next = {
    balance: state.balance + amount,
    updatedAt: new Date().toISOString(),
  };
  saveCredits(next);
}

export function resetCredits(amount: number): void {
  const next = {
    balance: amount,
    updatedAt: new Date().toISOString(),
  };
  saveCredits(next);
}

function loadCredits(): CreditState {
  const file = creditsFilePath();
  if (!existsSync(file)) {
    const override = getEnvCredits();
    const initial: CreditState = {
      balance: override ?? DEFAULT_CREDITS,
      updatedAt: new Date().toISOString(),
    };
    saveCredits(initial);
    return initial;
  }

  const raw = readFileSync(file, "utf8");
  const parsed = JSON.parse(raw) as CreditState;
  if (typeof parsed.balance !== "number") {
    return {
      balance: DEFAULT_CREDITS,
      updatedAt: new Date().toISOString(),
    };
  }
  return parsed;
}

function saveCredits(state: CreditState): void {
  const file = creditsFilePath();
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(state, null, 2));
}

function creditsFilePath(): string {
  return path.join(os.homedir(), ".upshift", "credits.json");
}

function getEnvCredits(): number | null {
  const raw = process.env.UPSHIFT_CREDITS;
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

async function consumeRemote(
  endpoint: string,
  token: string,
  action: string
): Promise<boolean> {
  try {
    const response = await fetch(`${endpoint}/credits/consume`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action }),
    });

    if (!response.ok) {
      if (response.status === 402 || response.status === 429) {
        process.stdout.write("C\n");
        process.exit(2);
      }
      return false;
    }
    const data = (await response.json()) as { balance?: number };
    if (typeof data.balance === "number" && data.balance <= 0) {
      process.stdout.write("C\n");
      process.exit(2);
    }
    return true;
  } catch {
    return false;
  }
}
