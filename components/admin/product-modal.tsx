'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema } from '@/lib/validations';
import { z } from 'zod';
import Link from 'next/link';
import { useUploadThing } from '@/lib/uploadthing';

type ProductFormData = z.infer<typeof productSchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Supplier {
  id: string;
  companyName: string;
  verified: boolean;
}

interface UploadedImage {
  url: string;
  name: string;
  uploading?: boolean;
  progress?: number;
  error?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  sku: string;
  stock: number;
  images: string[];
  category?: { id: string; name: string };
  supplier?: { id: string; companyName: string } | null;
  rating: number;
  description?: string;
  slug?: string;
  categoryId?: string;
  supplierId?: string | null;
  specifications?: Record<string, string>;
}

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function generateSKU(name: string, categoryName?: string): string {
  const prefix = categoryName
    ? categoryName.slice(0, 3).toUpperCase()
    : name.slice(0, 3).toUpperCase();
  const mid = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 4);
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

type Tab = 'basic' | 'pricing' | 'images' | 'specs';

const TABS: { id: Tab; label: string; icon: string }[] = [
  {
    id: 'basic',
    label: 'Basic Info',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    id: 'pricing',
    label: 'Pricing & Stock',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    id: 'images',
    label: 'Images',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    id: 'specs',
    label: 'Specifications',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  },
];

export default function ProductModal({ product, onClose, onSaved }: ProductModalProps) {
  const isEditing = !!product;
  const [activeTab, setActiveTab] = useState<Tab>('basic');
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  const [specifications, setSpecifications] = useState<Record<string, string>>({});
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  const { startUpload, isUploading } = useUploadThing('categoryImage', {
    onClientUploadComplete: (res) => {
      if (res) {
        setImages((prev) =>
          prev.map((img) => {
            const match = res.find((r) => r.name === img.name);
            const matchAny = match as (typeof match & { ufsUrl?: string }) | undefined;
            const uploadedUrl = matchAny?.ufsUrl ?? matchAny?.url ?? img.url;
            return match ? { ...img, url: uploadedUrl, uploading: false, progress: 100 } : img;
          })
        );
      }
    },
    onUploadError: (err) => {
      setImages((prev) =>
        prev.map((img) =>
          img.uploading ? { ...img, uploading: false, error: err.message } : img
        )
      );
    },
    onUploadProgress: (p) => {
      setImages((prev) =>
        prev.map((img) => (img.uploading ? { ...img, progress: p } : img))
      );
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    getValues,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? '',
      slug: product?.slug ?? '',
      description: product?.description ?? '',
      sku: product?.sku ?? '',
      price: product?.price ?? 0,
      stock: product?.stock ?? 0,
      categoryId: product?.category?.id ?? product?.categoryId ?? '',
      // supplierId is optional — default to empty string so the select shows "No supplier"
      supplierId: product?.supplier?.id ?? product?.supplierId ?? '',
      images: product?.images ?? [],
      specifications: (product?.specifications as Record<string, string>) ?? {},
    },
  });

  // ── Load categories & suppliers ──────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, supRes] = await Promise.all([
          fetch('/api/categories/manage'),
          fetch('/api/suppliers'),
        ]);
        if (catRes.ok) setCategories(normalizeArray<Category>(await catRes.json(), 'categories'));
        if (supRes.ok) setSuppliers(normalizeArray<Supplier>(await supRes.json(), 'suppliers'));
      } catch (e) {
        console.error('Failed to load form data:', e);
      }
    }
    loadData();
  }, []);

  // ── Pre-fill images & specs in edit mode ─────────────────────────────────
  useEffect(() => {
    if (product?.images?.length) {
      setImages(
        product.images.map((url) => ({
          url,
          name: url.split('/').pop() ?? url,
          uploading: false,
        }))
      );
    }
    if (product?.specifications && typeof product.specifications === 'object') {
      setSpecifications(product.specifications as Record<string, string>);
    }
  }, [product]);

  // ── Watch values ──────────────────────────────────────────────────────────
  const nameValue  = watch('name');
  const categoryId = watch('categoryId');
  const slugValue  = watch('slug');
  const skuValue   = watch('sku');
  const stockValue = watch('stock') ?? 0;
  const priceValue = watch('price');

  // Auto-generate slug (create mode only)
  useEffect(() => {
    if (!isEditing && nameValue) {
      setValue('slug', generateSlug(nameValue), { shouldValidate: true, shouldDirty: true });
    }
  }, [nameValue, isEditing, setValue]);

  // Auto-generate SKU (create mode only)
  useEffect(() => {
    const cat = categories.find((c) => c.id === categoryId);
    setSelectedCategoryName(cat?.name ?? '');
    if (!isEditing && nameValue) {
      setValue('sku', generateSKU(nameValue, cat?.name), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [categoryId, categories, nameValue, isEditing, setValue]);

  // ── Sync images → RHF ────────────────────────────────────────────────────
  const readyImageUrls = images
    .filter((img) => !img.uploading && !img.error && img.url.startsWith('http'))
    .map((img) => img.url);

  useEffect(() => {
    setValue('images', readyImageUrls, { shouldValidate: false });
  }, [readyImageUrls.join(','), setValue]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync specs → RHF ─────────────────────────────────────────────────────
  useEffect(() => {
    setValue('specifications', specifications, { shouldValidate: false });
  }, [specifications, setValue]);

  // ── Image handlers ────────────────────────────────────────────────────────
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArr = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (!fileArr.length) return;
      if (images.length + fileArr.length > 8) {
        setError('Maximum 8 images allowed.');
        return;
      }
      const previews: UploadedImage[] = fileArr.map((f) => ({
        url: URL.createObjectURL(f),
        name: f.name,
        uploading: true,
        progress: 0,
      }));
      setImages((prev) => [...prev, ...previews]);
      setError(undefined);
      await startUpload(fileArr);
    },
    [images.length, startUpload]
  );

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Spec handlers ─────────────────────────────────────────────────────────
  function addSpec() {
    if (!specKey.trim() || !specValue.trim()) return;
    setSpecifications((prev) => ({ ...prev, [specKey.trim()]: specValue.trim() }));
    setSpecKey('');
    setSpecValue('');
  }

  function removeSpec(key: string) {
    setSpecifications((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function onFormSubmit(data: ProductFormData) {
    setError(undefined);
    setFieldErrors({});

    if (isUploading || images.some((img) => img.uploading)) {
      setError('Please wait for images to finish uploading.');
      return;
    }

    // Guarantee slug & SKU are always present before sending
    const currentName = data.name || getValues('name');
    if (!data.slug && currentName) {
      data.slug = generateSlug(currentName);
      setValue('slug', data.slug, { shouldValidate: false });
    }
    if (!data.sku && currentName) {
      data.sku = generateSKU(currentName, selectedCategoryName);
      setValue('sku', data.sku, { shouldValidate: false });
    }

    setSubmitting(true);
    try {
      const uploadedImageUrls = images
        .filter((img) => !img.uploading && !img.error && /^https?:\/\//.test(img.url))
        .map((img) => img.url);

      const payload = {
        ...data,
        // Convert empty string → null so the API/Prisma receives a clean nullable value
        supplierId: data.supplierId?.trim() || null,
        images: uploadedImageUrls,
        specifications: Object.keys(specifications).length > 0 ? specifications : null,
        ...(isEditing && { id: product.id }),
      };

      console.log('[ProductModal] payload →', JSON.stringify(payload, null, 2));

      const res = await fetch('/api/admin/products/manage', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 422 && Array.isArray(json.fields)) {
          const map: Record<string, string> = {};
          json.fields.forEach(({ field, message }: { field: string; message: string }) => {
            map[field] = message;
          });
          setFieldErrors(map);
          setError('Please fix the highlighted fields and try again.');
          return;
        }
        throw new Error(json.error || `Server error ${res.status}`);
      }

      reset();
      setImages([]);
      setSpecifications({});
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  function onValidationError(errs: typeof errors) {
    console.warn('Validation errors:', errs);
    const currentName = getValues('name');
    if (errs.slug && currentName) {
      setValue('slug', generateSlug(currentName), { shouldValidate: true });
    }
    if (errs.sku && currentName) {
      setValue('sku', generateSKU(currentName, selectedCategoryName), { shouldValidate: true });
    }
    setError('Please fill in all required fields before submitting.');
  }

  function fieldError(name: string): string | undefined {
    return (errors as Record<string, { message?: string }>)[name]?.message ?? fieldErrors[name];
  }

  const isButtonDisabled = submitting || isUploading;

  const stockStatus =
    stockValue === 0
      ? { label: 'Out of Stock', cls: 'bg-destructive/10 text-destructive border-destructive/20' }
      : stockValue < 10
      ? { label: 'Low Stock', cls: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' }
      : { label: 'In Stock', cls: 'bg-green-500/10 text-green-600 border-green-500/20' };

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {isEditing ? 'Edit Product' : 'New Product'}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEditing
                ? `Editing: ${product.name}`
                : 'Fill in the details to add a new product to the catalog.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-border flex-shrink-0 px-6 gap-1 bg-muted/30">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px
                ${activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={tab.icon} />
              </svg>
              {tab.label}
              {tab.id === 'basic' &&
                (fieldError('name') || fieldError('slug') || fieldError('description') || fieldError('categoryId')) && (
                  <span className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
                )}
              {tab.id === 'pricing' &&
                (fieldError('price') || fieldError('stock') || fieldError('sku')) && (
                  <span className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
                )}
            </button>
          ))}
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex-shrink-0">
            {error}
          </div>
        )}

        {/* ── Form ── */}
        <form
          onSubmit={handleSubmit(onFormSubmit, onValidationError)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6 py-5">

            {/* ── TAB: Basic Info ── */}
            {activeTab === 'basic' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {/* Product Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5 text-foreground">
                      Product Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      {...register('name')}
                      type="text"
                      placeholder="e.g. Heavy Duty Drill Machine"
                      className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                    />
                    {fieldError('name') && (
                      <p className="text-destructive text-xs mt-1">{fieldError('name')}</p>
                    )}
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-foreground">
                      Slug <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <input
                        {...register('slug')}
                        type="text"
                        placeholder="auto-generated-from-name"
                        className="w-full px-3 py-2.5 pr-14 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-muted/40 text-foreground font-mono text-sm placeholder:text-muted-foreground"
                      />
                      {slugValue && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded pointer-events-none">
                          auto
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs mt-1">
                      Auto-generated from name. You can edit it.
                    </p>
                    {fieldError('slug') && (
                      <p className="text-destructive text-xs mt-1">{fieldError('slug')}</p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-foreground">
                      Category <span className="text-destructive">*</span>
                    </label>
                    <select
                      {...register('categoryId')}
                      className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {fieldError('categoryId') && (
                      <p className="text-destructive text-xs mt-1">{fieldError('categoryId')}</p>
                    )}
                    <Link
                      href="/admin/categories/new"
                      className="text-xs text-primary hover:underline mt-1 inline-block"
                    >
                      + Create new category
                    </Link>
                  </div>

                  {/* Supplier — genuinely optional */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5 text-foreground">
                      Supplier{' '}
                      <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                    </label>
                    <select
                      {...register('supplierId')}
                      className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                    >
                      {/* Always present — choosing this means no supplier (null) */}
                      <option value="">No supplier</option>
                      {suppliers.map((sup) => (
                        <option key={sup.id} value={sup.id}>
                          {sup.companyName}
                          {sup.verified ? ' ✓' : ''}
                        </option>
                      ))}
                    </select>
                    {/* No validation error shown — field is optional */}
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5 text-foreground">
                      Description <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      {...register('description')}
                      rows={5}
                      placeholder="Describe the product — features, use cases, materials, etc."
                      className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-background text-foreground placeholder:text-muted-foreground"
                    />
                    {fieldError('description') && (
                      <p className="text-destructive text-xs mt-1">{fieldError('description')}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: Pricing & Stock ── */}
            {activeTab === 'pricing' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-foreground">
                      Price (UGX) <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                        UGX
                      </span>
                      <input
                        {...register('price', { valueAsNumber: true })}
                        type="number"
                        step="100"
                        min="0"
                        placeholder="0"
                        className="w-full pl-14 pr-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                    {fieldError('price') && (
                      <p className="text-destructive text-xs mt-1">{fieldError('price')}</p>
                    )}
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-foreground">
                      Stock Quantity <span className="text-destructive">*</span>
                    </label>
                    <input
                      {...register('stock', { valueAsNumber: true })}
                      type="number"
                      min="0"
                      placeholder="0"
                      className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                    />
                    {fieldError('stock') && (
                      <p className="text-destructive text-xs mt-1">{fieldError('stock')}</p>
                    )}
                  </div>

                  {/* SKU */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5 text-foreground">
                      SKU <span className="text-destructive">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        {...register('sku')}
                        type="text"
                        placeholder="Auto-generated"
                        className="flex-1 px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-muted/40 text-foreground font-mono text-sm placeholder:text-muted-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const name = getValues('name') || 'PRD';
                          setValue('sku', generateSKU(name, selectedCategoryName), {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }}
                        className="px-4 py-2.5 border border-border rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors whitespace-nowrap"
                      >
                        Regenerate
                      </button>
                    </div>
                    <p className="text-muted-foreground text-xs mt-1">
                      Auto-generated from name & category. Must be unique.
                    </p>
                    {fieldError('sku') && (
                      <p className="text-destructive text-xs mt-1">{fieldError('sku')}</p>
                    )}
                  </div>
                </div>

                {/* Stock status preview */}
                <div className="rounded-lg border border-border p-4 bg-muted/20 space-y-3">
                  <p className="text-sm font-medium text-foreground">Status Preview</p>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${stockStatus.cls}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {stockStatus.label}
                    </span>
                    <span className="text-sm text-muted-foreground">·</span>
                    <span className="text-sm text-foreground font-medium">
                      {priceValue ? `UGX ${Number(priceValue).toLocaleString()}` : 'No price set'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Inventory value:{' '}
                    {priceValue && stockValue
                      ? `UGX ${(Number(priceValue) * Number(stockValue)).toLocaleString()}`
                      : '—'}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: Images ── */}
            {activeTab === 'images' && (
              <div className="space-y-4">
                <label
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFiles(e.dataTransfer.files);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  className={`w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors
                    ${isDragging
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/20'
                    }`}
                >
                  <svg
                    className={`w-10 h-10 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      {isDragging ? 'Drop images here' : 'Click or drag to upload images'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      PNG, JPG, WEBP — max 4MB each, up to 8 images
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                  />
                </label>

                {images.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {images.map((img, i) => (
                      <div
                        key={i}
                        className="relative group rounded-xl overflow-hidden border border-border aspect-square"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={`Product ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {img.uploading && (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                            <div className="w-3/4 bg-white/30 rounded-full h-1">
                              <div
                                className="bg-white h-1 rounded-full transition-all duration-200"
                                style={{ width: `${img.progress ?? 0}%` }}
                              />
                            </div>
                            <span className="text-white text-[10px]">{img.progress ?? 0}%</span>
                          </div>
                        )}
                        {img.error && (
                          <div className="absolute inset-0 bg-destructive/80 flex items-center justify-center">
                            <p className="text-white text-[10px] text-center px-1">{img.error}</p>
                          </div>
                        )}
                        {!img.uploading && (
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              className="p-1.5 bg-destructive rounded-full text-destructive-foreground"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                        {i === 0 && !img.uploading && (
                          <span className="absolute top-1.5 left-1.5 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-medium">
                            Main
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-muted-foreground text-xs">
                  First image is the main display image.{' '}
                  {images.filter((i) => !i.uploading && !i.error).length} / 8 uploaded.
                </p>
              </div>
            )}

            {/* ── TAB: Specifications ── */}
            {activeTab === 'specs' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={specKey}
                    onChange={(e) => setSpecKey(e.target.value)}
                    placeholder="Name (e.g. Weight)"
                    className="flex-1 px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground text-sm"
                  />
                  <input
                    type="text"
                    value={specValue}
                    onChange={(e) => setSpecValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSpec();
                      }
                    }}
                    placeholder="Value (e.g. 2.5 kg)"
                    className="flex-1 px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground text-sm"
                  />
                  <button
                    type="button"
                    onClick={addSpec}
                    className="px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    + Add
                  </button>
                </div>

                {Object.keys(specifications).length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                    No specifications added yet. Use the fields above to add technical details.
                  </div>
                ) : (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-foreground">
                            Specification
                          </th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-foreground">
                            Value
                          </th>
                          <th className="px-4 py-2.5 w-12" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {Object.entries(specifications).map(([k, v]) => (
                          <tr key={k} className="bg-card">
                            <td className="px-4 py-2.5 font-medium text-foreground">{k}</td>
                            <td className="px-4 py-2.5 text-muted-foreground">{v}</td>
                            <td className="px-4 py-2.5">
                              <button
                                type="button"
                                onClick={() => removeSpec(k)}
                                className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors"
                              >
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20 flex-shrink-0 gap-3">
            {/* Summary pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground hidden sm:block">Summary:</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted border border-border text-foreground font-mono">
                {skuValue || 'No SKU'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted border border-border text-foreground">
                {images.filter((i) => !i.uploading && !i.error).length} images
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted border border-border text-foreground">
                {Object.keys(specifications).length} specs
              </span>
            </div>

            <div className="flex gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-5 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isButtonDisabled}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    {isEditing ? 'Saving…' : 'Creating…'}
                  </>
                ) : isUploading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Uploading…
                  </>
                ) : isEditing ? (
                  'Save Changes'
                ) : (
                  'Create Product'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}