'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Product {
  id: string
  name: string
  slug: string | null
  description: string
  price: number
  stock: number
  images: string[]
  rating: number
  category: {
    id: string
    name: string
    slug: string
  }
}

interface Favorite {
  id: string
  productId: string
  createdAt: string
  product: Product
}

/** Safe number formatter — never crashes on undefined / null */
function fmt(val: unknown, decimals = 2): string {
  const n = Number(val)
  return isNaN(n) ? '0.00' : n.toFixed(decimals)
}

/** Star rating display */
function Stars({ rating }: { rating: number }) {
  const r = Math.min(5, Math.max(0, Number(rating) || 0))
  return (
    <span className="flex items-center gap-0.5" aria-label={`${r} out of 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} viewBox="0 0 12 12" className={`w-3 h-3 ${i <= Math.round(r) ? 'text-amber-400' : 'text-[#e0ddd6]'}`} fill="currentColor">
          <path d="M6 .5l1.4 2.9 3.2.5-2.3 2.2.5 3.2L6 7.8l-2.8 1.5.5-3.2L1.4 3.9l3.2-.5z"/>
        </svg>
      ))}
      <span className="ml-1 text-[10px] text-[#aaa] font-mono">{r.toFixed(1)}</span>
    </span>
  )
}

export default function FavoritesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [favorites, setFavorites]   = useState<Favorite[]>([])
  const [isLoading, setIsLoading]   = useState(true)
  const [removing, setRemoving]     = useState<string | null>(null)  // productId being removed
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [toast, setToast]           = useState('')

  /* ── auth guard ── */
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
    if (status === 'authenticated' && session?.user?.role !== 'CUSTOMER') router.push('/')
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'CUSTOMER') {
      fetchFavorites()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session])

  /* ── data fetching ── */
  const fetchFavorites = async () => {
    setIsLoading(true)
    try {
      const res  = await fetch('/api/favorites')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setFavorites(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch favorites:', err)
      setFavorites([])
    } finally {
      setIsLoading(false)
    }
  }

  /* ── remove from favorites ── */
  const removeFavorite = async (productId: string) => {
    setRemoving(productId)
    try {
      const res = await fetch(`/api/favorites/${productId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove')
      setFavorites(prev => prev.filter(f => f.productId !== productId))
      showToast('Removed from saved items')
    } catch (err) {
      console.error(err)
      showToast('Could not remove item. Try again.')
    } finally {
      setRemoving(null)
    }
  }

  /* ── add to cart ── */
  const addToCart = async (productId: string, productName: string) => {
    setAddingToCart(productId)
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      })
      if (!res.ok) throw new Error('Failed to add to cart')
      showToast(`${productName} added to cart`)
    } catch (err) {
      console.error(err)
      showToast('Could not add to cart. Try again.')
    } finally {
      setAddingToCart(null)
    }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  /* ── loading ── */
  if (status === 'loading' || isLoading) {
    return (
      <main className="min-h-screen bg-[#f5f4f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#1a1a1a] border-t-transparent animate-spin" />
          <p className="text-xs font-mono tracking-[.2em] uppercase text-[#999]">Loading saved items</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f5f4f0]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        .serif { font-family: 'Instrument Serif', Georgia, serif; }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn  { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp .4s ease both; }
        .fade-1  { animation-delay:.05s }
        .fade-2  { animation-delay:.10s }
        .slide-in{ animation: slideIn .25s ease both; }
        .card:hover .card-actions { opacity:1; transform:translateY(0); }
        .card-actions { opacity:0; transform:translateY(6px); transition: all .2s ease; }
      `}</style>

      {/* ── toast ── */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 slide-in
          bg-[#1a1a1a] text-[#f5f4f0] text-sm px-5 py-2.5 rounded-full shadow-lg pointer-events-none">
          {toast}
        </div>
      )}

      {/* ── header ── */}
      <header className="sticky top-0 z-30 bg-[#f5f4f0]/90 backdrop-blur border-b border-[#e0ddd6]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-[#777] hover:text-[#1a1a1a] transition-colors">
              ← Dashboard
            </Link>
            <span className="text-[#ddd]">/</span>
            <span className="serif italic text-xl">Saved Items</span>
          </div>
          <Link href="/cart"
            className="text-sm bg-[#1a1a1a] text-[#f5f4f0] px-4 py-1.5 rounded-full hover:bg-[#333] transition-colors">
            View Cart
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* ── page title ── */}
        <div className="mb-8 fade-up">
          <p className="text-xs font-mono tracking-[.2em] uppercase text-[#aaa] mb-1">Your collection</p>
          <h1 className="serif text-5xl italic text-[#1a1a1a]">Saved Items</h1>
          {favorites.length > 0 && (
            <p className="text-sm text-[#999] mt-2">{favorites.length} {favorites.length === 1 ? 'item' : 'items'} saved</p>
          )}
        </div>

        {/* ── empty state ── */}
        {favorites.length === 0 && (
          <div className="fade-up fade-1 flex flex-col items-center justify-center py-24 text-center">
            {/* heart icon */}
            <div className="w-16 h-16 rounded-full bg-white border border-[#e8e5de] flex items-center justify-center mb-5 shadow-sm">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-[#ccc]" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <p className="serif text-2xl italic text-[#bbb] mb-2">Nothing saved yet</p>
            <p className="text-sm text-[#aaa] mb-6 max-w-xs">
              Browse our products and tap the heart icon to save items here for later.
            </p>
            <Link href="/products"
              className="bg-[#1a1a1a] text-[#f5f4f0] px-6 py-2.5 rounded-full text-sm hover:bg-[#333] transition-colors">
              Browse Products
            </Link>
          </div>
        )}

        {/* ── favorites grid ── */}
        {favorites.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 fade-up fade-2">
            {favorites.map((fav, i) => {
              const product = fav.product
              const isOutOfStock = product.stock === 0
              const isRemoving   = removing    === product.id
              const isAddingCart = addingToCart === product.id

              return (
                <div
                  key={fav.id}
                  className="card group bg-white rounded-2xl border border-[#e8e5de] overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                  style={{ animationDelay: `${i * 40}ms` }}>

                  {/* image */}
                  <div className="relative aspect-square bg-[#f0ede6] overflow-hidden">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-10 h-10 text-[#ccc]" fill="none" stroke="currentColor" strokeWidth="1">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <path d="m21 15-5-5L5 21"/>
                        </svg>
                      </div>
                    )}

                    {/* out of stock overlay */}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="text-xs font-mono tracking-widest uppercase text-[#999] bg-white/80 px-3 py-1 rounded-full border border-[#e8e5de]">
                          Out of stock
                        </span>
                      </div>
                    )}

                    {/* remove button — top right */}
                    <button
                      onClick={() => removeFavorite(product.id)}
                      disabled={isRemoving}
                      aria-label="Remove from saved"
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-sm
                        flex items-center justify-center border border-[#e8e5de]
                        hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all
                        opacity-0 group-hover:opacity-100 disabled:opacity-50">
                      {isRemoving ? (
                        <div className="w-3.5 h-3.5 rounded-full border border-current border-t-transparent animate-spin" />
                      ) : (
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                          <path d="M12 21.593c-.525-.868-4.812-7.962-4.812-7.962C4.708 10.47 4 8.747 4 7A8 8 0 0 1 20 7c0 1.747-.708 3.47-3.188 6.631 0 0-4.287 7.094-4.812 7.962z"
                            className="text-red-400"/>
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* info */}
                  <div className="p-4">
                    {/* category */}
                    <p className="text-[10px] font-mono tracking-widest uppercase text-[#bbb] mb-1.5">
                      {product.category?.name ?? ''}
                    </p>

                    {/* name */}
                    <Link href={`/products/${product.slug ?? product.id}`}
                      className="font-medium text-[#1a1a1a] leading-snug hover:underline underline-offset-2 line-clamp-2 block mb-2">
                      {product.name}
                    </Link>

                    {/* rating */}
                    <div className="mb-3">
                      <Stars rating={product.rating} />
                    </div>

                    {/* price + actions */}
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-[#1a1a1a]">${fmt(product.price)}</p>

                      {/* stock badge */}
                      {!isOutOfStock && product.stock <= 5 && (
                        <span className="text-[10px] font-mono text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          {product.stock} left
                        </span>
                      )}
                    </div>

                    {/* add to cart — revealed on hover */}
                    <div className="card-actions mt-3 pt-3 border-t border-[#f5f4f0]">
                      <button
                        onClick={() => addToCart(product.id, product.name)}
                        disabled={isOutOfStock || isAddingCart}
                        className={`w-full py-2 rounded-xl text-sm font-medium transition-all
                          ${isOutOfStock
                            ? 'bg-[#f0ede6] text-[#ccc] cursor-not-allowed'
                            : 'bg-[#1a1a1a] text-[#f5f4f0] hover:bg-[#333] active:scale-[0.98]'}
                          disabled:opacity-50`}>
                        {isAddingCart ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-3.5 h-3.5 rounded-full border border-[#f5f4f0] border-t-transparent animate-spin" />
                            Adding…
                          </span>
                        ) : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── bottom cta ── */}
        {favorites.length > 0 && (
          <div className="mt-12 pt-8 border-t border-[#e8e5de] flex items-center justify-between fade-up">
            <p className="text-sm text-[#aaa]">
              Saved {new Date(favorites[favorites.length - 1].createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
            <Link href="/products"
              className="text-sm underline underline-offset-4 text-[#555] hover:text-[#1a1a1a] transition-colors">
              Continue browsing →
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}