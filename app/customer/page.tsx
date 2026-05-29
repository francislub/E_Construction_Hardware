'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function CustomerDashboard() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login');
    }

    if (status === 'authenticated') {
      fetchOrders();
    }
  }, [status]);

  async function fetchOrders() {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : data.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">My Account</h1>
        <p className="text-muted-foreground">Welcome, {session?.user?.name}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Link
          href="/customer/profile"
          className="p-6 rounded-lg border border-border bg-card hover:border-primary transition-colors"
        >
          <div className="text-2xl mb-2">👤</div>
          <h3 className="font-bold text-foreground">Profile Settings</h3>
          <p className="text-sm text-muted-foreground">Manage your account info</p>
        </Link>

        <Link
          href="/customer/orders"
          className="p-6 rounded-lg border border-border bg-card hover:border-primary transition-colors"
        >
          <div className="text-2xl mb-2">🛒</div>
          <h3 className="font-bold text-foreground">My Orders</h3>
          <p className="text-sm text-muted-foreground">
            {orders.length} order{orders.length !== 1 ? 's' : ''}
          </p>
        </Link>

        <Link
          href="/customer/addresses"
          className="p-6 rounded-lg border border-border bg-card hover:border-primary transition-colors"
        >
          <div className="text-2xl mb-2">📍</div>
          <h3 className="font-bold text-foreground">Addresses</h3>
          <p className="text-sm text-muted-foreground">Manage delivery addresses</p>
        </Link>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Recent Orders</h2>
        {orders.length === 0 ? (
          <p className="text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-2">Order #</th>
                  <th className="text-left py-2">Amount</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id}>
                    <td className="py-2">{order.orderNumber}</td>
                    <td className="py-2">${order.total.toFixed(2)}</td>
                    <td className="py-2">
                      <span className="px-2 py-1 rounded text-xs bg-primary/20 text-primary">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2">
                      <Link
                        href={`/customer/orders/${order.id}`}
                        className="text-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {orders.length > 5 && (
          <Link
            href="/customer/orders"
            className="mt-4 text-primary hover:underline block"
          >
            View All Orders →
          </Link>
        )}
      </div>
    </div>
  );
}
