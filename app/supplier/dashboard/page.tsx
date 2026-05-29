'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

// ─── Types ─────────────────────────────────────────────────────────────────
interface SupplierStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

interface Order {
  id: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface OrderHealth {
  DELIVERED: number;
  PROCESSING: number;
  PENDING: number;
  CANCELLED: number;
  CONFIRMED: number;
  SHIPPED: number;
  total: number;
}

interface SupplierProfile {
  rating: number;
  reviewCount: number;
}

// ─── Sparkline (pure SVG) ──────────────────────────────────────────────────
function Sparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 120;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return `${x},${y}`;
  });
  const pathD = `M${pts.join(' L')}`;
  const fillD = `${pathD} L${w},${height} L0,${height} Z`;
  const gradId = `sg-${color.replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#${gradId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={pts[pts.length - 1].split(',')[0]}
        cy={pts[pts.length - 1].split(',')[1]}
        r="3" fill={color}
      />
    </svg>
  );
}

// ─── Radial Progress ───────────────────────────────────────────────────────
function RadialProgress({ value, max, color, size = 64 }: { value: number; max: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({
  label, value, subtext, icon, color, bg, trend, sparkData, delay = 0,
}: {
  label: string; value: string | number; subtext?: string; icon: string;
  color: string; bg: string; trend?: string; sparkData?: number[]; delay?: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  return (
    <div style={{
      background: 'linear-gradient(145deg, #111827 0%, #0d1321 100%)',
      borderRadius: 20, padding: 24,
      border: '1px solid rgba(255,255,255,0.07)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
        {trend && (
          <span style={{ fontSize: 11, fontWeight: 700, color: trend.startsWith('+') ? '#34d399' : '#f87171', background: trend.startsWith('+') ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', padding: '3px 8px', borderRadius: 6 }}>{trend}</span>
        )}
      </div>

      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1, fontFamily: 'Georgia,serif' }}>{value}</div>
        <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)', marginTop: 4, fontWeight: 500 }}>{label}</div>
      </div>

      {subtext && <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)', marginBottom: 12 }}>{subtext}</div>}

      {sparkData && sparkData.length >= 2 && (
        <div style={{ marginTop: 12 }}>
          <Sparkline data={sparkData} color={color} height={36} />
        </div>
      )}
    </div>
  );
}

// ─── Quick Action Card ─────────────────────────────────────────────────────
function ActionCard({ href, icon, title, desc, color, delay = 0 }: {
  href: string; icon: string; title: string; desc: string; color: string; delay?: number;
}) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  return (
    <Link href={href} style={{
      display: 'block', textDecoration: 'none',
      background: hovered
        ? 'linear-gradient(145deg, #1a2744 0%, #111827 100%)'
        : 'linear-gradient(145deg, #111827 0%, #0d1321 100%)',
      borderRadius: 16, padding: '20px',
      border: `1px solid ${hovered ? color + '40' : 'rgba(255,255,255,0.07)'}`,
      boxShadow: hovered ? `0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px ${color}20` : '0 4px 16px rgba(0,0,0,0.2)',
      opacity: visible ? 1 : 0,
      transform: visible ? (hovered ? 'translateY(-4px)' : 'translateY(0)') : 'translateY(12px)',
      transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
    }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.55)', lineHeight: 1.5 }}>{desc}</div>
      <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600, color: color }}>Go →</div>
    </Link>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    PENDING:    { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
    CONFIRMED:  { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
    PROCESSING: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
    SHIPPED:    { color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
    DELIVERED:  { color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
    CANCELLED:  { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  };
  const s = map[status] ?? { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, color: s.color, background: s.bg, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{status}</span>
  );
}

// ─── Skeleton loader row ───────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      {[180, 200, 40, 100, 80, 80].map((w, i) => (
        <td key={i} style={{ padding: '13px 16px' }}>
          <div style={{ height: 12, width: w, borderRadius: 6, background: 'rgba(255,255,255,0.07)', animation: 'pulse 1.5s ease infinite' }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Format date ───────────────────────────────────────────────────────────
function formatOrderDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return `Today, ${d.toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })}`;
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-UG', { day: 'numeric', month: 'short' });
}

// ─── DASHBOARD PAGE ────────────────────────────────────────────────────────
export default function SupplierDashboard() {
  const { data: session, status } = useSession();

  const [stats, setStats]             = useState<SupplierStats | null>(null);
  const [orders, setOrders]           = useState<Order[]>([]);
  const [orderHealth, setOrderHealth] = useState<OrderHealth | null>(null);
  const [profile, setProfile]         = useState<SupplierProfile | null>(null);
  const [revSpark, setRevSpark]       = useState<number[]>([]);
  const [ordSpark, setOrdSpark]       = useState<number[]>([]);

  const [statsLoading,  setStatsLoading]  = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [headerVisible, setHeaderVisible] = useState(false);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'unauthenticated') redirect('/auth/login');
    if (status === 'authenticated' && session?.user?.role !== 'SUPPLIER') redirect('/');
  }, [status, session]);

  useEffect(() => {
    const t = setTimeout(() => setHeaderVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // ── Fetch stats ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/supplier/stats')
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then((data: SupplierStats) => setStats(data))
      .catch(() => setStats({ totalProducts: 0, totalOrders: 0, totalRevenue: 0, pendingOrders: 0 }))
      .finally(() => setStatsLoading(false));
  }, [status]);

  // ── Fetch recent orders ───────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/supplier/orders?limit=5&sort=createdAt_desc')
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then((data: { orders: Order[] }) => setOrders(data.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [status]);

  // ── Fetch order health breakdown ──────────────────────────────────────────
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/supplier/orders/health')
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then((data: OrderHealth) => setOrderHealth(data))
      .catch(() => setOrderHealth(null));
  }, [status]);

  // ── Fetch supplier profile (rating) ──────────────────────────────────────
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/supplier/profile/summary')
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then((data: SupplierProfile) => setProfile(data))
      .catch(() => setProfile(null));
  }, [status]);

  // ── Fetch weekly sparkline data ───────────────────────────────────────────
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/supplier/analytics/weekly')
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then((data: { revenue: number[]; orders: number[] }) => {
        if (Array.isArray(data.revenue)) setRevSpark(data.revenue);
        if (Array.isArray(data.orders))  setOrdSpark(data.orders);
      })
      .catch(() => {
        // Sparklines are decorative — fail silently
      });
  }, [status]);

  const supplierName = session?.user?.name ?? 'Supplier';
  const now    = new Date();
  const hour   = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const isLoading = status === 'loading' || statsLoading;

  // ── Spinner ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid rgba(245,158,11,0.2)', borderTop: '3px solid #f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ color: 'rgba(148,163,184,0.6)', fontSize: 13 }}>Loading your dashboard…</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const healthTotal = orderHealth?.total || 1;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1321 50%, #060d1a 100%)', padding: '32px 32px 64px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        * { font-family: 'DM Sans', sans-serif; }
      `}</style>

      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 36,
        opacity: headerVisible ? 1 : 0,
        transform: headerVisible ? 'translateY(0)' : 'translateY(-12px)',
        transition: 'all 0.5s ease',
      }}>
        <div>
          <div style={{ fontSize: 12, color: 'rgba(245,158,11,0.7)', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>
            {greeting}, {supplierName.split(' ')[0]} 👋
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', fontFamily: 'Georgia,serif', lineHeight: 1.1 }}>
            Supplier Dashboard
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.55)', marginTop: 4 }}>
            {now.toLocaleDateString('en-UG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button style={{ position: 'relative', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8', fontSize: 16 }}>
            🔔
            {(stats?.pendingOrders ?? 0) > 0 && (
              <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', animation: 'pulse 2s infinite' }} />
            )}
          </button>
          <Link href="/supplier/products/new" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10,
            background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#0d1321', fontWeight: 800, fontSize: 13,
            textDecoration: 'none', boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
          }}>
            + Add Product
          </Link>
        </div>
      </div>

      {/* ── PENDING ALERT BANNER ─────────────────────────────────────────── */}
      {(stats?.pendingOrders ?? 0) > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(217,119,6,0.06) 100%)',
          border: '1px solid rgba(245,158,11,0.25)', borderRadius: 14, padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28,
          animation: 'fadeIn 0.5s ease 0.2s both',
        }}>
          <div style={{ fontSize: 22 }}>⚡</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>
              {stats!.pendingOrders} order{stats!.pendingOrders > 1 ? 's' : ''} waiting for confirmation
            </div>
            <div style={{ fontSize: 12, color: 'rgba(251,191,36,0.6)', marginTop: 2 }}>Review and confirm new orders to keep customers happy.</div>
          </div>
          <Link href="/supplier/orders?status=PENDING" style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: '#fbbf24', textDecoration: 'none', whiteSpace: 'nowrap', background: 'rgba(245,158,11,0.15)', padding: '7px 14px', borderRadius: 8 }}>
            View Orders →
          </Link>
        </div>
      )}

      {/* ── STAT CARDS ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard
          label="Total Revenue"
          value={`UGX ${((stats?.totalRevenue ?? 0) / 1000).toFixed(0)}K`}
          subtext="Completed payments"
          icon="💰" color="#f59e0b" bg="rgba(245,158,11,0.15)"
          sparkData={revSpark} delay={100}
        />
        <StatCard
          label="Total Orders"
          value={stats?.totalOrders ?? 0}
          subtext="All time"
          icon="🛒" color="#60a5fa" bg="rgba(96,165,250,0.15)"
          sparkData={ordSpark} delay={200}
        />
        <StatCard
          label="Pending Orders"
          value={stats?.pendingOrders ?? 0}
          subtext="Awaiting confirmation"
          icon="⏳" color="#fbbf24" bg="rgba(251,191,36,0.15)"
          delay={300}
        />
        <StatCard
          label="Products Listed"
          value={stats?.totalProducts ?? 0}
          subtext="Active catalogue"
          icon="📦" color="#34d399" bg="rgba(52,211,153,0.15)"
          delay={400}
        />
      </div>

      {/* ── MIDDLE ROW ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 20 }}>

        {/* Recent Orders Table */}
        <div style={{
          background: 'linear-gradient(145deg,#111827 0%,#0d1321 100%)',
          borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.5s ease 0.4s both',
        }}>
          <div style={{ padding: '20px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>Recent Orders</div>
              <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', marginTop: 2 }}>Last 5 transactions</div>
            </div>
            <Link href="/supplier/orders" style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b', textDecoration: 'none', background: 'rgba(245,158,11,0.1)', padding: '6px 12px', borderRadius: 8 }}>View all →</Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {['Order ID', 'Product', 'Qty', 'Amount', 'Status', 'Date'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordersLoading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  : orders.length === 0
                    ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: 'rgba(148,163,184,0.4)', fontSize: 13 }}>
                          No orders yet. Share your products to start receiving orders.
                        </td>
                      </tr>
                    )
                    : orders.map(o => (
                      <tr key={o.id}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '13px 16px', fontSize: 12, fontWeight: 700, color: '#f59e0b', whiteSpace: 'nowrap' }}>
                          #{o.id.slice(-6).toUpperCase()}
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: 12, color: '#cbd5e1', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {o.productName}
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: 12, color: 'rgba(148,163,184,0.7)', textAlign: 'center' }}>
                          ×{o.quantity}
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>
                          UGX {o.totalAmount.toLocaleString()}
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <StatusBadge status={o.status} />
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: 11, color: 'rgba(148,163,184,0.45)', whiteSpace: 'nowrap' }}>
                          {formatOrderDate(o.createdAt)}
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Health Panel */}
        <div style={{
          background: 'linear-gradient(145deg,#111827 0%,#0d1321 100%)',
          borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          padding: 24,
          animation: 'fadeIn 0.5s ease 0.5s both',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Order Health</div>
          <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', marginBottom: 24 }}>Fulfilment at a glance</div>

          {[
            { label: 'Delivered',  key: 'DELIVERED'  as keyof OrderHealth, color: '#34d399' },
            { label: 'Processing', key: 'PROCESSING' as keyof OrderHealth, color: '#a78bfa' },
            { label: 'Pending',    key: 'PENDING'    as keyof OrderHealth, color: '#fbbf24' },
            { label: 'Cancelled',  key: 'CANCELLED'  as keyof OrderHealth, color: '#f87171' },
          ].map(({ label, key, color }) => {
            const val = (orderHealth?.[key] as number) ?? 0;
            return (
              <div key={label} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RadialProgress value={val} max={healthTotal} color={color} size={32} />
                    <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500 }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color }}>{val}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(val / healthTotal) * 100}%`, background: color, borderRadius: 2, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }} />
                </div>
              </div>
            );
          })}

          {/* Supplier Score — only shown when real data exists */}
          {profile && (
            <div style={{ marginTop: 28, padding: '16px', background: 'rgba(245,158,11,0.06)', borderRadius: 12, border: '1px solid rgba(245,158,11,0.12)' }}>
              <div style={{ fontSize: 11, color: 'rgba(245,158,11,0.7)', fontWeight: 700, marginBottom: 4 }}>⭐ Supplier Score</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#fbbf24', fontFamily: 'Georgia,serif' }}>
                {profile.rating.toFixed(1)}
                <span style={{ fontSize: 14, color: 'rgba(148,163,184,0.5)', fontWeight: 400, fontFamily: 'inherit' }}>/5.0</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)', marginTop: 2 }}>
                Based on {profile.reviewCount.toLocaleString()} customer review{profile.reviewCount !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── QUICK ACTIONS ────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16 }}>Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          <ActionCard href="/supplier/products/new"          icon="📦" title="Add New Product"   desc="List a new item in your catalogue"       color="#34d399" delay={600} />
          <ActionCard href="/supplier/orders?status=PENDING" icon="⏳" title="Pending Orders"    desc="Confirm orders waiting for action"       color="#fbbf24" delay={700} />
          <ActionCard href="/supplier/analytics"             icon="📊" title="View Analytics"    desc="Deep dive into sales performance"        color="#60a5fa" delay={800} />
          <ActionCard href="/supplier/profile"               icon="🏭" title="Company Profile"   desc="Update your business information"        color="#a78bfa" delay={900} />
        </div>
      </div>
    </div>
  );
}