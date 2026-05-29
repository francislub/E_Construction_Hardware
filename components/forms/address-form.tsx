'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddressSchema } from '@/lib/validations';
import { z } from 'zod';

type AddressFormData = z.infer<typeof AddressSchema>;

interface AddressFormProps {
  initialData?: AddressFormData & { id?: string };
  onSubmit: (data: AddressFormData & { id?: string }) => Promise<void>;
  isLoading?: boolean;
}

export function AddressForm({
  initialData,
  onSubmit,
  isLoading = false,
}: AddressFormProps) {
  const [error, setError] = useState<string>();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddressFormData>({
    resolver: zodResolver(AddressSchema),
    defaultValues: initialData,
  });

  const onFormSubmit = async (data: AddressFormData) => {
    try {
      setError(undefined);
      await onSubmit({
        ...data,
        id: initialData?.id,
      });
      if (!initialData?.id) {
        reset();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Street Address</label>
        <input
          {...register('street')}
          type="text"
          placeholder="123 Main St"
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.street && (
          <p className="text-destructive text-sm mt-1">{errors.street.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">City</label>
        <input
          {...register('city')}
          type="text"
          placeholder="City"
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.city && (
          <p className="text-destructive text-sm mt-1">{errors.city.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">State</label>
          <input
            {...register('state')}
            type="text"
            placeholder="State"
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.state && (
            <p className="text-destructive text-sm mt-1">{errors.state.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Postal Code</label>
          <input
            {...register('postalCode')}
            type="text"
            placeholder="00000"
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.postalCode && (
            <p className="text-destructive text-sm mt-1">
              {errors.postalCode.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Country</label>
        <input
          {...register('country')}
          type="text"
          placeholder="Country"
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.country && (
          <p className="text-destructive text-sm mt-1">{errors.country.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {isLoading
          ? 'Saving...'
          : initialData?.id
            ? 'Update Address'
            : 'Add Address'}
      </button>
    </form>
  );
}
