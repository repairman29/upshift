import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, isSupabaseServerConfigured } from '@/lib/supabaseServer'

const KROGER_SERVICE = process.env.NEXT_PUBLIC_KROGER_SERVICE_URL
const SERVICE_SECRET = process.env.KROGER_SERVICE_SECRET
const KROGER_CLIENT_ID = process.env.KROGER_CLIENT_ID || 'jarvisshopping-bbccng3h'
const KROGER_CLIENT_SECRET = process.env.KROGER_CLIENT_SECRET || ''
const DEFAULT_LOCATION_ID = process.env.KROGER_LOCATION_ID || '62000006'

type ShoppingMode = 'budget' | 'splurge'

async function getKrogerToken() {
  const auth = Buffer.from(`${KROGER_CLIENT_ID}:${KROGER_CLIENT_SECRET}`).toString('base64')
  const tokenRes = await fetch('https://api.kroger.com/v1/connect/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials&scope=product.compact',
  })
  const tokenData = await tokenRes.json()
  if (!tokenRes.ok) throw new Error('Failed to get Kroger token')
  return tokenData.access_token as string
}

// Search products: budget = best price from top results, splurge = prefer preferred_upc if set
async function searchProduct(
  term: string,
  locationId: string,
  token: string,
  options: { mode: ShoppingMode; preferredUpc?: string | null } = { mode: 'splurge' }
) {
  const limit = options.mode === 'budget' ? 10 : options.preferredUpc ? 15 : 1
  const searchRes = await fetch(
    `https://api.kroger.com/v1/products?filter.term=${encodeURIComponent(term)}&filter.limit=${limit}&filter.locationId=${locationId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    }
  )
  const searchData = await searchRes.json()
  if (!searchRes.ok || !searchData.data?.length) return null

  const products = searchData.data.map((p: any) => ({
    upc: p.upc || p.productId,
    description: p.description,
    price: p.items?.[0]?.price?.regular ?? 999999,
  }))

  if (options.mode === 'splurge' && options.preferredUpc) {
    const preferred = products.find((p: any) => String(p.upc) === String(options.preferredUpc))
    if (preferred) return preferred
  }

  if (options.mode === 'budget') {
    const byPrice = [...products].sort((a, b) => (a.price ?? 999999) - (b.price ?? 999999))
    return byPrice[0] ?? null
  }

  return products[0] ?? null
}

export async function POST(request: NextRequest) {
  if (!KROGER_SERVICE || !SERVICE_SECRET) {
    return NextResponse.json(
      { success: false, error: 'Kroger service not configured (missing NEXT_PUBLIC_KROGER_SERVICE_URL or KROGER_SERVICE_SECRET)' },
      { status: 503 }
    )
  }

  try {
    const { userId, items, shopping_mode: bodyMode } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    let mode: ShoppingMode = bodyMode === 'budget' ? 'budget' : 'splurge'
    let preferencesByTerm: Record<string, string | null> = {}

    if (isSupabaseServerConfigured() && supabaseServer && userId) {
      const { data: settings } = await supabaseServer
        .from('olive_user_settings')
        .select('shopping_mode')
        .eq('user_id', userId)
        .maybeSingle()
      if (settings?.shopping_mode === 'budget') mode = 'budget'

      const terms = items.map((item: string | { term: string }) =>
        typeof item === 'string' ? item : item.term
      )
      const { data: prefs } = await supabaseServer
        .from('olive_preferences')
        .select('term, preferred_upc')
        .eq('user_id', userId)
        .in('term', terms)
      if (Array.isArray(prefs)) {
        prefs.forEach((p: { term: string; preferred_upc: string | null }) => {
          preferencesByTerm[p.term] = p.preferred_upc ?? null
        })
      }
    }

    let token: string
    try {
      token = await getKrogerToken()
    } catch (e: unknown) {
      return NextResponse.json(
        { success: false, error: 'Kroger product search unavailable (check KROGER_CLIENT_ID / KROGER_CLIENT_SECRET)' },
        { status: 503 }
      )
    }
    const cartItems: { upc: string; quantity: number; modality: string }[] = []
    const results: { term: string; found: boolean; upc?: string; description?: string; price?: number }[] = []

    for (const item of items) {
      const term = typeof item === 'string' ? item : item.term
      const quantity = typeof item === 'object' ? item.quantity || 1 : 1
      const preferredUpc = preferencesByTerm[term] ?? null

      const product = await searchProduct(term, DEFAULT_LOCATION_ID, token, {
        mode,
        preferredUpc: mode === 'splurge' ? preferredUpc : undefined,
      })
      if (product) {
        cartItems.push({
          upc: product.upc,
          quantity,
          modality: 'PICKUP',
        })
        results.push({
          term,
          found: true,
          upc: product.upc,
          description: product.description,
          price: product.price,
        })
      } else {
        results.push({ term, found: false })
      }
    }

    if (cartItems.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No products found for your items',
        results,
      })
    }

    // Add to cart via our service
    const addRes = await fetch(`${KROGER_SERVICE}/api/cart/${userId}/add`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Secret': SERVICE_SECRET!,
      },
      body: JSON.stringify({ items: cartItems }),
    })

    const addData = await addRes.json()

    if (addData.needsAuth) {
      return NextResponse.json({
        success: false,
        needsAuth: true,
        authUrl: addData.authUrl,
        error: 'Please connect your Kroger account first',
      })
    }

    // Store memory (events + preferences) if configured — non-fatal so cart success is preserved
    if (isSupabaseServerConfigured() && supabaseServer && userId) {
      try {
        const now = new Date().toISOString()
        const events = results.map((result: any) => ({
          user_id: userId,
          event_type: 'add_to_cart',
          term: result.term,
          upc: result.found ? result.upc : null,
          description: result.description || null,
          price: result.price || null,
          store_location_id: DEFAULT_LOCATION_ID,
          created_at: now,
        }))

        if (events.length > 0) {
          await supabaseServer.from('olive_events').insert(events)
        }

        const foundItems = results.filter((result: any) => result.found)
        for (const result of foundItems) {
          const { data: existing } = await supabaseServer
            .from('olive_preferences')
            .select('times_used')
            .eq('user_id', userId)
            .eq('term', result.term)
            .maybeSingle()

          if (existing) {
            await supabaseServer
              .from('olive_preferences')
              .update({
                preferred_upc: result.upc || null,
                last_used_at: now,
                times_used: (existing.times_used || 0) + 1,
              })
              .eq('user_id', userId)
              .eq('term', result.term)
          } else {
            await supabaseServer.from('olive_preferences').insert({
              user_id: userId,
              term: result.term,
              preferred_upc: result.upc || null,
              preferred_brand: null,
              preferred_size: null,
              notes: null,
              last_used_at: now,
              times_used: 1,
            })
          }
        }
      } catch (_) {
        // Memory write failed; cart still succeeded — don't fail the request
      }
    }

    return NextResponse.json({
      success: addData.success || addRes.ok,
      results,
      cartUrl: 'https://www.kroger.com/shopping/cart',
      shopping_mode_used: mode,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Add to cart failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
