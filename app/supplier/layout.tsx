'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  {
    group: 'Overview',
    items: [
      { href: '/supplier/dashboard', label: 'Dashboard', icon: '▦', exact: true },
    ],
  },
  {
    group: 'Catalogue',
    items: [
      { href: '/supplier/products', label: 'My Products', icon: '📦' },
      { href: '/supplier/products/new', label: 'Add Product', icon: '＋' },
    ],
  },
  {
    group: 'Commerce',
    items: [
      { href: '/supplier/orders', label: 'Orders', icon: '🛒' },
      { href: '/supplier/analytics', label: 'Analytics', icon: '📊' },
    ],
  },
  {
    group: 'Account',
    items: [
      { href: '/supplier/profile', label: 'Company Profile', icon: '🏭' },
      { href: '/supplier/settings', label: 'Settings', icon: '⚙' },
    ],
  },
];

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted || status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, border: '3px solid rgba(245,158,11,0.2)', borderTop: '3px solid #f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ color: 'rgba(148,163,184,0.7)', fontSize: 13, fontFamily: 'Georgia,serif' }}>Loading portal…</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  const supplierName = session?.user?.name ?? 'Supplier';
  const supplierEmail = session?.user?.email ?? '';

  async function handleLogout() {
    setLoggingOut(true);
    await signOut({ callbackUrl: '/auth/login' });
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'DM Sans', Georgia, sans-serif", background: '#f0f2f8' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(245,158,11,0.3); border-radius: 2px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .nav-item:hover { background: rgba(245,158,11,0.08) !important; }
        .nav-item.active { background: rgba(245,158,11,0.14) !important; border-left-color: #f59e0b !important; }
        .logout-btn:hover { background: rgba(239,68,68,0.12) !important; border-color: rgba(239,68,68,0.25) !important; }
        .logout-btn:hover .logout-label { color: #f87171 !important; }
        .logout-btn:hover .logout-icon { color: #f87171 !important; }
        .logout-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
      <aside style={{
        width: collapsed ? 72 : 256,
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0d1321 0%, #0a0f1e 100%)',
        borderRight: '1px solid rgba(245,158,11,0.1)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
        zIndex: 50,
      }}>

        {/* Logo */}
        <div style={{ padding: '24px 16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', gap: 8 }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🔨</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Butebi</div>
                <div style={{ fontSize: 10, color: 'rgba(245,158,11,0.8)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Supplier Portal</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🔨</div>
          )}
          <button onClick={() => setCollapsed(c => !c)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(148,163,184,0.7)', fontSize: 12, flexShrink: 0, transition: 'all 0.2s' }}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {/* Supplier Avatar */}
        {!collapsed && (
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0, border: '2px solid rgba(245,158,11,0.3)' }}>
              {supplierName.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{supplierName}</div>
              <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{supplierEmail}</div>
            </div>
            <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
              <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 7px', borderRadius: 4, background: 'rgba(5,150,105,0.2)', color: '#34d399', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Active</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 10px' }}>
          {NAV_ITEMS.map(({ group, items }) => (
            <div key={group} style={{ marginBottom: 24 }}>
              {!collapsed && (
                <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(148,163,184,0.35)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6, padding: '0 8px' }}>{group}</div>
              )}
              {items.map(({ href, label, icon, exact }) => {
                const active = isActive(href, exact);
                return (
                  <Link key={href} href={href} className={`nav-item${active ? ' active' : ''}`} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: collapsed ? '10px' : '10px 12px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    borderRadius: 10, marginBottom: 2, textDecoration: 'none',
                    borderLeft: `3px solid ${active ? '#f59e0b' : 'transparent'}`,
                    background: active ? 'rgba(245,158,11,0.14)' : 'transparent',
                    transition: 'all 0.2s',
                  }}>
                    <span style={{ fontSize: 17, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
                    {!collapsed && (
                      <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#fbbf24' : 'rgba(203,213,225,0.7)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{label}</span>
                    )}
                    {!collapsed && active && (
                      <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Back to Store */}
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: collapsed ? '10px' : '10px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 10, textDecoration: 'none',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            transition: 'all 0.2s',
          }}>
            <span style={{ fontSize: 16 }}>←</span>
            {!collapsed && <span style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)', fontWeight: 500 }}>Back to Store</span>}
          </Link>

          {/* Logout */}
          <button
            className="logout-btn"
            onClick={handleLogout}
            disabled={loggingOut}
            title={collapsed ? 'Log out' : undefined}
            aria-label="Log out"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: collapsed ? '10px' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 10, width: '100%', cursor: 'pointer',
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.15)',
              transition: 'all 0.2s',
            }}
          >
            {loggingOut ? (
              <span style={{ width: 16, height: 16, border: '2px solid rgba(248,113,113,0.3)', borderTop: '2px solid #f87171', borderRadius: '50%', animation: 'spin 0.6s linear infinite', flexShrink: 0, display: 'inline-block' }} />
            ) : (
              <span className="logout-icon" style={{ fontSize: 15, lineHeight: 1, flexShrink: 0, color: 'rgba(248,113,113,0.7)', transition: 'color 0.2s' }}>
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </span>
            )}
            {!collapsed && (
              <span className="logout-label" style={{ fontSize: 12, fontWeight: 500, color: 'rgba(248,113,113,0.7)', whiteSpace: 'nowrap', transition: 'color 0.2s' }}>
                {loggingOut ? 'Logging out…' : 'Log out'}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}