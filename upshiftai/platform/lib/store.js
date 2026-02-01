import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role for admin tasks

// Fallback for build time or missing env
const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

/**
 * DATABASE STORE (Supabase)
 */

export async function addReport({ userId, projectName, ecosystem, summary, markdown, payload }) {
  if (!supabase) return null;
  
  const { data, error } = await supabase
    .from('reports')
    .insert([{
      user_id: userId,
      project_name: projectName,
      ecosystem,
      summary,
      markdown,
      payload
    }])
    .select('id')
    .single();

  if (error) {
    console.error('Error adding report:', error);
    return null;
  }
  return data?.id;
}

export async function getReportsByUser(userId) {
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
  return data || [];
}

export async function createApiKey(userId) {
  if (!supabase) return null;

  const key = `usk_${Date.now()}_${Math.random().toString(36).slice(2, 24)}`;
  
  const { error } = await supabase
    .from('api_keys')
    .insert([{
      api_key_value: key,
      user_id: userId
    }]);

  if (error) {
    console.error('Error creating API key:', error);
    return null;
  }
  return key;
}

export async function getApiKeyByUser(userId) {
  if (!supabase) return null;

  const { data } = await supabase
    .from('api_keys')
    .select('api_key_value')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data?.api_key_value;
}

export async function getUserIdByApiKey(key) {
  if (!supabase) return null;

  const { data } = await supabase
    .from('api_keys')
    .select('user_id')
    .eq('api_key_value', key)
    .single();

  return data?.user_id ?? null;
}

// Subscription Management

export async function setSubscription(userId, { customerId, subscriptionId, status, planTier }) {
  if (!supabase || !userId) return;

  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      customer_id: customerId,
      subscription_id: subscriptionId,
      status,
      plan_tier: planTier || 'pro', // Default to pro if active
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  if (error) console.error('Error setting subscription:', error);
}

export async function setSubscriptionStatusBySubscriptionId(subscriptionId, status) {
  if (!supabase) return;

  // First find the user
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('subscription_id', subscriptionId)
    .single();

  if (!sub) return;

  const { error } = await supabase
    .from('subscriptions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('subscription_id', subscriptionId);

  if (error) console.error('Error updating subscription status:', error);
}

export async function hasPro(userId) {
  if (!supabase) return false;

  const { data } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .single();

  return data?.status === 'active' || data?.status === 'trialing';
}

// AI Usage Tracking

export async function trackAIUsage(userId, feature) {
  if (!supabase) return;

  await supabase.from('ai_usage').insert({
    user_id: userId,
    feature,
    created_at: new Date().toISOString()
  });
}

export async function getMonthlyAIUsage(userId) {
  if (!supabase) return 0;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('ai_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  if (error) {
    console.error('Error counting usage:', error);
    return 0;
  }
  return count || 0;
}
