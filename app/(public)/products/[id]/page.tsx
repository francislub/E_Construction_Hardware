'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, ShoppingCart, Star, Package, Truck, Shield, ChevronLeft, Plus, Minus } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  sku: string
  stock: number
  images: string[]
  category: { name: string }
  supplier: { companyName: string; verified: boolean } | null
  rating: number
  reviews: {
    id: string
    rating: number
    comment: string | null
    createdAt: string
    user: { name: string | null }
  }[]
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const [cartSuccess, setCartSuccess] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    setIsLoading(true)
    setFetchError(false)
    try {
      const response = await fetch(`/api/products/${id}`)
      const data = await response.json()
      if (!response.ok || data.error) {
        setFetchError(true)
        setProduct(null)
        return
      }
      setProduct(data)
    } catch (error) {
      console.error('Failed to fetch product:', error)
      setFetchError(true)
      setProduct(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!session) {
      router.push('/auth/login')
      return
    }
    if (!product) return

    setCartLoading(true)
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ✅ KEY FIX: Send product.id (the real MongoDB ObjectId from the API response),
        //    NOT the URL param `id` which could be a slug like "cement"
        body: JSON.stringify({ productId: product.id, quantity }),
      })

      const data = await response.json()

      if (response.ok) {
        setCartSuccess(true)
        setTimeout(() => setCartSuccess(false), 2500)
        setQuantity(1)
      } else {
        alert(data.error || 'Failed to add to cart')
      }
    } catch (error) {
      console.error('Failed to add to cart:', error)
      alert('Failed to add to cart. Please try again.')
    } finally {
      setCartLoading(false)
    }
  }

  const handleToggleFavorite = async () => {
    if (!session) {
      router.push('/auth/login')
      return
    }
    if (!product) return

    try {
      if (isFavorited) {
        const response = await fetch(`/api/favorites/${product.id}`, {
          method: 'DELETE',
        })
        if (response.ok) setIsFavorited(false)
      } else {
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // ✅ Also use product.id here, not the URL param
          body: JSON.stringify({ productId: product.id }),
        })
        if (response.ok) setIsFavorited(true)
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const decreaseQty = () => setQuantity((q) => Math.max(1, q - 1))
  const increaseQty = () =>
    setQuantity((q) => Math.min(product?.stock ?? 1, q + 1))

  // ── Loading state ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-8 bg-gray-200 rounded w-1/3" />
              <div className="h-24 bg-gray-200 rounded" />
              <div className="h-12 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  // ── Error / not found state ────────────────────────────────────
  if (fetchError || !product) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Package className="h-16 w-16 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-700">Product not found</h2>
          <p className="text-gray-500">This product may have been removed or doesn't exist.</p>
          <Link
            href="/products"
            className="mt-2 inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </div>
      </main>
    )
  }

  const averageRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0

  // ── Main page ──────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600 transition">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-blue-600 transition">Products</Link>
          <span>/</span>
          <Link
            href={`/products?category=${product.category.name}`}
            className="hover:text-blue-600 transition"
          >
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="text-gray-800 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* ── Image gallery ── */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm">
              {product.images.length > 0 ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-all duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Package className="h-20 w-20 text-gray-300" />
                </div>
              )}
            </div>

            {/* Thumbnail row */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition ${
                      selectedImage === i
                        ? 'border-blue-500 shadow-md'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product details ── */}
          <div className="flex flex-col">
            {/* Category + badges */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {product.category.name}
              </span>
              {product.supplier?.verified && (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Verified Supplier
                </span>
              )}
              {product.stock === 0 && (
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Name */}
            <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-2">
              {product.name}
            </h1>

            {/* Rating row */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(averageRating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-200 fill-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings yet'}
                {product.reviews.length > 0 && ` · ${product.reviews.length} review${product.reviews.length !== 1 ? 's' : ''}`}
              </span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <p className="text-4xl font-extrabold text-gray-900">
                UGX {product.price.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">Inclusive of all taxes</p>
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Meta info */}
            <div className="bg-gray-50 rounded-2xl p-5 mb-6 space-y-3 border border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">SKU</span>
                <span className="text-gray-800 font-mono">{product.sku}</span>
              </div>
              {product.supplier && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Supplier</span>
                  <span className="text-gray-800">{product.supplier.companyName}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Availability</span>
                {product.stock > 0 ? (
                  <span className="text-emerald-600 font-semibold">
                    In Stock ({product.stock} units)
                  </span>
                ) : (
                  <span className="text-red-600 font-semibold">Out of Stock</span>
                )}
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { icon: Truck, label: 'Fast Delivery' },
                { icon: Shield, label: 'Quality Assured' },
                { icon: Package, label: 'Secure Packaging' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-xl border border-gray-100 text-center"
                >
                  <Icon className="h-5 w-5 text-blue-500" />
                  <span className="text-xs text-gray-600 font-medium">{label}</span>
                </div>
              ))}
            </div>

            {/* Add to cart section */}
            {product.stock > 0 ? (
              <div className="space-y-4">
                {/* Quantity picker */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">Quantity:</span>
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <button
                      onClick={decreaseQty}
                      disabled={quantity <= 1}
                      className="px-4 py-2.5 hover:bg-gray-50 disabled:opacity-30 transition"
                    >
                      <Minus className="h-4 w-4 text-gray-600" />
                    </button>
                    <span className="px-5 py-2.5 font-semibold text-gray-800 min-w-[3rem] text-center border-x border-gray-200">
                      {quantity}
                    </span>
                    <button
                      onClick={increaseQty}
                      disabled={quantity >= product.stock}
                      className="px-4 py-2.5 hover:bg-gray-50 disabled:opacity-30 transition"
                    >
                      <Plus className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={cartLoading}
                    className={`flex-1 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${
                      cartSuccess
                        ? 'bg-emerald-500 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {cartLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Adding...
                      </span>
                    ) : cartSuccess ? (
                      <>✓ Added to Cart!</>
                    ) : (
                      <>
                        <ShoppingCart className="h-5 w-5" />
                        Add to Cart
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleToggleFavorite}
                    className={`px-5 py-3.5 rounded-xl border font-semibold flex items-center gap-2 transition ${
                      isFavorited
                        ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Heart
                      className="h-5 w-5"
                      fill={isFavorited ? 'currentColor' : 'none'}
                    />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  disabled
                  className="flex-1 py-3.5 rounded-xl font-semibold bg-gray-100 text-gray-400 cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Out of Stock
                </button>
                <button
                  onClick={handleToggleFavorite}
                  className={`px-5 py-3.5 rounded-xl border font-semibold flex items-center gap-2 transition ${
                    isFavorited
                      ? 'bg-red-50 border-red-200 text-red-500'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Heart className="h-5 w-5" fill={isFavorited ? 'currentColor' : 'none'} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Reviews ── */}
        <section className="mt-16 border-t border-gray-200 pt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Reviews</h2>
          <p className="text-gray-500 mb-8">
            {product.reviews.length === 0
              ? 'No reviews yet. Be the first to review this product!'
              : `${product.reviews.length} review${product.reviews.length !== 1 ? 's' : ''}`}
          </p>

          {product.reviews.length > 0 && (
            <div className="grid gap-4">
              {product.reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {review.user.name ?? 'Anonymous'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(review.createdAt).toLocaleDateString('en-UG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-200 fill-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-gray-600 leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}