'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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

interface UploadedImage {
  url: string;
  name: string;
  uploading?: boolean;
  progress?: number;
  error?: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  const [specifications, setSpecifications] = useState<Record<string, string>>({});
  const [selectedCategoryName, setSelectedCategoryName] = useState('');

  // ─── UploadThing ──────────────────────────────────────────────────────────
  const { startUpload, isUploading } = useUploadThing('categoryImage', {
    onClientUploadComplete: (res) => {
      if (res) {
        setImages((prev) =>
          prev.map((img) => {
            const match = res.find((r) => r.name === img.name);
            // ufsUrl is the persistent CDN URL in UploadThing v8+ (file.url is deprecated)
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

  // ─── React Hook Form ──────────────────────────────────────────────────────
  // NOTE: defaultValues must cover every field the schema expects so that
  //       react-hook-form tracks them from the start and they're included
  //       in the submitted payload.
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      sku: '',
      price: 0,
      stock: 0,
      categoryId: '',
      supplierId: '',
      images: [],
      specifications: {},
    },
  });

  // ─── Load categories & suppliers ─────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, supRes] = await Promise.all([
          fetch('/api/categories/manage'),
          fetch('/api/suppliers'),
        ]);
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(normalizeArray<Category>(catData, 'categories'));
        }
        if (supRes.ok) {
          const supData = await supRes.json();
          setSuppliers(normalizeArray<Supplier>(supData, 'suppliers'));
        }
      } catch (e) {
        console.error('Failed to load form data:', e);
      }
    }
    loadData();
  }, []);

  // ─── Auto-generate slug & SKU when name / category changes ───────────────
  const nameValue = watch('name');
  const categoryId = watch('categoryId');

  useEffect(() => {
    if (nameValue) {
      setValue('slug', generateSlug(nameValue), { shouldValidate: true });
    }
  }, [nameValue, setValue]);

  useEffect(() => {
    const cat = categories.find((c) => c.id === categoryId);
    setSelectedCategoryName(cat?.name ?? '');
    if (nameValue) {
      setValue('sku', generateSKU(nameValue, cat?.name), { shouldValidate: true });
    }
  }, [categoryId, categories, nameValue, setValue]);

  // ─── Keep RHF's `images` field in sync with local state ──────────────────
  // This is the critical piece that was missing: images & specifications must
  // be registered in RHF so they appear in the submitted data object.
  const readyImages = images
    .filter((img) => !img.uploading && !img.error && img.url.startsWith('http'))
    .map((img) => img.url);

  useEffect(() => {
    setValue('images', readyImages, { shouldValidate: false });
  }, [readyImages.join(','), setValue]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setValue('specifications', specifications, { shouldValidate: false });
  }, [specifications, setValue]);

  // ─── Image upload helpers ─────────────────────────────────────────────────
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArr = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (fileArr.length === 0) return;
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

  // ─── Specifications helpers ───────────────────────────────────────────────
  function addSpec() {
    if (!specKey.trim() || !specValue.trim()) return;
    setSpecifications((prev) => ({ ...prev, [specKey.trim()]: specValue.trim() }));
    setSpecKey('');
    setSpecValue('');
  }

  function removeSpec(key: string) {
    setSpecifications((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  // ─── Submit ───────────────────────────────────────────────────────────────
  async function onFormSubmit(data: ProductFormData) {
    setError(undefined);
    setFieldErrors({});

    if (isUploading) {
      setError('Please wait for images to finish uploading.');
      return;
    }

    // Guard: images in state that haven't finished yet (belt-and-suspenders)
    const stillUploading = images.some((img) => img.uploading);
    if (stillUploading) {
      setError('Some images are still uploading. Please wait.');
      return;
    }

    setSubmitting(true);
    try {
      // Accept any http/https URL — covers both utfs.io and ufs.uploadthing.com CDNs.
      const uploadedImageUrls = images
        .filter((img) => !img.uploading && !img.error && /^https?:\/\//.test(img.url))
        .map((img) => img.url);

      // supplierId: RHF tracks it via register(), so data.supplierId should have
      // it, but we double-assert here in case Zod strips it from the schema.
      const payload = {
        ...data,
        supplierId: ((data as Record<string, unknown>).supplierId as string) || null,
        images: uploadedImageUrls,
        specifications:
          Object.keys(specifications).length > 0 ? specifications : null,
      };

      // Temporary: log payload so you can verify supplierId & images in browser console
      console.log('[ProductForm] submitting payload:', JSON.stringify(payload, null, 2));

      const res = await fetch('/api/admin/products/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        // Surface per-field errors returned by the API (422)
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

      setSuccess(true);
      reset();
      setImages([]);
      setSpecifications({});
      setTimeout(() => router.push('/admin/products'), 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Called by RHF when validation fails client-side ─────────────────────
  // Without this handler the button press appears to do nothing.
  function onValidationError(errs: typeof errors) {
    console.warn('Client-side validation errors:', errs);
    setError('Please fill in all required fields before submitting.');
  }

  // ─── Derived display values ───────────────────────────────────────────────
  const slugValue = watch('slug');
  const skuValue = watch('sku');
  const stockValue = watch('stock') ?? 0;
  const priceValue = watch('price');

  const stockStatus =
    stockValue === 0
      ? { label: 'Out of Stock', cls: 'bg-destructive/10 text-destructive border-destructive/20' }
      : stockValue < 10
      ? { label: 'Low Stock', cls: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' }
      : { label: 'In Stock', cls: 'bg-green-500/10 text-green-600 border-green-500/20' };

  // Merge RHF errors + API field errors for display
  function fieldError(name: string): string | undefined {
    return (errors as Record<string, { message?: string }>)[name]?.message ?? fieldErrors[name];
  }

  const isButtonDisabled = submitting || isUploading;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin/products" className="text-primary hover:underline text-sm block mb-4">
          ← Back to Products
        </Link>
        <h1 className="text-3xl font-bold text-foreground">New Product</h1>
        <p className="text-muted-foreground mt-1">
          Fill in the details below to add a new product to the catalog.
        </p>
      </div>

      {/* Global error banner */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Success banner */}
      {success && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500 text-green-600 text-sm">
          Product created successfully! Redirecting…
        </div>
      )}

      {/*
        IMPORTANT: pass BOTH the success handler AND the validation-error
        handler to handleSubmit so a button click always gives visible feedback.
      */}
      <form onSubmit={handleSubmit(onFormSubmit, onValidationError)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Basic Info */}
            <section className="bg-card border border-border rounded-xl p-6 space-y-5">
              <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">
                Basic Information
              </h2>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  Product Name <span className="text-destructive">*</span>
                </label>
                <input
                  {...register('name')}
                  type="text"
                  placeholder="e.g. Heavy Duty Drill Machine"
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                />
                {fieldError('name') && (
                  <p className="text-destructive text-xs mt-1">{fieldError('name')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  Slug <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    {...register('slug')}
                    type="text"
                    placeholder="auto-generated-slug"
                    className="w-full px-3 py-2 pr-14 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-muted/40 text-foreground font-mono text-sm placeholder:text-muted-foreground"
                  />
                  {slugValue && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded pointer-events-none">
                      auto
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-xs mt-1">Auto-generated from name. Editable.</p>
                {fieldError('slug') && (
                  <p className="text-destructive text-xs mt-1">{fieldError('slug')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  {...register('description')}
                  rows={5}
                  placeholder="Describe the product — features, use cases, materials, etc."
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-background text-foreground placeholder:text-muted-foreground"
                />
                {fieldError('description') && (
                  <p className="text-destructive text-xs mt-1">{fieldError('description')}</p>
                )}
              </div>
            </section>

            {/* Pricing & Inventory */}
            <section className="bg-card border border-border rounded-xl p-6 space-y-5">
              <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">
                Pricing & Inventory
              </h2>

              <div className="grid grid-cols-2 gap-4">
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
                      className="w-full pl-14 pr-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  {fieldError('price') && (
                    <p className="text-destructive text-xs mt-1">{fieldError('price')}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-foreground">
                    Stock Quantity <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('stock', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    placeholder="0"
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                  />
                  {fieldError('stock') && (
                    <p className="text-destructive text-xs mt-1">{fieldError('stock')}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  SKU <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    {...register('sku')}
                    type="text"
                    placeholder="Auto-generated"
                    className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-muted/40 text-foreground font-mono text-sm placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setValue('sku', generateSKU(nameValue || 'PRD', selectedCategoryName), {
                        shouldValidate: true,
                      })
                    }
                    className="px-3 py-2 border border-border rounded-md text-xs text-muted-foreground hover:bg-muted transition-colors whitespace-nowrap"
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
            </section>

            {/* Images */}
            <section className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">
                Product Images
              </h2>

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
                className={`
                  w-full h-36 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors
                  ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/20'}
                `}
              >
                <svg
                  className={`w-8 h-8 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}
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
                      className="relative group rounded-lg overflow-hidden border border-border aspect-square"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />

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
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {i === 0 && !img.uploading && (
                        <span className="absolute top-1 left-1 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-medium">
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <p className="text-muted-foreground text-xs">
                First image is the main display image. Drag & drop or click to upload.
              </p>
            </section>

            {/* Specifications */}
            <section className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="border-b border-border pb-3">
                <h2 className="text-base font-semibold text-foreground">Specifications</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Technical specs: dimensions, weight, material, voltage, etc.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={specKey}
                  onChange={(e) => setSpecKey(e.target.value)}
                  placeholder="Name (e.g. Weight)"
                  className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground text-sm"
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
                  className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground text-sm"
                />
                <button
                  type="button"
                  onClick={addSpec}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 text-sm font-medium transition-colors whitespace-nowrap"
                >
                  + Add
                </button>
              </div>

              {Object.keys(specifications).length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs border border-dashed border-border rounded-lg">
                  No specifications added yet
                </div>
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-foreground">Specification</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-foreground">Value</th>
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
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-6">

            {/* Publish */}
            <section className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">Publish</h2>
              <button
                type="submit"
                disabled={isButtonDisabled}
                className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Creating…
                  </span>
                ) : isUploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Uploading images…
                  </span>
                ) : (
                  'Create Product'
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin/products')}
                disabled={submitting}
                className="w-full px-4 py-2.5 border border-border rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </section>

            {/* Category */}
            <section className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">
                Category <span className="text-destructive">*</span>
              </h2>
              <select
                {...register('categoryId')}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {fieldError('categoryId') && (
                <p className="text-destructive text-xs">{fieldError('categoryId')}</p>
              )}
              <Link href="/admin/categories/new" className="text-xs text-primary hover:underline block">
                + Create new category
              </Link>
            </section>

            {/* Supplier */}
            <section className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">
                Supplier <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </h2>
              <select
                {...register('supplierId')}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
              >
                <option value="">Select a supplier</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.companyName}
                    {sup.verified ? ' ✓' : ''}
                  </option>
                ))}
              </select>
              {fieldError('supplierId') && (
                <p className="text-destructive text-xs">{fieldError('supplierId')}</p>
              )}
              {suppliers.length === 0 && (
                <p className="text-xs text-muted-foreground">No suppliers found.</p>
              )}
            </section>

            {/* Stock Status */}
            <section className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">
                Stock Status
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${stockStatus.cls}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {stockStatus.label}
              </span>
              <p className="text-xs text-muted-foreground">
                Updates automatically based on stock quantity.
              </p>
            </section>

            {/* Summary */}
            <section className="bg-muted/40 border border-border rounded-xl p-5 space-y-3">
              <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">
                Summary
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Images</span>
                  <span className="text-foreground font-medium">
                    {images.filter((i) => !i.uploading && !i.error).length} / {images.length}
                    {isUploading && (
                      <span className="text-xs text-muted-foreground ml-1">(uploading…)</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Specifications</span>
                  <span className="text-foreground font-medium">
                    {Object.keys(specifications).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span className="text-foreground font-medium">
                    {priceValue ? `UGX ${Number(priceValue).toLocaleString()}` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SKU</span>
                  <span className="text-foreground font-mono text-xs">{skuValue || '—'}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </form>
    </div>
  );
}