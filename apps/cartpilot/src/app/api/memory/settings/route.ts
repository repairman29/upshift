import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, isSupabaseServerConfigured } from '@/lib/supabaseServer'

export type ShoppingMode = 'budget' | 'splurge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  if (!isSupabaseServerConfigured() || !supabaseServer) {
    return NextResponse.json({ shopping_mode: 'splurge' })
  }

  const { data, error } = await supabaseServer
    .from('olive_user_settings')
    .select('shopping_mode')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const mode = (data?.shopping_mode === 'budget' ? 'budget' : 'splurge') as ShoppingMode
  return NextResponse.json({ shopping_mode: mode })
}

export async function PATCH(request: NextRequest) {
  if (!isSupabaseServerConfigured() || !supabaseServer) {
    return NextResponse.json(
      { error: 'Supabase not configured; settings cannot be saved' },
      { status: 503 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const userId = body.userId
  const shopping_mode = body.shopping_mode === 'budget' ? 'budget' : 'splurge'

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  const { error } = await supabaseServer
    .from('olive_user_settings')
    .upsert(
      { user_id: userId, shopping_mode, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ shopping_mode })
}
