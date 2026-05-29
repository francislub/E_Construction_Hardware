"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface DeliveryWithOrder {
  id: string;
  orderId: string;
  status: string;
  estimatedDate: string | null;
  location: string | null;
  notes: string | null;
  createdAt: string;
  order: {
    orderNumber: string;
    shippingAddress: string;
    total: number;
    customer: {
      user: {
        name: string | null;
        phone: string | null;
      };
    };
    items: {
      id: string;
      quantity: number;
      price: number;
      product: { name: string };
    }[];
  };
}

export default function PendingDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<DeliveryWithOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPending();
  }, []);

  async function fetchPending() {
    try {
      const res = await fetch("/api/delivery/pending");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setDeliveries(data);
    } catch (e) {
      setError("Unable to load pending deliveries.");
    } finally {
      setLoading(false);
    }
  }

  async function acceptDelivery(deliveryId: string) {
    setAccepting(deliveryId);
    try {
      const res = await fetch(`/api/delivery/${deliveryId}/accept`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to accept");
      setDeliveries((prev) => prev.filter((d) => d.id !== deliveryId));
    } catch {
      setError("Failed to accept delivery. Try again.");
    } finally {
      setAccepting(null);
    }
  }

  return (
    <div className="delivery-page">
      <header className="page-header">
        <div className="header-left">
          <span className="page-tag">Queue</span>
          <h1>Pending Deliveries</h1>
          <p className="header-sub">
            {loading
              ? "Loading..."
              : `${deliveries.length} awaiting assignment`}
          </p>
        </div>
        <button className="refresh-btn" onClick={fetchPending} title="Refresh">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </header>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {loading ? (
        <div className="skeleton-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      ) : deliveries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          </div>
          <h3>No pending deliveries</h3>
          <p>New orders will appear here when they're ready for pickup.</p>
        </div>
      ) : (
        <ul className="delivery-list">
          {deliveries.map((delivery) => (
            <li key={delivery.id} className="delivery-card pending-card">
              <div className="card-top">
                <div className="order-meta">
                  <span className="order-number">#{delivery.order.orderNumber}</span>
                  <span className="status-chip status-pending">Unassigned</span>
                </div>
                <span className="time-ago">
                  {formatDistanceToNow(new Date(delivery.createdAt), { addSuffix: true })}
                </span>
              </div>

              <div className="card-body">
                <div className="info-row">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>{delivery.order.customer.user.name ?? "Customer"}</span>
                  {delivery.order.customer.user.phone && (
                    <a href={`tel:${delivery.order.customer.user.phone}`} className="phone-link">
                      {delivery.order.customer.user.phone}
                    </a>
                  )}
                </div>

                <div className="info-row">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="address">{delivery.order.shippingAddress}</span>
                </div>

                <div className="items-summary">
                  {delivery.order.items.slice(0, 2).map((item) => (
                    <span key={item.id} className="item-pill">
                      {item.quantity}× {item.product.name}
                    </span>
                  ))}
                  {delivery.order.items.length > 2 && (
                    <span className="item-pill item-pill-more">
                      +{delivery.order.items.length - 2} more
                    </span>
                  )}
                </div>
              </div>

              <div className="card-footer">
                <span className="order-total">
                  UGX {delivery.order.total.toLocaleString()}
                </span>
                {delivery.estimatedDate && (
                  <span className="est-date">
                    Est. {new Date(delivery.estimatedDate).toLocaleDateString("en-UG", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
                <button
                  className="accept-btn"
                  onClick={() => acceptDelivery(delivery.id)}
                  disabled={accepting === delivery.id}
                >
                  {accepting === delivery.id ? (
                    <span className="btn-spinner" />
                  ) : (
                    "Accept"
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}