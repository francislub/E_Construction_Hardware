'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  ChevronRight,
  Lock,
  Plus,
  MapPin,
  CreditCard,
  Smartphone,
  Building2,
  Tag,
  CheckCircle2,
  AlertCircle,
  Package,
  Truck,
  ArrowLeft,
  X,
  Home,
  Briefcase,
  Star,
} from 'lucide-react'

/* ─────────────────────────────────────────────
   Types (matching Prisma schema exactly)
───────────────────────────────────────────── */
interface Address {
  id: string
  customerId: string
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

interface CartItem {
  id: string
  cartId: string
  productId: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    images: string[]
    stock: number
    supplier?: { companyName: string }
  }
  createdAt: string
  updatedAt: string
}

interface Cart {
  id: string
  customerId: string
  items: CartItem[]
}

interface PromoValidation {
  discount: number
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  name: string
}

type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER'
type Step = 'shipping' | 'payment' | 'review'

/* ─────────────────────────────────────────────
   Sub-component: Address Card
───────────────────────────────────────────── */
function AddressCard({
  address,
  selected,
  onSelect,
}: {
  address: Address
  selected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button
      onClick={() => onSelect(address.id)}
      className={`
        w-full text-left p-5 rounded-2xl border-2 transition-all duration-200
        ${selected
          ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100'
          : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
          ${selected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={14} className={selected ? 'text-indigo-500' : 'text-gray-400'} />
            <span className="text-sm font-semibold text-gray-700">
              {address.isDefault ? 'Default Address' : 'Saved Address'}
            </span>
            {address.isDefault && (
              <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-gray-800 font-medium">{address.street}</p>
          <p className="text-sm text-gray-500">
            {address.city}, {address.state} {address.postalCode}
          </p>
          <p className="text-sm text-gray-500">{address.country}</p>
        </div>
      </div>
    </button>
  )
}

/* ─────────────────────────────────────────────
   Sub-component: Payment Method Card
───────────────────────────────────────────── */
const paymentOptions: { value: PaymentMethod; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'CREDIT_CARD', label: 'Credit Card', icon: <CreditCard size={20} />, desc: 'Visa, Mastercard, Amex' },
  { value: 'DEBIT_CARD', label: 'Debit Card', icon: <CreditCard size={20} />, desc: 'Direct from your bank' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money', icon: <Smartphone size={20} />, desc: 'MTN, Airtel Money' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: <Building2 size={20} />, desc: 'Direct bank transfer' },
]

function PaymentCard({
  option,
  selected,
  onSelect,
}: {
  option: typeof paymentOptions[0]
  selected: boolean
  onSelect: (v: PaymentMethod) => void
}) {
  return (
    <button
      onClick={() => onSelect(option.value)}
      className={`
        w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200
        ${selected
          ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100'
          : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50'
        }
      `}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
        ${selected ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
        {option.icon}
      </div>
      <div className="text-left flex-1">
        <p className={`font-semibold text-sm ${selected ? 'text-indigo-700' : 'text-gray-800'}`}>
          {option.label}
        </p>
        <p className="text-xs text-gray-500">{option.desc}</p>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
        ${selected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
    </button>
  )
}

/* ─────────────────────────────────────────────
   Sub-component: Step Indicator
───────────────────────────────────────────── */
const steps: { key: Step; label: string }[] = [
  { key: 'shipping', label: 'Shipping' },
  { key: 'payment', label: 'Payment' },
  { key: 'review', label: 'Review' },
]

function StepIndicator({ current }: { current: Step }) {
  const currentIdx = steps.findIndex((s) => s.key === current)
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
              ${i < currentIdx ? 'bg-indigo-500 text-white' :
                i === currentIdx ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' :
                'bg-gray-200 text-gray-400'}
            `}>
              {i < currentIdx ? <CheckCircle2 size={16} /> : i + 1}
            </div>
            <span className={`text-xs font-medium ${i === currentIdx ? 'text-indigo-600' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-16 mx-1 mb-4 ${i < currentIdx ? 'bg-indigo-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Main Checkout Page
───────────────────────────────────────────── */
export default function CheckoutPage() {
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()

  // Data state
  const [cart, setCart] = useState<CartItem[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Checkout state
  const [step, setStep] = useState<Step>('shipping')
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MOBILE_MONEY')
  const [promoCode, setPromoCode] = useState('')
  const [promoInput, setPromoInput] = useState('')
  const [promoData, setPromoData] = useState<PromoValidation | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null)

  // Redirect if unauthenticated
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login?redirect=/checkout')
    }
  }, [sessionStatus, router])

  // Fetch cart and addresses
  useEffect(() => {
    if (sessionStatus !== 'authenticated') return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [cartRes, addrRes] = await Promise.all([
          fetch('/api/cart'),
          fetch('/api/addresses'),
        ])

        // ── Cart ──
        if (cartRes.ok) {
          const cartData = await cartRes.json()
          // Handle: { items } | { cart: { items } } | CartItem[] directly
          const items: CartItem[] =
            Array.isArray(cartData) ? cartData :
            Array.isArray(cartData.items) ? cartData.items :
            Array.isArray(cartData.cart?.items) ? cartData.cart.items :
            []
          setCart(items)
        }

        // ── Addresses ──
        // The Address model belongs to Customer (not User) in the Prisma schema.
        // The API must resolve: session.user.id → Customer → addresses[]
        if (addrRes.ok) {
          const addrData = await addrRes.json()
          // Handle all possible response shapes:
          // { addresses: [] } | { customer: { addresses: [] } } | []
          const addrs: Address[] =
            Array.isArray(addrData) ? addrData :
            Array.isArray(addrData.addresses) ? addrData.addresses :
            Array.isArray(addrData.customer?.addresses) ? addrData.customer.addresses :
            []

          setAddresses(addrs)

          // Pre-select: prefer isDefault=true, else first address
          const defaultAddr = addrs.find((a) => a.isDefault)
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id)
          } else if (addrs.length > 0) {
            setSelectedAddressId(addrs[0].id)
          }
        } else {
          // Non-200 from addresses endpoint — surface the error message
          const errData = await addrRes.json().catch(() => ({}))
          console.error('Addresses API error:', addrRes.status, errData)
          // Don't block checkout over addresses — user can add one
          setAddresses([])
        }
      } catch (err: any) {
        setError(err.message ?? 'Something went wrong loading checkout data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [sessionStatus])

  /* ── Pricing calculations ── */
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const shippingCost = subtotal > 100 ? 0 : 10

  const discount = (() => {
    if (!promoData) return 0
    if (promoData.discountType === 'PERCENTAGE') return subtotal * (promoData.discount / 100)
    return Math.min(promoData.discount, subtotal)
  })()

  const taxableAmount = subtotal - discount
  const tax = taxableAmount * 0.1
  const total = taxableAmount + shippingCost + tax

  /* ── Promo code ── */
  const applyPromo = useCallback(async () => {
    if (!promoInput.trim()) return
    setPromoLoading(true)
    setPromoError(null)
    try {
      const res = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoInput.trim().toUpperCase(), subtotal }),
      })
      if (res.ok) {
        const data = await res.json()
        setPromoData(data)
        setPromoCode(promoInput.trim().toUpperCase())
        setPromoError(null)
      } else {
        const data = await res.json()
        setPromoError(data.error ?? 'Invalid or expired promo code')
        setPromoData(null)
        setPromoCode('')
      }
    } catch {
      setPromoError('Failed to validate promo code')
    } finally {
      setPromoLoading(false)
    }
  }, [promoInput, subtotal])

  const removePromo = () => {
    setPromoData(null)
    setPromoCode('')
    setPromoInput('')
    setPromoError(null)
  }

  /* ── Place order ── */
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) return
    const addr = addresses.find((a) => a.id === selectedAddressId)
    if (!addr) return

    setProcessing(true)
    try {
      const shippingAddress = `${addr.street}, ${addr.city}, ${addr.state} ${addr.postalCode}, ${addr.country}`

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
          })),
          shippingAddress,
          billingAddress: shippingAddress,
          paymentMethod,
          promoCode: promoCode || undefined,
          discount,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const orderId = data.id ?? data.orderId
        router.push(`/order-confirmation/${orderId}`)
      } else {
        const data = await res.json()
        alert(data.error ?? 'Failed to place order. Please try again.')
      }
    } catch {
      alert('An error occurred. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId)
  const selectedPayment = paymentOptions.find((p) => p.value === paymentMethod)

  /* ── Loading ── */
  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading your checkout...</p>
        </div>
      </div>
    )
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  /* ── Empty cart ── */
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <Package size={48} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add some items before checking out.</p>
          <Link href="/products">
            <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
              Browse Products
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      {/* ── Top nav ── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Link href="/cart" className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
              <ArrowLeft size={16} />
              Back to Cart
            </Link>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="font-semibold text-gray-800">Checkout</span>
          </div>
          <StepIndicator current={step} />
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Lock size={14} className="text-green-500" />
            <span className="text-xs text-gray-400 hidden sm:inline">Secured by SSL</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-5 gap-8 items-start">

          {/* ── LEFT: Step content ── */}
          <div className="lg:col-span-3 space-y-6">

            {/* ════ STEP 1: SHIPPING ════ */}
            {step === 'shipping' && (
              <section className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <MapPin size={16} className="text-indigo-600" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">Shipping Address</h2>
                    </div>
                    <Link href="/customer/addresses">
                      <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                        <Plus size={14} />
                        Add New
                      </button>
                    </Link>
                  </div>

                  {addresses.length === 0 ? (
                    <div className="text-center py-10">
                      <MapPin size={40} className="mx-auto text-gray-200 mb-3" />
                      <p className="text-gray-500 mb-4">No saved addresses found</p>
                      <Link href="/customer/addresses">
                        <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                          Add Your First Address
                        </button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {addresses.map((addr) => (
                        <AddressCard
                          key={addr.id}
                          address={addr}
                          selected={selectedAddressId === addr.id}
                          onSelect={setSelectedAddressId}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Promo code section */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                      <Tag size={16} className="text-amber-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Promo Code</h2>
                  </div>

                  {promoData ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-green-500" />
                        <div>
                          <p className="text-sm font-semibold text-green-700">{promoCode}</p>
                          <p className="text-xs text-green-600">
                            {promoData.discountType === 'PERCENTAGE'
                              ? `${promoData.discount}% off`
                              : `Shs${promoData.discount} off`}
                            {' — '}{promoData.name}
                          </p>
                        </div>
                      </div>
                      <button onClick={removePromo} className="text-gray-400 hover:text-red-500 transition-colors">
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter promo code"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
                          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                        />
                        <button
                          onClick={applyPromo}
                          disabled={promoLoading || !promoInput}
                          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {promoLoading ? '...' : 'Apply'}
                        </button>
                      </div>
                      {promoError && (
                        <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle size={12} /> {promoError}
                        </p>
                      )}
                    </>
                  )}
                </div>

                <button
                  onClick={() => setStep('payment')}
                  disabled={!selectedAddressId}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-base transition-all duration-200 shadow-lg shadow-indigo-200 disabled:shadow-none"
                >
                  Continue to Payment →
                </button>
              </section>
            )}

            {/* ════ STEP 2: PAYMENT ════ */}
            {step === 'payment' && (
              <section className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Selected address recap */}
                {selectedAddress && (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-green-500" />
                        <span className="text-sm font-semibold text-gray-700">Shipping to</span>
                      </div>
                      <button
                        onClick={() => setStep('shipping')}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Change
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1.5 ml-6">
                      {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}, {selectedAddress.country}
                    </p>
                  </div>
                )}

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                      <CreditCard size={16} className="text-blue-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Payment Method</h2>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {paymentOptions.map((opt) => (
                      <PaymentCard
                        key={opt.value}
                        option={opt}
                        selected={paymentMethod === opt.value}
                        onSelect={setPaymentMethod}
                      />
                    ))}
                  </div>

                  {/* Mobile money field */}
                  {paymentMethod === 'MOBILE_MONEY' && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                      <p className="text-sm font-semibold text-amber-800 mb-2">Mobile Money Number</p>
                      <input
                        type="tel"
                        placeholder="+256 7XX XXX XXX"
                        className="w-full border border-amber-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                      />
                      <p className="text-xs text-amber-600 mt-1.5">Supports MTN MoMo & Airtel Money</p>
                    </div>
                  )}

                  {/* Card fields */}
                  {(paymentMethod === 'CREDIT_CARD' || paymentMethod === 'DEBIT_CARD') && (
                    <div className="mt-4 space-y-3">
                      <input
                        type="text"
                        placeholder="Card Number"
                        maxLength={19}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="MM / YY"
                          maxLength={5}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                        <input
                          type="text"
                          placeholder="CVV"
                          maxLength={4}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('shipping')}
                    className="flex-1 border-2 border-gray-200 text-gray-700 py-4 rounded-2xl font-bold text-base hover:border-indigo-300 hover:text-indigo-600 transition-all duration-200"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep('review')}
                    className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold text-base transition-all duration-200 shadow-lg shadow-indigo-200"
                  >
                    Review Order →
                  </button>
                </div>
              </section>
            )}

            {/* ════ STEP 3: REVIEW ════ */}
            {step === 'review' && (
              <section className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Recap cards */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Address recap */}
                  {selectedAddress && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-indigo-500" />
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Shipping To</span>
                        </div>
                        <button onClick={() => setStep('shipping')} className="text-xs text-indigo-600 hover:underline">Edit</button>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{selectedAddress.street}</p>
                      <p className="text-sm text-gray-500">{selectedAddress.city}, {selectedAddress.state}</p>
                      <p className="text-sm text-gray-500">{selectedAddress.postalCode}, {selectedAddress.country}</p>
                    </div>
                  )}
                  {/* Payment recap */}
                  {selectedPayment && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <CreditCard size={14} className="text-blue-500" />
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment</span>
                        </div>
                        <button onClick={() => setStep('payment')} className="text-xs text-indigo-600 hover:underline">Edit</button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                          {selectedPayment.icon}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{selectedPayment.label}</p>
                          <p className="text-xs text-gray-500">{selectedPayment.desc}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Items review */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Order Items ({cart.length})</h2>
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                          {item.product.images?.[0] ? (
                            <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={20} className="text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{item.product.name}</p>
                          {item.product.supplier && (
                            <p className="text-xs text-gray-400">{item.product.supplier.companyName}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-gray-900 text-sm">
                            Shs{(item.product.price * item.quantity).toLocaleString('en-UG', { minimumFractionDigits: 0 })}
                          </p>
                          <p className="text-xs text-gray-400">@Shs{item.product.price.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('payment')}
                    className="flex-1 border-2 border-gray-200 text-gray-700 py-4 rounded-2xl font-bold text-base hover:border-indigo-300 hover:text-indigo-600 transition-all duration-200"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={processing}
                    className="flex-[2] bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-base transition-all duration-200 shadow-xl shadow-indigo-200 flex items-center justify-center gap-2"
                  >
                    <Lock size={18} />
                    {processing ? 'Placing Order...' : `Pay Shs${total.toLocaleString('en-UG', { minimumFractionDigits: 0 })}`}
                  </button>
                </div>

                <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
                  <Lock size={12} /> Your payment information is encrypted and secure
                </p>
              </section>
            )}
          </div>

          {/* ── RIGHT: Order Summary (sticky) ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Order Summary</h2>

              {/* Items list */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1 mb-5 scrollbar-thin">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                      {item.product.images?.[0] ? (
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={14} className="text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-400">× {item.quantity}</p>
                    </div>
                    <p className="text-xs font-bold text-gray-700 flex-shrink-0">
                      Shs{(item.product.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Price breakdown */}
              <div className="border-t border-dashed border-gray-200 pt-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-800">Shs{subtotal.toLocaleString()}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 flex items-center gap-1">
                      <Tag size={12} /> Discount ({promoCode})
                    </span>
                    <span className="font-medium text-green-600">−Shs{discount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Truck size={12} /> Shipping
                  </span>
                  <span className="font-medium text-gray-800">
                    {shippingCost === 0
                      ? <span className="text-green-600 font-semibold">FREE</span>
                      : `Shs${shippingCost.toLocaleString()}`}
                  </span>
                </div>

                {subtotal <= 100 && (
                  <p className="text-xs text-indigo-500 bg-indigo-50 rounded-lg px-2 py-1.5">
                    💡 Add Shs{(100 - subtotal).toLocaleString()} more for free shipping!
                  </p>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax (10%)</span>
                  <span className="font-medium text-gray-800">Shs{tax.toLocaleString()}</span>
                </div>

                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-xl font-black text-indigo-600">
                    Shs{total.toLocaleString('en-UG', { minimumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { icon: <Lock size={14} />, label: 'Secure' },
                    { icon: <Truck size={14} />, label: 'Fast Delivery' },
                    { icon: <Star size={14} />, label: 'Quality' },
                  ].map((badge) => (
                    <div key={badge.label} className="flex flex-col items-center gap-1 text-gray-400">
                      {badge.icon}
                      <span className="text-xs">{badge.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}