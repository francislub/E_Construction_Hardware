'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Eye, Trash2, TrendingUp } from 'lucide-react';

interface Delivery {
  id: string;
  order: { orderNumber: string };
  staff: { user: { name: string } };
  status: string;
  estimatedDate: string;
  actualDate: string;
  createdAt: string;
}

export default function AdminDeliveriesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    fetchDeliveries();
  }, [session, router, statusFilter]);

  const fetchDeliveries = async () => {
    try {
      const response = await fetch(`/api/deliveries?status=${statusFilter}`);
      if (response.ok) {
        const data = await response.json();
        setDeliveries(data.deliveries || []);
      }
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteDelivery = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery?')) return;
    try {
      const response = await fetch(`/api/deliveries/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setDeliveries(deliveries.filter(d => d.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete delivery:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-800';
      case 'PICKED_UP':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: deliveries.length,
    delivered: deliveries.filter(d => d.status === 'DELIVERED').length,
    inTransit: deliveries.filter(d => d.status === 'IN_TRANSIT').length,
    failed: deliveries.filter(d => d.status === 'FAILED').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Deliveries Management</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm">Total Deliveries</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm">Delivered</div>
            <div className="text-3xl font-bold text-green-600">{stats.delivered}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm">In Transit</div>
            <div className="text-3xl font-bold text-blue-600">{stats.inTransit}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm">Failed</div>
            <div className="text-3xl font-bold text-red-600">{stats.failed}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="PICKED_UP">Picked Up</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        {/* Deliveries Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-600">Loading deliveries...</div>
          ) : deliveries.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No deliveries found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Order #</th>
                    <th className="px-6 py-3 text-left font-semibold">Delivery Staff</th>
                    <th className="px-6 py-3 text-left font-semibold">Status</th>
                    <th className="px-6 py-3 text-left font-semibold">Est. Date</th>
                    <th className="px-6 py-3 text-left font-semibold">Actual Date</th>
                    <th className="px-6 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map(delivery => (
                    <tr key={delivery.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {delivery.order.orderNumber}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{delivery.staff?.user?.name || 'Unassigned'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(delivery.status)}`}>
                          {delivery.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {delivery.estimatedDate ? new Date(delivery.estimatedDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {delivery.actualDate ? new Date(delivery.actualDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/admin/deliveries/${delivery.id}`)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deleteDelivery(delivery.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
