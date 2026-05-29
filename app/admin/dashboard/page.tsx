'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const YEAR = new Date().getFullYear()

interface DashboardStats {
  totalUsers: number
  totalOrders: number
  totalProducts: number
  totalRevenue: number
  pendingOrders: number
  suppliers: number
  deliveredOrders?: number
  verifiedSuppliers?: number
}

// ─── Trend sparkline (pure SVG) ───────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 80, h = 28
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((v - min) / range) * h
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-70">
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  subtext,
  trend,
  color,
  icon,
  loading,
  href,
}: {
  label: string
  value: string | number
  subtext?: string
  trend?: number[]
  color: string
  icon: string
  loading: boolean
  href?: string
}) {
  const card = (
    <div
      className="relative rounded-2xl p-5 overflow-hidden group transition-all duration-200 hover:translate-y-[-2px]"
      style={{
        background: 'linear-gradient(135deg, #0d1526, #111827)',
        border: `1px solid ${color}25`,
        boxShadow: `0 0 0 1px ${color}10`,
      }}
    >
      {/* Glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(circle at 30% 30%, ${color}12, transparent 70%)` }}
      />

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-3 rounded w-2/3" style={{ background: '#1e293b' }} />
          <div className="h-8 rounded w-1/2" style={{ background: '#1e293b' }} />
          <div className="h-3 rounded w-3/4" style={{ background: '#1e293b' }} />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#64748b' }}>
                {label}
              </p>
              <p
                className="text-3xl font-black mt-1.5 text-white"
                style={{ fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em' }}
              >
                {value}
              </p>
              {subtext && <p className="text-xs mt-1" style={{ color: color }}>{subtext}</p>}
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: `${color}18` }}
            >
              {icon}
            </div>
          </div>
          {trend && <Sparkline data={trend} color={color} />}
        </>
      )}
    </div>
  )

  return href ? (
    <Link href={href} className="block">
      {card}
    </Link>
  ) : card
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────
function MiniBarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-sm transition-all duration-500"
            style={{
              height: `${(d.value / max) * 64}px`,
              background: `linear-gradient(to top, ${color}80, ${color})`,
              minHeight: '4px',
            }}
          />
          <span className="text-xs" style={{ color: '#475569', fontSize: '10px' }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Quick action button ──────────────────────────────────────────────────────
function QuickAction({ href, icon, label, color }: { href: string; icon: string; label: string; color: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150 group"
      style={{
        background: `${color}10`,
        border: `1px solid ${color}25`,
        color: color,
      }}
    >
      <span className="text-base group-hover:scale-110 transition-transform">{icon}</span>
      <span>{label}</span>
      <span className="ml-auto opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">→</span>
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0, totalOrders: 0, totalProducts: 0,
    totalRevenue: 0, pendingOrders: 0, suppliers: 0,
    deliveredOrders: 0, verifiedSuppliers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setStats(data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Mock weekly sparkline data (replace with real data from API)
  const weekTrend = [40, 55, 48, 70, 62, 80, 74]
  const revTrend   = [1200, 1800, 1500, 2400, 2100, 2800, 2600]
  const orderTrend = [8, 12, 9, 15, 11, 17, 14]

  const statCards = [
    { label: 'Total Users',    value: stats.totalUsers,              subtext: 'Registered accounts',  trend: weekTrend,  color: '#3b82f6', icon: '👥', href: '/admin/users' },
    { label: 'Total Products', value: stats.totalProducts,           subtext: 'Active listings',      trend: weekTrend,  color: '#8b5cf6', icon: '📦', href: '/admin/products' },
    { label: 'Total Orders',   value: stats.totalOrders,             subtext: 'All time',             trend: orderTrend, color: '#06b6d4', icon: '🛒', href: '/admin/orders' },
    { label: 'Pending Orders', value: stats.pendingOrders,           subtext: 'Needs attention',      color: '#f59e0b', icon: '⏳', href: '/admin/orders' },
    { label: 'Suppliers',      value: stats.suppliers,               subtext: `${stats.verifiedSuppliers ?? 0} verified`, color: '#10b981', icon: '🏭', href: '/admin/suppliers' },
    {
      label: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtext: 'Lifetime revenue',
      trend: revTrend,
      color: '#f59e0b',
      icon: '💰',
    },
  ]

  const weeklyOrders = [
    { label: 'Mon', value: 8 }, { label: 'Tue', value: 12 }, { label: 'Wed', value: 9 },
    { label: 'Thu', value: 15 }, { label: 'Fri', value: 11 }, { label: 'Sat', value: 17 }, { label: 'Sun', value: 14 },
  ]

  const now = new Date()

  return (
    <div
      className="min-h-full p-6 md:p-8 space-y-8"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');`}</style>

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1
            className="text-3xl font-black text-white"
            style={{ fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em' }}
          >
            Dashboard
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#475569' }}>
            {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: '#10b98118', border: '1px solid #10b98130', color: '#34d399' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          System Operational
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.label} loading={loading} {...card} />
        ))}
      </div>

      {/* ── Second row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Weekly orders chart */}
        <div
          className="lg:col-span-2 rounded-2xl p-5"
          style={{ background: '#0d1526', border: '1px solid #1a2235' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                Orders This Week
              </h2>
              <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Daily breakdown</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-mono" style={{ background: '#06b6d418', color: '#22d3ee', border: '1px solid #06b6d430' }}>
              Live
            </span>
          </div>
          <MiniBarChart data={weeklyOrders} color="#06b6d4" />
        </div>

        {/* Quick Actions */}
        <div
          className="rounded-2xl p-5 space-y-3"
          style={{ background: '#0d1526', border: '1px solid #1a2235' }}
        >
          <h2 className="text-base font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
            Quick Actions
          </h2>
          <QuickAction href="/admin/categories" icon="📁" label="Manage Categories" color="#8b5cf6" />
          <QuickAction href="/admin/products" icon="📦" label="Manage Products" color="#3b82f6" />
          <QuickAction href="/admin/suppliers" icon="🏭" label="Verify Suppliers" color="#10b981" />
          <QuickAction href="/admin/orders" icon="🛒" label="View Orders" color="#06b6d4" />
          <QuickAction href="/admin/users" icon="👥" label="Manage Users" color="#f59e0b" />
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Order status breakdown */}
        <div
          className="rounded-2xl p-5"
          style={{ background: '#0d1526', border: '1px solid #1a2235' }}
        >
          <h2 className="text-base font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
            Order Status
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Delivered', pct: 62, color: '#10b981' },
              { label: 'Processing', pct: 18, color: '#3b82f6' },
              { label: 'Pending', pct: 12, color: '#f59e0b' },
              { label: 'Cancelled', pct: 8, color: '#ef4444' },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-1" style={{ color: '#64748b' }}>
                  <span className="font-medium" style={{ color: '#94a3b8' }}>{s.label}</span>
                  <span>{s.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1e293b' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${s.pct}%`, background: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System info */}
        <div
          className="rounded-2xl p-5"
          style={{ background: '#0d1526', border: '1px solid #1a2235' }}
        >
          <h2 className="text-base font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
            System Info
          </h2>
          <div className="space-y-3">
            {[
              { label: 'System Status', value: '● Operational', valueColor: '#34d399' },
              { label: 'API Version',   value: 'v1.0',           valueColor: '#94a3b8' },
              { label: 'Database',      value: 'MongoDB Atlas',   valueColor: '#94a3b8' },
              { label: 'Last Updated',  value: now.toLocaleTimeString(), valueColor: '#94a3b8' },
              { label: 'Environment',   value: process.env.NODE_ENV === 'production' ? 'Production' : 'Development', valueColor: process.env.NODE_ENV === 'production' ? '#34d399' : '#f59e0b' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid #1a2235' }}>
                <span className="text-sm" style={{ color: '#64748b' }}>{row.label}</span>
                <span className="text-sm font-semibold" style={{ color: row.valueColor }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}