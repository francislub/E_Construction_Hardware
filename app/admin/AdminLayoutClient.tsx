'use client'

import { ReactNode, useState, useEffect, createContext, useContext } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

// ─── Sidebar context ──────────────────────────────────────────────────────────
const SidebarContext = createContext({ collapsed: false, toggle: () => {} })
export const useSidebar = () => useContext(SidebarContext)

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: DashIcon },
  { href: '/admin/categories', label: 'Categories', icon: CatIcon },
  { href: '/admin/products', label: 'Products', icon: BoxIcon },
  { href: '/admin/orders', label: 'Orders', icon: CartIcon },
  { href: '/admin/users', label: 'Users', icon: UsersIcon },
  { href: '/admin/suppliers', label: 'Suppliers', icon: FactoryIcon },
  { href: '/admin/deliveries', label: 'Deliveries', icon: TruckIcon },
  // { href: '/admin/payments', label: 'Payments', icon: CoinIcon },
]

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function DashIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
}
function CatIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
}
function BoxIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
}
function CartIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
}
function UsersIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function FactoryIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/></svg>
}
function TruckIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
}
function CoinIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
}
function ChevronLeft({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
}
function ChevronRight({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
}
function MenuIcon({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
}
function LogOutIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
}

// ─── Sidebar component ────────────────────────────────────────────────────────
function Sidebar({ email }: { email?: string | null }) {
  const { collapsed, toggle } = useSidebar()
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col h-screen sticky top-0 flex-shrink-0 transition-all duration-300 ease-in-out"
        style={{
          width: collapsed ? '68px' : '240px',
          background: '#0a0f1e',
          borderRight: '1px solid #1a2235',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 py-5 flex-shrink-0 overflow-hidden"
          style={{ borderBottom: '1px solid #1a2235', minHeight: '65px' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            🔩
          </div>
          {!collapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <p className="text-white font-black text-sm tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                Butebi
              </p>
              <p className="text-amber-500/60 text-xs font-mono">ADMIN</p>
            </div>
          )}
        </div>

        {/* Toggle button */}
        <button
          onClick={toggle}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-colors hover:opacity-90"
          style={{ background: '#f59e0b', color: '#000' }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150 group relative overflow-hidden"
                style={{
                  background: active ? '#f59e0b18' : 'transparent',
                  color: active ? '#fbbf24' : '#64748b',
                  borderLeft: active ? '2px solid #f59e0b' : '2px solid transparent',
                }}
              >
                <span
                  className="flex-shrink-0 transition-transform duration-150 group-hover:scale-110"
                  style={{ color: active ? '#fbbf24' : '#475569' }}
                >
                  <Icon size={18} />
                </span>
                {!collapsed && (
                  <span className="text-sm font-medium whitespace-nowrap overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {item.label}
                  </span>
                )}
                {!active && (
                  <span
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                    style={{ background: '#ffffff08' }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div
          className="px-3 py-4 flex-shrink-0 overflow-hidden"
          style={{ borderTop: '1px solid #1a2235' }}
        >
          {!collapsed && (
            <div className="mb-3 px-2">
              <p className="text-xs text-slate-500 truncate">{email}</p>
              <p className="text-xs text-amber-500/60 font-mono">Administrator</p>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2 transition-colors hover:bg-red-500/10 text-slate-500 hover:text-red-400"
            title={collapsed ? 'Sign out' : undefined}
          >
            <LogOutIcon size={16} />
            {!collapsed && <span className="text-sm font-medium">Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

// ─── Mobile top bar ───────────────────────────────────────────────────────────
function MobileTopBar({ email, mobileOpen, setMobileOpen }: { email?: string | null; mobileOpen: boolean; setMobileOpen: (v: boolean) => void }) {
  const pathname = usePathname()
  const current = NAV_ITEMS.find((n) => pathname === n.href || pathname.startsWith(n.href + '/'))

  return (
    <>
      <header
        className="md:hidden flex items-center justify-between px-4 py-3 flex-shrink-0 z-20"
        style={{ background: '#0a0f1e', borderBottom: '1px solid #1a2235' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <MenuIcon size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">🔩</span>
            <span className="text-white font-black text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>Butebi</span>
            <span className="text-amber-500/60 text-xs font-mono">ADMIN</span>
          </div>
        </div>
        {current && (
          <div className="flex items-center gap-1.5 text-amber-400 text-sm font-medium">
            <current.icon size={16} />
            <span>{current.label}</span>
          </div>
        )}
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 flex flex-col"
            style={{ background: '#0a0f1e', borderRight: '1px solid #1a2235' }}
          >
            <div className="flex items-center justify-between px-4 py-5" style={{ borderBottom: '1px solid #1a2235' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>🔩</div>
                <div>
                  <p className="text-white font-black text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>Butebi</p>
                  <p className="text-amber-500/60 text-xs font-mono">ADMIN</p>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-slate-500 hover:text-white p-1 text-xl leading-none">×</button>
            </div>
            <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
                    style={{
                      background: active ? '#f59e0b18' : 'transparent',
                      color: active ? '#fbbf24' : '#64748b',
                      borderLeft: active ? '2px solid #f59e0b' : '2px solid transparent',
                    }}
                  >
                    <Icon size={18} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
            <div className="px-3 py-4" style={{ borderTop: '1px solid #1a2235' }}>
              <p className="text-xs text-slate-500 px-2 mb-2 truncate">{email}</p>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOutIcon size={16} />
                <span className="text-sm font-medium">Sign out</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}

// ─── Root layout ──────────────────────────────────────────────────────────────
export default function AdminLayoutClient({
  children,
  email,
}: {
  children: ReactNode
  email?: string | null
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Persist collapse preference
  useEffect(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed')
    if (saved !== null) setCollapsed(saved === 'true')
  }, [])

  const toggle = () => {
    setCollapsed((v) => {
      localStorage.setItem('admin-sidebar-collapsed', String(!v))
      return !v
    })
  }

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
      `}</style>
      <div
        className="flex h-screen overflow-hidden"
        style={{ background: '#060d1a', fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        <Sidebar email={email} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <MobileTopBar email={email} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
          <main
            className="flex-1 overflow-y-auto"
            style={{ background: '#060d1a' }}
          >
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  )
}