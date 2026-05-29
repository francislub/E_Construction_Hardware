"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

type DeliveryStatus = "ASSIGNED" | "PICKED_UP" | "IN_TRANSIT";

interface ActiveDelivery {
  id: string;
  orderId: string;
  status: DeliveryStatus;
  estimatedDate: string | null;
  location: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
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

const STATUS_STEPS: DeliveryStatus[] = ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"];

const STATUS_LABELS: Record<DeliveryStatus | string, string> = {
  ASSIGNED: "Assigned",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
};

const NEXT_STATUS: Record<DeliveryStatus, DeliveryStatus | "DELIVERED"> = {
  ASSIGNED: "PICKED_UP",
  PICKED_UP: "IN_TRANSIT",
  IN_TRANSIT: "DELIVERED",
};

const NEXT_LABEL: Record<DeliveryStatus, string> = {
  ASSIGNED: "Mark Picked Up",
  PICKED_UP: "Mark In Transit",
  IN_TRANSIT: "Mark Delivered",
};

export default function ActiveDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<ActiveDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [locationInput, setLocationInput] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetchActive();
  }, []);

  async function fetchActive() {
    setLoading(true);
    try {
      const res = await fetch("/api/delivery/active");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setDeliveries(data);
    } catch {
      setError("Unable to load active deliveries.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(delivery: ActiveDelivery) {
    const nextStatus = NEXT_STATUS[delivery.status];
    setUpdating(delivery.id);
    try {
      const res = await fetch(`/api/delivery/${delivery.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          location: locationInput[delivery.id] ?? delivery.location,
        }),
      });
      if (!res.ok) throw new Error("Update failed");
      if (nextStatus === "DELIVERED") {
        setDeliveries((prev) => prev.filter((d) => d.id !== delivery.id));
      } else {
        setDeliveries((prev) =>
          prev.map((d) =>
            d.id === delivery.id
              ? { ...d, status: nextStatus as DeliveryStatus }
              : d
          )
        );
      }
    } catch {
      setError("Failed to update status.");
    } finally {
      setUpdating(null);
    }
  }

  function stepIndex(status: DeliveryStatus) {
    return STATUS_STEPS.indexOf(status);
  }

  return (
    <div className="delivery-page">
      <header className="page-header">
        <div className="header-left">
          <span className="page-tag">Live</span>
          <h1>Active Deliveries</h1>
          <p className="header-sub">
            {loading ? "Loading..." : `${deliveries.length} in progress`}
          </p>
        </div>
        <button className="refresh-btn" onClick={fetchActive} title="Refresh">
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
          {[1, 2].map((i) => (
            <div key={i} className="skeleton-card tall" />
          ))}
        </div>
      ) : deliveries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
              <rect x="1" y="3" width="15" height="13" rx="1.5" />
              <path d="M16 8l5 3-5 3V8z" />
              <line x1="1" y1="20" x2="23" y2="20" />
            </svg>
          </div>
          <h3>No active deliveries</h3>
          <p>Accept a pending delivery to get started.</p>
        </div>
      ) : (
        <ul className="delivery-list">
          {deliveries.map((delivery) => (
            <li key={delivery.id} className="delivery-card active-card">
              <div className="card-top">
                <div className="order-meta">
                  <span className="order-number">#{delivery.order.orderNumber}</span>
                  <span className={`status-chip status-${delivery.status.toLowerCase().replace("_", "-")}`}>
                    {STATUS_LABELS[delivery.status]}
                  </span>
                </div>
                <button
                  className="expand-btn"
                  onClick={() => setExpanded(expanded === delivery.id ? null : delivery.id)}
                >
                  {expanded === delivery.id ? "▲" : "▼"}
                </button>
              </div>

              {/* Progress stepper */}
              <div className="progress-stepper">
                {STATUS_STEPS.map((step, idx) => (
                  <div key={step} className="step-item">
                    <div className={`step-dot ${idx <= stepIndex(delivery.status) ? "step-done" : ""}`}>
                      {idx < stepIndex(delivery.status) ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div className={`step-line ${idx < stepIndex(delivery.status) ? "line-done" : ""}`} />
                    )}
                    <span className="step-label">{STATUS_LABELS[step]}</span>
                  </div>
                ))}
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
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35 2 2 0 0 1 3.57 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.84a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      Call
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

                {expanded === delivery.id && (
                  <div className="expanded-section">
                    <div className="items-list">
                      <span className="items-label">Items</span>
                      {delivery.order.items.map((item) => (
                        <div key={item.id} className="item-row">
                          <span>{item.product.name}</span>
                          <span>×{item.quantity}</span>
                          <span>UGX {(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="location-input-wrap">
                      <label>Current Location Note</label>
                      <input
                        type="text"
                        placeholder="e.g. At Kampala Road roundabout"
                        value={locationInput[delivery.id] ?? delivery.location ?? ""}
                        onChange={(e) =>
                          setLocationInput((prev) => ({
                            ...prev,
                            [delivery.id]: e.target.value,
                          }))
                        }
                        className="location-input"
                      />
                    </div>

                    {delivery.notes && (
                      <div className="delivery-notes">
                        <span className="notes-label">Notes</span>
                        <p>{delivery.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="card-footer">
                <span className="order-total">UGX {delivery.order.total.toLocaleString()}</span>
                {delivery.estimatedDate && (
                  <span className="est-date">
                    Est. {new Date(delivery.estimatedDate).toLocaleDateString("en-UG", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
                <button
                  className={`next-status-btn ${delivery.status === "IN_TRANSIT" ? "deliver-btn" : ""}`}
                  onClick={() => updateStatus(delivery)}
                  disabled={updating === delivery.id}
                >
                  {updating === delivery.id ? (
                    <span className="btn-spinner" />
                  ) : (
                    NEXT_LABEL[delivery.status]
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