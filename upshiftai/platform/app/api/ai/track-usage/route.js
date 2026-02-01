/**
 * AI Usage Tracking API
 * POST /api/ai/track-usage
 * Tracks and gates AI feature usage for JARVIS skill and future ML features
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';

// In production, use database. For demo, use in-memory store.
const usageStore = new Map(); // apiKey -> { count, resetAt, tier }

const TIER_LIMITS = {
  free: 10,      // 10 AI queries/month  
  pro: 1000,     // 1,000 AI queries/month ($19/mo)
  team: 10000,   // 10,000 AI queries/month ($99/mo)
};

function getTier(apiKey) {
  // In production, look up user's subscription tier from database
  // For demo, pro keys start with 'uai_pro_', team with 'uai_team_', free with 'uai_free_'
  if (apiKey.startsWith('uai_pro_')) return 'pro';
  if (apiKey.startsWith('uai_team_')) return 'team';
  return 'free';
}

function getResetDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1); // First day of next month
}

function initializeUsage(apiKey) {
  const tier = getTier(apiKey);
  return {
    count: 0,
    resetAt: getResetDate().getTime(),
    tier,
    limit: TIER_LIMITS[tier]
  };
}

export async function POST(request) {
  try {
    const { feature, apiKey } = await request.json();
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required for AI features' },
        { status: 401 }
      );
    }

    if (!apiKey.startsWith('uai_')) {
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 401 }
      );
    }

    // Get or initialize usage for this API key
    let usage = usageStore.get(apiKey);
    if (!usage) {
      usage = initializeUsage(apiKey);
      usageStore.set(apiKey, usage);
    }

    // Check if usage period has reset
    const now = Date.now();
    if (now > usage.resetAt) {
      usage.count = 0;
      usage.resetAt = getResetDate().getTime();
    }

    // Check quota
    if (usage.count >= usage.limit) {
      const resetDate = new Date(usage.resetAt).toLocaleDateString();
      return NextResponse.json(
        { 
          error: 'AI quota exceeded',
          message: `${usage.count}/${usage.limit} queries used. Resets ${resetDate}.`,
          tier: usage.tier,
          limit: usage.limit,
          resetAt: usage.resetAt
        },
        { status: 429 }
      );
    }

    // Increment usage
    usage.count++;
    const remaining = usage.limit - usage.count;

    // Log usage (in production, save to database)
    console.log(`AI usage: ${apiKey.slice(0, 12)}... used ${feature}, ${remaining} remaining`);

    return NextResponse.json({ 
      success: true,
      feature,
      remaining,
      tier: usage.tier,
      limit: usage.limit,
      resetAt: usage.resetAt
    });

  } catch (error) {
    console.error('AI usage tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In production, get user's API key from database
    const demoApiKey = `uai_pro_${session.user.email.replace('@', '_').replace('.', '_')}`;
    
    let usage = usageStore.get(demoApiKey);
    if (!usage) {
      usage = initializeUsage(demoApiKey);
      usageStore.set(demoApiKey, usage);
    }

    // Check if usage period has reset
    const now = Date.now();
    if (now > usage.resetAt) {
      usage.count = 0;
      usage.resetAt = getResetDate().getTime();
    }

    return NextResponse.json({
      apiKey: demoApiKey,
      usage: usage.count,
      limit: usage.limit,
      remaining: usage.limit - usage.count,
      tier: usage.tier,
      resetAt: usage.resetAt
    });

  } catch (error) {
    console.error('Usage fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}