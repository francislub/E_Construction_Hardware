import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Award, Target, Heart, Zap, MapPin, Phone, Mail, ArrowRight, CheckCircle2 } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us - Butebi Hardware Store',
  description: 'Learn about our mission to provide quality hardware and tools across Uganda',
}

const values = [
  {
    icon: Award,
    title: 'Quality First',
    desc: 'We only stock products from reputable suppliers meeting strict quality standards — no compromises.',
    color: 'blue',
  },
  {
    icon: Target,
    title: 'Customer Focus',
    desc: 'Your satisfaction drives every decision we make. We go the extra mile to exceed expectations.',
    color: 'amber',
  },
  {
    icon: Heart,
    title: 'Community',
    desc: 'Rooted in Busiika, we are committed to supporting local communities and sustainable practices.',
    color: 'rose',
  },
  {
    icon: Zap,
    title: 'Innovation',
    desc: 'We constantly improve our services to deliver the smoothest, most reliable shopping experience.',
    color: 'green',
  },
]

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  green: 'bg-green-50 text-green-600',
}

const stats = [
  { value: '10K+', label: 'Products', sub: 'In stock' },
  { value: '50K+', label: 'Customers', sub: 'Served & satisfied' },
  { value: '500+', label: 'Suppliers', sub: 'Trusted partners' },
  { value: '2020', label: 'Founded', sub: 'Serving Uganda' },
]

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-gray-950 via-blue-950 to-gray-900 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
              🏪 Our Story
            </div>
            <h1
              className="text-5xl md:text-6xl font-black leading-none mb-6"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              About Butebi<br />
              <span className="text-amber-400">Hardware Store</span>
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed">
              Your trusted partner for quality hardware and construction materials — proudly serving Uganda from Busiika-Natyoole since 2020.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-4xl font-black text-blue-600 mb-1">{s.value}</div>
                <div className="font-bold text-gray-900 text-sm">{s.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-3">Our Journey</p>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6" style={{ fontFamily: "'Georgia', serif" }}>
                From a Local Shop to Uganda's Trusted Hardware Supplier
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Founded in 2020 in Busiika-Natyoole, Butebi Hardware Store was born from a simple mission: to make quality hardware and construction materials genuinely accessible to every Ugandan — from small-scale homeowners to large construction firms.
                </p>
                <p>
                  What started as a modest local operation has grown into a trusted destination for contractors, builders, and DIY enthusiasts. We have built deep relationships with leading suppliers and manufacturers to bring you an unmatched selection of premium products at honest prices.
                </p>
                <p>
                  Today we serve thousands of customers, delivering not just products, but reliability and peace of mind with every order.
                </p>
              </div>
              <ul className="mt-8 space-y-3">
                {[
                  'Genuine, manufacturer-certified products only',
                  'Same-day dispatch on in-stock orders',
                  'Dedicated customer support team',
                  'Competitive, transparent pricing',
                ].map((point) => (
                  <li key={point} className="flex items-center gap-3 text-sm text-gray-700">
                    <CheckCircle2 size={18} className="text-blue-600 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="text-6xl mb-6">🏗️</div>
                <h3 className="text-2xl font-black mb-4" style={{ fontFamily: "'Georgia', serif" }}>
                  Building Uganda, One Project at a Time
                </h3>
                <p className="text-blue-100 leading-relaxed mb-8">
                  Every tool sold and every material supplied contributes to the growth of Uganda's built environment — homes, schools, hospitals, and businesses.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <MapPin size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Our Location</div>
                    <div className="text-blue-200 text-xs">Busiika-Natyoole, Uganda</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-3">What Drives Us</p>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900" style={{ fontFamily: "'Georgia', serif" }}>
              Our Core Values
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="group bg-gray-50 hover:bg-white rounded-2xl p-8 border border-gray-100 hover:border-blue-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-2xl ${colorMap[color]} flex items-center justify-center mb-5`}>
                  <Icon size={26} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-3">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact preview */}
      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Phone, label: 'Call Us', value: '+256 758 027368', href: 'tel:+256758027368' },
              { icon: Mail, label: 'Email Us', value: 'eriatugume25@gmail.com', href: 'mailto:eriatugume25@gmail.com' },
              { icon: MapPin, label: 'Visit Us', value: 'Busiika-Natyoole, Uganda', href: '#' },
            ].map(({ icon: Icon, label, value, href }) => (
              <a key={label} href={href}
                className="flex items-center gap-4 bg-white rounded-2xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition-colors">
                  <Icon size={22} className="text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
                  <div className="font-semibold text-gray-900 text-sm">{value}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-700 to-blue-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black mb-4" style={{ fontFamily: "'Georgia', serif" }}>
            Ready to Start Your Project?
          </h2>
          <p className="text-blue-100 mb-10 max-w-2xl mx-auto text-lg">
            Browse thousands of quality products or reach out to our team — we are here to help you build with confidence.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/products">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold rounded-xl px-8 gap-2">
                Shop Now <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold rounded-xl px-8">
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}