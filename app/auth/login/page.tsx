'use client'

import { useState, useEffect } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const YEAR = new Date().getFullYear()

const ROLE_HINTS = [
  { id: 'customer',  label: 'Customer',       icon: '🛒', color: '#2563eb', placeholder: 'customer@example.com' },
  { id: 'supplier',  label: 'Supplier',        icon: '🏭', color: '#059669', placeholder: 'supplier@business.com' },
  { id: 'staff',     label: 'Delivery Staff',  icon: '🚚', color: '#d97706', placeholder: 'driver@example.com' },
]

// ─── Role → redirect map ──────────────────────────────────────────────────────
function getDashboardRoute(role?: string | null): string {
  switch (role) {
    case 'SUPPLIER':        return '/supplier/dashboard'
    case 'DELIVERY_STAFF':  return '/delivery/dashboard'
    case 'ADMIN':           return '/admin'
    case 'CUSTOMER':
    default:                return '/dashboard'
  }
}

export default function LoginPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const registered   = searchParams.get('registered')
  const callbackUrl  = searchParams.get('callbackUrl') // honour next-auth redirects

  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState('')
  const [isLoading, setIsLoading]       = useState(false)
  const [activeRole, setActiveRole]     = useState(0)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passFocused, setPassFocused]   = useState(false)

  // Cycle role hints every 3 s
  useEffect(() => {
    const t = setInterval(() => setActiveRole(p => (p + 1) % ROLE_HINTS.length), 3000)
    return () => clearInterval(t)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,   // ← must be false so we can inspect the session
      })

      if (result?.error) {
        setError('Invalid email or password. Please try again.')
        return
      }

      if (result?.ok) {
        // Re-fetch the session so we can read the role
        const session = await getSession()
        const role    = (session?.user as any)?.role as string | undefined

        // If next-auth provided a callbackUrl use that, otherwise route by role
        const destination = callbackUrl ?? getDashboardRoute(role)
        router.push(destination)
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const currentRole = ROLE_HINTS[activeRole]

  return (
    <div
      style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        fontFamily: "'DM Sans', system-ui, sans-serif", background: '#f8fafc',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .fade-role  { animation: fadeRole  0.45s cubic-bezier(.4,0,.2,1) both; }
        .form-enter { animation: formEnter 0.45s cubic-bezier(.4,0,.2,1) both; }

        @keyframes fadeRole  { from { opacity:0; transform:translateY(5px); }  to { opacity:1; transform:translateY(0); } }
        @keyframes formEnter { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin      { to   { transform:rotate(360deg); } }
        @keyframes shimmer   {
          0%   { background-position: 200% 0; }
          100% { background-position:-200% 0; }
        }

        .btn-submit {
          width:100%; padding:14px; border-radius:12px; font-weight:800;
          color:#fff; font-size:14px; border:none; cursor:pointer;
          transition: opacity .2s, transform .15s;
        }
        .btn-submit:hover:not(:disabled) { opacity:.9; transform:translateY(-1px); }
        .btn-submit:active:not(:disabled){ transform:translateY(0); }
        .btn-submit:disabled              { opacity:.55; cursor:not-allowed; }

        .role-register-card {
          display:flex; flex-direction:column; align-items:center; gap:6px;
          padding:14px 10px; border-radius:14px; border:2px solid #e5e7eb;
          background:#fff; text-decoration:none; transition: all .2s;
        }
        .role-register-card:hover { border-color:#94a3b8; transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,0.07); }

        .spinner {
          width:16px; height:16px; border:2px solid rgba(255,255,255,.35);
          border-top-color:#fff; border-radius:50%; animation:spin .75s linear infinite;
        }

        .stat-pill {
          border-radius:14px; background:rgba(255,255,255,.06);
          padding:14px 16px;
        }
      `}</style>

      <div style={{ display: 'flex', flex: 1 }}>

        {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
        <div style={{
          width: '41.66%', minHeight: '100vh', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', padding: '48px', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(145deg, #0a0f1e 0%, #0d1a30 60%, #0f172a 100%)',
        }}
          className="hidden-mobile"
        >
          {/* dot grid */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
          {/* glow orb */}
          <div style={{ position: 'absolute', bottom: '10%', left: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

          {/* Logo */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔨</div>
            <div>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 900, letterSpacing: '-0.03em', fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>Butebi</div>
              <div style={{ color: 'rgba(245,158,11,0.7)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Hardware Hub</div>
            </div>
          </div>

          {/* Hero copy */}
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 50, padding: '5px 12px', marginBottom: 20 }}>
              <span style={{ fontSize: 10, color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>⚡ Uganda's #1 Hardware Platform</span>
            </div>
            <h2 style={{ color: '#fff', fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', fontFamily: "'Syne',sans-serif", marginBottom: 20 }}>
              The smarter way<br />to buy &amp; sell<br />
              <span style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>hardware.</span>
            </h2>

            {/* Role toggles */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ color: 'rgba(148,163,184,0.45)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 10 }}>Signing in as</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {ROLE_HINTS.map((r, i) => (
                  <button key={r.id} onClick={() => setActiveRole(i)} style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', border: `1px solid ${i === activeRole ? r.color + '55' : 'transparent'}`,
                    background: i === activeRole ? `${r.color}20` : 'rgba(255,255,255,0.05)',
                    color: i === activeRole ? r.color : 'rgba(255,255,255,0.4)',
                    transition: 'all .2s',
                  }}>
                    <span>{r.icon}</span><span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[['12K+','Products'],['800+','Suppliers'],['50K+','Customers']].map(([v, l]) => (
                <div key={l} className="stat-pill">
                  <div style={{ color: '#fff', fontSize: 22, fontWeight: 900, fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>{v}</div>
                  <div style={{ color: 'rgba(148,163,184,0.45)', fontSize: 11, marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          <p style={{ position: 'relative', color: 'rgba(148,163,184,0.25)', fontSize: 11 }}>© {YEAR} Butebi Hardware Hub. All rights reserved.</p>
        </div>

        {/* ── RIGHT: FORM ──────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>

          {/* Mobile header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🔨</div>
              <span style={{ fontWeight: 900, fontSize: 16, fontFamily: "'Syne',sans-serif", color: '#0f172a' }}>Butebi</span>
            </div>
            <Link href="/auth/register" style={{ fontSize: 13, fontWeight: 600, color: '#2563eb', textDecoration: 'none' }}>Create account →</Link>
          </div>

          {/* Form area */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
            <div style={{ width: '100%', maxWidth: 420 }} className="form-enter">

              {/* Heading */}
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 30, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', fontFamily: "'Syne',sans-serif", lineHeight: 1.1, marginBottom: 8 }}>
                  Welcome back 👋
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 14 }}>
                  <span>Signing in as</span>
                  <span key={currentRole.id} className="fade-role" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700, color: currentRole.color }}>
                    {currentRole.icon} {currentRole.label}
                  </span>
                </div>
              </div>

              {/* Flash messages */}
              {registered && (
                <div style={{ marginBottom: 18, padding: '13px 16px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: 13, fontWeight: 600 }}>
                  🎉 Account created! Please sign in to continue.
                </div>
              )}
              {error && (
                <div style={{ marginBottom: 18, padding: '13px 16px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Email Address</label>
                  <input
                    type="email" required
                    value={email} onChange={e => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)} onBlur={() => setEmailFocused(false)}
                    placeholder={currentRole.placeholder}
                    style={{
                      width: '100%', padding: '13px 16px', borderRadius: 12, fontSize: 14,
                      border: `2px solid ${emailFocused ? currentRole.color : '#e5e7eb'}`,
                      boxShadow: emailFocused ? `0 0 0 3px ${currentRole.color}22` : 'none',
                      background: '#fff', outline: 'none', transition: 'all .2s',
                      color: '#111',
                    }}
                  />
                </div>

                {/* Password */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Password</label>
                    <Link href="/auth/forgot-password" style={{ fontSize: 12, fontWeight: 600, color: currentRole.color, textDecoration: 'none' }}>Forgot password?</Link>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'} required
                      value={password} onChange={e => setPassword(e.target.value)}
                      onFocus={() => setPassFocused(true)} onBlur={() => setPassFocused(false)}
                      placeholder="••••••••"
                      style={{
                        width: '100%', padding: '13px 48px 13px 16px', borderRadius: 12, fontSize: 14,
                        border: `2px solid ${passFocused ? currentRole.color : '#e5e7eb'}`,
                        boxShadow: passFocused ? `0 0 0 3px ${currentRole.color}22` : 'none',
                        background: '#fff', outline: 'none', transition: 'all .2s',
                        color: '#111',
                      }}
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1, color: '#94a3b8', padding: 0 }}>
                      {showPassword ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit" disabled={isLoading}
                  className="btn-submit"
                  style={{ background: `linear-gradient(135deg, ${currentRole.color}, ${currentRole.color}cc)`, marginTop: 4, boxShadow: `0 4px 16px ${currentRole.color}40` }}
                >
                  {isLoading
                    ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><span className="spinner" />Signing in…</span>
                    : 'Sign In →'}
                </button>
              </form>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
                <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>New to Butebi?</span>
                <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
              </div>

              {/* Register links */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {ROLE_HINTS.map(r => (
                  <Link
                    key={r.id}
                    href={`/auth/register?role=${r.id === 'staff' ? 'DELIVERY_STAFF' : r.id.toUpperCase()}`}
                    className="role-register-card"
                  >
                    <span style={{ fontSize: 22 }}>{r.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{r.label}</span>
                    <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>Register</span>
                  </Link>
                ))}
              </div>

              {/* Admin portal */}
              <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                <Link href="/auth/admin/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8', fontWeight: 600, textDecoration: 'none' }}>
                  🛡 Admin Portal
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile footer */}
          <footer style={{ textAlign: 'center', padding: '16px', fontSize: 11, color: '#cbd5e1', borderTop: '1px solid #f1f5f9' }}>
            © {YEAR} Butebi Hardware Hub. All rights reserved.
          </footer>
        </div>
      </div>

      {/* Hide left panel on small screens via inline media override */}
      <style>{`
        @media (max-width: 1023px) { .hidden-mobile { display:none !important; } }
      `}</style>
    </div>
  )
}