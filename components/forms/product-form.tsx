'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema } from '@/lib/validations';
import { z } from 'zod';

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: ProductFormData & { id?: string };
  onSubmit: (data: ProductFormData & { id?: string }) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  categories?: Array<{ id: string; name: string }>;
}

export function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  categories = [],
}: ProductFormProps) {
  const [error, setError] = useState<string>();
  const [imageArray, setImageArray] = useState<string[]>(
    initialData?.images || []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData,
  });

  const onFormSubmit = async (data: ProductFormData) => {
    try {
      setError(undefined);
      await onSubmit({ ...data, images: imageArray, id: initialData?.id });
      if (!initialData?.id) {
        reset();
        setImageArray([]);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const addImage = (imageUrl: string) => {
    if (imageUrl && !imageArray.includes(imageUrl)) {
      setImageArray([...imageArray, imageUrl]);
    }
  };

  const removeImage = (index: number) => {
    setImageArray(imageArray.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-sm font-medium mb-2 text-foreground">
          Product Name <span className="text-destructive">*</span>
        </label>
        <input
          {...register('name')}
          type="text"
          placeholder="Product name"
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
        />
        {errors.name && (
          <p className="text-destructive text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium mb-2 text-foreground">
          Slug <span className="text-destructive">*</span>
        </label>
        <input
          {...register('slug')}
          type="text"
          placeholder="product-slug"
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground font-mono text-sm placeholder:text-muted-foreground"
        />
        {errors.slug && (
          <p className="text-destructive text-sm mt-1">{errors.slug.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2 text-foreground">
          Description
        </label>
        <textarea
          {...register('description')}
          placeholder="Product description"
          rows={4}
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-background text-foreground placeholder:text-muted-foreground"
        />
        {errors.description && (
          <p className="text-destructive text-sm mt-1">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Price & Stock */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Price <span className="text-destructive">*</span>
          </label>
          <input
            {...register('price', { valueAsNumber: true })}
            type="number"
            placeholder="0.00"
            step="0.01"
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
          />
          {errors.price && (
            <p className="text-destructive text-sm mt-1">{errors.price.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Stock <span className="text-destructive">*</span>
          </label>
          <input
            {...register('stock', { valueAsNumber: true })}
            type="number"
            placeholder="0"
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
          />
          {errors.stock && (
            <p className="text-destructive text-sm mt-1">{errors.stock.message}</p>
          )}
        </div>
      </div>

      {/* SKU */}
      <div>
        <label className="block text-sm font-medium mb-2 text-foreground">
          SKU
        </label>
        <input
          {...register('sku')}
          type="text"
          placeholder="SKU123"
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
        />
        {errors.sku && (
          <p className="text-destructive text-sm mt-1">{errors.sku.message}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium mb-2 text-foreground">
          Category <span className="text-destructive">*</span>
        </label>
        <select
          {...register('categoryId')}
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <p className="text-destructive text-sm mt-1">
            {errors.categoryId.message}
          </p>
        )}
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-medium mb-2 text-foreground">
          Images
        </label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="Paste image URL and click Add"
              id="imageInput"
              className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById('imageInput') as HTMLInputElement;
                if (input?.value) {
                  addImage(input.value);
                  input.value = '';
                }
              }}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 text-sm font-medium transition-colors"
            >
              Add
            </button>
          </div>

          {imageArray.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {imageArray.map((image, index) => (
                <div key={index} className="relative rounded-md overflow-hidden group">
                  <img
                    src={image}
                    alt={`Product ${index + 1}`}
                    className="w-full h-24 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 px-2 py-0.5 bg-destructive text-destructive-foreground rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-border rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium text-sm"
        >
          {isLoading
            ? 'Saving…'
            : initialData?.id
              ? 'Update Product'
              : 'Create Product'}
        </button>
      </div>
    </form>
  );
}