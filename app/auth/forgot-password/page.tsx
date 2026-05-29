'use client'

import { useState } from 'react'
import Link from 'next/link'

const YEAR = new Date().getFullYear()

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [focused, setFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        return
      }

      setSent(true)
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
        fontFamily: "'DM Sans', system-ui, sans-serif",
        background: 'linear-gradient(135deg, #f0f4ff 0%, #fafafa 60%, #fff7ed 100%)',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');
        .card-in { animation: cardIn 0.45s cubic-bezier(.4,0,.2,1) both; }
        @keyframes cardIn { from { opacity:0; transform:translateY(24px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        .success-in { animation: successIn 0.5s cubic-bezier(.34,1.56,.64,1) both; }
        @keyframes successIn { from { opacity:0; transform:scale(0.7); } to { opacity:1; transform:scale(1); } }
        .pulse-ring { animation: pulseRing 2s ease-out infinite; }
        @keyframes pulseRing { 0% { transform:scale(1); opacity:0.6; } 100% { transform:scale(2); opacity:0; } }
        .spin { animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      {/* Nav */}
      <nav className="px-8 py-5 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-black text-xl"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          <span className="text-2xl">🔩</span>
          <span className="text-gray-900">HardwareHub</span>
        </Link>
        <Link
          href="/auth/login"
          className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
        >
          ← Back to Sign In
        </Link>
      </nav>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md card-in">

          {!sent ? (
            <>
              {/* Icon */}
              <div className="relative flex justify-center mb-8">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="pulse-ring w-20 h-20 rounded-full"
                    style={{ background: '#dbeafe' }}
                  />
                </div>
                <div
                  className="relative w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}
                >
                  🔑
                </div>
              </div>

              <div className="text-center mb-8">
                <h1
                  className="text-3xl font-black text-gray-900"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  Forgot Password?
                </h1>
                <p className="mt-2 text-gray-500 text-sm leading-relaxed">
                  No worries. Enter the email linked to your account and we'll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">
                  ⚠️ {error}
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-gray-700 mb-1.5"
                    >
                      Email Address <span className="text-blue-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      required
                      placeholder="you@example.com"
                      className="w-full rounded-xl border-2 px-4 py-3 text-sm outline-none transition-all duration-200 bg-gray-50"
                      style={{
                        borderColor: focused ? '#2563eb' : '#e5e7eb',
                        boxShadow: focused ? '0 0 0 3px #2563eb22' : 'none',
                        background: focused ? '#fff' : '#f9fafb',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !email}
                    className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        Sending Link…
                      </span>
                    ) : (
                      'Send Reset Link →'
                    )}
                  </button>
                </form>

                <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-center gap-4 text-sm text-gray-400">
                  <span>Remember it?</span>
                  <Link
                    href="/auth/login"
                    className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Sign In
                  </Link>
                  <span>·</span>
                  <Link
                    href="/auth/register"
                    className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            </>
          ) : (
            /* ── Success State ── */
            <div className="text-center success-in space-y-5">
              <div className="flex justify-center">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
                  style={{ background: '#dcfce7' }}
                >
                  ✅
                </div>
              </div>
              <div>
                <h2
                  className="text-3xl font-black text-gray-900"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  Check Your Inbox
                </h2>
                <p className="mt-3 text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
                  We sent a password reset link to{' '}
                  <strong className="text-gray-700">{email}</strong>. It expires in <strong>1 hour</strong>.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl px-5 py-4 text-sm text-amber-700 text-left space-y-1">
                <p className="font-semibold">Didn't get it?</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs text-amber-600">
                  <li>Check your spam / junk folder</li>
                  <li>Make sure you entered the correct email</li>
                  <li>Wait a few minutes and try again</li>
                </ul>
              </div>

              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                ← Try a different email
              </button>

              <div className="pt-4">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}
                >
                  Back to Sign In →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400">
        © {YEAR} HardwareHub. All rights reserved.
      </footer>
    </div>
  )
}