/**
 * MVP in-memory store. Replace with DB (Supabase, Vercel Postgres) for production.
 */
const reports = [];
const apiKeys = new Map(); // key -> { userId, createdAt }
const subscriptionsByUserId = new Map(); // userId -> { customerId, subscriptionId, status }
const subscriptionIdToUserId = new Map(); // subscriptionId -> userId

export function addReport({ userId, projectName, ecosystem, summary, markdown, payload }) {
  const id = `r_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  reports.push({ id, userId, projectName, ecosystem, summary, markdown, payload, createdAt: new Date().toISOString() });
  return id;
}

export function getReportsByUser(userId) {
  return reports.filter((r) => r.userId === userId).sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

export function getReport(id, userId) {
  const r = reports.find((x) => x.id === id && x.userId === userId);
  return r ?? null;
}

export function createApiKey(userId) {
  const key = `usk_${Date.now()}_${Math.random().toString(36).slice(2, 24)}`;
  apiKeys.set(key, { userId, createdAt: new Date().toISOString() });
  return key;
}

export function getUserIdByApiKey(key) {
  const v = apiKeys.get(key);
  return v?.userId ?? null;
}

export function getSubscriptions() {
  return Object.fromEntries(subscriptionsByUserId);
}

export function setSubscription(userId, { customerId, subscriptionId, status }) {
  if (!userId) return;
  subscriptionsByUserId.set(userId, { customerId, subscriptionId, status });
  if (subscriptionId) subscriptionIdToUserId.set(subscriptionId, userId);
}

export function setSubscriptionStatusBySubscriptionId(subscriptionId, status) {
  const userId = subscriptionIdToUserId.get(subscriptionId);
  if (!userId) return;
  const cur = subscriptionsByUserId.get(userId);
  if (cur) {
    cur.status = status;
    subscriptionsByUserId.set(userId, cur);
  }
  if (status === 'cancelled' || status === 'unpaid') subscriptionIdToUserId.delete(subscriptionId);
}

export function getUserIdBySubscriptionId(subscriptionId) {
  return subscriptionIdToUserId.get(subscriptionId) ?? null;
}

export function hasPro(userId) {
  const sub = subscriptionsByUserId.get(userId);
  return sub?.status === 'active';
}
