'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Package,
  Truck,
  Mail,
  ArrowRight,
  Clock,
  MapPin,
  Receipt,
  ShoppingBag,
  PartyPopper,
} from 'lucide-react'

/* ── Types ── */
interface OrderItem {
  id: string
  quantity: number
  price: number
  product: { name: string; images?: string[] }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  shippingAddress: string
  createdAt: string
  items: OrderItem[]
  payment?: { method: string; status: string }
  delivery?: { status: string; estimatedDate?: string }
}

/* ── Status timeline config ── */
const TIMELINE = [
  {
    key: 'confirmed',
    label: 'Order Confirmed',
    sub: 'We received your order',
    icon: CheckCircle2,
    activeStatuses: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
  },
  {
    key: 'processing',
    label: 'Processing',
    sub: 'Preparing your items',
    icon: Package,
    activeStatuses: ['PROCESSING', 'SHIPPED', 'DELIVERED'],
  },
  {
    key: 'shipped',
    label: 'Shipped',
    sub: 'On the way to you',
    icon: Truck,
    activeStatuses: ['SHIPPED', 'DELIVERED'],
  },
  {
    key: 'delivered',
    label: 'Delivered',
    sub: 'Package received',
    icon: CheckCircle2,
    activeStatuses: ['DELIVERED'],
  },
]

const PAYMENT_LABELS: Record<string, string> = {
  CREDIT_CARD: 'Credit Card',
  DEBIT_CARD: 'Debit Card',
  MOBILE_MONEY: 'Mobile Money',
  BANK_TRANSFER: 'Bank Transfer',
}

/* ── Page ── */
export default function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>   // Next.js 15: params is a Promise
}) {
  // Unwrap params with React.use() — required in Next.js 15 client components
  const { id } = use(params)

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`)
        if (res.ok) {
          const data = await res.json()
          // API returns { order } or the order directly
          setOrder(data.order ?? data)
        } else if (res.status === 404) {
          setNotFound(true)
        }
      } catch (err) {
        console.error('Failed to fetch order:', err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [id])

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading your order...</p>
        </div>
      </div>
    )
  }

  /* ── Not found ── */
  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <Package size={52} className="mx-auto mb-4 text-gray-200" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-500 mb-6">We couldn't find that order. It may have been removed or the link is incorrect.</p>
          <Link href="/products">
            <button className="bg-indigo-600 text-white px-7 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
              Continue Shopping
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const currentStepIdx = TIMELINE.findLastIndex((t) =>
    t.activeStatuses.includes(order.status)
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-indigo-50/30">

      {/* ── Hero success banner ── */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-5 backdrop-blur-sm">
            <PartyPopper size={40} className="text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight">Order Confirmed!</h1>
          <p className="text-emerald-100 text-lg mb-4">Thank you for your purchase. We're on it!</p>
          <div className="inline-block bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-2.5">
            <span className="text-sm text-emerald-100 mr-2">Order</span>
            <span className="font-bold text-white text-lg tracking-wider">#{order.orderNumber}</span>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── LEFT column ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Order status timeline */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Clock size={16} className="text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Order Status</h2>
              </div>

              <div className="relative">
                {/* vertical track */}
                <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-100" />

                <div className="space-y-6">
                  {TIMELINE.map((step, i) => {
                    const active = i <= currentStepIdx
                    const Icon = step.icon
                    return (
                      <div key={step.key} className="flex items-start gap-4 relative">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10
                          transition-all duration-300
                          ${active
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                            : 'bg-gray-100 text-gray-300'}
                        `}>
                          <Icon size={18} />
                        </div>
                        <div className="pt-1.5">
                          <p className={`font-semibold text-sm ${active ? 'text-gray-900' : 'text-gray-400'}`}>
                            {step.label}
                          </p>
                          <p className={`text-xs mt-0.5 ${active ? 'text-gray-500' : 'text-gray-300'}`}>
                            {step.key === 'delivered' && order.delivery?.estimatedDate
                              ? `Expected: ${new Date(order.delivery.estimatedDate).toLocaleDateString('en-UG', { weekday: 'short', month: 'short', day: 'numeric' })}`
                              : step.key === 'confirmed'
                              ? new Date(order.createdAt).toLocaleDateString('en-UG', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                              : step.sub}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Order items */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <ShoppingBag size={16} className="text-indigo-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  Items Ordered ({order.items.length})
                </h2>
              </div>

              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex-shrink-0 overflow-hidden">
                      {item.product.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={20} className="text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity} × Shs{item.price.toLocaleString()}</p>
                    </div>
                    <p className="font-bold text-gray-900 text-sm flex-shrink-0">
                      Shs{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* What's next */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">What Happens Next?</h2>
              <div className="space-y-4">
                {[
                  {
                    icon: <Mail size={18} className="text-blue-500" />,
                    bg: 'bg-blue-50',
                    title: 'Confirmation Email Sent',
                    desc: 'Check your inbox for full order details and a receipt.',
                  },
                  {
                    icon: <Package size={18} className="text-amber-500" />,
                    bg: 'bg-amber-50',
                    title: 'We\'re Preparing Your Order',
                    desc: 'Our team is picking and packing your items right now.',
                  },
                  {
                    icon: <Truck size={18} className="text-emerald-500" />,
                    bg: 'bg-emerald-50',
                    title: 'Delivery Updates',
                    desc: 'You\'ll get notified by email when your order ships.',
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT column: summary ── */}
          <div className="space-y-5">

            {/* Price breakdown */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center">
                  <Receipt size={16} className="text-violet-600" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Order Summary</h2>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order #</span>
                  <span className="font-semibold text-gray-800 font-mono">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(order.createdAt).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {order.status}
                  </span>
                </div>

                {order.payment && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment</span>
                    <span className="font-semibold text-gray-800">
                      {PAYMENT_LABELS[order.payment.method] ?? order.payment.method}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-gray-200 my-4 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>Shs{order.subtotal?.toLocaleString() ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span>{order.shippingCost === 0 ? <span className="text-emerald-600 font-semibold">FREE</span> : `Shs${order.shippingCost?.toLocaleString()}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax (10%)</span>
                  <span>Shs{order.tax?.toLocaleString() ?? '—'}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-xl font-black text-indigo-600">Shs{order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Shipping address */}
            {order.shippingAddress && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={15} className="text-rose-500" />
                  <h3 className="text-sm font-bold text-gray-900">Shipping To</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{order.shippingAddress}</p>
              </div>
            )}

            {/* CTA buttons */}
            <div className="space-y-3">
              <Link href={`/customer/orders/${order.id}`} className="block">
                <button className="w-full flex items-center justify-center gap-2 border-2 border-indigo-200 text-indigo-700 py-3 rounded-2xl font-semibold text-sm hover:bg-indigo-50 transition-colors">
                  <Package size={16} />
                  View Full Order Details
                </button>
              </Link>
              <Link href="/products" className="block">
                <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 rounded-2xl font-semibold text-sm hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-200">
                  <ShoppingBag size={16} />
                  Continue Shopping
                  <ArrowRight size={14} />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}