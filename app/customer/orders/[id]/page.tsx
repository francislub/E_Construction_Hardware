'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    price: number
    images: string[]
  }
}

interface Delivery {
  id: string
  status: string
  estimatedDate: string | null
  actualDate: string | null
  location: string | null
  notes: string | null
}

interface Payment {
  id: string
  amount: number
  method: string
  status: string
  transactionId: string | null
  createdAt: string
}

interface Order {
  id: string
  orderNumber: string
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  status: string
  paymentStatus: string
  shippingAddress: string
  billingAddress: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  payment: Payment | null
  delivery: Delivery | null
}

const ORDER_STATUS_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']

const DELIVERY_STATUS_STYLES: Record<string, string> = {
  PENDING:    'bg-amber-50   text-amber-700  border-amber-200',
  ASSIGNED:   'bg-blue-50    text-blue-700   border-blue-200',
  PICKED_UP:  'bg-violet-50  text-violet-700 border-violet-200',
  IN_TRANSIT: 'bg-sky-50     text-sky-700    border-sky-200',
  DELIVERED:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  FAILED:     'bg-red-50     text-red-700    border-red-200',
}

/** Safe toFixed — handles undefined / null / string values from API */
function fmt(val: unknown, decimals = 2): string {
  const n = Number(val)
  return isNaN(n) ? '0.00' : n.toFixed(decimals)
}

/** Normalise raw API payload — coerces every field to the correct type */
function normaliseOrder(raw: unknown): Order | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  // Error payload from API e.g. { error: 'Forbidden' }
  if ('error' in r) return null

  return {
    id:             String(r.id            ?? ''),
    orderNumber:    String(r.orderNumber   ?? ''),
    subtotal:       Number(r.subtotal      ?? 0),
    shippingCost:   Number(r.shippingCost  ?? 0),
    tax:            Number(r.tax           ?? 0),
    total:          Number(r.total         ?? 0),
    status:         String(r.status        ?? 'PENDING'),
    paymentStatus:  String(r.paymentStatus ?? 'PENDING'),
    shippingAddress: String(r.shippingAddress ?? ''),
    billingAddress: r.billingAddress != null ? String(r.billingAddress) : null,
    createdAt:      String(r.createdAt     ?? ''),
    updatedAt:      String(r.updatedAt     ?? ''),
    // items — normalise each item's numeric fields too
    items: Array.isArray(r.items)
      ? (r.items as Record<string, unknown>[]).map(item => ({
          id:       String(item.id       ?? ''),
          quantity: Number(item.quantity ?? 1),
          price:    Number(item.price    ?? 0),
          product:  item.product && typeof item.product === 'object'
            ? (() => {
                const p = item.product as Record<string, unknown>
                return {
                  id:     String(p.id    ?? ''),
                  name:   String(p.name  ?? ''),
                  price:  Number(p.price ?? 0),
                  images: Array.isArray(p.images) ? (p.images as string[]) : [],
                }
              })()
            : { id: '', name: 'Unknown product', price: 0, images: [] },
        }))
      : [],
    payment:  r.payment  != null && typeof r.payment  === 'object' ? (r.payment  as Payment)  : null,
    delivery: r.delivery != null && typeof r.delivery === 'object' ? (r.delivery as Delivery) : null,
  }
}

export default function OrderDetailPage() {
  const { data: session, status } = useSession()
  const router  = useRouter()
  const params  = useParams()
  const orderId = params?.id as string | undefined

  const [order, setOrder]         = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState('')

  /* ── auth guard ── */
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
    if (status === 'authenticated' && session?.user?.role !== 'CUSTOMER') router.push('/')
  }, [status, session, router])

  /* ── fetch once session + orderId are ready ── */
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'CUSTOMER' && orderId) {
      fetchOrder()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, orderId])

  const fetchOrder = async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? `HTTP ${res.status}`)
      }
      const json = await res.json()
      // API returns { order } — unwrap before normalising
      const raw  = json?.order ?? json
      const data = normaliseOrder(raw)
      if (!data) throw new Error('Invalid order data received from server')
      setOrder(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load this order.')
      console.error('Order fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  /* ── loading ── */
  if (status === 'loading' || isLoading) {
    return (
      <main className="min-h-screen bg-[#f5f4f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#1a1a1a] border-t-transparent animate-spin" />
          <p className="text-xs font-mono tracking-[.2em] uppercase text-[#999]">Loading order</p>
        </div>
      </main>
    )
  }

  /* ── error / not found ── */
  if (error || !order) {
    return (
      <main className="min-h-screen bg-[#f5f4f0] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="serif text-3xl italic text-[#ccc]">Order not found</p>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Link href="/dashboard" className="text-sm underline underline-offset-4 text-[#555] hover:text-[#1a1a1a]">
            ← Back to dashboard
          </Link>
        </div>
      </main>
    )
  }

  const currentStep = ORDER_STATUS_STEPS.indexOf(order.status)
  const isCancelled = order.status === 'CANCELLED' || order.status === 'RETURNED'

  return (
    <main className="min-h-screen bg-[#f5f4f0]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        .serif { font-family: 'Instrument Serif', Georgia, serif; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp .35s ease both; }
        .fade-1  { animation-delay:.05s }
        .fade-2  { animation-delay:.1s  }
        .fade-3  { animation-delay:.15s }
      `}</style>

      {/* ── header ── */}
      <header className="sticky top-0 z-30 bg-[#f5f4f0]/90 backdrop-blur border-b border-[#e0ddd6]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-[#777] hover:text-[#1a1a1a] transition-colors">
            ← Dashboard
          </Link>
          <span className="text-[#ddd]">/</span>
          <span className="text-sm font-mono text-[#555]">{order.orderNumber}</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* ── title ── */}
        <div className="fade-up">
          <p className="text-xs font-mono tracking-[.2em] uppercase text-[#aaa] mb-1">
            Placed {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <h1 className="serif text-5xl italic text-[#1a1a1a]">{order.orderNumber}</h1>
        </div>

        {/* ── progress tracker ── */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl border border-[#e8e5de] p-6 fade-up fade-1">
            <p className="text-xs font-mono tracking-widest uppercase text-[#aaa] mb-5">Order Progress</p>
            <div className="flex items-center">
              {ORDER_STATUS_STEPS.map((step, i) => {
                const done    = i <= currentStep
                const current = i === currentStep
                return (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs transition-all
                        ${done    ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white' : 'border-[#ddd] text-[#ccc]'}
                        ${current ? 'ring-2 ring-offset-2 ring-[#1a1a1a]'      : ''}`}>
                        {done ? '✓' : i + 1}
                      </div>
                      <span className={`text-[10px] font-mono tracking-wide uppercase whitespace-nowrap
                        ${done ? 'text-[#1a1a1a]' : 'text-[#ccc]'}`}>
                        {step.charAt(0) + step.slice(1).toLowerCase()}
                      </span>
                    </div>
                    {i < ORDER_STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-px mx-2 mb-4 ${i < currentStep ? 'bg-[#1a1a1a]' : 'bg-[#e8e5de]'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4 fade-up fade-1">
            <p className="text-sm font-medium text-red-700">
              This order was <strong>{order.status.toLowerCase()}</strong>.
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">

          {/* ── items + delivery ── */}
          <div className="col-span-2 space-y-4 fade-up fade-2">
            <h2 className="serif text-2xl italic text-[#1a1a1a]">Items</h2>

            <div className="bg-white rounded-2xl border border-[#e8e5de] divide-y divide-[#f5f4f0]">
              {order.items.length === 0 ? (
                <p className="p-6 text-sm text-[#aaa] text-center">No items found for this order.</p>
              ) : (
                order.items.map(item => (
                  <div key={item.id} className="flex gap-4 p-5 hover:bg-[#faf9f6] transition-colors">
                    <div className="w-16 h-16 rounded-xl bg-[#f0ede6] flex-shrink-0 overflow-hidden">
                      {item.product?.images?.[0] ? (
                        <img src={item.product.images[0]} alt={item.product.name}
                          className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#ccc] text-xl">□</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1a1a1a] truncate">{item.product?.name ?? '—'}</p>
                      <p className="text-sm text-[#999] mt-0.5">Qty {item.quantity}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-[#1a1a1a]">${fmt(item.price * item.quantity)}</p>
                      <p className="text-xs text-[#aaa]">${fmt(item.price)} each</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* delivery card */}
            {order.delivery && (
              <div className="bg-white rounded-2xl border border-[#e8e5de] p-5">
                <p className="text-xs font-mono tracking-widest uppercase text-[#aaa] mb-3">Delivery</p>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    {order.delivery.estimatedDate && (
                      <p className="text-sm text-[#666]">
                        Est. {new Date(order.delivery.estimatedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                    {order.delivery.location && (
                      <p className="text-sm text-[#999]">📍 {order.delivery.location}</p>
                    )}
                    {order.delivery.notes && (
                      <p className="text-sm text-[#aaa] italic">{order.delivery.notes}</p>
                    )}
                  </div>
                  <span className={`flex-shrink-0 text-xs font-medium px-3 py-1 rounded-full border
                    ${DELIVERY_STATUS_STYLES[order.delivery.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {order.delivery.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── sidebar ── */}
          <div className="space-y-4 fade-up fade-3">

            {/* order summary */}
            <div className="bg-white rounded-2xl border border-[#e8e5de] p-5">
              <p className="text-xs font-mono tracking-widest uppercase text-[#aaa] mb-4">Summary</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-[#555]">
                  <span>Subtotal</span><span>${fmt(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#555]">
                  <span>Shipping</span>
                  <span>
                    {order.shippingCost === 0
                      ? <span className="text-emerald-600">Free</span>
                      : `$${fmt(order.shippingCost)}`}
                  </span>
                </div>
                <div className="flex justify-between text-[#555]">
                  <span>Tax</span><span>${fmt(order.tax)}</span>
                </div>
                <div className="flex justify-between font-semibold text-[#1a1a1a] pt-2 border-t border-[#f0ede6]">
                  <span>Total</span><span>${fmt(order.total)}</span>
                </div>
              </div>
            </div>

            {/* shipping address */}
            <div className="bg-white rounded-2xl border border-[#e8e5de] p-5">
              <p className="text-xs font-mono tracking-widest uppercase text-[#aaa] mb-3">Ships to</p>
              <p className="text-sm text-[#555] leading-relaxed whitespace-pre-line">{order.shippingAddress}</p>
            </div>

            {/* payment */}
            {order.payment && (
              <div className="bg-white rounded-2xl border border-[#e8e5de] p-5">
                <p className="text-xs font-mono tracking-widest uppercase text-[#aaa] mb-3">Payment</p>
                <div className="space-y-1.5 text-sm text-[#555]">
                  <div className="flex justify-between">
                    <span>Method</span>
                    <span className="text-[#1a1a1a] font-medium">
                      {order.payment.method.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status</span>
                    <span className={`font-medium ${order.payment.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {order.payment.status}
                    </span>
                  </div>
                  {order.payment.transactionId && (
                    <div className="flex justify-between gap-2">
                      <span className="flex-shrink-0">Ref</span>
                      <span className="font-mono text-xs text-[#aaa] truncate">{order.payment.transactionId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}