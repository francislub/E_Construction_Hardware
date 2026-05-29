import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Providers from '@/components/providers'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { headers } from 'next/headers'

import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'Hardware Store - Quality Tools & Materials',
  description:
    'Your one-stop shop for quality hardware, tools, and building materials',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

// All role-based dashboard prefixes — header & footer are hidden for these
const DASHBOARD_PREFIXES = [
  // Admin routes
  '/admin/dashboard',
  '/admin/categories',
  '/admin/products',
  '/admin/orders',
  '/admin/users',
  '/admin/suppliers',
  '/admin/deliveries',
  '/admin/payments',
  // Delivery staff routes
  '/delivery/dashboard',
  '/delivery/pending',
  '/delivery/active',
  '/delivery/completed',
  '/delivery/profile',
  // Supplier routes
  '/supplier/dashboard',
  '/supplier/products',
  '/supplier/orders',
  '/supplier/analytics',
  '/supplier/profile',
  '/supplier/settings',
]

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersList = await headers()
  const pathname = headersList.get('x-invoke-path') ?? ''
  const isDashboard = DASHBOARD_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )

  return (
    <html lang="en">
      <body
        className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Providers>
          {!isDashboard && <Header />}
          <main className="flex-1">{children}</main>
          {!isDashboard && <Footer />}
        </Providers>

        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}