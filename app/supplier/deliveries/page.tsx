'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { MapPin, User, Package, Calendar } from 'lucide-react';

interface Delivery {
  id: string;
  order: { orderNumber: string };
  staff: { user: { name: string } };
  status: string;
  estimatedDate: string;
  actualDate: string;
  location: string;
  notes: string;
}

export default function SupplierDeliveriesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role !== 'SUPPLIER') {
      router.push('/');
      return;
    }
    fetchDeliveries();
  }, [session, router]);

  const fetchDeliveries = async () => {
    try {
      const response = await fetch(`/api/deliveries?supplierId=${session?.user?.id}`);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const getStatusSteps = (status: string) => {
    const steps = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];
    const currentIndex = steps.indexOf(status);
    return steps.map((step, index) => ({
      step,
      completed: index <= currentIndex,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Delivery Tracking</h1>

        {/* Deliveries List */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12 text-gray-600">Loading deliveries...</div>
          ) : deliveries.length === 0 ? (
            <div className="text-center py-12 text-gray-600">No deliveries to track</div>
          ) : (
            deliveries.map(delivery => (
              <div key={delivery.id} className="bg-white rounded-lg shadow p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{delivery.order.orderNumber}</h3>
                    <p className="text-sm text-gray-500 mt-1">Delivery ID: {delivery.id.slice(0, 8)}...</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(delivery.status)}`}>
                    {delivery.status}
                  </span>
                </div>

                {/* Delivery Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 pb-6 border-b">
                  {delivery.staff && (
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Delivery Staff</p>
                        <p className="font-semibold text-gray-900">{delivery.staff.user.name}</p>
                      </div>
                    </div>
                  )}
                  {delivery.estimatedDate && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Est. Delivery</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(delivery.estimatedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {delivery.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Current Location</p>
                        <p className="font-semibold text-gray-900">{delivery.location}</p>
                      </div>
                    </div>
                  )}
                  {delivery.actualDate && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Delivered</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(delivery.actualDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Timeline */}
                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-600 mb-4">Delivery Progress</p>
                  <div className="flex items-center justify-between">
                    {getStatusSteps(delivery.status).map((step, index) => (
                      <div key={step.step} className="flex items-center flex-1">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            step.completed
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {step.completed ? '✓' : index + 1}
                        </div>
                        {index < getStatusSteps(delivery.status).length - 1 && (
                          <div
                            className={`flex-1 h-1 mx-2 ${
                              step.completed ? 'bg-green-600' : 'bg-gray-200'
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-2">
                    <span>Pending</span>
                    <span>Assigned</span>
                    <span>Picked Up</span>
                    <span>In Transit</span>
                    <span>Delivered</span>
                  </div>
                </div>

                {/* Notes */}
                {delivery.notes && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-600 mb-2">Notes</p>
                    <p className="text-gray-700">{delivery.notes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
