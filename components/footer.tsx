"use client"

import Link from 'next/link'
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Youtube, Wrench, ArrowRight, Zap, Shield, Clock, ChevronRight, ExternalLink } from 'lucide-react'

const QUICK_LINKS = [
  { label: 'All Products', href: '/products' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'My Account', href: '/dashboard' },
  { label: 'Shopping Cart', href: '/cart' },
]

const SUPPORT_LINKS = [
  { label: 'Help Center', href: '#' },
  { label: 'Shipping Information', href: '#' },
  { label: 'Returns & Refunds', href: '#' },
  { label: 'Track My Order', href: '#' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms & Conditions', href: '#' },
]

const SOCIALS = [
  { Icon: Facebook, label: 'Facebook', href: '#', color: '#1877F2' },
  { Icon: Twitter, label: 'Twitter / X', href: '#', color: '#1DA1F2' },
  { Icon: Instagram, label: 'Instagram', href: '#', color: '#E4405F' },
  { Icon: Youtube, label: 'YouTube', href: '#', color: '#FF0000' },
]

const TRUST_BADGES = [
  { icon: Shield, label: 'Secure Payments' },
  { icon: Zap, label: 'Fast Delivery' },
  { icon: Clock, label: '24/7 Support' },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{ background: 'linear-gradient(180deg, #0c0f1a 0%, #060810 100%)' }} className="text-gray-300">

      {/* Top Divider with accent */}
      <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.5) 30%, rgba(251,191,36,0.6) 50%, rgba(37,99,235,0.5) 70%, transparent 100%)' }} />

      {/* Newsletter Section */}
      <div style={{ background: 'linear-gradient(135deg, #1d2d6e 0%, #1a2355 50%, #0f1a45 100%)' }} className="relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }}
        />
        <div className="absolute right-0 top-0 w-96 h-full opacity-10"
          style={{ background: 'radial-gradient(ellipse at right center, #f59e0b 0%, transparent 70%)' }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left max-w-md">
              <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-[0.15em] mb-3">
                <Zap size={12} />
                Exclusive Newsletter
              </div>
              <h3 className="text-white font-black text-2xl mb-2" style={{ fontFamily: "'Georgia', serif" }}>
                Get Deals Before Anyone Else
              </h3>
              <p className="text-blue-200/70 text-sm">
                Join <strong className="text-white">12,000+</strong> contractors and builders who save big every month.
              </p>
            </div>
            <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 sm:w-80">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-0 bg-white/95"
                />
              </div>
              <button
                className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-gray-900 transition-all hover:-translate-y-0.5 active:translate-y-0 flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 4px 20px rgba(245,158,11,0.35)' }}
              >
                Subscribe <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-center gap-8 flex-wrap">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-blue-200/60 text-xs font-medium">
                <Icon size={13} className="text-blue-400" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12">

          {/* Brand — wider column */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}
              >
                <Wrench size={20} className="text-white group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <div className="leading-none">
                <div className="text-xl font-black text-white tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>BUTEBI</div>
                <div className="text-[9px] font-bold text-blue-400 tracking-[0.2em] uppercase mt-0.5">Hardware Store</div>
              </div>
            </Link>

            <p className="text-sm leading-relaxed text-gray-500 mb-6 max-w-xs">
              Uganda's trusted partner for quality hardware, tools, and construction materials since 2020. Serving builders, contractors, and DIY enthusiasts nationwide.
            </p>

            {/* Socials */}
            <div className="flex gap-2 mb-8">
              {SOCIALS.map(({ Icon, label, href, color }) => (
                <a
                  key={label}
                  href={href}
                  title={label}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = `${color}22`, e.currentTarget.style.borderColor = `${color}44`)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)', e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                >
                  <Icon size={15} className="text-gray-400 hover:text-white transition-colors" />
                </a>
              ))}
            </div>

            {/* Country badge */}
            <div
              className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <span className="text-lg leading-none">🇺🇬</span>
              <div>
                <div className="text-gray-300 font-semibold">Proudly Ugandan</div>
                <div className="text-gray-600 text-[11px]">Serving East Africa since 2020</div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-bold mb-5 text-[11px] uppercase tracking-[0.2em]">Quick Links</h4>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-amber-400 transition-colors duration-150 group"
                  >
                    <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-amber-400 flex-shrink-0" />
                    <span className="group-hover:translate-x-0.5 transition-transform">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-bold mb-5 text-[11px] uppercase tracking-[0.2em]">Support</h4>
            <ul className="space-y-2.5">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-amber-400 transition-colors duration-150 group"
                  >
                    <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-amber-400 flex-shrink-0" />
                    <span className="group-hover:translate-x-0.5 transition-transform">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + Hours */}
          <div className="lg:col-span-4">
            <h4 className="text-white font-bold mb-5 text-[11px] uppercase tracking-[0.2em]">Get In Touch</h4>

            <ul className="space-y-4 mb-6">
              <li>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3.5 group"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors group-hover:bg-amber-500/10"
                    style={{ background: 'rgba(245,158,11,0.1)' }}>
                    <MapPin size={14} className="text-amber-400" />
                  </div>
                  <div className="text-sm text-gray-500 leading-relaxed group-hover:text-gray-300 transition-colors">
                    Busiika-Natyoole<br />
                    <span className="text-gray-600">Uganda, East Africa</span>
                  </div>
                </a>
              </li>
              <li>
                <a href="tel:+256758027368" className="flex gap-3.5 group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{ background: 'rgba(245,158,11,0.1)' }}>
                    <Phone size={14} className="text-amber-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 group-hover:text-amber-400 transition-colors font-medium">+256 758 027368</div>
                    <div className="text-xs text-gray-600">Call or WhatsApp</div>
                  </div>
                </a>
              </li>
              <li>
                <a href="mailto:eriatugume25@gmail.com" className="flex gap-3.5 group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{ background: 'rgba(245,158,11,0.1)' }}>
                    <Mail size={14} className="text-amber-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 group-hover:text-amber-400 transition-colors font-medium break-all">eriatugume25@gmail.com</div>
                    <div className="text-xs text-gray-600">We reply within 24 hours</div>
                  </div>
                </a>
              </li>
            </ul>

            {/* Business Hours Card */}
            <div
              className="rounded-2xl p-4 overflow-hidden relative"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20"
                style={{ background: '#2563eb', transform: 'translate(30%, -30%)' }} />
              <div className="relative">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
                  <Clock size={11} />
                  Business Hours
                </p>
                <div className="space-y-1.5">
                  {[
                    { day: 'Mon – Fri', hours: '8:00 AM – 6:00 PM', open: true },
                    { day: 'Saturday', hours: '9:00 AM – 4:00 PM', open: true },
                    { day: 'Sunday', hours: 'Closed', open: false },
                  ].map(({ day, hours, open }) => (
                    <div key={day} className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{day}</span>
                      <span className={`font-semibold ${open ? 'text-gray-300' : 'text-red-400/80'}`}>{hours}</span>
                    </div>
                  ))}
                </div>
                {/* Live indicator */}
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-[11px] text-emerald-400 font-medium">Currently Open</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom divider */}
      <div className="h-px mx-4 sm:mx-8" style={{ background: 'rgba(255,255,255,0.06)' }} />

      {/* Bottom Bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <p>
            &copy; {year}{' '}
            <span className="text-gray-500 font-semibold">Butebi Hardware Store.</span>{' '}
            All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-gray-400 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-gray-400 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-gray-400 transition-colors">Sitemap</Link>
          </div>
          <p className="text-gray-700">
            Built with ❤️ for Uganda's builders & makers
          </p>
        </div>
      </div>
    </footer>
  )
}