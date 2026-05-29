"use client";

import { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";

interface CompletedDelivery {
  id: string;
  orderId: string;
  status: "DELIVERED" | "FAILED";
  estimatedDate: string | null;
  actualDate: string | null;
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

type FilterMode = "all" | "delivered" | "failed";

export default function CompletedDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<CompletedDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchCompleted();
  }, []);

  async function fetchCompleted() {
    setLoading(true);
    try {
      const res = await fetch("/api/delivery/completed");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setDeliveries(data);
    } catch {
      setError("Unable to load completed deliveries.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = deliveries
    .filter((d) => {
      if (filter === "delivered") return d.status === "DELIVERED";
      if (filter === "failed") return d.status === "FAILED";
      return true;
    })
    .filter((d) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        d.order.orderNumber.toLowerCase().includes(q) ||
        (d.order.customer.user.name ?? "").toLowerCase().includes(q) ||
        d.order.shippingAddress.toLowerCase().includes(q)
      );
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalRevenue = deliveries
    .filter((d) => d.status === "DELIVERED")
    .reduce((sum, d) => sum + d.order.total, 0);

  return (
    <div className="delivery-page">
      <header className="page-header">
        <div className="header-left">
          <span className="page-tag">History</span>
          <h1>Completed Deliveries</h1>
          <p className="header-sub">
            {loading ? "Loading..." : `${deliveries.filter((d) => d.status === "DELIVERED").length} delivered · ${deliveries.filter((d) => d.status === "FAILED").length} failed`}
          </p>
        </div>
      </header>

      {/* Summary Stats */}
      {!loading && (
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-value">{deliveries.filter((d) => d.status === "DELIVERED").length}</span>
            <span className="stat-label">Delivered</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{deliveries.filter((d) => d.status === "FAILED").length}</span>
            <span className="stat-label">Failed</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {deliveries.length > 0
                ? Math.round(
                    (deliveries.filter((d) => d.status === "DELIVERED").length / deliveries.length) * 100
                  )
                : 0}%
            </span>
            <span className="stat-label">Success Rate</span>
          </div>
          <div className="stat-card wide">
            <span className="stat-value">UGX {totalRevenue.toLocaleString()}</span>
            <span className="stat-label">Total Value Delivered</span>
          </div>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="filters-bar">
        <div className="filter-tabs">
          {(["all", "delivered", "failed"] as FilterMode[]).map((f) => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? "active" : ""}`}
              onClick={() => { setFilter(f); setPage(1); }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="search-wrap">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="search-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="skeleton-list">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3>No deliveries found</h3>
          <p>Completed deliveries will appear here.</p>
        </div>
      ) : (
        <>
          <ul className="delivery-list">
            {paginated.map((delivery) => (
              <li key={delivery.id} className={`delivery-card completed-card ${delivery.status === "FAILED" ? "failed-card" : ""}`}>
                <div className="card-top">
                  <div className="order-meta">
                    <span className="order-number">#{delivery.order.orderNumber}</span>
                    <span className={`status-chip ${delivery.status === "DELIVERED" ? "status-delivered" : "status-failed"}`}>
                      {delivery.status === "DELIVERED" ? "✓ Delivered" : "✕ Failed"}
                    </span>
                  </div>
                  <span className="time-ago">
                    {delivery.actualDate
                      ? formatDistanceToNow(new Date(delivery.actualDate), { addSuffix: true })
                      : formatDistanceToNow(new Date(delivery.updatedAt), { addSuffix: true })}
                  </span>
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>{delivery.order.customer.user.name ?? "Customer"}</span>
                  </div>

                  <div className="info-row">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="address">{delivery.order.shippingAddress}</span>
                  </div>

                  <div className="date-row">
                    <span className="date-label">
                      {delivery.estimatedDate && (
                        <>Est: {format(new Date(delivery.estimatedDate), "MMM d")}</>
                      )}
                    </span>
                    <span className="date-label">
                      {delivery.actualDate && (
                        <>Actual: {format(new Date(delivery.actualDate), "MMM d, HH:mm")}</>
                      )}
                    </span>
                  </div>

                  <div className="items-summary">
                    {delivery.order.items.slice(0, 3).map((item) => (
                      <span key={item.id} className="item-pill">
                        {item.quantity}× {item.product.name}
                      </span>
                    ))}
                    {delivery.order.items.length > 3 && (
                      <span className="item-pill item-pill-more">
                        +{delivery.order.items.length - 3} more
                      </span>
                    )}
                  </div>

                  {delivery.notes && (
                    <p className="delivery-note-text">📝 {delivery.notes}</p>
                  )}
                </div>

                <div className="card-footer">
                  <span className="order-total">UGX {delivery.order.total.toLocaleString()}</span>
                </div>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ←
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`page-btn ${page === p ? "active" : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="page-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}