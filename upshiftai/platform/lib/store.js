/**
 * Platform store: in-memory MVP with optional Supabase-backed persistence.
 * Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY for api_keys, reports, subscriptions, ai_usage.
 */
import crypto from 'crypto';
import { getSupabase, isSupabaseConfigured } from './supabase';

const reports = [];
const apiKeys = new Map(); // key -> { userId, createdAt }
const subscriptionsByUserId = new Map();
const subscriptionIdToUserId = new Map();

const TIER_LIMITS = { free: 10, pro: 1000, team: 10000 };

function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

function getPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// --- Reports ---

export async function addReport({ userId, projectName, ecosystem, summary, markdown, payload }) {
  const id = `r_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const createdAt = new Date().toISOString();
  if (!isSupabaseConfigured()) {
    reports.push({ id, userId, projectName, ecosystem, summary, markdown, payload, createdAt });
    return id;
  }
  const supabase = getSupabase();
  await supabase.from('reports').insert({
    id,
    user_id: userId,
    project_name: projectName,
    ecosystem,
    summary,
    markdown,
    payload: payload ?? null,
    created_at: createdAt,
  });
  return id;
}

export async function getReportsByUser(userId) {
  if (!isSupabaseConfigured()) {
    return reports.filter((r) => r.userId === userId).sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  }
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('reports')
    .select('id, user_id, project_name, ecosystem, summary, markdown, payload, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    projectName: row.project_name,
    ecosystem: row.ecosystem,
    summary: row.summary,
    markdown: row.markdown,
    payload: row.payload,
    createdAt: row.created_at,
  }));
}

export async function getReport(id, userId) {
  if (!isSupabaseConfigured()) {
    const r = reports.find((x) => x.id === id && x.userId === userId);
    return r ?? null;
  }
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('reports')
    .select('id, user_id, project_name, ecosystem, summary, markdown, payload, created_at')
    .eq('id', id)
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    userId: data.user_id,
    projectName: data.project_name,
    ecosystem: data.ecosystem,
    summary: data.summary,
    markdown: data.markdown,
    payload: data.payload,
    createdAt: data.created_at,
  };
}

// --- API keys ---

export async function createApiKey(userId) {
  const key = `usk_${Date.now()}_${Math.random().toString(36).slice(2, 24)}`;
  const createdAt = new Date().toISOString();
  if (!isSupabaseConfigured()) {
    apiKeys.set(key, { userId, createdAt });
    return key;
  }
  const supabase = getSupabase();
  await supabase.from('api_keys').insert({
    user_id: userId,
    key_hash: hashKey(key),
    created_at: createdAt,
  });
  return key;
}

export async function getUserIdByApiKey(key) {
  if (!isSupabaseConfigured()) {
    const v = apiKeys.get(key);
    return v?.userId ?? null;
  }
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('api_keys')
    .select('user_id')
    .eq('key_hash', hashKey(key))
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data.user_id;
}

// --- Subscriptions ---

export async function getSubscriptions() {
  if (!isSupabaseConfigured()) {
    return Object.fromEntries(subscriptionsByUserId);
  }
  const supabase = getSupabase();
  const { data, error } = await supabase.from('subscriptions').select('user_id, stripe_customer_id, stripe_subscription_id, status');
  if (error) return {};
  const out = {};
  for (const row of data || []) {
    out[row.user_id] = {
      customerId: row.stripe_customer_id || '',
      subscriptionId: row.stripe_subscription_id || '',
      status: row.status || '',
    };
  }
  return out;
}

export async function setSubscription(userId, { customerId, subscriptionId, status }) {
  if (!userId) return;
  if (!isSupabaseConfigured()) {
    subscriptionsByUserId.set(userId, { customerId: customerId || '', subscriptionId: subscriptionId || '', status });
    if (subscriptionId) subscriptionIdToUserId.set(subscriptionId, userId);
    return;
  }
  const supabase = getSupabase();
  await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId || null,
      stripe_subscription_id: subscriptionId || null,
      status: status || 'active',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
  subscriptionsByUserId.set(userId, { customerId, subscriptionId, status });
  if (subscriptionId) subscriptionIdToUserId.set(subscriptionId, userId);
}

export async function setSubscriptionStatusBySubscriptionId(subscriptionId, status) {
  if (!isSupabaseConfigured()) {
    const userId = subscriptionIdToUserId.get(subscriptionId);
    if (!userId) return;
    const cur = subscriptionsByUserId.get(userId);
    if (cur) {
      cur.status = status;
      subscriptionsByUserId.set(userId, cur);
    }
    if (status === 'cancelled' || status === 'unpaid') subscriptionIdToUserId.delete(subscriptionId);
    return;
  }
  const supabase = getSupabase();
  const { data: rows } = await supabase.from('subscriptions').select('user_id').eq('stripe_subscription_id', subscriptionId).limit(1);
  const userId = rows?.[0]?.user_id;
  if (!userId) return;
  await supabase.from('subscriptions').update({ status, updated_at: new Date().toISOString() }).eq('user_id', userId);
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

export async function hasPro(userId) {
  if (!userId) return false;
  if (!isSupabaseConfigured()) {
    const sub = subscriptionsByUserId.get(userId);
    return sub?.status === 'active';
  }
  const supabase = getSupabase();
  const { data, error } = await supabase.from('subscriptions').select('status').eq('user_id', userId).limit(1).maybeSingle();
  if (error || !data) return false;
  return data.status === 'active';
}

// --- AI usage ---

export async function getAiUsage(userId) {
  const pro = await hasPro(userId);
  const tier = pro ? 'pro' : 'free';
  const limit = TIER_LIMITS[tier];
  const period = getPeriod();
  const now = new Date();
  const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();

  if (!isSupabaseConfigured()) {
    return { count: 0, limit, remaining: limit, tier, resetAt };
  }
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('ai_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('period', period)
    .limit(1)
    .maybeSingle();
  const count = error || !data ? 0 : (data.count ?? 0);
  return {
    count,
    limit,
    remaining: Math.max(0, limit - count),
    tier,
    resetAt,
  };
}

export async function incrementAiUsage(userId) {
  if (!userId) return null;
  const period = getPeriod();
  const updatedAt = new Date().toISOString();
  if (!isSupabaseConfigured()) {
    return { count: 1, limit: TIER_LIMITS.free, remaining: TIER_LIMITS.free - 1, tier: 'free', resetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).getTime() };
  }
  const supabase = getSupabase();
  const { data: existing } = await supabase.from('ai_usage').select('count').eq('user_id', userId).eq('period', period).limit(1).maybeSingle();
  const newCount = (existing?.count ?? 0) + 1;
  await supabase.from('ai_usage').upsert(
    { user_id: userId, period, count: newCount, updated_at: updatedAt },
    { onConflict: ['user_id', 'period'] }
  );
  const pro = await hasPro(userId);
  const tier = pro ? 'pro' : 'free';
  const limit = TIER_LIMITS[tier];
  return {
    count: newCount,
    limit,
    remaining: Math.max(0, limit - newCount),
    tier,
    resetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).getTime(),
  };
}
