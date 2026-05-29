'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const YEAR = new Date().getFullYear()

function Field({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  hint,
}: {
  label: string
  id: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  hint?: string
}) {
  const [focused, setFocused] = useState(false)
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        <input
          type={isPassword ? (show ? 'text' : 'password') : type}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          placeholder={placeholder}
          className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all duration-200 pr-10"
          style={{
            background: '#0f172a',
            border: `1.5px solid ${focused ? '#f59e0b' : '#1e293b'}`,
            color: '#f1f5f9',
            boxShadow: focused ? '0 0 0 3px #f59e0b22' : 'none',
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-xs"
          >
            {show ? '🙈' : '👁'}
          </button>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+', pass: password.length >= 8 },
    { label: 'A-Z', pass: /[A-Z]/.test(password) },
    { label: '0-9', pass: /\d/.test(password) },
    { label: '#$%', pass: /[^A-Za-z0-9]/.test(password) },
  ]
  const score = checks.filter((c) => c.pass).length
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e']
  if (!password) return null
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i < score ? colors[score - 1] : '#1e293b' }}
          />
        ))}
      </div>
      <div className="flex gap-2">
        {checks.map((c) => (
          <span
            key={c.label}
            className="text-xs font-mono px-1.5 py-0.5 rounded transition-colors"
            style={{
              background: c.pass ? '#14532d' : '#1e293b',
              color: c.pass ? '#86efac' : '#475569',
            }}
          >
            {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function AdminRegisterPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, inviteCode }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/auth/admin/login?registered=true'), 2000)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#020817', fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=Syne:wght@700;800&display=swap');`}</style>
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-4xl mx-auto">
            🛡️
          </div>
          <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
            Admin Created
          </h2>
          <p className="text-slate-400 text-sm">Redirecting to admin sign in…</p>
        </div>
      </div>
    )
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
        .glow { box-shadow: 0 0 40px #f59e0b18; }
        .spin { animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        /* Subtle grid background */
        .grid-bg {
          background-image: linear-gradient(rgba(248,196,60,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(248,196,60,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>

      <div className="grid-bg fixed inset-0 pointer-events-none" />

      {/* Nav */}
      <nav className="relative px-8 py-5 flex items-center justify-between border-b border-slate-800/60">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-black text-xl"
          style={{ fontFamily: "'Syne', sans-serif", color: '#f1f5f9' }}
        >
          <span>🔩</span>
          <span>HardwareHub</span>
        </Link>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-semibold" style={{ background: '#f59e0b15', color: '#f59e0b', border: '1px solid #f59e0b30' }}>
          🛡 ADMIN PORTAL
        </div>
      </nav>

      <div className="relative flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md card-in">

          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 glow"
              style={{ background: 'linear-gradient(135deg, #92400e, #f59e0b)' }}
            >
              🛡️
            </div>
            <h1
              className="text-3xl font-black text-white"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Admin Registration
            </h1>
            <p className="mt-2 text-slate-500 text-sm">
              Restricted access. An invite code is required.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-4 rounded-xl text-sm font-medium" style={{ background: '#450a0a', border: '1px solid #7f1d1d', color: '#fca5a5' }}>
              ⚠️ {error}
            </div>
          )}

          <div
            className="rounded-2xl p-6 space-y-5 glow"
            style={{ background: '#0d1526', border: '1px solid #1e293b' }}
          >
            {/* Invite Code — prominent */}
            <div
              className="rounded-xl p-4 space-y-2"
              style={{ background: '#f59e0b0d', border: '1px solid #f59e0b25' }}
            >
              <label className="block text-xs font-bold uppercase tracking-widest text-amber-500 mb-1.5">
                Invite Code <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                placeholder="XXXX-XXXX-XXXX"
                maxLength={19}
                className="w-full rounded-lg px-4 py-2.5 outline-none transition-all duration-200 tracking-widest text-center font-mono font-semibold"
                style={{
                  background: '#020817',
                  border: '1.5px solid #f59e0b40',
                  color: '#fbbf24',
                  fontSize: '16px',
                  letterSpacing: '0.15em',
                }}
              />
              <p className="text-xs text-slate-500">
                Contact your system administrator to obtain an invite code.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Field label="Full Name" id="name" value={name} onChange={setName} placeholder="Jane Admin" required />
                </div>
                <Field label="Email" id="email" type="email" value={email} onChange={setEmail} placeholder="admin@hardwarehub.com" required />
                <Field label="Phone" id="phone" type="tel" value={phone} onChange={setPhone} placeholder="+1 555 000 0000" />
              </div>

              <div className="border-t pt-4" style={{ borderColor: '#1e293b' }}>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Security</p>
                <div className="space-y-4">
                  <div>
                    <Field
                      label="Password"
                      id="password"
                      type="password"
                      value={password}
                      onChange={setPassword}
                      placeholder="••••••••"
                      required
                      hint="Min 8 chars, uppercase, number, symbol recommended"
                    />
                    <PasswordStrength password={password} />
                  </div>
                  <Field
                    label="Confirm Password"
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !inviteCode}
                className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
                style={{
                  background: 'linear-gradient(135deg, #92400e, #d97706)',
                  color: '#fff',
                }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Verifying & Creating…
                  </span>
                ) : (
                  'Create Admin Account →'
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-slate-600">
            Already have an admin account?{' '}
            <Link href="/auth/admin/login" className="text-amber-500 font-semibold hover:text-amber-400 transition-colors">
              Admin Sign In
            </Link>
          </p>
        </div>
      </div>

      <footer className="relative text-center py-5 text-xs text-slate-700 border-t border-slate-800/50">
        © {YEAR} HardwareHub. All rights reserved.
      </footer>
    </div>
  )
}