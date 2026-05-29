'use client'

import { useEffect, useState } from 'react'
import { Copy, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Promotion {
  id: string
  name: string
  code: string
  description: string
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discountValue: number
  startDate: string
  endDate: string
  usageLimit?: number
  usageCount: number
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await fetch('/api/promotions?limit=50')
        if (response.ok) {
          const data = await response.json()
          setPromotions(data.promotions || [])
        }
      } catch (error) {
        console.error('Failed to fetch promotions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPromotions()
  }, [])

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const getDiscountDisplay = (promo: Promotion) => {
    if (promo.discountType === 'PERCENTAGE') {
      return `${promo.discountValue}% OFF`
    } else {
      return `$${promo.discountValue} OFF`
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Special Promotions</h1>
          <p className="text-blue-100">Save more with our exclusive offers and discount codes</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : promotions.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border-l-4 border-blue-600"
              >
                {/* Header with Discount */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold text-blue-600">
                      {getDiscountDisplay(promo)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{promo.name}</h3>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-gray-700 mb-4 text-sm line-clamp-2">
                    {promo.description}
                  </p>

                  {/* Code Section */}
                  <div className="bg-gray-50 rounded p-3 mb-4 border border-gray-200">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Promo Code</p>
                        <p className="font-mono font-bold text-lg text-gray-900">
                          {promo.code}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyCode(promo.code)}
                        className="gap-1"
                      >
                        {copiedCode === promo.code ? (
                          <>
                            <CheckCircle size={14} className="text-green-600" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Valid Until */}
                  <div className="text-xs text-gray-600 mb-3">
                    Valid until {new Date(promo.endDate).toLocaleDateString()}
                  </div>

                  {/* Usage Limit */}
                  {promo.usageLimit && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Uses left</span>
                        <span className="font-semibold">
                          {Math.max(0, promo.usageLimit - promo.usageCount)} / {promo.usageLimit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              ((promo.usageLimit - promo.usageCount) / promo.usageLimit) * 100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Apply Button */}
                  <Button className="w-full gap-2" onClick={() => window.location.href = '/products'}>
                    Shop Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">No promotions currently active</p>
            <p className="text-gray-500 mb-8">Check back soon for exciting deals!</p>
            <Button onClick={() => (window.location.href = '/products')}>
              Browse Products
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
