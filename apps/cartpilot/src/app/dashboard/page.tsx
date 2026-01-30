'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface KrogerStatus {
  connected: boolean
  authUrl?: string
}

interface CartItem {
  term: string
  found: boolean
  description?: string
  price?: number
}

function DashboardContent() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [krogerStatus, setKrogerStatus] = useState<KrogerStatus | null>(null)
  const [items, setItems] = useState<string[]>([])
  const [newItem, setNewItem] = useState('')
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartResult, setCartResult] = useState<any>(null)
  const [oliveMessage, setOliveMessage] = useState("What's missing from the kitchen?")
  const [statusLoading, setStatusLoading] = useState(true)
  const [usuals, setUsuals] = useState<string[]>([])
  const [usualsLoading, setUsualsLoading] = useState(false)
  const [shoppingMode, setShoppingMode] = useState<'budget' | 'splurge'>('splurge')
  const [modeLoading, setModeLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (searchParams.get('connectKroger') === '1' && !krogerStatus?.connected) {
      setOliveMessage("Connect your Kroger account to start adding items to your cart.")
    }
  }, [searchParams, krogerStatus?.connected])

  const checkUser = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)
    checkKrogerConnection(user.id)
    fetchUsuals(user.id)
    fetchSettings(user.id)
    setLoading(false)
  }

  const checkKrogerConnection = async (userId: string) => {
    try {
      setStatusLoading(true)
      const res = await fetch(`/api/kroger/status?userId=${userId}`)
      const data = await res.json()
      setKrogerStatus(data)
      if (!data.connected) {
        setOliveMessage("Let's connect your Kroger account first — just takes a moment.")
      }
    } catch (e) {
      console.error('Failed to check Kroger status:', e)
    } finally {
      setStatusLoading(false)
    }
  }

  const fetchUsuals = async (userId: string) => {
    try {
      setUsualsLoading(true)
      const res = await fetch(`/api/memory/usuals?userId=${userId}`)
      const data = await res.json()
      if (Array.isArray(data.usuals)) {
        setUsuals(data.usuals.map((u: any) => u.term))
      }
    } catch (e) {
      console.error('Failed to fetch usuals:', e)
    } finally {
      setUsualsLoading(false)
    }
  }

  const fetchSettings = async (userId: string) => {
    try {
      const res = await fetch(`/api/memory/settings?userId=${userId}`)
      const data = await res.json()
      if (data.shopping_mode === 'budget' || data.shopping_mode === 'splurge') {
        setShoppingMode(data.shopping_mode)
      }
    } catch (e) {
      console.error('Failed to fetch settings:', e)
    }
  }

  const setMode = async (mode: 'budget' | 'splurge') => {
    if (!user) return
    setModeLoading(true)
    try {
      const res = await fetch('/api/memory/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, shopping_mode: mode }),
      })
      const data = await res.json()
      if (data.shopping_mode) setShoppingMode(data.shopping_mode)
    } catch (e) {
      console.error('Failed to update mode:', e)
    } finally {
      setModeLoading(false)
    }
  }

  const connectKroger = async () => {
    if (!user) return
    const returnUrl = typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : ''
    const res = await fetch(`/api/kroger/auth-url?userId=${encodeURIComponent(user.id)}&returnUrl=${encodeURIComponent(returnUrl)}`)
    const data = await res.json()
    if (data.url) {
      // Open in new tab so dashboard stays open; callback page has "Return to Olive" link
      window.open(data.url, '_blank', 'noopener,noreferrer')
    }
  }

  const addItem = () => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      setItems([...items, newItem.trim()])
      setNewItem('')
      setOliveMessage(`Got it — ${newItem.trim()}. What else?`)
      inputRef.current?.focus()
    }
  }

  const removeItem = (item: string) => {
    setItems(items.filter(i => i !== item))
    if (items.length === 1) {
      setOliveMessage("List is empty. What do we need?")
    }
  }

  const addToKrogerCart = async () => {
    if (!user || items.length === 0) return
    setAddingToCart(true)
    setCartResult(null)
    setOliveMessage("Finding your items and adding them to the cart...")

    try {
      const res = await fetch('/api/kroger/add-to-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, items, shopping_mode: shoppingMode }),
      })
      const data = await res.json()
      setCartResult(data)
      if (data.success) {
        setItems([])
        setOliveMessage("All done! Your cart is ready for checkout. 🫒")
        fetchUsuals(user.id)
      } else if (data.needsAuth) {
        setOliveMessage('Please connect your Kroger account to continue.')
      } else {
        setOliveMessage(data.error || "Something went wrong. Let's try again.")
      }
    } catch (e: any) {
      setCartResult({ error: e.message })
      setOliveMessage("I couldn't reach Kroger. Let's try again in a moment.")
    } finally {
      setAddingToCart(false)
    }
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfcf9] flex items-center justify-center">
        <div className="w-12 h-12 bg-[#9caf88] rounded-full flex items-center justify-center olive-pulse">
          <span className="text-white text-xl">🫒</span>
        </div>
      </div>
    )
  }

  if (!isSupabaseConfigured()) {
    return (
      <main className="min-h-screen bg-[#fdfcf9] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#eef2e6] shadow-sm text-center">
          <div className="w-14 h-14 bg-[#9caf88] rounded-full flex items-center justify-center mx-auto mb-4 olive-pulse">
            <span className="text-white text-2xl">🫒</span>
          </div>
          <h2 className="text-xl font-medium text-[#2d3a1f] mb-2">Olive isn&apos;t configured yet</h2>
          <p className="text-[#536538] text-sm mb-5">
            Add Supabase keys to finish setup, then refresh this page.
          </p>
          <div className="bg-[#f8faf5] rounded-2xl p-4 text-left text-xs text-[#536538]">
            <p className="font-medium text-[#2d3a1f] mb-2">Required env vars</p>
            <p>NEXT_PUBLIC_SUPABASE_URL</p>
            <p>NEXT_PUBLIC_SUPABASE_ANON_KEY</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-6 text-[#87a05a] hover:text-[#6b8245] text-sm"
          >
            Back to home
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#fdfcf9]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#eef2e6] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#9caf88] rounded-full flex items-center justify-center">
              <span className="text-white text-sm">🫒</span>
            </div>
            <span className="text-lg font-medium text-[#3a4529]">Olive</span>
          </Link>
          <button
            onClick={signOut}
            className="text-[#87a05a] hover:text-[#6b8245] text-sm"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Olive Pulse - The Conversation Center */}
        <div className="text-center mb-8 fade-in">
          <div className="w-16 h-16 bg-[#9caf88] rounded-full flex items-center justify-center mx-auto mb-4 olive-pulse">
            <span className="text-white text-2xl">🫒</span>
          </div>
          <p className="text-[#2d3a1f] text-lg">{oliveMessage}</p>
        </div>

        {/* Budget vs Splurge */}
        <div className="bg-white rounded-3xl p-5 border border-[#eef2e6] shadow-sm mb-6">
          <h3 className="text-[#2d3a1f] font-medium mb-3 text-sm">How should Olive pick items?</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('splurge')}
              disabled={modeLoading}
              className={`rounded-2xl p-4 text-left border-2 transition ${
                shoppingMode === 'splurge'
                  ? 'border-[#9caf88] bg-[#f8faf5]'
                  : 'border-[#eef2e6] bg-white hover:border-[#dce5cc]'
              }`}
            >
              <span className="block text-lg mb-1">🫒</span>
              <span className="font-medium text-[#2d3a1f] text-sm">Your preferences</span>
              <span className="block text-[#87a05a] text-xs mt-1">Your usual brands & picks</span>
            </button>
            <button
              onClick={() => setMode('budget')}
              disabled={modeLoading}
              className={`rounded-2xl p-4 text-left border-2 transition ${
                shoppingMode === 'budget'
                  ? 'border-[#9caf88] bg-[#f8faf5]'
                  : 'border-[#eef2e6] bg-white hover:border-[#dce5cc]'
              }`}
            >
              <span className="block text-lg mb-1">🏷️</span>
              <span className="font-medium text-[#2d3a1f] text-sm">Best deals</span>
              <span className="block text-[#87a05a] text-xs mt-1">Lowest price from search</span>
            </button>
          </div>
        </div>

        {/* Kroger Connection Card */}
        {!krogerStatus?.connected && (
          <div className="bg-white rounded-3xl p-6 border border-[#eef2e6] shadow-sm mb-6 fade-in">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#eef2e6] rounded-2xl flex items-center justify-center text-xl">
                🔗
              </div>
              <div className="flex-1">
                <h3 className="text-[#2d3a1f] font-medium">Connect Kroger</h3>
                <p className="text-[#87a05a] text-sm">One-time setup to link your account</p>
              </div>
              <button
                onClick={connectKroger}
                className="bg-[#9caf88] text-white px-5 py-2.5 rounded-xl hover:bg-[#87a05a] transition text-sm font-medium"
              >
                Connect
              </button>
            </div>
            <p className="text-[#87a05a] text-xs mt-3">
              Olive only builds your cart — you still review and place the order.
            </p>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-white rounded-3xl p-4 border border-[#eef2e6] shadow-sm mb-6">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
              placeholder="milk, eggs, bread..."
              className="flex-1 px-4 py-3 bg-[#f8faf5] border border-[#dce5cc] rounded-xl focus:ring-2 focus:ring-[#9caf88] focus:border-transparent outline-none transition text-[#2d3a1f]"
            />
            <button
              onClick={addItem}
              className="bg-[#9caf88] text-white px-5 py-3 rounded-xl hover:bg-[#87a05a] transition font-medium"
            >
              Add
            </button>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Current Haul - Main Card */}
          <div className="col-span-2 bg-white rounded-3xl p-5 border border-[#eef2e6] shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🛒</span>
              <h3 className="text-[#2d3a1f] font-medium">Current Haul</h3>
              {items.length > 0 && (
                <span className="ml-auto text-sm text-[#87a05a]">{items.length} items</span>
              )}
            </div>
            
            {items.length > 0 ? (
              <ul className="space-y-2">
                {items.map((item, i) => (
                  <li
                    key={i}
                    className="flex justify-between items-center bg-[#f8faf5] px-4 py-2.5 rounded-xl group"
                  >
                    <span className="text-[#2d3a1f]">{item}</span>
                    <button
                      onClick={() => removeItem(item)}
                      className="text-[#c4704b] opacity-0 group-hover:opacity-100 transition text-sm"
                    >
                      remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[#87a05a] text-center py-6 text-sm">
                Your list is empty — add something above
              </p>
            )}
          </div>

          {/* Result Card */}
          {cartResult && (
            <div className={`rounded-3xl p-5 border ${cartResult.success ? 'bg-[#eef2e6] border-[#dce5cc]' : 'bg-[#fff7ed] border-[#fed7aa]'}`}>
              <div className="text-2xl mb-2">{cartResult.success ? '✓' : '⚠️'}</div>
              <h3 className="text-[#2d3a1f] font-medium text-sm">
                {cartResult.success ? 'Added to Cart' : 'Needs attention'}
              </h3>
              {cartResult.success && cartResult.shopping_mode_used && (
                <p className="text-[#87a05a] text-xs mt-1">
                  {cartResult.shopping_mode_used === 'budget' ? 'Best deals' : 'Your preferences'}
                </p>
              )}
              {cartResult.success ? (
                <a
                  href={cartResult.cartUrl || 'https://www.kroger.com/shopping/cart'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#6b8245] text-sm hover:underline mt-2 inline-block"
                >
                  Open Cart →
                </a>
              ) : (
                <p className="text-[#9a3412] text-xs mt-2">
                  {cartResult.error || 'Some items could not be added.'}
                </p>
              )}
            </div>
          )}

          {/* Status Card */}
          {statusLoading ? (
            <div className="bg-white rounded-3xl p-5 border border-[#eef2e6] shadow-sm">
              <div className="h-6 w-6 bg-[#eef2e6] rounded-full mb-3"></div>
              <div className="h-3 w-24 bg-[#eef2e6] rounded mb-2"></div>
              <div className="h-2 w-16 bg-[#f1f5ec] rounded"></div>
            </div>
          ) : (
            krogerStatus?.connected && (
              <div className="bg-white rounded-3xl p-5 border border-[#eef2e6] shadow-sm">
                <div className="text-2xl mb-2">✓</div>
                <h3 className="text-[#2d3a1f] font-medium text-sm">Kroger Connected</h3>
                <p className="text-[#87a05a] text-xs">Ready to shop</p>
              </div>
            )
          )}
        </div>

        {/* Add to Cart Button */}
        {items.length > 0 && krogerStatus?.connected && (
          <button
            onClick={addToKrogerCart}
            disabled={addingToCart}
            className="w-full bg-[#9caf88] text-white py-4 rounded-2xl hover:bg-[#87a05a] transition disabled:opacity-50 font-medium text-lg shadow-sm"
          >
            {addingToCart ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Adding to Kroger...
              </span>
            ) : (
              `Add ${items.length} item${items.length > 1 ? 's' : ''} to Kroger Cart`
            )}
          </button>
        )}

        {/* Results List */}
        {cartResult?.results && (
          <div className="mt-6 bg-white rounded-3xl p-5 border border-[#eef2e6] shadow-sm">
            <h3 className="text-[#2d3a1f] font-medium mb-3 text-sm">Item results</h3>
            <div className="space-y-2 text-sm">
              {cartResult.results.map((result: any) => (
                <div
                  key={result.term}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl ${result.found ? 'bg-[#f8faf5]' : 'bg-[#fff7ed]'}`}
                >
                  <span className="text-[#2d3a1f]">{result.term}</span>
                  <span className={`text-xs ${result.found ? 'text-[#6b8245]' : 'text-[#9a3412]'}`}>
                    {result.found ? 'Added' : 'Not found'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 pt-6 border-t border-[#eef2e6]">
          <div className="flex items-center justify-center gap-2 mb-3 text-[#87a05a] text-sm">
            <span>Quick add</span>
            {usualsLoading && <span className="text-xs">• loading usuals</span>}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {[...new Set([...usuals, 'Milk', 'Eggs', 'Bread', 'Bananas', 'Butter'])].slice(0, 8).map((item) => (
              <button
                key={item}
                onClick={() => {
                  if (!items.includes(item)) {
                    setItems([...items, item])
                    setOliveMessage(`Added ${item}. Anything else?`)
                  }
                }}
                className="px-4 py-2 bg-white border border-[#dce5cc] rounded-full text-[#536538] text-sm hover:bg-[#f8faf5] transition"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fdfcf9] flex items-center justify-center">
        <div className="w-12 h-12 bg-[#9caf88] rounded-full flex items-center justify-center olive-pulse">
          <span className="text-white text-xl">🫒</span>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
