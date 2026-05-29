'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const contactMethods = [
  {
    icon: Phone,
    label: 'Phone',
    primary: '+256 758 027368',
    secondary: 'Call or WhatsApp us anytime',
    href: 'tel:+256758027368',
    color: 'blue',
  },
  {
    icon: Mail,
    label: 'Email',
    primary: 'eriatugume25@gmail.com',
    secondary: 'We reply within 24 hours',
    href: 'mailto:eriatugume25@gmail.com',
    color: 'green',
  },
  {
    icon: MapPin,
    label: 'Location',
    primary: 'Busiika- Natyoole',
    secondary: 'Uganda, East Africa',
    href: '#',
    color: 'amber',
  },
]

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
  green: 'bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white',
  amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
}

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        setSubmitted(true)
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
        setTimeout(() => setSubmitted(false), 7000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to send message')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-gray-950 via-blue-950 to-gray-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            <MessageSquare size={12} /> Get in Touch
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-4" style={{ fontFamily: "'Georgia', serif" }}>
            We&apos;d Love to<br />
            <span className="text-amber-400">Hear From You</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-xl">
            Whether you need product advice, a bulk quote, or just have a question — our team is ready to help.
          </p>
        </div>
      </section>

      {/* Contact methods */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-5">
            {contactMethods.map(({ icon: Icon, label, primary, secondary, href, color }) => (
              <a
                key={label}
                href={href}
                className="group flex items-center gap-4 p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${colorMap[color]}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
                  <div className="font-bold text-gray-900">{primary}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{secondary}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Sidebar info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <p className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-3">Talk to Us</p>
                <h2 className="text-3xl font-black text-gray-900 mb-4" style={{ fontFamily: "'Georgia', serif" }}>
                  Let&apos;s Start a Conversation
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Have a question about a product? Need a bulk order quote? Want to discuss a project? We&apos;re here for it all.
                </p>
              </div>

              {/* Business hours */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Clock size={16} className="text-blue-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">Business Hours</h3>
                </div>
                <div className="space-y-2">
                  {[
                    { day: 'Monday – Friday', hours: '8:00 AM – 6:00 PM', open: true },
                    { day: 'Saturday', hours: '9:00 AM – 4:00 PM', open: true },
                    { day: 'Sunday', hours: 'Closed', open: false },
                  ].map(({ day, hours, open }) => (
                    <div key={day} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-600">{day}</span>
                      <span className={`text-sm font-semibold ${open ? 'text-gray-900' : 'text-red-400'}`}>{hours}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* WhatsApp CTA */}
              <a
                href="https://wa.me/256758027368"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl p-5 transition-colors shadow-lg shadow-green-500/20 group"
              >
                <div className="text-3xl">💬</div>
                <div>
                  <div className="font-bold text-sm">Chat on WhatsApp</div>
                  <div className="text-green-100 text-xs">Quick responses, real-time help</div>
                </div>
              </a>

              {/* Map placeholder */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <MapPin size={28} className="mb-3 relative" />
                <h3 className="font-bold text-lg mb-1 relative">Find Us</h3>
                <p className="text-blue-200 text-sm relative">Busiika-Natyoole, Uganda</p>
                <a
                  href="https://maps.google.com/?q=Busiika+Natyoole+Uganda"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 text-xs font-bold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors relative"
                >
                  Open in Maps →
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10">
                <h2 className="text-2xl font-black text-gray-900 mb-2">Send Us a Message</h2>
                <p className="text-gray-500 text-sm mb-8">Fill out the form and we&apos;ll get back to you within 24 hours.</p>

                {submitted && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 flex items-start gap-3">
                    <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-sm">Message sent successfully!</div>
                      <div className="text-xs mt-0.5">We&apos;ll get back to you within 24 hours.</div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-start gap-3">
                    <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">{error}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Full Name *</label>
                      <Input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Your full name"
                        className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                      <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+256 7XX XXX XXX"
                        className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email Address *</label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="your@email.com"
                      className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Subject *</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="">Select a subject...</option>
                      <option value="product-inquiry">Product Inquiry</option>
                      <option value="bulk-order">Bulk Order / Wholesale</option>
                      <option value="price-quote">Price Quote</option>
                      <option value="delivery">Delivery Question</option>
                      <option value="complaint">Complaint / Feedback</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Message *</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      placeholder="Tell us how we can help you..."
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Send Message
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-400 text-center">
                    By submitting this form, you agree to our Privacy Policy. We&apos;ll never share your information.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}