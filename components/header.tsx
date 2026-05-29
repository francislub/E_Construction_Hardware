'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { Menu, X, ShoppingCart, User, LogOut, Wrench, Phone, Search, Bell, ChevronDown, Zap, Package, HardHat, Paintbrush, Bolt, Shield } from 'lucide-react'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  {
    href: '/products',
    label: 'Products',
    mega: true,
    categories: [
      { icon: Wrench, label: 'Tools & Equipment', count: '2,400+', href: '/products?category=tools' },
      { icon: Bolt, label: 'Electrical', count: '800+', href: '/products?category=electrical' },
      { icon: Package, label: 'Plumbing', count: '600+', href: '/products?category=plumbing' },
      { icon: Paintbrush, label: 'Paint & Finishes', count: '400+', href: '/products?category=paint' },
      { icon: HardHat, label: 'Safety Gear', count: '300+', href: '/products?category=safety' },
      { icon: Shield, label: 'Fasteners', count: '1,200+', href: '/products?category=fasteners' },
    ],
  },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export function Header() {
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [cartCount] = useState(3)
  const searchRef = useRef<HTMLInputElement>(null)
  const dropdownTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  const handleMouseEnter = (label: string) => {
    if (dropdownTimer.current) clearTimeout(dropdownTimer.current)
    setActiveDropdown(label)
  }

  const handleMouseLeave = () => {
    dropdownTimer.current = setTimeout(() => setActiveDropdown(null), 180)
  }

  return (
    <>
      {/* Announcement Bar */}
      <div
        className="relative overflow-hidden text-white text-xs py-2 px-4 text-center font-semibold tracking-wide"
        style={{ background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #1a1a2e 100%)' }}
      >
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <span className="flex items-center gap-1.5">
            <Zap size={11} className="text-amber-400" />
            <span className="text-gray-300">Free delivery on orders over</span>
            <span className="text-amber-400 font-bold">UGX 500,000</span>
          </span>
          <span className="hidden sm:block text-gray-600">|</span>
          <span className="hidden sm:flex items-center gap-1.5">
            <Phone size={11} className="text-blue-400" />
            <span className="text-gray-300">+256 758 027368</span>
            <span className="text-gray-500 font-normal">· Mon–Fri 8AM–6PM</span>
          </span>
        </div>
      </div>

      {/* Main Header */}
      <header
        className="sticky top-0 z-50 transition-all duration-500"
        style={{
          background: scrolled
            ? 'rgba(255,255,255,0.97)'
            : 'rgba(255,255,255,1)',
          backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
          boxShadow: scrolled
            ? '0 1px 0 rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.06)'
            : '0 1px 0 rgba(0,0,0,0.07)',
        }}
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[68px] gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)' }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }} />
                <Wrench size={18} className="text-white relative z-10 group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <div className="leading-none">
                <div className="text-[17px] font-black text-gray-950 tracking-tight" style={{ fontFamily: "'Playfair Display', 'Georgia', serif", letterSpacing: '-0.02em' }}>
                  BUTEBI
                </div>
                <div className="text-[9px] font-bold text-blue-600 tracking-[0.25em] uppercase mt-0.5">
                  Hardware Store
                </div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
              {NAV_LINKS.map((link) => (
                <div
                  key={link.href}
                  className="relative"
                  onMouseEnter={() => link.mega ? handleMouseEnter(link.label) : undefined}
                  onMouseLeave={link.mega ? handleMouseLeave : undefined}
                >
                  <Link
                    href={link.href}
                    className={`
                      flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 relative group
                      ${activeDropdown === link.label ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50/70'}
                    `}
                  >
                    {link.label}
                    {link.mega && (
                      <ChevronDown
                        size={13}
                        className={`transition-transform duration-200 ${activeDropdown === link.label ? 'rotate-180 text-blue-600' : 'text-gray-400'}`}
                      />
                    )}
                    {/* Active indicator */}
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-blue-600 rounded-full group-hover:w-4 transition-all duration-200" />
                  </Link>

                  {/* Mega Dropdown */}
                  {link.mega && activeDropdown === link.label && (
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[480px] rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                      style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)' }}
                      onMouseEnter={() => handleMouseEnter(link.label)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className="bg-white p-3">
                        <div className="px-3 py-2 mb-2">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">Shop by Category</p>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {link.categories?.map(({ icon: Icon, label, count, href: catHref }) => (
                            <Link
                              key={label}
                              href={catHref}
                              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-blue-50 group/item transition-all duration-150"
                            >
                              <div className="w-9 h-9 rounded-lg bg-blue-50 group-hover/item:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors">
                                <Icon size={16} className="text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-800 group-hover/item:text-blue-700 transition-colors">{label}</div>
                                <div className="text-[11px] text-gray-400">{count} items</div>
                              </div>
                            </Link>
                          ))}
                        </div>
                        <div className="mt-2 mx-3 pt-2 border-t border-gray-100">
                          <Link
                            href="/products"
                            className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            View All Products →
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1.5">
              {/* Search */}
              <div className={`hidden md:flex items-center transition-all duration-300 overflow-hidden ${searchOpen ? 'w-52' : 'w-9'}`}>
                {searchOpen ? (
                  <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2 w-full">
                    <Search size={15} className="text-gray-400 flex-shrink-0" />
                    <input
                      ref={searchRef}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onBlur={() => { if (!searchQuery) setSearchOpen(false) }}
                      onKeyDown={e => e.key === 'Escape' && (setSearchOpen(false), setSearchQuery(''))}
                      placeholder="Search products…"
                      className="bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none w-full"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="flex-shrink-0">
                        <X size={13} className="text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                  >
                    <Search size={18} />
                  </button>
                )}
              </div>

              {session ? (
                <>
                  {/* Notifications */}
                  <button className="relative hidden md:flex w-9 h-9 items-center justify-center rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all">
                    <Bell size={18} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                  </button>

                  {/* Cart */}
                  <Link href="/cart" className="relative flex w-9 h-9 items-center justify-center rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all">
                    <ShoppingCart size={18} />
                    {cartCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 ring-2 ring-white">
                        {cartCount}
                      </span>
                    )}
                  </Link>

                  {/* User Menu */}
                  <div className="hidden md:flex items-center gap-1 pl-1.5 border-l border-gray-200 ml-1">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                        <User size={12} className="text-white" />
                      </div>
                      <span className="text-sm font-semibold truncate max-w-[80px]">
                        {session.user?.name?.split(' ')[0] || 'Account'}
                      </span>
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Sign out"
                    >
                      <LogOut size={15} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="hidden md:flex items-center gap-2 pl-2 border-l border-gray-200 ml-1">
                  <Link
                    href="/auth/login"
                    className="text-sm font-semibold text-gray-700 hover:text-blue-600 px-4 py-2 rounded-xl hover:bg-blue-50 transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="text-sm font-bold text-white px-5 py-2 rounded-xl transition-all relative overflow-hidden group/btn"
                    style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}
                  >
                    <span className="relative z-10">Sign Up</span>
                    <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200"
                      style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }} />
                  </Link>
                </div>
              )}

              {/* Mobile toggle */}
              <button
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors ml-1"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                <div className="relative w-5 h-5">
                  <span className={`absolute block h-0.5 w-5 bg-gray-800 rounded transition-all duration-300 ${isMenuOpen ? 'top-2 rotate-45' : 'top-0.5'}`} />
                  <span className={`absolute block h-0.5 bg-gray-800 rounded transition-all duration-200 top-2 ${isMenuOpen ? 'w-0 opacity-0' : 'w-5 opacity-100'}`} />
                  <span className={`absolute block h-0.5 w-5 bg-gray-800 rounded transition-all duration-300 ${isMenuOpen ? 'top-2 -rotate-45' : 'top-3.5'}`} />
                </div>
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="border-t border-gray-100 bg-white">
            {/* Mobile Search */}
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-3">
                <Search size={16} className="text-gray-400" />
                <input
                  placeholder="Search hardware, tools…"
                  className="bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none flex-1"
                />
              </div>
            </div>

            <div className="px-4 py-3 space-y-0.5">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                >
                  {link.label}
                  {link.mega && <ChevronDown size={14} className="text-gray-400" />}
                </Link>
              ))}
            </div>

            <div className="px-4 pb-4 pt-2 border-t border-gray-100">
              {session ? (
                <div className="space-y-1">
                  <Link href="/cart" onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                    <ShoppingCart size={16} /> Cart
                    {cartCount > 0 && <span className="ml-auto bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{cartCount}</span>}
                  </Link>
                  <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                    <User size={16} /> Dashboard
                  </Link>
                  <button onClick={() => signOut()}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all">
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 mt-2">
                  <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}
                    className="text-center px-4 py-3 text-sm font-semibold text-gray-800 border-2 border-gray-200 hover:border-blue-300 rounded-xl transition-all">
                    Sign In
                  </Link>
                  <Link href="/auth/register" onClick={() => setIsMenuOpen(false)}
                    className="text-center px-4 py-3 text-sm font-bold text-white rounded-xl transition-all"
                    style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}>
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  )
}