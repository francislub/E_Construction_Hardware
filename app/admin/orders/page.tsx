'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// ─── Types (matching your Prisma schema exactly) ──────────────────────────────

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
type DeliveryStatus = 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { id: string; name: string; images: string[]; slug: string | null; };
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  transactionId: string | null;
  createdAt: string;
}

interface Delivery {
  id: string;
  status: DeliveryStatus;
  estimatedDate: string | null;
  actualDate: string | null;
  location: string | null;
  notes: string | null;
  staff?: { id: string; vehicleType: string; user: { id: string; name: string | null; email: string } } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: string;
  billingAddress: string | null;
  customer: { user: { name: string | null; email: string; phone?: string | null } };
  supplier: { id: string; companyName: string; verified?: boolean; phone?: string; address?: string };
  items: OrderItem[];
  payment: Payment | null;
  delivery: Delivery | null;
  createdAt: string;
  updatedAt: string;
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface Stats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  revenue: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ORDER_STATUSES: OrderStatus[] = ['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','RETURNED'];
const PAYMENT_STATUSES: PaymentStatus[] = ['PENDING','COMPLETED','FAILED','REFUNDED'];

const STATUS_CFG: Record<OrderStatus, { label: string; dot: string; bg: string; border: string; text: string }> = {
  PENDING:    { label: 'Pending',    dot: '#f59e0b', bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
  CONFIRMED:  { label: 'Confirmed',  dot: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', text: '#1e3a8a' },
  PROCESSING: { label: 'Processing', dot: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', text: '#4c1d95' },
  SHIPPED:    { label: 'Shipped',    dot: '#06b6d4', bg: '#ecfeff', border: '#a5f3fc', text: '#164e63' },
  DELIVERED:  { label: 'Delivered',  dot: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', text: '#064e3b' },
  CANCELLED:  { label: 'Cancelled',  dot: '#ef4444', bg: '#fef2f2', border: '#fecaca', text: '#7f1d1d' },
  RETURNED:   { label: 'Returned',   dot: '#f97316', bg: '#fff7ed', border: '#fed7aa', text: '#7c2d12' },
};

const PAY_CFG: Record<PaymentStatus, { color: string }> = {
  PENDING:   { color: '#d97706' },
  COMPLETED: { color: '#059669' },
  FAILED:    { color: '#dc2626' },
  REFUNDED:  { color: '#ea580c' },
};

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:    ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:  ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED:    ['DELIVERED', 'RETURNED'],
  DELIVERED:  ['RETURNED'],
  CANCELLED:  [],
  RETURNED:   [],
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ─── Inline SVG Icons ─────────────────────────────────────────────────────────

const ICON_PATHS: Record<string, string> = {
  search:      'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  refresh:     'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  filter:      'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
  eye:         'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  trash:       'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  check:       'M5 13l4 4L19 7',
  x:           'M6 18L18 6M6 6l12 12',
  chevronDown: 'M19 9l-7 7-7-7',
  chevronUp:   'M5 15l7-7 7 7',
  package:     'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  truck:       'M9 17a2 2 0 11-4 0 2 2 0 014 0zM21 17a2 2 0 11-4 0 2 2 0 014 0z M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6',
  dollar:      'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  bag:         'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z M3 6h18 M16 10a4 4 0 01-8 0',
  clock:       'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2',
  alert:       'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  edit:        'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  arrowUp:     'M5 10l7-7m0 0l7 7m-7-7v18',
  arrowDown:   'M19 14l-7 7m0 0l-7-7m7 7V3',
  checkCircle: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  spinner:     'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
};

function Icon({ name, size = 16, color = 'currentColor' }: { name: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <path d={ICON_PATHS[name] ?? ''} />
    </svg>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status, size = 'sm' }: { status: OrderStatus; size?: 'sm' | 'md' }) {
  const cfg = STATUS_CFG[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      color: cfg.text, borderRadius: 20,
      padding: size === 'sm' ? '3px 9px' : '5px 13px',
      fontSize: size === 'sm' ? 11 : 13,
      fontWeight: 700, letterSpacing: '0.03em',
      fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: string | number; icon: string; accent: string }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e8eaf0',
      borderRadius: 12, padding: '14px 18px',
      borderTop: `3px solid ${accent}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        <Icon name={icon} size={14} color={accent} />
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', fontFamily: "'DM Mono', monospace" }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#111827', fontFamily: "'Syne', sans-serif" }}>{value}</div>
    </div>
  );
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────

function OrderModal({
  order,
  onClose,
  onStatusChange,
  onDelete,
  saving,
}: {
  order: Order;
  onClose: () => void;
  onStatusChange: (id: string, status: OrderStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  saving: boolean;
}) {
  const [tab, setTab] = useState<'items' | 'financials' | 'delivery' | 'actions'>('items');
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [localOrder, setLocalOrder] = useState(order);
  const allowed = TRANSITIONS[localOrder.status] ?? [];

  // Sync when parent updates order
  useEffect(() => { setLocalOrder(order); }, [order]);

  const handleApplyStatus = async () => {
    if (!newStatus) return;
    await onStatusChange(localOrder.id, newStatus as OrderStatus);
    setLocalOrder(prev => ({ ...prev, status: newStatus as OrderStatus }));
    setNewStatus('');
  };

  const handleDelete = async () => {
    if (!confirm('Permanently delete this order? This cannot be undone.')) return;
    await onDelete(localOrder.id);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 820,
        maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 30px 70px rgba(0,0,0,0.25)',
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid #1e293b',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: '#fff', fontFamily: "'Syne', sans-serif" }}>
                {localOrder.orderNumber}
              </span>
              <StatusBadge status={localOrder.status} />
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
              {localOrder.customer.user.name ?? '—'} · {localOrder.customer.user.email}
              {localOrder.customer.user.phone ? ` · ${localOrder.customer.user.phone}` : ''}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none',
            borderRadius: 8, padding: '6px', cursor: 'pointer',
          }}>
            <Icon name="x" size={18} color="#fff" />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', borderBottom: '1px solid #f0f0f0',
          background: '#fafafa', padding: '0 24px', flexShrink: 0,
        }}>
          {(['items', 'financials', 'delivery', 'actions'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '11px 16px', fontSize: 12, fontWeight: 600,
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: tab === t ? '2px solid #6366f1' : '2px solid transparent',
              color: tab === t ? '#6366f1' : '#6b7280',
              fontFamily: "'DM Mono', monospace",
              textTransform: 'capitalize',
              transition: 'color 0.15s',
            }}>{t}</button>
          ))}
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {/* ITEMS TAB */}
          {tab === 'items' && (
            <div>
              <p style={{ margin: '0 0 14px', fontSize: 13, color: '#6b7280' }}>
                {localOrder.items.reduce((s, i) => s + i.quantity, 0)} items · supplier:{' '}
                <strong style={{ color: '#374151' }}>{localOrder.supplier.companyName}</strong>
                {localOrder.supplier.verified && (
                  <span style={{ marginLeft: 6, fontSize: 10, background: '#d1fae5', color: '#065f46', padding: '1px 7px', borderRadius: 20, border: '1px solid #6ee7b7', fontWeight: 700 }}>
                    Verified
                  </span>
                )}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {localOrder.items.map(item => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: '#f9fafb', borderRadius: 10, padding: '12px 14px',
                    border: '1px solid #e5e7eb',
                  }}>
                    {item.product.images[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', border: '1px solid #e5e7eb' }}
                      />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 8, background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="package" size={20} color="#9ca3af" />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.product.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                        ×{item.quantity} @ ${item.price.toFixed(2)} each
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', flexShrink: 0 }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FINANCIALS TAB */}
          {tab === 'financials' && (
            <div style={{ display: 'grid', gap: 16, maxWidth: 480 }}>
              {/* Totals breakdown */}
              <div style={{ background: '#f9fafb', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
                {([
                  ['Subtotal', `$${localOrder.subtotal.toFixed(2)}`],
                  ['Shipping', localOrder.shippingCost === 0 ? 'Free' : `$${localOrder.shippingCost.toFixed(2)}`],
                  ['Tax (10%)', `$${localOrder.tax.toFixed(2)}`],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb', fontSize: 14, color: '#6b7280' }}>
                    <span>{k}</span>
                    <span style={{ fontWeight: 500, color: '#374151' }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontSize: 16, fontWeight: 800, color: '#111827', fontFamily: "'Syne', sans-serif" }}>
                  <span>Total</span>
                  <span style={{ color: '#6366f1' }}>${localOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment info */}
              {localOrder.payment ? (
                <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#166534', marginBottom: 10 }}>Payment</div>
                  <div style={{ display: 'grid', gap: 5, fontSize: 13, color: '#374151' }}>
                    <div><span style={{ color: '#6b7280' }}>Method: </span>{localOrder.payment.method.replace(/_/g, ' ')}</div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Status: </span>
                      <span style={{ color: PAY_CFG[localOrder.payment.status]?.color, fontWeight: 700 }}>
                        {localOrder.payment.status}
                      </span>
                    </div>
                    {localOrder.payment.transactionId && (
                      <div>
                        <span style={{ color: '#6b7280' }}>Txn ID: </span>
                        <code style={{ fontSize: 11, background: '#e5e7eb', padding: '1px 6px', borderRadius: 4, fontFamily: "'DM Mono', monospace" }}>
                          {localOrder.payment.transactionId}
                        </code>
                      </div>
                    )}
                    <div><span style={{ color: '#6b7280' }}>Amount: </span>${localOrder.payment.amount.toFixed(2)}</div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: 16, background: '#fefce8', borderRadius: 10, border: '1px solid #fde68a', fontSize: 13, color: '#92400e' }}>
                  No payment record attached to this order.
                </div>
              )}

              {/* Addresses */}
              <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 8 }}>Addresses</div>
                <div style={{ fontSize: 13, color: '#6b7280', display: 'grid', gap: 6 }}>
                  <div><strong style={{ color: '#374151' }}>Shipping: </strong>{localOrder.shippingAddress}</div>
                  {localOrder.billingAddress && (
                    <div><strong style={{ color: '#374151' }}>Billing: </strong>{localOrder.billingAddress}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* DELIVERY TAB */}
          {tab === 'delivery' && (
            <div>
              {localOrder.delivery ? (
                <div style={{ display: 'grid', gap: 14 }}>
                  <div style={{ padding: 18, background: '#eff6ff', borderRadius: 12, border: '1px solid #bfdbfe' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1e40af', marginBottom: 12 }}>Delivery Information</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                      {([
                        ['Status', localOrder.delivery.status],
                        ['Location', localOrder.delivery.location ?? '—'],
                        ['Estimated Date', localOrder.delivery.estimatedDate ? new Date(localOrder.delivery.estimatedDate).toLocaleDateString() : '—'],
                        ['Actual Date', localOrder.delivery.actualDate ? new Date(localOrder.delivery.actualDate).toLocaleDateString() : '—'],
                      ] as [string, string][]).map(([k, v]) => (
                        <div key={k}>
                          <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{k}</div>
                          <div style={{ fontWeight: 600, color: '#1e40af' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {localOrder.delivery.notes && (
                      <div style={{ marginTop: 12, padding: 10, background: '#fff', borderRadius: 8, fontSize: 12, color: '#374151' }}>
                        <strong>Notes: </strong>{localOrder.delivery.notes}
                      </div>
                    )}
                  </div>

                  {/* Staff info */}
                  {localOrder.delivery.staff && (
                    <div style={{ padding: 14, background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#166534', marginBottom: 8 }}>Assigned Staff</div>
                      <div style={{ fontSize: 13, color: '#374151', display: 'grid', gap: 4 }}>
                        <div>{localOrder.delivery.staff.user.name ?? localOrder.delivery.staff.user.email}</div>
                        <div style={{ color: '#6b7280' }}>{localOrder.delivery.staff.user.email}</div>
                        <div><span style={{ color: '#6b7280' }}>Vehicle: </span>{localOrder.delivery.staff.vehicleType}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '50px 0', color: '#9ca3af' }}>
                  <Icon name="truck" size={44} color="#d1d5db" />
                  <div style={{ marginTop: 14, fontSize: 14 }}>No delivery record for this order yet.</div>
                  <div style={{ marginTop: 6, fontSize: 12, color: '#d1d5db' }}>Delivery is created when order is shipped.</div>
                </div>
              )}
            </div>
          )}

          {/* ACTIONS TAB */}
          {tab === 'actions' && (
            <div style={{ display: 'grid', gap: 16 }}>
              {/* Status transition */}
              <div style={{ padding: 20, background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 4 }}>Update Order Status</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Current: <StatusBadge status={localOrder.status} />
                </div>
                {allowed.length > 0 ? (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <select
                      value={newStatus}
                      onChange={e => setNewStatus(e.target.value as OrderStatus)}
                      style={{
                        padding: '8px 12px', fontSize: 13, borderRadius: 8,
                        border: '1px solid #d1d5db', background: '#fff', color: '#374151',
                        cursor: 'pointer', flex: 1, minWidth: 160,
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      <option value=''>Select new status…</option>
                      {allowed.map(s => (
                        <option key={s} value={s}>{STATUS_CFG[s].label}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleApplyStatus}
                      disabled={!newStatus || saving}
                      style={{
                        padding: '8px 20px',
                        background: newStatus && !saving ? '#6366f1' : '#e5e7eb',
                        color: newStatus && !saving ? '#fff' : '#9ca3af',
                        border: 'none', borderRadius: 8, fontSize: 13,
                        fontWeight: 700, cursor: newStatus && !saving ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', gap: 7,
                        fontFamily: "'DM Mono', monospace",
                        transition: 'background 0.15s',
                      }}
                    >
                      {saving && <Icon name="spinner" size={14} color="#9ca3af" />}
                      Apply
                    </button>
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>
                    No further transitions available for <strong>{STATUS_CFG[localOrder.status].label}</strong>.
                  </p>
                )}
              </div>

              {/* Quick confirm shortcut */}
              {localOrder.status === 'PENDING' && (
                <button
                  onClick={async () => {
                    await onStatusChange(localOrder.id, 'CONFIRMED');
                    setLocalOrder(prev => ({ ...prev, status: 'CONFIRMED' }));
                  }}
                  disabled={saving}
                  style={{
                    padding: '14px 20px',
                    background: saving ? '#e5e7eb' : 'linear-gradient(135deg, #10b981, #059669)',
                    color: saving ? '#9ca3af' : '#fff',
                    border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontFamily: "'Syne', sans-serif", letterSpacing: '0.02em',
                    boxShadow: saving ? 'none' : '0 4px 12px rgba(16,185,129,0.3)',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon name="checkCircle" size={18} color={saving ? '#9ca3af' : '#fff'} />
                  Confirm This Order
                </button>
              )}

              {/* Danger zone */}
              <div style={{ padding: 18, background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#7f1d1d', marginBottom: 6 }}>Danger Zone</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
                  Permanently delete this order and all associated data. Cannot be undone.
                  {(localOrder.status === 'DELIVERED' || localOrder.status === 'SHIPPED') && (
                    <span style={{ display: 'block', marginTop: 6, color: '#dc2626', fontWeight: 600 }}>
                      Warning: This order is {localOrder.status.toLowerCase()}. Deletion requires ?force=true.
                    </span>
                  )}
                </div>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  style={{
                    padding: '8px 16px', background: saving ? '#fca5a5' : '#dc2626',
                    color: '#fff', border: 'none', borderRadius: 8, fontSize: 12,
                    fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'background 0.15s',
                  }}
                >
                  <Icon name="trash" size={14} color="#fff" />
                  Delete Order
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '12px 24px', borderTop: '1px solid #f0f0f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#fafafa', flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: "'DM Mono', monospace" }}>
            Created {new Date(localOrder.createdAt).toLocaleString()} ·
            Updated {new Date(localOrder.updatedAt).toLocaleString()}
          </span>
          <button onClick={onClose} style={{
            padding: '7px 20px', background: '#f3f4f6',
            border: '1px solid #e5e7eb', borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151',
          }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  // ── Data state ──
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Pagination ──
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // ── Filters ──
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [payFilter, setPayFilter] = useState<'ALL' | PaymentStatus>('ALL');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // ── Sort ──
  const [sortField, setSortField] = useState<'createdAt' | 'total' | 'status'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // ── Selection ──
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');

  // ── Modal ──
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  // ── Toast ──
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── Auth guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (session?.user?.role !== 'ADMIN') router.push('/');
  }, [session, sessionStatus, router]);

  // ─── Debounce search ──────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ─── Fetch orders from /api/admin/orders ──────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortField,
        sortDir,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(payFilter !== 'ALL' && { paymentStatus: payFilter }),
        ...(supplierFilter && { supplierId: supplierFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });

      const res = await fetch(`/api/admin/orders?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

      const data: OrdersResponse = await res.json();
      setOrders(data.orders ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotalCount(data.total ?? 0);
      setSelected(new Set());
    } catch (err) {
      setError('Failed to load orders. Please try again.');
      console.error('[fetchOrders]', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortField, sortDir, debouncedSearch, statusFilter, payFilter, supplierFilter, dateFrom, dateTo]);

  // ─── Fetch stats from /api/admin/orders/stats ─────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/admin/orders/stats');
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error('[fetchStats]', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchOrders();
      fetchStats();
    }
  }, [fetchOrders, fetchStats, session]);

  // Reset to page 1 whenever any filter / sort changes
  useEffect(() => { setPage(1); }, [
    debouncedSearch, statusFilter, payFilter,
    supplierFilter, dateFrom, dateTo, sortField, sortDir,
  ]);

  // ─── PATCH: update order status via /api/admin/orders/[id] ───────────────
  const handleStatusChange = async (id: string, status: OrderStatus) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setOrders(prev => prev.map(o => o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o));
      if (viewOrder?.id === id) setViewOrder(prev => prev ? { ...prev, status } : null);
      showToast(`Status updated to ${STATUS_CFG[status].label}`);
      fetchStats(); // refresh counters
    } catch (err) {
      showToast('Failed to update status.', 'error');
      console.error('[handleStatusChange]', err);
    } finally {
      setSaving(false);
    }
  };

  // ─── DELETE: /api/admin/orders/[id] ──────────────────────────────────────
  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' });
      if (res.status === 422) {
        // Locked status — retry with force
        if (confirm('This order is SHIPPED or DELIVERED. Force delete anyway?')) {
          const forced = await fetch(`/api/admin/orders/${id}?force=true`, { method: 'DELETE' });
          if (!forced.ok) throw new Error(`HTTP ${forced.status}`);
        } else {
          setSaving(false);
          return;
        }
      } else if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      setOrders(prev => prev.filter(o => o.id !== id));
      setTotalCount(prev => prev - 1);
      showToast('Order deleted.', 'error');
      fetchStats();
    } catch (err) {
      showToast('Failed to delete order.', 'error');
      console.error('[handleDelete]', err);
    } finally {
      setSaving(false);
    }
  };

  // ─── Bulk actions ─────────────────────────────────────────────────────────
  const applyBulkAction = async () => {
    if (!bulkAction || selected.size === 0) return;
    const ids = Array.from(selected);
    setSaving(true);
    try {
      if (bulkAction === 'delete') {
        if (!confirm(`Permanently delete ${ids.length} orders?`)) { setSaving(false); return; }
        await Promise.all(ids.map(id => fetch(`/api/admin/orders/${id}`, { method: 'DELETE' })));
        setOrders(prev => prev.filter(o => !ids.includes(o.id)));
        setTotalCount(prev => prev - ids.length);
        showToast(`${ids.length} orders deleted.`, 'error');
      } else {
        await Promise.all(ids.map(id =>
          fetch(`/api/admin/orders/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: bulkAction }),
          })
        ));
        setOrders(prev => prev.map(o =>
          ids.includes(o.id) ? { ...o, status: bulkAction as OrderStatus } : o
        ));
        showToast(`${ids.length} orders updated to ${STATUS_CFG[bulkAction as OrderStatus]?.label ?? bulkAction}.`);
      }
    } catch (err) {
      showToast('Bulk action failed.', 'error');
      console.error('[applyBulkAction]', err);
    } finally {
      setSaving(false);
      setBulkAction('');
      setSelected(new Set());
      fetchStats();
    }
  };

  // ─── Sort helpers ─────────────────────────────────────────────────────────
  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  // ─── Selection helpers ────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(prev =>
      prev.size === orders.length ? new Set() : new Set(orders.map(o => o.id))
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setPayFilter('ALL');
    setSupplierFilter('');
    setDateFrom('');
    setDateTo('');
  };

  // ─── Sort button ──────────────────────────────────────────────────────────
  function SortBtn({ field, label }: { field: typeof sortField; label: string }) {
    return (
      <button onClick={() => toggleSort(field)} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 4,
        color: '#6b7280', fontSize: 11, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.07em',
        fontFamily: "'DM Mono', monospace",
        padding: 0,
      }}>
        {label}
        {sortField === field
          ? <Icon name={sortDir === 'asc' ? 'arrowUp' : 'arrowDown'} size={11} color="#6366f1" />
          : <Icon name="arrowDown" size={11} color="#d1d5db" />}
      </button>
    );
  }

  // ─── Auth loading / guard ─────────────────────────────────────────────────
  if (sessionStatus === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#6b7280', fontSize: 14 }}>
          <Icon name="spinner" size={20} color="#6366f1" />
          Authenticating…
        </div>
      </div>
    );
  }

  const pendingCount = stats?.pending ?? 0;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f9', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #c5c5c5; border-radius: 3px; }
        input[type=checkbox] { accent-color: #6366f1; width: 14px; height: 14px; cursor: pointer; }
        select:focus, input:focus { outline: none; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 3000,
          background: toast.type === 'error' ? '#dc2626' : '#10b981',
          color: '#fff', padding: '11px 18px', borderRadius: 10,
          fontSize: 13, fontWeight: 600,
          boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'fadeUp 0.2s ease',
        }}>
          <Icon name={toast.type === 'error' ? 'alert' : 'checkCircle'} size={15} color="#fff" />
          {toast.msg}
        </div>
      )}

      {/* ── Order Modal ── */}
      {viewOrder && (
        <OrderModal
          order={viewOrder}
          onClose={() => setViewOrder(null)}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          saving={saving}
        />
      )}

      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 20px' }}>

        {/* ── Page Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em' }}>
              Order Management
            </h1>
            <div style={{ marginTop: 5, fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 8 }}>
              {loading
                ? <span>Loading…</span>
                : <span>{totalCount.toLocaleString()} total orders</span>}
              {pendingCount > 0 && (
                <span style={{
                  background: '#fef3c7', color: '#92400e',
                  padding: '2px 9px', borderRadius: 20,
                  fontSize: 11, fontWeight: 700, border: '1px solid #fde68a',
                }}>
                  {pendingCount} pending review
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => { fetchOrders(); fetchStats(); }}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 16px', background: '#fff',
              border: '1px solid #e5e7eb', borderRadius: 9,
              fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              color: '#374151', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              opacity: loading ? 0.7 : 1,
            }}
          >
            <span style={{ animation: loading ? 'spin 1s linear infinite' : 'none', display: 'flex' }}>
              <Icon name="refresh" size={14} />
            </span>
            Refresh
          </button>
        </div>

        {/* ── Stats Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          {statsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                background: '#fff', border: '1px solid #e8eaf0', borderRadius: 12,
                padding: '14px 18px', borderTop: '3px solid #e5e7eb',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              }}>
                <div style={{ height: 10, background: '#f3f4f6', borderRadius: 4, marginBottom: 10 }} />
                <div style={{ height: 22, background: '#f3f4f6', borderRadius: 4, width: '60%' }} />
              </div>
            ))
          ) : stats ? (
            <>
              <StatCard label="Revenue" value={`$${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon="dollar" accent="#10b981" />
              <StatCard label="Total" value={stats.total.toLocaleString()} icon="bag" accent="#6366f1" />
              <StatCard label="Pending" value={stats.pending} icon="clock" accent="#f59e0b" />
              <StatCard label="Processing" value={stats.processing} icon="refresh" accent="#8b5cf6" />
              <StatCard label="Shipped" value={stats.shipped} icon="truck" accent="#06b6d4" />
              <StatCard label="Delivered" value={stats.delivered} icon="checkCircle" accent="#10b981" />
            </>
          ) : null}
        </div>

        {/* ── Main Panel ── */}
        <div style={{
          background: '#fff', borderRadius: 14,
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}>

          {/* ── Search + filter bar ── */}
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid #f3f4f6',
            display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
          }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 240px' }}>
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <Icon name="search" size={14} color="#9ca3af" />
              </span>
              <input
                type="text"
                placeholder="Search order #, customer, supplier…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', paddingLeft: 33, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                  fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 9,
                  background: '#f9fafb', color: '#374151', fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              style={{ padding: '8px 12px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 9, background: '#f9fafb', color: '#374151', cursor: 'pointer', fontFamily: "'DM Mono', monospace" }}
            >
              <option value="ALL">All Statuses</option>
              {ORDER_STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
            </select>

            {/* Payment filter */}
            <select
              value={payFilter}
              onChange={e => setPayFilter(e.target.value as any)}
              style={{ padding: '8px 12px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 9, background: '#f9fafb', color: '#374151', cursor: 'pointer', fontFamily: "'DM Mono', monospace" }}
            >
              <option value="ALL">All Payments</option>
              {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Advanced filters toggle */}
            <button
              onClick={() => setShowFilters(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                background: showFilters ? '#ede9fe' : '#f9fafb',
                color: showFilters ? '#6d28d9' : '#374151',
                border: `1px solid ${showFilters ? '#ddd6fe' : '#e5e7eb'}`,
                borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <Icon name="filter" size={13} color={showFilters ? '#6d28d9' : '#374151'} />
              Filters
            </button>
          </div>

          {/* ── Advanced filters panel ── */}
          {showFilters && (
            <div style={{
              padding: '12px 20px', background: '#f8f9ff',
              borderBottom: '1px solid #e8eaf0',
              display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end',
            }}>
              {([['Date From', dateFrom, setDateFrom], ['Date To', dateTo, setDateTo]] as [string, string, (v: string) => void][]).map(([lbl, val, setter]) => (
                <div key={lbl}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'DM Mono', monospace" }}>
                    {lbl}
                  </div>
                  <input
                    type="date"
                    value={val}
                    onChange={e => setter(e.target.value)}
                    style={{ padding: '7px 10px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', fontFamily: 'inherit' }}
                  />
                </div>
              ))}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'DM Mono', monospace" }}>
                  Supplier ID
                </div>
                <input
                  type="text"
                  placeholder="MongoDB ObjectId"
                  value={supplierFilter}
                  onChange={e => setSupplierFilter(e.target.value)}
                  style={{ padding: '7px 10px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', width: 200, fontFamily: "'DM Mono', monospace" }}
                />
              </div>
              <button
                onClick={clearFilters}
                style={{ padding: '7px 14px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151', alignSelf: 'flex-end' }}
              >
                Clear All
              </button>
            </div>
          )}

          {/* ── Bulk action bar ── */}
          {selected.size > 0 && (
            <div style={{
              padding: '9px 20px', background: '#ede9fe',
              borderBottom: '1px solid #ddd6fe',
              display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#5b21b6' }}>{selected.size} selected</span>
              <select
                value={bulkAction}
                onChange={e => setBulkAction(e.target.value)}
                style={{ padding: '6px 10px', fontSize: 12, border: '1px solid #ddd6fe', borderRadius: 7, background: '#fff', color: '#374151', fontFamily: "'DM Mono', monospace" }}
              >
                <option value="">Bulk action…</option>
                <option value="CONFIRMED">Mark Confirmed</option>
                <option value="PROCESSING">Mark Processing</option>
                <option value="SHIPPED">Mark Shipped</option>
                <option value="DELIVERED">Mark Delivered</option>
                <option value="CANCELLED">Mark Cancelled</option>
                <option value="delete">Delete Selected</option>
              </select>
              <button
                onClick={applyBulkAction}
                disabled={!bulkAction || saving}
                style={{
                  padding: '6px 14px',
                  background: bulkAction && !saving ? '#6366f1' : '#e5e7eb',
                  color: bulkAction && !saving ? '#fff' : '#9ca3af',
                  border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700,
                  cursor: bulkAction && !saving ? 'pointer' : 'not-allowed',
                }}
              >
                Apply
              </button>
              <button
                onClick={() => setSelected(new Set())}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', fontSize: 12, fontWeight: 600 }}
              >
                Deselect all
              </button>
            </div>
          )}

          {/* ── Table ── */}
          {loading ? (
            <div style={{ padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#9ca3af' }}>
              <span style={{ animation: 'spin 1s linear infinite', display: 'flex' }}>
                <Icon name="spinner" size={28} color="#6366f1" />
              </span>
              <span style={{ fontSize: 13 }}>Loading orders…</span>
            </div>
          ) : error ? (
            <div style={{ padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#ef4444' }}>
              <Icon name="alert" size={32} color="#ef4444" />
              <span style={{ fontSize: 14, fontWeight: 600 }}>{error}</span>
              <button onClick={fetchOrders} style={{ fontSize: 13, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Retry
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div style={{ padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: '#9ca3af' }}>
              <Icon name="package" size={44} color="#d1d5db" />
              <span style={{ fontSize: 14 }}>No orders match your filters.</span>
              {(searchTerm || statusFilter !== 'ALL' || payFilter !== 'ALL') && (
                <button onClick={clearFilters} style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '2px solid #f0f0f0' }}>
                    <th style={{ padding: '11px 16px', width: 38 }}>
                      <input
                        type="checkbox"
                        checked={selected.size === orders.length && orders.length > 0}
                        onChange={toggleAll}
                      />
                    </th>
                    <th style={{ padding: '11px 12px', textAlign: 'left' }}><SortBtn field="createdAt" label="Order" /></th>
                    <th style={{ padding: '11px 12px', textAlign: 'left' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'DM Mono', monospace" }}>Customer</span>
                    </th>
                    <th style={{ padding: '11px 12px', textAlign: 'left' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'DM Mono', monospace" }}>Supplier</span>
                    </th>
                    <th style={{ padding: '11px 12px', textAlign: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'DM Mono', monospace" }}>Items</span>
                    </th>
                    <th style={{ padding: '11px 12px', textAlign: 'right' }}><SortBtn field="total" label="Total" /></th>
                    <th style={{ padding: '11px 12px', textAlign: 'left' }}><SortBtn field="status" label="Status" /></th>
                    <th style={{ padding: '11px 12px', textAlign: 'left' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'DM Mono', monospace" }}>Payment</span>
                    </th>
                    <th style={{ padding: '11px 12px', textAlign: 'left' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'DM Mono', monospace" }}>Delivery</span>
                    </th>
                    <th style={{ padding: '11px 12px', textAlign: 'left' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'DM Mono', monospace" }}>Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, idx) => (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        background: selected.has(order.id) ? '#f5f3ff' : idx % 2 === 0 ? '#fff' : '#fafafa',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { if (!selected.has(order.id)) (e.currentTarget as HTMLElement).style.background = '#f8f9ff'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = selected.has(order.id) ? '#f5f3ff' : idx % 2 === 0 ? '#fff' : '#fafafa'; }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '11px 16px' }}>
                        <input type="checkbox" checked={selected.has(order.id)} onChange={() => toggleSelect(order.id)} />
                      </td>

                      {/* Order # + date */}
                      <td style={{ padding: '11px 12px' }}>
                        <button
                          onClick={() => setViewOrder(order)}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                        >
                          <div style={{ fontWeight: 700, color: '#6366f1', fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
                            {order.orderNumber}
                          </div>
                        </button>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '11px 12px' }}>
                        <div style={{ fontWeight: 600, color: '#1f2937', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {order.customer.user.name ?? '—'}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {order.customer.user.email}
                        </div>
                      </td>

                      {/* Supplier */}
                      <td style={{ padding: '11px 12px' }}>
                        <div style={{ fontSize: 12, color: '#374151', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {order.supplier.companyName}
                        </div>
                        {order.supplier.verified && (
                          <span style={{ fontSize: 9, background: '#d1fae5', color: '#065f46', padding: '1px 5px', borderRadius: 10, fontWeight: 700, border: '1px solid #6ee7b7' }}>
                            Verified
                          </span>
                        )}
                      </td>

                      {/* Items count */}
                      <td style={{ padding: '11px 12px', textAlign: 'center' }}>
                        <span style={{
                          background: '#e0e7ff', color: '#3730a3', borderRadius: 20,
                          padding: '2px 9px', fontSize: 11, fontWeight: 700,
                          fontFamily: "'DM Mono', monospace",
                        }}>
                          {order.items.reduce((s, i) => s + i.quantity, 0)}
                        </span>
                      </td>

                      {/* Total */}
                      <td style={{ padding: '11px 12px', textAlign: 'right' }}>
                        <span style={{ fontWeight: 800, color: '#111827', fontFamily: "'Syne', sans-serif", fontSize: 14 }}>
                          ${order.total.toFixed(2)}
                        </span>
                      </td>

                      {/* Status + quick confirm */}
                      <td style={{ padding: '11px 12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-start' }}>
                          <StatusBadge status={order.status} />
                          {order.status === 'PENDING' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'CONFIRMED')}
                              disabled={saving}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '3px 8px', background: '#d1fae5', color: '#065f46',
                                border: '1px solid #6ee7b7', borderRadius: 6,
                                fontSize: 10, fontWeight: 700,
                                cursor: saving ? 'not-allowed' : 'pointer',
                                fontFamily: "'DM Mono', monospace",
                              }}
                            >
                              <Icon name="check" size={10} color="#065f46" />
                              Confirm
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Payment */}
                      <td style={{ padding: '11px 12px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700,
                          color: PAY_CFG[order.paymentStatus]?.color ?? '#374151',
                          fontFamily: "'DM Mono', monospace",
                        }}>
                          {order.paymentStatus}
                        </span>
                        {order.payment?.method && (
                          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                            {order.payment.method.replace(/_/g, ' ')}
                          </div>
                        )}
                      </td>

                      {/* Delivery */}
                      <td style={{ padding: '11px 12px' }}>
                        {order.delivery ? (
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{order.delivery.status}</div>
                            {order.delivery.location && (
                              <div style={{ fontSize: 10, color: '#9ca3af', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {order.delivery.location}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#d1d5db', fontSize: 11 }}>—</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td style={{ padding: '11px 12px' }}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button
                            onClick={() => setViewOrder(order)}
                            title="View details"
                            style={{ padding: 6, background: '#eff6ff', border: 'none', borderRadius: 7, cursor: 'pointer', display: 'flex' }}
                          >
                            <Icon name="eye" size={14} color="#3b82f6" />
                          </button>
                          <button
                            onClick={() => { setViewOrder(order); }}
                            title="Edit / update status"
                            style={{ padding: 6, background: '#f0fdf4', border: 'none', borderRadius: 7, cursor: 'pointer', display: 'flex' }}
                          >
                            <Icon name="edit" size={14} color="#16a34a" />
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm('Delete this order?')) return;
                              await handleDelete(order.id);
                            }}
                            title="Delete order"
                            disabled={saving}
                            style={{ padding: 6, background: '#fff5f5', border: 'none', borderRadius: 7, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex' }}
                          >
                            <Icon name="trash" size={14} color="#ef4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination ── */}
          {!loading && !error && orders.length > 0 && (
            <div style={{
              padding: '12px 20px', borderTop: '1px solid #f0f0f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#fafafa', flexWrap: 'wrap', gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#6b7280' }}>
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                  style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', cursor: 'pointer', fontFamily: "'DM Mono', monospace" }}
                >
                  {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span>
                  · {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount.toLocaleString()}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 5 }}>
                {[
                  { label: '«', action: () => setPage(1), disabled: page === 1 },
                  { label: '‹', action: () => setPage(p => p - 1), disabled: page === 1 },
                  ...Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    return { label: String(p), action: () => setPage(p), active: p === page };
                  }),
                  { label: '›', action: () => setPage(p => p + 1), disabled: page === totalPages },
                  { label: '»', action: () => setPage(totalPages), disabled: page === totalPages },
                ].map((btn, i) => (
                  <button
                    key={i}
                    onClick={btn.action}
                    disabled={btn.disabled}
                    style={{
                      padding: '5px 10px', borderRadius: 7,
                      border: '1px solid #e5e7eb',
                      background: (btn as any).active ? '#6366f1' : '#fff',
                      color: (btn as any).active ? '#fff' : btn.disabled ? '#d1d5db' : '#374151',
                      fontSize: 12, cursor: btn.disabled ? 'not-allowed' : 'pointer',
                      fontWeight: (btn as any).active ? 700 : 500,
                      fontFamily: "'DM Mono', monospace",
                      minWidth: 32,
                      transition: 'all 0.1s',
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}