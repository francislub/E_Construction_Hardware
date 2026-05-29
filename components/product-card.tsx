'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProductCardProps {
  id: string
  name: string
  price: number
  image?: string
  category: string
  rating: number
  reviews?: number
  supplier?: string
  slug?: string
  onAddToCart?: () => void
  onAddToWishlist?: () => void
  isInWishlist?: boolean
}

export function ProductCard({
  id,
  name,
  price,
  image,
  category,
  rating,
  reviews = 0,
  supplier,
  slug,
  onAddToCart,
  onAddToWishlist,
  isInWishlist = false,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-200">
            <span className="text-gray-400">No image</span>
          </div>
        )}

        {/* Action Buttons on Hover */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 transition-opacity">
            <Button
              size="sm"
              onClick={onAddToCart}
              className="gap-2"
            >
              <ShoppingCart size={16} />
              Add to Cart
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onAddToWishlist}
              className={isInWishlist ? 'bg-red-100' : ''}
            >
              <Heart
                size={16}
                fill={isInWishlist ? 'currentColor' : 'none'}
              />
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category Badge */}
        <div className="text-xs text-blue-600 font-semibold mb-1 uppercase">
          {category}
        </div>

        {/* Product Name */}
        <Link href={`/products/${slug || id}`}>
          <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 min-h-14">
            {name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 my-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={
                  i < Math.floor(rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }
              />
            ))}
          </div>
          <span className="text-xs text-gray-600">
            {rating.toFixed(1)} ({reviews})
          </span>
        </div>

        {/* Supplier */}
        {supplier && (
          <p className="text-xs text-gray-500 mb-2">by {supplier}</p>
        )}

        {/* Price */}
        <div className="pt-2 border-t border-gray-200">
          <div className="text-lg font-bold text-gray-900">
            ${price.toFixed(2)}
          </div>
        </div>

        {/* Mobile Action Buttons */}
        <div className="mt-3 flex gap-2 md:hidden">
          <Button
            size="sm"
            onClick={onAddToCart}
            className="flex-1 gap-2"
          >
            <ShoppingCart size={14} />
            Add
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onAddToWishlist}
            className="flex-1"
          >
            <Heart
              size={14}
              fill={isInWishlist ? 'currentColor' : 'none'}
            />
          </Button>
        </div>
      </div>
    </div>
  )
}
