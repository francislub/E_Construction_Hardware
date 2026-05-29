'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DataTable } from '@/components/data-table';

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function OrdersPage() {
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

  if (status === 'loading') {
    return <div className="flex items-center justify-center py-8">Loading...</div>;
  }

  const columns = [
    { key: 'orderNumber', label: 'Order #' },
    {
      key: 'total',
      label: 'Amount',
      render: (total: number) => `$${total.toFixed(2)}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (status: string) => (
        <span className="px-2 py-1 rounded text-xs bg-primary/20 text-primary">
          {status}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/customer" className="text-primary hover:underline mb-4 block">
        ← Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-6">My Orders</h1>

      <DataTable
        data={orders}
        columns={columns}
        loading={loading}
        editHref={(item) => `/customer/orders/${item.id}`}
        emptyMessage="No orders found"
      />
    </div>
  );
}
