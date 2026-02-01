/**
 * AI Usage Tracking API
 * POST /api/ai/track-usage
 * Tracks and gates AI feature usage for JARVIS skill and future ML features
 */

import { NextResponse } from 'next/server';
import { getUserIdByApiKey, trackAIUsage, getMonthlyAIUsage, hasPro } from '@/lib/store';

const TIER_LIMITS = {
  free: 10,
  pro: 1000,
  team: 10000,
};

export async function POST(request) {
  try {
    const { feature, apiKey } = await request.json();
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    const userId = await getUserIdByApiKey(apiKey);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // Determine Tier
    const isPro = await hasPro(userId);
    // TODO: Add Team tier check logic here when team plan is live
    const tier = isPro ? 'pro' : 'free';
    const limit = TIER_LIMITS[tier];

    // Check Usage
    const currentUsage = await getMonthlyAIUsage(userId);
    
    if (currentUsage >= limit) {
      return NextResponse.json(
        { 
          error: 'AI quota exceeded',
          message: `${currentUsage}/${limit} queries used. Upgrade for more.`,
          tier,
          limit
        },
        { status: 429 }
      );
    }

    // Track Usage
    await trackAIUsage(userId, feature);

    return NextResponse.json({ 
      success: true,
      remaining: limit - (currentUsage + 1),
      tier,
      limit
    });

  } catch (error) {
    console.error('AI usage tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
