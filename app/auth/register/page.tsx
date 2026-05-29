'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Role = 'CUSTOMER' | 'SUPPLIER' | 'DELIVERY_STAFF'

interface BaseForm {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

interface CustomerForm extends BaseForm {
  role: 'CUSTOMER'
}

interface SupplierForm extends BaseForm {
  role: 'SUPPLIER'
  companyName: string
  companyAddress: string
  companyPhone: string
  description: string
}

interface DeliveryForm extends BaseForm {
  role: 'DELIVERY_STAFF'
  licenseNumber: string
  vehicleType: string
}

type FormData = CustomerForm | SupplierForm | DeliveryForm

const ROLES: { id: Role; label: string; icon: string; tagline: string; color: string }[] = [
  {
    id: 'CUSTOMER',
    label: 'Customer',
    icon: '🛒',
    tagline: 'Shop tools & hardware',
    color: '#2563eb',
  },
  {
    id: 'SUPPLIER',
    label: 'Supplier',
    icon: '🏭',
    tagline: 'Sell your products',
    color: '#059669',
  },
  {
    id: 'DELIVERY_STAFF',
    label: 'Delivery Staff',
    icon: '🚚',
    tagline: 'Deliver orders',
    color: '#d97706',
  },
]

const VEHICLE_TYPES = ['Motorcycle', 'Bicycle', 'Car', 'Van', 'Truck']

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /\d/.test(password) },
    { label: 'Symbol', pass: /[^A-Za-z0-9]/.test(password) },
  ]
  const score = checks.filter((c) => c.pass).length
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e']
  if (!password) return null
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i < score ? colors[score - 1] : '#e5e7eb' }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {checks.map((c) => (
          <span
            key={c.label}
            className="text-xs px-2 py-0.5 rounded-full transition-all duration-200"
            style={{
              background: c.pass ? '#dcfce7' : '#f3f4f6',
              color: c.pass ? '#166534' : '#9ca3af',
            }}
          >
            {c.pass ? '✓' : '○'} {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function InputField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  hint,
  accentColor,
}: {
  label: string
  id: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  hint?: string
  accentColor: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1">
        {label} {required && <span style={{ color: accentColor }}>*</span>}
      </label>
      <input
        type={type}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border-2 px-4 py-2.5 text-sm transition-all duration-200 outline-none bg-white"
        style={{
          borderColor: focused ? accentColor : '#e5e7eb',
          boxShadow: focused ? `0 0 0 3px ${accentColor}22` : 'none',
        }}
      />
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

function SelectField({
  label,
  id,
  value,
  onChange,
  options,
  required,
  accentColor,
}: {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
  options: string[]
  required?: boolean
  accentColor: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1">
        {label} {required && <span style={{ color: accentColor }}>*</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        className="w-full rounded-xl border-2 px-4 py-2.5 text-sm transition-all duration-200 outline-none bg-white appearance-none"
        style={{
          borderColor: focused ? accentColor : '#e5e7eb',
          boxShadow: focused ? `0 0 0 3px ${accentColor}22` : 'none',
        }}
      >
        <option value="">Select...</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role') as Role | null

  const [selectedRole, setSelectedRole] = useState<Role>(roleParam || 'CUSTOMER')
  const [step, setStep] = useState<'role' | 'form'>(roleParam ? 'form' : 'role')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Shared fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Supplier fields
  const [companyName, setCompanyName] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [companyPhone, setCompanyPhone] = useState('')
  const [description, setDescription] = useState('')

  // Delivery fields
  const [licenseNumber, setLicenseNumber] = useState('')
  const [vehicleType, setVehicleType] = useState('')

  const role = ROLES.find((r) => r.id === selectedRole)!

  const handleRoleSelect = (r: Role) => {
    setSelectedRole(r)
    setStep('form')
  }

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
      const body: Record<string, unknown> = {
        name,
        email,
        phone: phone || undefined,
        password,
        role: selectedRole,
      }

      if (selectedRole === 'SUPPLIER') {
        body.companyName = companyName
        body.companyAddress = companyAddress
        body.companyPhone = companyPhone
        body.description = description || undefined
      }

      if (selectedRole === 'DELIVERY_STAFF') {
        body.licenseNumber = licenseNumber
        body.vehicleType = vehicleType
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/auth/login?registered=true'), 2000)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <div className="text-center space-y-4 animate-bounce-in">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto"
            style={{ background: `${role.color}18` }}
          >
            ✅
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Account Created!</h2>
          <p className="text-gray-500">Redirecting you to sign in…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');
        .role-card { transition: all 0.2s cubic-bezier(.4,0,.2,1); }
        .role-card:hover { transform: translateY(-4px); }
        .role-card.selected { transform: translateY(-4px) scale(1.02); }
        .form-slide { animation: slideUp 0.35s cubic-bezier(.4,0,.2,1); }
        @keyframes slideUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
          <span className="text-2xl">🔩</span>
          <span>HardwareHub</span>
        </Link>
        <p className="text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-semibold" style={{ color: role.color }}>
            Sign in
          </Link>
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ background: role.color }}
          >
            1
          </div>
          <div className="h-0.5 flex-1 rounded-full" style={{ background: step === 'form' ? role.color : '#e5e7eb' }} />
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
            style={{
              background: step === 'form' ? role.color : '#f3f4f6',
              color: step === 'form' ? 'white' : '#9ca3af',
            }}
          >
            2
          </div>
        </div>

        {step === 'role' && (
          <div className="form-slide space-y-6">
            <div>
              <h1 className="text-4xl font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                Create Account
              </h1>
              <p className="text-gray-500 mt-1">Choose how you want to use HardwareHub</p>
            </div>

            <div className="grid gap-4">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleRoleSelect(r.id)}
                  className="role-card w-full text-left rounded-2xl border-2 p-5 flex items-center gap-5 bg-white"
                  style={{ borderColor: selectedRole === r.id ? r.color : '#e5e7eb' }}
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `${r.color}15` }}
                  >
                    {r.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 text-lg">{r.label}</div>
                    <div className="text-gray-500 text-sm">{r.tagline}</div>
                  </div>
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: r.color }}
                  >
                    {selectedRole === r.id && (
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep('form')}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90"
              style={{ background: role.color }}
            >
              Continue as {role.label} →
            </button>
          </div>
        )}

        {step === 'form' && (
          <div className="form-slide">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{role.icon}</span>
                  <span
                    className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{ background: `${role.color}18`, color: role.color }}
                  >
                    {role.label}
                  </span>
                </div>
                <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {selectedRole === 'CUSTOMER' && 'Your Details'}
                  {selectedRole === 'SUPPLIER' && 'Business Registration'}
                  {selectedRole === 'DELIVERY_STAFF' && 'Driver Registration'}
                </h1>
              </div>
              <button
                onClick={() => setStep('role')}
                className="text-sm text-gray-400 hover:text-gray-600 mt-1 transition-colors"
              >
                ← Change
              </button>
            </div>

            {error && (
              <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              {/* Always-present fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <InputField
                    label="Full Name"
                    id="name"
                    value={name}
                    onChange={setName}
                    placeholder="John Doe"
                    required
                    accentColor={role.color}
                  />
                </div>
                <InputField
                  label="Email"
                  id="email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  required
                  accentColor={role.color}
                />
                <InputField
                  label="Phone"
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                  placeholder="+1 (555) 000-0000"
                  accentColor={role.color}
                />
              </div>

              {/* Supplier-specific */}
              {selectedRole === 'SUPPLIER' && (
                <>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                      Business Information
                    </p>
                    <div className="space-y-4">
                      <InputField
                        label="Company Name"
                        id="companyName"
                        value={companyName}
                        onChange={setCompanyName}
                        placeholder="Acme Hardware Ltd."
                        required
                        accentColor={role.color}
                      />
                      <InputField
                        label="Business Address"
                        id="companyAddress"
                        value={companyAddress}
                        onChange={setCompanyAddress}
                        placeholder="123 Industrial Ave, City"
                        required
                        accentColor={role.color}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <InputField
                          label="Business Phone"
                          id="companyPhone"
                          type="tel"
                          value={companyPhone}
                          onChange={setCompanyPhone}
                          placeholder="+1 (555) 000-0000"
                          required
                          accentColor={role.color}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={3}
                          placeholder="Describe your business and products…"
                          className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none resize-none transition-all duration-200 focus:border-green-500"
                          style={{ fontFamily: 'inherit' }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Delivery-specific */}
              {selectedRole === 'DELIVERY_STAFF' && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                    Vehicle Information
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="License Number"
                      id="licenseNumber"
                      value={licenseNumber}
                      onChange={setLicenseNumber}
                      placeholder="DL-123456"
                      required
                      hint="Your official driver's license"
                      accentColor={role.color}
                    />
                    <SelectField
                      label="Vehicle Type"
                      id="vehicleType"
                      value={vehicleType}
                      onChange={setVehicleType}
                      options={VEHICLE_TYPES}
                      required
                      accentColor={role.color}
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div className="border-t border-gray-100 pt-4 space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Security</p>
                <div>
                  <InputField
                    label="Password"
                    id="password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    placeholder="••••••••"
                    required
                    accentColor={role.color}
                  />
                  <PasswordStrength password={password} />
                </div>
                <InputField
                  label="Confirm Password"
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="••••••••"
                  required
                  accentColor={role.color}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: role.color }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Account…
                    </span>
                  ) : (
                    `Create ${role.label} Account →`
                  )}
                </button>
              </div>
            </form>

            <p className="mt-5 text-center text-xs text-gray-400">
              By creating an account, you agree to our{' '}
              <a href="#" className="underline hover:text-gray-600">Terms of Service</a> and{' '}
              <a href="#" className="underline hover:text-gray-600">Privacy Policy</a>.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}