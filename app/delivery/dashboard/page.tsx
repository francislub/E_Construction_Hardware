'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface DeliveryStats {
  totalDeliveries: number;
  completedDeliveries: number;
  pendingDeliveries: number;
  inTransitDeliveries: number;
  assignedDeliveries: number;
  failedDeliveries: number;
  successRate: number;
}

interface RecentDelivery {
  id: string;
  orderId: string;
  orderNumber: string;
  status: string;
  customerName: string;
  shippingAddress: string;
  estimatedDate: string | null;
  updatedAt: string;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    PENDING:   { label: 'PENDING',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    ASSIGNED:  { label: 'ASSIGNED',  color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    PICKED_UP: { label: 'PICKED UP', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    IN_TRANSIT:{ label: 'IN TRANSIT',color: '#e8d5a3', bg: 'rgba(232,213,163,0.1)' },
    DELIVERED: { label: 'DELIVERED', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    FAILED:    { label: 'FAILED',    color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  };
  const s = map[status] || { label: status, color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
  return (
    <span style={{
      fontSize: '0.6rem', letterSpacing: '0.12em', fontWeight: 500,
      color: s.color, background: s.bg,
      border: `1px solid ${s.color}30`,
      padding: '2px 8px', borderRadius: '3px',
    }}>
      {s.label}
    </span>
  );
}

function StatCard({
  label, value, sub, accent = '#e8d5a3', icon,
}: {
  label: string; value: string | number; sub?: string; accent?: string; icon: string;
}) {
  return (
    <div style={{
      background: 'rgba(240,230,211,0.03)',
      border: '1px solid rgba(240,230,211,0.07)',
      borderRadius: '10px',
      padding: '20px 22px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: `linear-gradient(90deg, transparent, ${accent}40, transparent)`,
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.62rem', color: '#4b5563', letterSpacing: '0.18em', marginBottom: '10px' }}>
            {label}
          </div>
          <div style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '2rem', fontWeight: 700,
            color: accent, lineHeight: 1,
          }}>
            {value}
          </div>
          {sub && (
            <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '6px' }}>{sub}</div>
          )}
        </div>
        <div style={{
          fontSize: '1.5rem',
          opacity: 0.3,
          marginTop: '2px',
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function DeliveryDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DeliveryStats>({
    totalDeliveries: 0,
    completedDeliveries: 0,
    pendingDeliveries: 0,
    inTransitDeliveries: 0,
    assignedDeliveries: 0,
    failedDeliveries: 0,
    successRate: 0,
  });
  const [recent, setRecent] = useState<RecentDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    fetchData();
    const tick = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  async function fetchData() {
    try {
      const [statsRes, recentRes] = await Promise.all([
        fetch('/api/delivery/stats'),
        fetch('/api/delivery/recent'),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (recentRes.ok) setRecent(await recentRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const completionPct = stats.totalDeliveries > 0
    ? Math.round((stats.completedDeliveries / stats.totalDeliveries) * 100)
    : 0;

  const today = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1100px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@600;700;800&display=swap');
        .quick-link {
          display: flex; flex-direction: column; gap: 4px;
          padding: 18px 20px; border-radius: 8px; text-decoration: none;
          background: rgba(240,230,211,0.02);
          border: 1px solid rgba(240,230,211,0.07);
          transition: all 0.2s; color: inherit;
        }
        .quick-link:hover {
          background: rgba(240,230,211,0.05);
          border-color: rgba(232,213,163,0.2);
          transform: translateY(-1px);
        }
        .row-hover { transition: background 0.15s; }
        .row-hover:hover { background: rgba(240,230,211,0.03); }
        @keyframes fadeIn { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease both; }
      `}</style>

      {/* Header */}
      <div className="fade-in" style={{ marginBottom: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.62rem', color: '#4b5563', letterSpacing: '0.2em', marginBottom: '6px' }}>
            DELIVERY OPERATIONS CENTER
          </div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800, fontSize: '2.2rem',
            color: '#f0e6d3', letterSpacing: '-0.01em', lineHeight: 1.1,
          }}>
            Overview
          </h1>
          <p style={{ fontSize: '0.75rem', color: '#4b5563', marginTop: '6px' }}>
            Welcome back, {session?.user?.name}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '1.4rem', fontWeight: 300,
            color: '#e8d5a3', letterSpacing: '0.05em',
          }}>
            {timeStr}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#4b5563', marginTop: '2px' }}>{today}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#374151', fontSize: '0.75rem', letterSpacing: '0.15em', padding: '40px 0' }}>
          LOADING DATA...
        </div>
      ) : (
        <>
          {/* Stat grid */}
          <div className="fade-in" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            marginBottom: '12px',
            animationDelay: '0.05s',
          }}>
            <StatCard label="TOTAL DELIVERIES" value={stats.totalDeliveries} icon="◫" sub="All time" />
            <StatCard label="IN TRANSIT" value={stats.inTransitDeliveries} icon="▶" accent="#e8d5a3" sub="En route now" />
            <StatCard label="PENDING" value={stats.pendingDeliveries} icon="◷" accent="#f59e0b" sub="Awaiting pickup" />
            <StatCard label="COMPLETED" value={stats.completedDeliveries} icon="◉" accent="#10b981" sub="Successfully delivered" />
          </div>

          <div className="fade-in" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '28px',
            animationDelay: '0.1s',
          }}>
            {/* Progress bar card */}
            <div style={{
              background: 'rgba(240,230,211,0.03)',
              border: '1px solid rgba(240,230,211,0.07)',
              borderRadius: '10px',
              padding: '20px 22px',
            }}>
              <div style={{ fontSize: '0.62rem', color: '#4b5563', letterSpacing: '0.18em', marginBottom: '16px' }}>
                COMPLETION RATE
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px' }}>
                <span style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: '2.5rem', fontWeight: 700, color: '#10b981',
                }}>
                  {completionPct}%
                </span>
                <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                  {stats.completedDeliveries}/{stats.totalDeliveries} delivered
                </span>
              </div>
              <div style={{
                height: '4px', background: 'rgba(240,230,211,0.08)',
                borderRadius: '2px', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${completionPct}%`,
                  background: 'linear-gradient(90deg, #10b981, #6ee7b7)',
                  borderRadius: '2px',
                  transition: 'width 1s ease',
                }} />
              </div>
              {stats.failedDeliveries > 0 && (
                <div style={{ fontSize: '0.65rem', color: '#ef4444', marginTop: '10px' }}>
                  ⚠ {stats.failedDeliveries} failed deliveries
                </div>
              )}
            </div>

            {/* Status breakdown */}
            <div style={{
              background: 'rgba(240,230,211,0.03)',
              border: '1px solid rgba(240,230,211,0.07)',
              borderRadius: '10px',
              padding: '20px 22px',
            }}>
              <div style={{ fontSize: '0.62rem', color: '#4b5563', letterSpacing: '0.18em', marginBottom: '16px' }}>
                STATUS BREAKDOWN
              </div>
              {[
                { label: 'Assigned', val: stats.assignedDeliveries, color: '#6366f1' },
                { label: 'In Transit', val: stats.inTransitDeliveries, color: '#e8d5a3' },
                { label: 'Completed', val: stats.completedDeliveries, color: '#10b981' },
                { label: 'Failed', val: stats.failedDeliveries, color: '#ef4444' },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: '10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: row.color }} />
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{row.label}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: row.color, fontWeight: 500 }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="fade-in" style={{ marginBottom: '28px', animationDelay: '0.15s' }}>
            <div style={{ fontSize: '0.62rem', color: '#4b5563', letterSpacing: '0.18em', marginBottom: '14px' }}>
              QUICK ACCESS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {[
                { href: '/delivery/pending', icon: '◷', label: 'Pending', sub: `${stats.pendingDeliveries} waiting` },
                { href: '/delivery/active', icon: '▶', label: 'Active', sub: `${stats.inTransitDeliveries} in transit` },
                { href: '/delivery/completed', icon: '◉', label: 'Completed', sub: `${stats.completedDeliveries} done` },
                { href: '/delivery/profile', icon: '◈', label: 'Profile', sub: 'Your info' },
              ].map(item => (
                <Link key={item.href} href={item.href} className="quick-link">
                  <span style={{ fontSize: '1.2rem', color: '#e8d5a3', opacity: 0.6 }}>{item.icon}</span>
                  <span style={{ fontSize: '0.8rem', color: '#f0e6d3', fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontSize: '0.65rem', color: '#4b5563' }}>{item.sub}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent deliveries */}
          {recent.length > 0 && (
            <div className="fade-in" style={{ animationDelay: '0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '0.62rem', color: '#4b5563', letterSpacing: '0.18em' }}>
                  RECENT DELIVERIES
                </div>
                <Link href="/delivery/completed" style={{
                  fontSize: '0.65rem', color: '#e8d5a3', textDecoration: 'none',
                  letterSpacing: '0.1em', opacity: 0.6,
                }}>
                  VIEW ALL →
                </Link>
              </div>
              <div style={{
                background: 'rgba(240,230,211,0.02)',
                border: '1px solid rgba(240,230,211,0.07)',
                borderRadius: '10px',
                overflow: 'hidden',
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.5fr 1fr 0.8fr',
                  padding: '10px 18px',
                  borderBottom: '1px solid rgba(240,230,211,0.05)',
                }}>
                  {['ORDER', 'CUSTOMER', 'STATUS', 'UPDATED'].map(h => (
                    <div key={h} style={{ fontSize: '0.58rem', color: '#374151', letterSpacing: '0.15em' }}>{h}</div>
                  ))}
                </div>
                {recent.slice(0, 6).map((d, i) => (
                  <div
                    key={d.id}
                    className="row-hover"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1.5fr 1fr 0.8fr',
                      padding: '12px 18px',
                      borderBottom: i < recent.length - 1 ? '1px solid rgba(240,230,211,0.04)' : 'none',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', color: '#e8d5a3', fontWeight: 500 }}>
                      #{d.orderNumber}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#f0e6d3' }}>{d.customerName}</div>
                      <div style={{ fontSize: '0.62rem', color: '#4b5563', marginTop: '2px' }}>
                        {d.shippingAddress?.slice(0, 32)}{d.shippingAddress?.length > 32 ? '…' : ''}
                      </div>
                    </div>
                    <div><StatusBadge status={d.status} /></div>
                    <div style={{ fontSize: '0.65rem', color: '#4b5563' }}>
                      {new Date(d.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}