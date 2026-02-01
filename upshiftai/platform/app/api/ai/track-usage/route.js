/**
 * AI Usage Tracking API
 * POST: increment usage (by API key), enforce quota.
 * GET: return current usage for session user (for dashboard).
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { getUserIdByApiKey, getAiUsage, incrementAiUsage } from '@/lib/store.js';
import { isSupabaseConfigured } from '@/lib/supabase.js';

// In-memory fallback when Supabase not configured (keyed by apiKey for POST, by userId for GET)
const usageStore = new Map(); // apiKey -> { count, resetAt, tier }
const TIER_LIMITS = { free: 10, pro: 1000, team: 10000 };

function getTierFromKey(apiKey) {
  if (apiKey.startsWith('uai_pro_')) return 'pro';
  if (apiKey.startsWith('uai_team_')) return 'team';
  return 'free';
}

function getResetDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
}

function getInMemoryUsage(apiKey) {
  let usage = usageStore.get(apiKey);
  if (!usage) {
    const tier = getTierFromKey(apiKey);
    usage = { count: 0, resetAt: getResetDate(), tier, limit: TIER_LIMITS[tier] };
    usageStore.set(apiKey, usage);
  }
  if (Date.now() > usage.resetAt) {
    usage.count = 0;
    usage.resetAt = getResetDate();
  }
  return usage;
}

export async function POST(request) {
  try {
    const { feature, apiKey } = await request.json();

    if (!apiKey || !apiKey.startsWith('uai_')) {
      return NextResponse.json(
        { error: apiKey ? 'Invalid API key format' : 'API key required for AI features' },
        { status: 401 }
      );
    }

    if (isSupabaseConfigured()) {
      const userId = await getUserIdByApiKey(apiKey);
      if (!userId) {
        return NextResponse.json(
          { error: 'Invalid or unknown API key' },
          { status: 401 }
        );
      }
      const usage = await getAiUsage(userId);
      if (usage.remaining <= 0) {
        const resetDate = new Date(usage.resetAt).toLocaleDateString();
        return NextResponse.json(
          {
            error: 'AI quota exceeded',
            message: `${usage.count}/${usage.limit} queries used. Resets ${resetDate}.`,
            tier: usage.tier,
            limit: usage.limit,
            resetAt: usage.resetAt,
          },
          { status: 429 }
        );
      }
      const next = await incrementAiUsage(userId);
      return NextResponse.json({
        success: true,
        feature,
        remaining: next.remaining,
        tier: next.tier,
        limit: next.limit,
        resetAt: next.resetAt,
      });
    }

    // In-memory path
    const usage = getInMemoryUsage(apiKey);
    if (usage.count >= usage.limit) {
      const resetDate = new Date(usage.resetAt).toLocaleDateString();
      return NextResponse.json(
        {
          error: 'AI quota exceeded',
          message: `${usage.count}/${usage.limit} queries used. Resets ${resetDate}.`,
          tier: usage.tier,
          limit: usage.limit,
          resetAt: usage.resetAt,
        },
        { status: 429 }
      );
    }
    usage.count++;
    const remaining = usage.limit - usage.count;
    return NextResponse.json({
      success: true,
      feature,
      remaining,
      tier: usage.tier,
      limit: usage.limit,
      resetAt: usage.resetAt,
    });
  } catch (error) {
    console.error('AI usage tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isSupabaseConfigured()) {
      const usage = await getAiUsage(session.user.id);
      // Dashboard doesn't need to expose raw apiKey; we use session
      const demoApiKey = `uai_pro_${(session.user.email || session.user.id).toString().replace('@', '_').replace(/\./g, '_')}`;
      return NextResponse.json({
        apiKey: demoApiKey,
        usage: usage.count,
        limit: usage.limit,
        remaining: usage.remaining,
        tier: usage.tier,
        resetAt: usage.resetAt,
      });
    }

    // In-memory: key by demo key from email
    const demoApiKey = `uai_pro_${(session.user.email || '').replace('@', '_').replace(/\./g, '_')}`;
    const usage = getInMemoryUsage(demoApiKey);
    return NextResponse.json({
      apiKey: demoApiKey,
      usage: usage.count,
      limit: usage.limit,
      remaining: usage.limit - usage.count,
      tier: usage.tier,
      resetAt: usage.resetAt,
    });
  } catch (error) {
    console.error('Usage fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
