'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const YEAR = new Date().getFullYear()

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/admin/dashboard',
      })

      if (result?.error) {
        setError('Invalid credentials or insufficient permissions.')
      } else if (result?.ok) {
        router.push('/admin/dashboard')
        router.refresh()
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: '#020817',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        .card-in { animation: cardIn 0.45s cubic-bezier(.4,0,.2,1) both; }
        @keyframes cardIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .glow { box-shadow: 0 0 60px #f59e0b12; }
        .spin { animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .grid-bg {
          background-image: linear-gradient(rgba(248,196,60,0.025) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(248,196,60,0.025) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .scan-line {
          background: linear-gradient(90deg, transparent, #f59e0b08, transparent);
          animation: scan 4s ease-in-out infinite;
        }
        @keyframes scan { 0%,100% { transform:translateY(-100%); } 50% { transform:translateY(400%); } }
      `}</style>

      <div className="grid-bg fixed inset-0 pointer-events-none" />

      {/* Top bar */}
      <nav className="relative px-8 py-5 flex items-center justify-between border-b border-slate-800/60">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-black text-xl"
          style={{ fontFamily: "'Syne', sans-serif", color: '#f1f5f9' }}
        >
          <span>🔩</span>
          <span>HardwareHub</span>
        </Link>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-semibold"
          style={{ background: '#f59e0b15', color: '#f59e0b', border: '1px solid #f59e0b30' }}
        >
          🛡 ADMIN PORTAL
        </div>
      </nav>

      <div className="relative flex-1 flex">
        {/* Left: brand panel */}
        <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-14 relative overflow-hidden border-r border-slate-800/60">
          <div
            className="scan-line absolute inset-x-0 h-1/4 pointer-events-none"
            style={{ top: 0 }}
          />

          <div className="space-y-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl glow"
              style={{ background: 'linear-gradient(135deg, #78350f, #d97706)' }}
            >
              🛡️
            </div>
            <p
              className="text-xs font-mono font-semibold tracking-widest"
              style={{ color: '#f59e0b' }}
            >
              SYSTEM ACCESS
            </p>
          </div>

          <div className="space-y-6">
            <h2
              className="text-4xl font-black text-white leading-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Admin Control Center
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Manage users, suppliers, delivery staff, orders, and platform settings from a single secure dashboard.
            </p>

            {/* Capability pills */}
            <div className="flex flex-wrap gap-2">
              {[
                'User Management',
                'Order Oversight',
                'Supplier Approval',
                'Analytics',
                'Platform Config',
                'Email Logs',
              ].map((cap) => (
                <span
                  key={cap}
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: '#f59e0b0f', color: '#fbbf24', border: '1px solid #f59e0b20' }}
                >
                  {cap}
                </span>
              ))}
            </div>

            {/* Audit notice */}
            <div
              className="rounded-xl p-4 text-xs"
              style={{ background: '#0f172a', border: '1px solid #1e293b', color: '#64748b' }}
            >
              🔒 All admin sessions are logged and audited. Unauthorized access is prohibited.
            </div>
          </div>

          <p className="text-slate-700 text-xs">© {YEAR} HardwareHub. All rights reserved.</p>
        </div>

        {/* Right: form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md card-in">

            {registered && (
              <div
                className="mb-5 p-4 rounded-xl text-sm font-medium"
                style={{ background: '#14532d20', border: '1px solid #14532d50', color: '#86efac' }}
              >
                🎉 Admin account created. Sign in below.
              </div>
            )}

            <div className="mb-8">
              <h1
                className="text-3xl font-black text-white"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Admin Sign In
              </h1>
              <p className="mt-1 text-slate-500 text-sm">
                Restricted to administrators only.
              </p>
            </div>

            {error && (
              <div
                className="mb-5 p-4 rounded-xl text-sm font-medium"
                style={{ background: '#450a0a', border: '1px solid #7f1d1d', color: '#fca5a5' }}
              >
                ⚠️ {error}
              </div>
            )}

            <div
              className="rounded-2xl p-6 glow"
              style={{ background: '#0d1526', border: '1px solid #1e293b' }}
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                    Admin Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    required
                    placeholder="admin@hardwarehub.com"
                    className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all duration-200"
                    style={{
                      background: '#020817',
                      border: `1.5px solid ${emailFocused ? '#f59e0b' : '#1e293b'}`,
                      color: '#f1f5f9',
                      boxShadow: emailFocused ? '0 0 0 3px #f59e0b22' : 'none',
                    }}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
                      Password <span className="text-red-400">*</span>
                    </label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs font-semibold transition-colors"
                      style={{ color: '#f59e0b' }}
                    >
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      required
                      placeholder="••••••••"
                      className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all duration-200 pr-12"
                      style={{
                        background: '#020817',
                        border: `1.5px solid ${passwordFocused ? '#f59e0b' : '#1e293b'}`,
                        color: '#f1f5f9',
                        boxShadow: passwordFocused ? '0 0 0 3px #f59e0b22' : 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors text-xs"
                    >
                      {showPassword ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
                  style={{ background: 'linear-gradient(135deg, #92400e, #d97706)', color: '#fff' }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Authenticating…
                    </span>
                  ) : (
                    'Sign In to Admin Panel →'
                  )}
                </button>
              </form>
            </div>

            <div className="mt-6 flex items-center justify-between text-xs text-slate-600">
              <Link href="/auth/login" className="hover:text-slate-400 transition-colors">
                ← User Login
              </Link>
              <Link href="/auth/admin/register" className="hover:text-amber-500 transition-colors text-slate-500">
                Register New Admin
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile footer */}
      <footer className="lg:hidden relative text-center py-5 text-xs text-slate-700 border-t border-slate-800/50">
        © {YEAR} HardwareHub. All rights reserved.
      </footer>
    </div>
  )
}