'use client';

import { useEffect, useState } from 'react';
import ProductModal from '@/components/admin/product-modal';

interface Product {
  id: string;
  name: string;
  price: number;
  sku: string;
  stock: number;
  images: string[];
  category?: { id: string; name: string };
  supplier?: { id: string; companyName: string };
  rating: number;
  _count?: { reviews: number; orderItems: number };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products/manage');
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : data.products || []);
      }
    } catch (e) {
      console.error('Failed to fetch products:', e);
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(id: string) {
    setDeleteId(id);
    try {
      const res = await fetch(`/api/admin/products/manage?id=${id}`, { method: 'DELETE' });
      if (res.ok) setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error('Failed to delete product:', e);
    } finally {
      setDeleteId(null);
      setConfirmId(null);
    }
  }

  function openCreate() {
    setEditProduct(null);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditProduct(product);
    setModalOpen(true);
  }

  function handleSaved() {
    setModalOpen(false);
    fetchProducts();
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    (p.category?.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 10).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  const stockBadge = (stock: number) => {
    if (stock === 0)
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />Out of Stock
        </span>
      );
    if (stock < 10)
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />Low ({stock})
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-current" />{stock}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your product catalog</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: products.length, color: 'text-foreground' },
          { label: 'Inventory Value', value: `UGX ${totalValue.toLocaleString()}`, color: 'text-foreground' },
          { label: 'Low Stock', value: lowStock, color: 'text-yellow-600' },
          { label: 'Out of Stock', value: outOfStock, color: 'text-destructive' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU or category…"
            className="w-full pl-9 pr-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground text-sm"
          />
        </div>
        {search && (
          <button onClick={() => setSearch('')} className="text-xs text-muted-foreground hover:text-foreground">
            Clear
          </button>
        )}
        <p className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {products.length} products
        </p>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground">
          <svg className="w-6 h-6 animate-spin mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading products…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
          {search ? `No products matching "${search}"` : (
            <div className="space-y-3">
              <p>No products yet.</p>
              <button
                onClick={openCreate}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Add your first product
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr>
                {['Product', 'SKU', 'Category', 'Supplier', 'Price', 'Stock', 'Rating', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-foreground tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((product) => (
                <tr key={product.id} className="bg-card hover:bg-muted/20 transition-colors">
                  {/* Product */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded-lg object-cover border border-border flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground leading-tight">{product.name}</p>
                        {product._count && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {product._count.reviews} reviews · {product._count.orderItems} orders
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{product.sku}</td>
                  <td className="px-4 py-3">
                    {product.category ? (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">{product.category.name}</span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-foreground text-xs">{product.supplier?.companyName || '—'}</td>
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">UGX {product.price.toLocaleString()}</td>
                  <td className="px-4 py-3">{stockBadge(product.stock)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span className="text-xs text-foreground font-medium">
                        {product.rating > 0 ? product.rating.toFixed(1) : '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(product)}
                        className="px-3 py-1 text-xs rounded-md bg-primary/10 text-primary hover:bg-primary/20 font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmId(product.id)}
                        disabled={deleteId === product.id}
                        className="px-3 py-1 text-xs rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 font-medium transition-colors disabled:opacity-50"
                      >
                        {deleteId === product.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmId(null); }}
        >
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Delete Product</h3>
                <p className="text-sm text-muted-foreground mt-0.5">This will permanently delete the product and cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)} className="flex-1 px-4 py-2 border border-border rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
              <button
                onClick={() => deleteProduct(confirmId)}
                disabled={!!deleteId}
                className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {deleteId ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <ProductModal
          product={editProduct}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}