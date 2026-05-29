'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { useUploadThing } from '@/lib/uploadthing';

// ─── Validation schema ───────────────────────────────────────────────────────
const productSchema = z.object({
  name:           z.string().min(2, 'Name must be at least 2 characters'),
  slug:           z.string().min(2, 'Slug required').regex(/^[a-z0-9-]+$/, 'Slug: lowercase letters, numbers, hyphens only'),
  description:    z.string().min(10, 'Description must be at least 10 characters'),
  price:          z.number({ invalid_type_error: 'Price must be a number' }).positive('Price must be positive'),
  sku:            z.string().min(2, 'SKU required'),
  stock:          z.number({ invalid_type_error: 'Stock must be a number' }).int().min(0, 'Stock cannot be negative'),
  categoryId:     z.string().min(1, 'Category required'),
  images:         z.array(z.string()).optional(),
  specifications: z.record(z.string()).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

// ─── Types ───────────────────────────────────────────────────────────────────
interface Category { id: string; name: string; slug: string }

interface UploadedImage {
  url: string;
  name: string;
  uploading?: boolean;
  progress?: number;
  error?: string;
}

interface ProductData {
  id: string;
  name: string;
  slug: string | null;
  description: string;
  price: number;
  sku: string;
  stock: number;
  categoryId: string;
  supplierId: string | null;
  images: string[];
  specifications: Record<string, string> | null;
  rating: number;
  category: { id: string; name: string };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function generateSlug(name: string) {
  return name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

function generateSKU(name: string, categoryName = '') {
  const prefix = categoryName ? categoryName.slice(0, 3).toUpperCase() : name.slice(0, 3).toUpperCase();
  const mid    = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${mid}-${suffix}`;
}

function normalizeArray<T>(data: unknown, key?: string): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    if (key && Array.isArray((data as Record<string, unknown>)[key]))
      return (data as Record<string, unknown>)[key] as T[];
    const first = Object.values(data as object).find(Array.isArray);
    if (first) return first as T[];
  }
  return [];
}

// ─── Tab config ───────────────────────────────────────────────────────────────
type Tab = 'basic' | 'pricing' | 'images' | 'specs';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'basic',   label: 'Basic Info',      emoji: '📋' },
  { id: 'pricing', label: 'Pricing & Stock', emoji: '💰' },
  { id: 'images',  label: 'Images',          emoji: '🖼'  },
  { id: 'specs',   label: 'Specifications',  emoji: '⚙️'  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(203,213,225,0.85)', marginBottom: 6, letterSpacing: '0.02em' }}>
      {children}{required && <span style={{ color: '#f87171', marginLeft: 3 }}>*</span>}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p style={{ fontSize: 11, color: '#f87171', marginTop: 5 }}>{msg}</p>;
}

function Skeleton({ w = '100%', h = 40, radius = 10 }: { w?: string | number; h?: number; radius?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: 'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease infinite',
    }} />
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
  color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit',
  transition: 'border-color .2s, box-shadow .2s', boxSizing: 'border-box',
};

// ─── Main Edit Page ───────────────────────────────────────────────────────────
export default function EditProductPage() {
  const router    = useRouter();
  const params    = useParams();
  const productId = params?.id as string;

  // Page state
  const [pageLoading,    setPageLoading]    = useState(true);
  const [pageError,      setPageError]      = useState<string | null>(null);
  const [product,        setProduct]        = useState<ProductData | null>(null);

  // Form UI state
  const [activeTab,       setActiveTab]       = useState<Tab>('basic');
  const [categories,      setCategories]      = useState<Category[]>([]);
  const [submitting,      setSubmitting]      = useState(false);
  const [globalError,     setGlobalError]     = useState<string | null>(null);
  const [images,          setImages]          = useState<UploadedImage[]>([]);
  const [isDragging,      setIsDragging]      = useState(false);
  const [specKey,         setSpecKey]         = useState('');
  const [specValue,       setSpecValue]       = useState('');
  const [specifications,  setSpecifications]  = useState<Record<string, string>>({});
  const [selectedCatName, setSelectedCatName] = useState('');
  const [success,         setSuccess]         = useState(false);
  const [dataReady,       setDataReady]       = useState(false);

  // UploadThing
  const { startUpload, isUploading } = useUploadThing('productImage', {
    onClientUploadComplete: (res) => {
      if (res) {
        setImages(prev =>
          prev.map(img => {
            const match = res.find(r => r.name === img.name);
            const url   = (match as any)?.ufsUrl ?? match?.url ?? img.url;
            return match ? { ...img, url, uploading: false, progress: 100 } : img;
          })
        );
      }
    },
    onUploadError: (err) => {
      setImages(prev => prev.map(img => img.uploading ? { ...img, uploading: false, error: err.message } : img));
    },
    onUploadProgress: (p) => {
      setImages(prev => prev.map(img => img.uploading ? { ...img, progress: p } : img));
    },
  });

  // React Hook Form
  const {
    register, handleSubmit, formState: { errors },
    setValue, watch, getValues, reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '', slug: '', description: '', sku: '',
      price: 0, stock: 0, categoryId: '', images: [], specifications: {},
    },
  });

  // ── Load product + categories in parallel on mount ─────────────────────────
  useEffect(() => {
    if (!productId) return;
    setPageLoading(true);
    setPageError(null);

    Promise.all([
      fetch(`/api/supplier/products/${productId}`)
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status} — product not found`);
          return r.json();
        }),
      fetch('/api/categories/manage')
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
    ])
      .then(([productRes, categoriesRes]) => {
        // Normalize product response (handles { data: ... } or bare object)
        const p: ProductData = productRes.data ?? productRes;
        setProduct(p);

        // Hydrate form
        reset({
          name:           p.name,
          slug:           p.slug ?? generateSlug(p.name),
          description:    p.description,
          price:          p.price,
          sku:            p.sku,
          stock:          p.stock,
          categoryId:     p.categoryId,
          images:         p.images ?? [],
          specifications: p.specifications ?? {},
        });

        // Hydrate images
        if (p.images?.length) {
          setImages(p.images.map(url => ({
            url, name: url.split('/').pop() ?? url, uploading: false,
          })));
        }

        // Hydrate specs
        if (p.specifications) setSpecifications(p.specifications);

        // Hydrate categories
        if (categoriesRes) {
          const cats = normalizeArray<Category>(categoriesRes, 'categories');
          setCategories(cats);
          const cat = cats.find(c => c.id === p.categoryId);
          if (cat) setSelectedCatName(cat.name);
        }

        setDataReady(true);
      })
      .catch((err) => {
        setPageError(typeof err === 'string' ? err : err?.message ?? 'Failed to load product');
      })
      .finally(() => setPageLoading(false));
  }, [productId, reset]);

  // Watched values
  const nameValue  = watch('name');
  const categoryId = watch('categoryId');
  const slugValue  = watch('slug');
  const skuValue   = watch('sku');
  const stockValue = watch('stock') ?? 0;
  const priceValue = watch('price');

  // Update selectedCatName when category dropdown changes (after data is loaded)
  useEffect(() => {
    if (!dataReady) return;
    const cat = categories.find(c => c.id === categoryId);
    if (cat) setSelectedCatName(cat.name);
  }, [categoryId, categories, dataReady]);

  // Sync ready image URLs → RHF
  const readyUrls = images.filter(i => !i.uploading && !i.error && i.url.startsWith('http')).map(i => i.url);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setValue('images', readyUrls, { shouldValidate: false }); }, [readyUrls.join(',')]);

  // Sync specs → RHF
  useEffect(() => { setValue('specifications', specifications, { shouldValidate: false }); }, [specifications, setValue]);

  // ── Image upload handler ───────────────────────────────────────────────────
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!arr.length) return;
    if (images.length + arr.length > 8) { setGlobalError('Maximum 8 images allowed.'); return; }
    const previews: UploadedImage[] = arr.map(f => ({
      url: URL.createObjectURL(f), name: f.name, uploading: true, progress: 0,
    }));
    setImages(prev => [...prev, ...previews]);
    setGlobalError(null);
    await startUpload(arr);
  }, [images.length, startUpload]);

  // ── Spec helpers ──────────────────────────────────────────────────────────
  function addSpec() {
    if (!specKey.trim() || !specValue.trim()) return;
    setSpecifications(p => ({ ...p, [specKey.trim()]: specValue.trim() }));
    setSpecKey('');
    setSpecValue('');
  }

  function removeSpec(key: string) {
    setSpecifications(p => { const n = { ...p }; delete n[key]; return n; });
  }

  // ── Form submit (PUT) ─────────────────────────────────────────────────────
  async function onSubmit(data: ProductFormData) {
    setGlobalError(null);

    if (isUploading || images.some(i => i.uploading)) {
      setGlobalError('Please wait for images to finish uploading.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...data,
        id:             productId,
        images:         readyUrls,
        specifications: Object.keys(specifications).length > 0 ? specifications : null,
      };

      const res = await fetch('/api/supplier/products/manage', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Server error ${res.status}`);

      setSuccess(true);
      setTimeout(() => router.push('/supplier/products'), 1400);
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  }

  function onValidationError() {
    setGlobalError('Please fill in all required fields correctly.');
  }

  const fe = (name: string) =>
    (errors as Record<string, { message?: string }>)[name]?.message;

  const tabHasError = (tab: Tab) => {
    if (tab === 'basic')   return !!(fe('name') || fe('slug') || fe('description') || fe('categoryId'));
    if (tab === 'pricing') return !!(fe('price') || fe('stock') || fe('sku'));
    return false;
  };

  const stockNum = Number(stockValue);
  const stockStatus =
    stockNum === 0  ? { label: 'Out of Stock', color: '#f87171' } :
    stockNum < 10   ? { label: 'Low Stock',    color: '#fbbf24' } :
                      { label: 'In Stock',     color: '#34d399' };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0a0f1e,#0d1321)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',Georgia,sans-serif" }}>
        <style>{`@keyframes popIn{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}`}</style>
        <div style={{ textAlign: 'center', animation: 'popIn .45s cubic-bezier(.34,1.56,.64,1)' }}>
          <div style={{ fontSize: 72, marginBottom: 20 }}>✅</div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', fontFamily: 'Georgia,serif', marginBottom: 8 }}>Product Updated!</h2>
          <p style={{ color: 'rgba(148,163,184,0.6)', fontSize: 14 }}>Redirecting to your products…</p>
        </div>
      </div>
    );
  }

  // ── Page-level fetch error ─────────────────────────────────────────────────
  if (!pageLoading && pageError) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0a0f1e,#0d1321)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',Georgia,sans-serif" }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f87171', marginBottom: 8 }}>Failed to load product</h2>
          <p style={{ color: 'rgba(148,163,184,0.55)', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>{pageError}</p>
          <button
            onClick={() => router.push('/supplier/products')}
            style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#0d1321', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
          >
            ← Back to Products
          </button>
        </div>
      </div>
    );
  }

  // ── Main UI ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0a0f1e 0%,#0d1321 100%)', padding: '32px', fontFamily: "'DM Sans',Georgia,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        input:focus, textarea:focus, select:focus {
          border-color: rgba(245,158,11,0.6) !important;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.1) !important;
        }
        input::placeholder, textarea::placeholder { color: rgba(100,116,139,0.6); }
        select option { background: #1a2236; color: #fff; }
        .img-thumb:hover .img-overlay { opacity: 1 !important; }
        .spec-row:hover { background: rgba(255,255,255,0.03) !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, animation: 'fadeIn .4s ease' }}>
        <button
          onClick={() => router.push('/supplier/products')}
          style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >←</button>

        <div style={{ flex: 1, minWidth: 0 }}>
          {pageLoading ? (
            <>
              <Skeleton w={220} h={26} radius={8} />
              <div style={{ marginTop: 7 }}><Skeleton w={320} h={14} radius={5} /></div>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', fontFamily: 'Georgia,serif', lineHeight: 1.1, marginBottom: 3 }}>
                Edit Product
              </h1>
              <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Editing: <span style={{ color: 'rgba(251,191,36,0.75)', fontWeight: 600 }}>{product?.name}</span>
                <span style={{ marginLeft: 10, fontFamily: 'monospace', fontSize: 11, color: 'rgba(148,163,184,0.3)' }}>#{productId}</span>
              </p>
            </>
          )}
        </div>

        {/* Product thumbnail */}
        {!pageLoading && product?.images?.[0] && (
          <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
            <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit(onSubmit, onValidationError)}>
        <div style={{ background: 'linear-gradient(145deg,#111827,#0d1321)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', overflow: 'hidden', animation: 'fadeIn .5s ease .1s both' }}>

          {/* ── Tab bar ── */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)', overflowX: 'auto' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => !pageLoading && setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '14px 20px', fontSize: 13,
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  color: activeTab === tab.id ? '#fbbf24' : 'rgba(148,163,184,0.6)',
                  borderBottom: `2px solid ${activeTab === tab.id ? '#f59e0b' : 'transparent'}`,
                  background: 'none', border: 'none',
                  borderBottom: `2px solid ${activeTab === tab.id ? '#f59e0b' : 'transparent'}`,
                  cursor: pageLoading ? 'default' : 'pointer',
                  transition: 'all .2s', whiteSpace: 'nowrap', fontFamily: 'inherit',
                  opacity: pageLoading ? 0.45 : 1,
                }}
              >
                <span style={{ fontSize: 16 }}>{tab.emoji}</span>
                {tab.label}
                {!pageLoading && tabHasError(tab.id) && (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f87171', display: 'inline-block', flexShrink: 0 }} />
                )}
              </button>
            ))}
          </div>

          {/* ── Error banner ── */}
          {globalError && (
            <div style={{ margin: '16px 24px 0', padding: '11px 16px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: 13, fontWeight: 600 }}>
              ⚠️ {globalError}
            </div>
          )}

          {/* ── Tab panels ── */}
          <div style={{ padding: '24px', minHeight: 380 }}>

            {/* ════ BASIC INFO ════ */}
            {activeTab === 'basic' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, animation: 'fadeIn .3s ease' }}>

                {/* Name */}
                <div style={{ gridColumn: '1/-1' }}>
                  <Label required>Product Name</Label>
                  {pageLoading ? <Skeleton h={44} /> : (
                    <>
                      <input {...register('name')} type="text" placeholder="e.g. Heavy Duty Drill Machine" style={inputStyle} />
                      <FieldError msg={fe('name')} />
                    </>
                  )}
                </div>

                {/* Slug */}
                <div>
                  <Label required>Slug</Label>
                  {pageLoading ? <Skeleton h={44} /> : (
                    <>
                      <div style={{ position: 'relative' }}>
                        <input
                          {...register('slug')}
                          type="text"
                          placeholder="url-friendly-slug"
                          style={{ ...inputStyle, paddingRight: 50, fontFamily: 'monospace', fontSize: 12 }}
                        />
                        {slugValue && (
                          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'rgba(148,163,184,0.4)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>slug</span>
                        )}
                      </div>
                      <FieldError msg={fe('slug')} />
                    </>
                  )}
                </div>

                {/* Category */}
                <div>
                  <Label required>Category</Label>
                  {pageLoading ? <Skeleton h={44} /> : (
                    <>
                      <select {...register('categoryId')} style={{ ...inputStyle, cursor: 'pointer' }}>
                        <option value="">Select a category</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <FieldError msg={fe('categoryId')} />
                    </>
                  )}
                </div>

                {/* Description */}
                <div style={{ gridColumn: '1/-1' }}>
                  <Label required>Description</Label>
                  {pageLoading ? <Skeleton h={120} /> : (
                    <>
                      <textarea
                        {...register('description')}
                        rows={5}
                        placeholder="Describe the product — features, materials, use cases…"
                        style={{ ...inputStyle, resize: 'vertical' }}
                      />
                      <FieldError msg={fe('description')} />
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ════ PRICING & STOCK ════ */}
            {activeTab === 'pricing' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, animation: 'fadeIn .3s ease' }}>

                {/* Price */}
                <div>
                  <Label required>Price (UGX)</Label>
                  {pageLoading ? <Skeleton h={44} /> : (
                    <>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: 'rgba(245,158,11,0.7)', pointerEvents: 'none' }}>UGX</span>
                        <input
                          {...register('price', { valueAsNumber: true })}
                          type="number" step="100" min="0" placeholder="0"
                          style={{ ...inputStyle, paddingLeft: 52 }}
                        />
                      </div>
                      <FieldError msg={fe('price')} />
                    </>
                  )}
                </div>

                {/* Stock */}
                <div>
                  <Label required>Stock Quantity</Label>
                  {pageLoading ? <Skeleton h={44} /> : (
                    <>
                      <input
                        {...register('stock', { valueAsNumber: true })}
                        type="number" min="0" placeholder="0"
                        style={inputStyle}
                      />
                      <FieldError msg={fe('stock')} />
                    </>
                  )}
                </div>

                {/* SKU */}
                <div style={{ gridColumn: '1/-1' }}>
                  <Label required>SKU</Label>
                  {pageLoading ? <Skeleton h={44} /> : (
                    <>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <input
                          {...register('sku')}
                          type="text" placeholder="Unique product code"
                          style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', fontSize: 12 }}
                        />
                        <button
                          type="button"
                          onClick={() => setValue('sku', generateSKU(getValues('name') || 'PRD', selectedCatName), { shouldValidate: true, shouldDirty: true })}
                          style={{ padding: '11px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 }}
                        >
                          Regenerate
                        </button>
                      </div>
                      <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)', marginTop: 5 }}>Must be unique across all products.</p>
                      <FieldError msg={fe('sku')} />
                    </>
                  )}
                </div>

                {/* Live status preview */}
                <div style={{ gridColumn: '1/-1', background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '16px 20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(148,163,184,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Status Preview</div>
                  {pageLoading ? <Skeleton h={28} w="55%" /> : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, padding: '5px 12px', borderRadius: 50, color: stockStatus.color, background: `${stockStatus.color}18`, border: `1px solid ${stockStatus.color}30` }}>
                        {stockStatus.label}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#fbbf24', fontFamily: 'Georgia,serif' }}>
                        {priceValue ? `UGX ${Number(priceValue).toLocaleString()}` : '—'}
                      </span>
                      <span style={{ fontSize: 12, color: 'rgba(148,163,184,0.45)' }}>
                        Inventory value: {priceValue && stockValue
                          ? `UGX ${(Number(priceValue) * Number(stockValue)).toLocaleString()}`
                          : '—'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════ IMAGES ════ */}
            {activeTab === 'images' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn .3s ease' }}>

                {/* Drop zone */}
                <label
                  onDrop={e => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 10, height: 160, borderRadius: 14, cursor: 'pointer', transition: 'all .2s',
                    border: `2px dashed ${isDragging ? 'rgba(245,158,11,0.6)' : 'rgba(255,255,255,0.1)'}`,
                    background: isDragging ? 'rgba(245,158,11,0.05)' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <span style={{ fontSize: 36 }}>{isDragging ? '⬇️' : '🖼'}</span>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: isDragging ? '#fbbf24' : 'rgba(203,213,225,0.7)', marginBottom: 3 }}>
                      {isDragging ? 'Drop images here' : 'Click or drag to upload images'}
                    </p>
                    <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)' }}>PNG, JPG, WEBP — max 4MB each, up to 8 images</p>
                  </div>
                  <input
                    type="file" accept="image/*" multiple
                    style={{ display: 'none' }}
                    onChange={e => e.target.files && handleFiles(e.target.files)}
                  />
                </label>

                {/* Image grid */}
                {pageLoading ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                    {[0, 1, 2].map(i => <Skeleton key={i} h={100} radius={12} />)}
                  </div>
                ) : images.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                    {images.map((img, i) => (
                      <div
                        key={i}
                        className="img-thumb"
                        style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '1', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}
                      >
                        <img src={img.url} alt={`Product ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                        {img.uploading && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <div style={{ width: '70%', height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                              <div style={{ height: '100%', width: `${img.progress ?? 0}%`, background: '#f59e0b', borderRadius: 2, transition: 'width .2s' }} />
                            </div>
                            <span style={{ fontSize: 10, color: '#fbbf24' }}>{img.progress ?? 0}%</span>
                          </div>
                        )}

                        {img.error && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(220,38,38,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <p style={{ color: '#fff', fontSize: 10, textAlign: 'center', padding: '0 6px' }}>{img.error}</p>
                          </div>
                        )}

                        {!img.uploading && (
                          <div
                            className="img-overlay"
                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', opacity: 0, transition: 'opacity .2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <button
                              type="button"
                              onClick={() => setImages(p => p.filter((_, j) => j !== i))}
                              style={{ width: 30, height: 30, borderRadius: 8, background: '#dc2626', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14 }}
                            >✕</button>
                          </div>
                        )}

                        {i === 0 && !img.uploading && (
                          <span style={{ position: 'absolute', top: 6, left: 6, fontSize: 9, fontWeight: 800, background: '#f59e0b', color: '#111', padding: '2px 7px', borderRadius: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Main</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)' }}>
                  First image is the main display image. {images.filter(i => !i.uploading && !i.error).length}/8 uploaded.
                </p>
              </div>
            )}

            {/* ════ SPECIFICATIONS ════ */}
            {activeTab === 'specs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn .3s ease' }}>

                {/* Add row */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="text" value={specKey} onChange={e => setSpecKey(e.target.value)}
                    placeholder="Name (e.g. Weight)"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <input
                    type="text" value={specValue} onChange={e => setSpecValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSpec(); } }}
                    placeholder="Value (e.g. 2.5 kg)"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    type="button" onClick={addSpec}
                    style={{ padding: '11px 18px', borderRadius: 10, border: 'none', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 }}
                  >
                    + Add
                  </button>
                </div>

                {/* List */}
                {pageLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[0, 1, 2].map(i => <Skeleton key={i} h={44} radius={8} />)}
                  </div>
                ) : Object.keys(specifications).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', border: '2px dashed rgba(255,255,255,0.07)', borderRadius: 14, color: 'rgba(148,163,184,0.4)', fontSize: 13 }}>
                    No specifications yet. Use the fields above to add technical details.
                  </div>
                ) : (
                  <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 40px', padding: '10px 16px', background: 'rgba(0,0,0,0.2)' }}>
                      {['Specification', 'Value', ''].map((h, i) => (
                        <div key={i} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{h}</div>
                      ))}
                    </div>
                    {Object.entries(specifications).map(([k, v], i) => (
                      <div
                        key={k}
                        className="spec-row"
                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 40px', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)', transition: 'background .15s' }}
                      >
                        <span style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 600 }}>{k}</span>
                        <span style={{ fontSize: 13, color: 'rgba(148,163,184,0.65)' }}>{v}</span>
                        <button
                          type="button"
                          onClick={() => removeSpec(k)}
                          style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'rgba(248,113,113,0.1)', color: '#f87171', cursor: 'pointer', fontSize: 13 }}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)', gap: 12, flexWrap: 'wrap' }}>

            {/* Summary pills */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Summary</span>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 50, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8', fontFamily: 'monospace' }}>
                {skuValue || '—'}
              </span>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 50, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8' }}>
                {images.filter(i => !i.uploading && !i.error).length} images
              </span>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 50, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8' }}>
                {Object.keys(specifications).length} specs
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => router.push('/supplier/products')}
                disabled={submitting}
                style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting || isUploading || pageLoading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 24px', borderRadius: 10, border: 'none',
                  background: (submitting || isUploading || pageLoading) ? 'rgba(245,158,11,0.4)' : 'linear-gradient(135deg,#f59e0b,#d97706)',
                  color: '#0d1321', fontWeight: 800, fontSize: 13,
                  cursor: (submitting || isUploading || pageLoading) ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(245,158,11,0.3)', transition: 'all .2s',
                }}
              >
                {submitting ? (
                  <>
                    <span style={{ width: 14, height: 14, border: '2px solid rgba(13,19,33,0.3)', borderTop: '2px solid #0d1321', borderRadius: '50%', animation: 'spin .75s linear infinite', flexShrink: 0 }} />
                    Saving…
                  </>
                ) : isUploading ? (
                  <>
                    <span style={{ width: 14, height: 14, border: '2px solid rgba(13,19,33,0.3)', borderTop: '2px solid #0d1321', borderRadius: '50%', animation: 'spin .75s linear infinite', flexShrink: 0 }} />
                    Uploading…
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}