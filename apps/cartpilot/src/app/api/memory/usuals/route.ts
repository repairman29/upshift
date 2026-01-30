import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, isSupabaseServerConfigured } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  if (!isSupabaseServerConfigured() || !supabaseServer) {
    return NextResponse.json({ usuals: [] })
  }

  const { data, error } = await supabaseServer
    .from('olive_preferences')
    .select('term, preferred_upc, times_used, last_used_at')
    .eq('user_id', userId)
    .order('last_used_at', { ascending: false })
    .limit(8)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ usuals: data || [] })
}
