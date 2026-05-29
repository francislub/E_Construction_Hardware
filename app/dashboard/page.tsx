'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
  createdAt: string
  items: OrderItem[]
}

const STATUS_STYLES: Record<string, string> = {
  DELIVERED:  'bg-emerald-100 text-emerald-800 border border-emerald-200',
  SHIPPED:    'bg-sky-100    text-sky-800    border border-sky-200',
  PROCESSING: 'bg-violet-100 text-violet-800 border border-violet-200',
  CONFIRMED:  'bg-blue-100   text-blue-800   border border-blue-200',
  PENDING:    'bg-amber-100  text-amber-800  border border-amber-200',
  CANCELLED:  'bg-red-100    text-red-800    border border-red-200',
  RETURNED:   'bg-gray-100   text-gray-700   border border-gray-200',
}

export default function CustomerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders]         = useState<Order[]>([])
  const [isLoading, setIsLoading]   = useState(true)
  const [activeTab, setActiveTab]   = useState<'all' | 'active' | 'completed'>('all')

  /* ── auth guard ── */
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
    if (status === 'authenticated' && session?.user?.role !== 'CUSTOMER') router.push('/')
  }, [status, session, router])

  /* ── fetch orders ── */
  useEffect(() => {
    if (session?.user?.role === 'CUSTOMER') fetchOrders()
  }, [session])

  const fetchOrders = async () => {
    try {
      const res  = await fetch('/api/orders')
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setIsLoading(false)
    }
  }

  /* ── tab filter ── */
  const ACTIVE_STATUSES    = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED']
  const COMPLETED_STATUSES = ['DELIVERED', 'CANCELLED', 'RETURNED']

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'active')    return ACTIVE_STATUSES.includes(o.status)
    if (activeTab === 'completed') return COMPLETED_STATUSES.includes(o.status)
    return true
  })

  /* ── derived stats ── */
  const totalSpent    = orders.reduce((s, o) => s + o.total, 0)
  const activeOrders  = orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length

  /* ── loading / guard ── */
  if (status === 'loading' || (status === 'authenticated' && session?.user?.role !== 'CUSTOMER')) {
    return (
      <main className="min-h-screen bg-[#f5f4f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#1a1a1a] border-t-transparent animate-spin" />
          <p className="text-sm text-[#666] font-mono tracking-widest uppercase">Loading</p>
        </div>
      </main>
    )
  }

  const firstName = session?.user?.name?.split(' ')[0] ?? 'there'

  return (
    <main className="min-h-screen bg-[#f5f4f0] font-['Instrument_Serif',_Georgia,_serif]">

      {/* ── Google Font ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        body { font-family: 'DM Sans', sans-serif; }
        .serif { font-family: 'Instrument Serif', Georgia, serif; }
        .tab-active { background: #1a1a1a; color: #f5f4f0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .fade-up { animation: fadeUp .4s ease both; }
        .fade-up-1 { animation-delay: .05s }
        .fade-up-2 { animation-delay: .1s  }
        .fade-up-3 { animation-delay: .15s }
        .fade-up-4 { animation-delay: .2s  }
      `}</style>

      {/* ── top bar ── */}
      <header className="sticky top-0 z-30 bg-[#f5f4f0]/90 backdrop-blur border-b border-[#e0ddd6]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="serif text-xl italic">My Account</span>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/products"  className="text-[#555] hover:text-[#1a1a1a] transition-colors">Shop</Link>
            <Link href="/cart"      className="text-[#555] hover:text-[#1a1a1a] transition-colors">Cart</Link>
            <Link href="/customer/favorites" className="text-[#555] hover:text-[#1a1a1a] transition-colors">Saved</Link>
            <Link href="/customer/profile"
              className="text-sm bg-[#1a1a1a] text-[#f5f4f0] px-4 py-1.5 rounded-full hover:bg-[#333] transition-colors">
              Profile
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">

        {/* ── greeting ── */}
        <div className="fade-up">
          <p className="text-xs font-mono tracking-[.2em] uppercase text-[#999] mb-1">
            {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}
          </p>
          <h1 className="serif text-5xl italic text-[#1a1a1a]">
            Hello, {firstName}.
          </h1>
        </div>

        {/* ── stat cards ── */}
        <div className="grid grid-cols-3 gap-4 fade-up fade-up-1">
          {[
            { label: 'Total Orders',    value: orders.length,          suffix: '' },
            { label: 'Active Orders',   value: activeOrders,           suffix: '' },
            { label: 'Total Spent',     value: `$${totalSpent.toFixed(2)}`, suffix: '' },
          ].map(card => (
            <div key={card.label}
              className="bg-white rounded-2xl p-6 border border-[#e8e5de] shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-mono tracking-widest uppercase text-[#aaa] mb-2">{card.label}</p>
              <p className="serif text-4xl italic text-[#1a1a1a]">{card.value}</p>
            </div>
          ))}
        </div>

        {/* ── quick links ── */}
        <div className="grid grid-cols-3 gap-4 fade-up fade-up-2">
          {[
            { href: '/cart',      label: 'Shopping Cart',  sub: 'View and manage your cart',    accent: '#d4a853' },
            { href: '/customer/favorites', label: 'Saved Items',    sub: 'Products you\'ve bookmarked',  accent: '#6b8f71' },
            { href: '/customer/profile',label: 'Your Profile',   sub: 'Address, password, settings',  accent: '#7e6b9e' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="group bg-white rounded-2xl p-5 border border-[#e8e5de] shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
              style={{ borderLeft: `3px solid ${item.accent}` }}>
              <h3 className="font-semibold text-[#1a1a1a] mb-1 group-hover:underline underline-offset-2">{item.label}</h3>
              <p className="text-sm text-[#888]">{item.sub}</p>
            </Link>
          ))}
        </div>

        {/* ── orders section ── */}
        <div className="fade-up fade-up-3">
          <div className="flex items-end justify-between mb-4">
            <h2 className="serif text-3xl italic text-[#1a1a1a]">Orders</h2>
            {/* tabs */}
            <div className="flex gap-1 bg-[#e8e5de] rounded-full p-1 text-sm">
              {(['all','active','completed'] as const).map(tab => (
                <button key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1 rounded-full capitalize transition-all font-medium ${activeTab === tab ? 'tab-active' : 'text-[#666] hover:text-[#1a1a1a]'}`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e8e5de] shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 flex flex-col items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-[#1a1a1a] border-t-transparent animate-spin" />
                <p className="text-sm text-[#999] font-mono tracking-widest uppercase">Loading orders</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 text-center">
                <p className="serif text-2xl italic text-[#bbb] mb-2">No orders here yet</p>
                <p className="text-sm text-[#aaa] mb-6">
                  {activeTab === 'active' ? 'You have no active orders.' :
                   activeTab === 'completed' ? 'No completed orders.' :
                   "You haven't placed any orders."}
                </p>
                <Link href="/products"
                  className="inline-block bg-[#1a1a1a] text-[#f5f4f0] px-6 py-2.5 rounded-full text-sm hover:bg-[#333] transition-colors">
                  Start Shopping
                </Link>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f0ede6]">
                    {['Order','Date','Items','Total','Status',''].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-mono tracking-widest uppercase text-[#aaa] font-normal">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f4f0]">
                  {filteredOrders.map((order, i) => (
                    <tr key={order.id}
                      className="hover:bg-[#faf9f6] transition-colors group"
                      style={{ animationDelay: `${i * 40}ms` }}>

                      <td className="px-5 py-4 font-mono text-xs text-[#555]">
                        {order.orderNumber}
                      </td>

                      <td className="px-5 py-4 text-[#777]">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                      </td>

                      <td className="px-5 py-4 text-[#777]">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </td>

                      <td className="px-5 py-4 font-semibold text-[#1a1a1a]">
                      {order.total.toFixed(2)}
                      </td>

                      <td className="px-5 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[order.status] ?? STATUS_STYLES['PENDING']}`}>
                          {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <Link href={`/customer/orders/${order.id}`}
                          className="text-xs font-medium text-[#1a1a1a] underline underline-offset-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#555]">
                          View details →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!isLoading && orders.length > 0 && (
            <p className="text-xs text-[#bbb] mt-2 text-right font-mono">
              {filteredOrders.length} of {orders.length} orders shown
            </p>
          )}
        </div>
      </div>
    </main>
  )
}