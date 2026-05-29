'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Package } from 'lucide-react';

interface CartItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    sku: string;
  };
  quantity: number;
}

const UGX = (amount: number) =>
  `UGX ${Math.round(amount).toLocaleString('en-UG')}`;

export default function CartPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      router.push('/auth/login?callbackUrl=/cart');
      return;
    }
    fetchCart();
  }, [session]);

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        setCartItems(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setUpdating(itemId);
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      if (res.ok) {
        setCartItems(items =>
          items.map(item => item.id === itemId ? { ...item, quantity } : item)
        );
      }
    } catch (err) {
      console.error('Failed to update quantity:', err);
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setUpdating(itemId);
    try {
      const res = await fetch(`/api/cart/${itemId}`, { method: 'DELETE' });
      if (res.ok) {
        setCartItems(items => items.filter(item => item.id !== itemId));
      }
    } catch (err) {
      console.error('Failed to remove item:', err);
    } finally {
      setUpdating(null);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  // Shipping: free above 500,000 UGX, otherwise 15,000 UGX flat
  const shippingCost = subtotal > 500_000 ? 0 : 15_000;
  const tax = subtotal * 0.18; // 18% VAT (Uganda standard)
  const total = subtotal + shippingCost + tax;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm tracking-widest uppercase">Loading cart</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-24 h-24 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto">
            <ShoppingCart className="w-10 h-10 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Your cart is empty</h1>
            <p className="text-slate-400">Add products to your cart to continue shopping</p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 px-6 py-3 rounded-xl font-bold hover:bg-amber-300 transition-colors"
          >
            Browse Products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top bar */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-white">
              Shopping Cart
              <span className="ml-2 text-sm text-slate-400 font-normal">
                ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
              </span>
            </span>
          </div>
          <Link href="/products" className="text-sm text-slate-400 hover:text-amber-400 transition-colors">
            ← Continue Shopping
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {cartItems.map((item, index) => (
              <div
                key={item.id}
                style={{ animationDelay: `${index * 60}ms` }}
                className="group bg-slate-900 border border-slate-800 rounded-2xl p-5 flex gap-5 transition-all duration-200 hover:border-slate-700 animate-in fade-in slide-in-from-bottom-2"
              >
                {/* Image */}
                <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-slate-800">
                  {item.product.images[0] ? (
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-slate-600" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${item.product.id}`}
                    className="font-semibold text-white hover:text-amber-400 transition-colors line-clamp-2 leading-snug"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">SKU: {item.product.sku}</p>

                  <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
                    {/* Quantity stepper */}
                    <div className="flex items-center gap-1 bg-slate-800 rounded-xl border border-slate-700 p-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={updating === item.id || item.quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700 disabled:opacity-30 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center font-bold text-sm text-white">
                        {updating === item.id ? (
                          <span className="inline-block w-3 h-3 border border-slate-500 border-t-transparent rounded-full animate-spin" />
                        ) : item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={updating === item.id}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700 disabled:opacity-30 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Line total */}
                    <div className="text-right">
                      <p className="text-amber-400 font-bold text-lg">
                        {UGX(item.product.price * item.quantity)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-slate-500 text-xs">
                          {UGX(item.product.price)} each
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.id)}
                  disabled={updating === item.id}
                  className="self-start p-2 rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-30"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sticky top-24">
              <h2 className="text-lg font-bold text-white mb-6">Order Summary</h2>

              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span className="text-white font-medium">{UGX(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Shipping</span>
                  <span className={shippingCost === 0 ? 'text-emerald-400 font-medium' : 'text-white font-medium'}>
                    {shippingCost === 0 ? 'FREE' : UGX(shippingCost)}
                  </span>
                </div>
                {shippingCost > 0 && (
                  <p className="text-xs text-amber-400/80 bg-amber-400/5 border border-amber-400/10 rounded-lg px-3 py-2">
                    Add {UGX(500_000 - subtotal)} more for free shipping
                  </p>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>VAT (18%)</span>
                  <span className="text-white font-medium">{UGX(tax)}</span>
                </div>
                <div className="border-t border-slate-800 pt-3 flex justify-between">
                  <span className="font-bold text-white text-base">Total</span>
                  <span className="font-bold text-amber-400 text-xl">{UGX(total)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full bg-amber-400 text-slate-950 py-3.5 rounded-xl font-bold hover:bg-amber-300 transition-colors text-center flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/products"
                className="w-full mt-3 border border-slate-700 text-slate-300 py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors text-center block"
              >
                Continue Shopping
              </Link>

              <p className="text-xs text-slate-600 text-center mt-4">
                Prices in Ugandan Shillings (UGX) · VAT included
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}