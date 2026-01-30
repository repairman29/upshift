'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/**
 * Handles OAuth callback when tokens are in the URL hash (implicit flow).
 * The server never sees the hash, so we run in the browser and set the session here.
 */
function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const next = searchParams.get('next') || '/dashboard'

    if (typeof window === 'undefined') return

    // PKCE flow: code in query. Send user to API route to exchange and set cookie, then redirect.
    const code = searchParams.get('code')
    if (code) {
      window.location.href = `/api/auth/exchange-code?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`
      return
    }

    // Implicit flow: tokens in hash. Set session here and redirect.
    const hash = window.location.hash?.slice(1)
    if (!hash) {
      router.replace('/login?error=auth_callback')
      return
    }

    const params = new URLSearchParams(hash)
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')

    if (!access_token || !refresh_token) {
      router.replace('/login?error=auth_callback')
      return
    }

    if (!supabase) {
      setError('Olive is not configured.')
      return
    }

    supabase.auth
      .setSession({ access_token, refresh_token })
      .then(() => {
        window.location.replace(next)
      })
      .catch((err: unknown) => {
        console.error('Auth callback setSession failed:', err)
        router.replace('/login?error=auth_callback')
      })
  }, [router, searchParams])

  if (error) {
    return (
      <main className="min-h-screen bg-[#fdfcf9] flex items-center justify-center px-6">
        <p className="text-[#9a3412]">{error}</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#fdfcf9] flex items-center justify-center px-6">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-[#9caf88] rounded-full olive-pulse flex items-center justify-center">
          <span className="text-white text-xl">🫒</span>
        </div>
        <p className="text-[#536538] text-sm">Signing you in...</p>
      </div>
    </main>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#fdfcf9] flex items-center justify-center">
          <div className="w-12 h-12 bg-[#9caf88] rounded-full olive-pulse flex items-center justify-center">
            <span className="text-white text-xl">🫒</span>
          </div>
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}
