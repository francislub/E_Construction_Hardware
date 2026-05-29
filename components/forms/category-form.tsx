'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categorySchema } from '@/lib/validations';
import { z } from 'zod';
import { useUploadThing } from '@/lib/uploadthing';

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  initialData?: CategoryFormData & { id?: string };
  onSubmit: (data: CategoryFormData & { id?: string }) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function CategoryForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: CategoryFormProps) {
  const [error, setError] = useState<string>();
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.image || null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { startUpload } = useUploadThing('categoryImage', {
    onUploadProgress: (p) => setUploadProgress(p),
    onClientUploadComplete: (res) => {
      if (res?.[0]?.url) {
        setValue('image', res[0].url);
        setImagePreview(res[0].url);
      }
      setIsUploading(false);
      setUploadProgress(0);
    },
    onUploadError: (err) => {
      setError(err.message || 'Image upload failed');
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData,
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue('name', name);
    setValue('slug', generateSlug(name));
  };

  const handleImageFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file.');
        return;
      }
      if (file.size > 4 * 1024 * 1024) {
        setError('Image must be smaller than 4MB.');
        return;
      }
      setError(undefined);
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
      await startUpload([file]);
    },
    [startUpload]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setValue('image', '');
  };

  const onFormSubmit = async (data: CategoryFormData) => {
    try {
      setError(undefined);
      await onSubmit({ ...data, id: initialData?.id });
      if (!initialData?.id) {
        reset();
        setImagePreview(null);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const slugValue = watch('slug');
  const busy = isLoading || isUploading;

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-sm font-medium mb-1.5 text-foreground">
          Name <span className="text-destructive">*</span>
        </label>
        <input
          {...register('name')}
          onChange={handleNameChange}
          type="text"
          placeholder="e.g. Electronics"
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
        />
        {errors.name && (
          <p className="text-destructive text-xs mt-1">{errors.name.message}</p>
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
            placeholder="auto-generated-slug"
            className="w-full px-3 py-2 pr-14 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-muted/40 text-foreground font-mono text-sm placeholder:text-muted-foreground"
          />
          {slugValue && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded pointer-events-none">
              auto
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-xs mt-1">
          Auto-generated from name. You can edit it manually.
        </p>
        {errors.slug && (
          <p className="text-destructive text-xs mt-1">{errors.slug.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1.5 text-foreground">
          Description
        </label>
        <textarea
          {...register('description')}
          placeholder="Brief description of this category"
          rows={3}
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-background text-foreground placeholder:text-muted-foreground"
        />
        {errors.description && (
          <p className="text-destructive text-xs mt-1">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium mb-1.5 text-foreground">
          Category Image
        </label>

        {imagePreview ? (
          <div className="relative w-full h-48 rounded-md overflow-hidden border border-border group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Category preview"
              className="w-full h-full object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                <div className="w-3/4 bg-white/30 rounded-full h-1.5">
                  <div
                    className="bg-white h-1.5 rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-white text-xs font-medium">
                  Uploading… {uploadProgress}%
                </span>
              </div>
            )}
            {!isUploading && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <label className="px-3 py-1.5 bg-white text-black text-xs rounded-md font-medium hover:bg-white/90 cursor-pointer">
                  Replace
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                </label>
                <button
                  type="button"
                  onClick={removeImage}
                  className="px-3 py-1.5 bg-destructive text-destructive-foreground text-xs rounded-md font-medium hover:bg-destructive/90"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ) : (
          <label
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            className={`
              w-full h-40 border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors
              ${isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }
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
                {isDragging ? 'Drop image here' : 'Click or drag to upload'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                PNG, JPG, WEBP — max 4MB
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />
          </label>
        )}

        <input type="hidden" {...register('image')} />
        {errors.image && (
          <p className="text-destructive text-xs mt-1">{errors.image.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="flex-1 px-4 py-2.5 border border-border rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium text-sm"
        >
          {isUploading
            ? `Uploading… ${uploadProgress}%`
            : isLoading
              ? 'Saving…'
              : initialData?.id
                ? 'Update Category'
                : 'Create Category'}
        </button>
      </div>
    </form>
  );
}