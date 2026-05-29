'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ─── Types ─────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  slug: string | null;
  description: string;
  price: number;
  sku: string;
  stock: number;
  images: string[];
  category: { id: string; name: string };
  supplier: { id: string; companyName: string } | null;
  rating: number;
  specifications: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
  _count?: { reviews: number; orderItems: number };
}

interface ApiResponse {
  data: Product[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

// ─── Status badge ───────────────────────────────────────────────────────────
function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 50, background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Out of stock</span>;
  if (stock < 10)
    return <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 50, background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Low — {stock}</span>;
  return <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 50, background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{stock} in stock</span>;
}

// ─── Confirm dialog ──────────────────────────────────────────────────────────
function ConfirmDialog({ product, onConfirm, onCancel }: { product: Product; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'linear-gradient(145deg,#1a2236,#111827)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 20, padding: 32, maxWidth: 400, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize: 40, marginBottom: 16, textAlign: 'center' }}>🗑️</div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: 8, fontFamily: 'Georgia,serif' }}>Delete Product?</h3>
        <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.7)', textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
          <strong style={{ color: '#fbbf24' }}>{product.name}</strong> will be permanently removed. This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 16px rgba(220,38,38,0.35)' }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function SupplierProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [products, setProducts]       = useState<Product[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [total, setTotal]             = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting]       = useState(false);
  const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '12' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/supplier/products?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ApiResponse = await res.json();
      setProducts(json.data);
      setTotalPages(json.pagination.pages);
      setTotal(json.pagination.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/supplier/products/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      showToast(`"${deleteTarget.name}" deleted successfully`);
      setDeleteTarget(null);
      loadProducts();
    } catch {
      showToast('Failed to delete product', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const LIMIT = 12;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0a0f1e 0%,#0d1321 100%)', padding: '32px', fontFamily: "'DM Sans',Georgia,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes toastIn { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .product-row:hover { background: rgba(255,255,255,0.025) !important; }
        .action-btn { transition: all .2s; }
        .action-btn:hover { transform: translateY(-1px); }
        .page-btn:hover:not(:disabled) { background: rgba(245,158,11,0.15) !important; border-color: rgba(245,158,11,0.4) !important; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 200, animation: 'toastIn .3s ease', background: toast.type === 'success' ? 'linear-gradient(135deg,#065f46,#047857)' : 'linear-gradient(135deg,#991b1b,#dc2626)', border: `1px solid ${toast.type === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`, borderRadius: 12, padding: '12px 20px', color: '#fff', fontSize: 13, fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: 8, maxWidth: 360 }}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span> {toast.msg}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          product={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, animation: 'fadeIn .4s ease' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', fontFamily: 'Georgia,serif', lineHeight: 1.1, marginBottom: 4 }}>My Products</h1>
          <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.5)' }}>{total} products in your catalogue</p>
        </div>
        <Link href="/supplier/products/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 11, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#0d1321', fontWeight: 800, fontSize: 13, textDecoration: 'none', boxShadow: '0 4px 16px rgba(245,158,11,0.35)' }}>
          ＋ Add Product
        </Link>
      </div>

      {/* Search & filter bar */}
      <div style={{ marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none', color: 'rgba(148,163,184,0.4)' }}>🔍</span>
          <input
            type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products…"
            style={{ width: '100%', paddingLeft: 42, paddingRight: 16, paddingTop: 11, paddingBottom: 11, borderRadius: 11, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {/* Table card */}
      <div style={{ background: 'linear-gradient(145deg,#111827,#0d1321)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', overflow: 'hidden', animation: 'fadeIn .5s ease .1s both' }}>

        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 140px 120px 110px 120px 110px', gap: 0, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
          {['', 'Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map((h, i) => (
            <div key={i} style={{ fontSize: 10, fontWeight: 800, color: 'rgba(148,163,184,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: i === 6 ? 'right' : 'left' }}>{h}</div>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 36, height: 36, border: '3px solid rgba(245,158,11,0.15)', borderTop: '3px solid #f59e0b', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
            <span style={{ fontSize: 13, color: 'rgba(148,163,184,0.5)' }}>Loading products…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 14, color: '#f87171', fontWeight: 600, marginBottom: 16 }}>{error}</div>
            <button onClick={loadProducts} style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Retry</button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && products.length === 0 && (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>No products yet</div>
            <div style={{ fontSize: 13, color: 'rgba(148,163,184,0.5)', marginBottom: 24 }}>{search ? 'No results for that search.' : 'Start by adding your first product.'}</div>
            <Link href="/supplier/products/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#111', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>＋ Add your first product</Link>
          </div>
        )}

        {/* Rows */}
        {!loading && !error && products.map((product, idx) => (
          <div key={product.id} className="product-row" style={{ display: 'grid', gridTemplateColumns: '56px 1fr 140px 120px 110px 120px 110px', gap: 0, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', transition: 'background .15s', animationDelay: `${idx * 40}ms` }}>

            {/* Image */}
            <div style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
              {product.images?.[0]
                ? <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔧</div>
              }
            </div>

            {/* Name + SKU */}
            <div style={{ overflow: 'hidden', paddingRight: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>{product.name}</div>
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(148,163,184,0.45)', letterSpacing: '0.05em' }}>{product.sku}</div>
            </div>

            {/* Category */}
            <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.65)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.category?.name ?? '—'}</div>

            {/* Price */}
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fbbf24', fontFamily: 'Georgia,serif' }}>UGX {product.price.toLocaleString()}</div>

            {/* Stock count */}
            <div style={{ fontSize: 13, color: product.stock === 0 ? '#f87171' : product.stock < 10 ? '#fbbf24' : '#94a3b8', fontWeight: 600 }}>{product.stock}</div>

            {/* Status badge */}
            <div><StockBadge stock={product.stock} /></div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <Link href={`/supplier/products/${product.id}/edit`} className="action-btn" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', color: '#60a5fa', textDecoration: 'none', fontSize: 14 }} title="Edit">✏️</Link>
              <button onClick={() => setDeleteTarget(product)} className="action-btn" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', cursor: 'pointer', fontSize: 14 }} title="Delete">🗑</button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="page-btn" style={{ padding: '8px 16px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: page === 1 ? 'rgba(148,163,184,0.3)' : '#94a3b8', fontSize: 13, cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 600, transition: 'all .2s' }}>← Prev</button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const p = i + 1;
            return (
              <button key={p} onClick={() => setPage(p)} className="page-btn" style={{ width: 36, height: 36, borderRadius: 9, border: `1px solid ${page === p ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.08)'}`, background: page === p ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)', color: page === p ? '#fbbf24' : '#94a3b8', fontSize: 13, cursor: 'pointer', fontWeight: page === p ? 800 : 400, transition: 'all .2s' }}>{p}</button>
            );
          })}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="page-btn" style={{ padding: '8px 16px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: page === totalPages ? 'rgba(148,163,184,0.3)' : '#94a3b8', fontSize: 13, cursor: page === totalPages ? 'not-allowed' : 'pointer', fontWeight: 600, transition: 'all .2s' }}>Next →</button>
        </div>
      )}
    </div>
  );
}