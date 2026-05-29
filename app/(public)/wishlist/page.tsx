'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';

interface FavoriteProduct {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    rating: number;
    images: string[];
    category?: { name: string };
  };
}

export default function WishlistPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      router.push('/auth/login?callbackUrl=/wishlist');
      return;
    }
    fetchFavorites();
  }, [session, router]);

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites');
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    setRemoving(favoriteId);
    try {
      const response = await fetch(`/api/favorites/${favoriteId}`, { method: 'DELETE' });
      if (response.ok) {
        setFavorites(items => items.filter(item => item.id !== favoriteId));
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    } finally {
      setRemoving(null);
    }
  };

  const addToCart = async (productId: string) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (response.ok) {
        alert('Added to cart!');
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading wishlist...</p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <Heart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Wishlist is Empty</h1>
            <p className="text-gray-600 mb-8">Add items you love to your wishlist</p>
            <Link
              href="/products"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Wishlist ({favorites.length})</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {favorites.map(favorite => (
            <div key={favorite.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition">
              {/* Product Image */}
              <div className="relative w-full h-48 bg-gray-200">
                {favorite.product.images[0] ? (
                  <Image
                    src={favorite.product.images[0]}
                    alt={favorite.product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <Link
                  href={`/products/${favorite.product.id}`}
                  className="font-semibold text-gray-900 hover:text-blue-600 line-clamp-2"
                >
                  {favorite.product.name}
                </Link>

                {favorite.product.category && (
                  <p className="text-sm text-gray-500 mt-1">{favorite.product.category.name}</p>
                )}

                <div className="flex items-center justify-between mt-3">
                  <span className="text-2xl font-bold text-gray-900">
                    ${favorite.product.price.toFixed(2)}
                  </span>
                  <div className="flex items-center text-yellow-400">
                    <span className="text-sm">★ {favorite.product.rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => addToCart(favorite.product.id)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                  <button
                    onClick={() => removeFavorite(favorite.id)}
                    disabled={removing === favorite.id}
                    className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
