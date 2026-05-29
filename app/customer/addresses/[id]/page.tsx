'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface AddressForm {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export default function EditAddressPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [form, setForm] = useState<AddressForm>({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    isDefault: false,
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [errors, setErrors] = useState<Partial<AddressForm>>({});
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (id) fetchAddress();
  }, [id]);

  async function fetchAddress() {
    try {
      const res = await fetch(`/api/addresses/${id}`);
      if (res.ok) {
        const data = await res.json();
        setForm({
          street: data.street,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country,
          isDefault: data.isDefault,
        });
      } else {
        router.push('/customer/addresses');
      }
    } catch {
      router.push('/customer/addresses');
    } finally {
      setFetchLoading(false);
    }
  }

  function validate(): boolean {
    const newErrors: Partial<AddressForm> = {};
    if (!form.street.trim()) newErrors.street = 'Street address is required';
    if (!form.city.trim()) newErrors.city = 'City is required';
    if (!form.state.trim()) newErrors.state = 'State / Province is required';
    if (!form.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
    if (!form.country.trim()) newErrors.country = 'Country is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError('');

    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || 'Failed to update address');
        return;
      }

      router.push('/customer/addresses');
      router.refresh();
    } catch {
      setServerError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading' || fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/customer/addresses"
          className="text-sm text-muted-foreground hover:text-primary transition-colors mb-2 inline-flex items-center gap-1"
        >
          ← Back to Addresses
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Edit Address</h1>
        <p className="text-muted-foreground mt-1">Update your delivery address details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {serverError && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {serverError}
          </div>
        )}

        <div>
          <label htmlFor="street" className="block text-sm font-medium text-foreground mb-1.5">
            Street Address <span className="text-destructive">*</span>
          </label>
          <input
            id="street"
            name="street"
            type="text"
            value={form.street}
            onChange={handleChange}
            placeholder="123 Main Street, Apt 4B"
            className={`w-full px-4 py-2.5 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow ${
              errors.street ? 'border-destructive' : 'border-border'
            }`}
          />
          {errors.street && <p className="mt-1 text-xs text-destructive">{errors.street}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-foreground mb-1.5">
              City <span className="text-destructive">*</span>
            </label>
            <input
              id="city"
              name="city"
              type="text"
              value={form.city}
              onChange={handleChange}
              placeholder="Kampala"
              className={`w-full px-4 py-2.5 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow ${
                errors.city ? 'border-destructive' : 'border-border'
              }`}
            />
            {errors.city && <p className="mt-1 text-xs text-destructive">{errors.city}</p>}
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-foreground mb-1.5">
              State / Province <span className="text-destructive">*</span>
            </label>
            <input
              id="state"
              name="state"
              type="text"
              value={form.state}
              onChange={handleChange}
              placeholder="Central Region"
              className={`w-full px-4 py-2.5 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow ${
                errors.state ? 'border-destructive' : 'border-border'
              }`}
            />
            {errors.state && <p className="mt-1 text-xs text-destructive">{errors.state}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium text-foreground mb-1.5">
              Postal Code <span className="text-destructive">*</span>
            </label>
            <input
              id="postalCode"
              name="postalCode"
              type="text"
              value={form.postalCode}
              onChange={handleChange}
              placeholder="00256"
              className={`w-full px-4 py-2.5 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow ${
                errors.postalCode ? 'border-destructive' : 'border-border'
              }`}
            />
            {errors.postalCode && <p className="mt-1 text-xs text-destructive">{errors.postalCode}</p>}
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-foreground mb-1.5">
              Country <span className="text-destructive">*</span>
            </label>
            <input
              id="country"
              name="country"
              type="text"
              value={form.country}
              onChange={handleChange}
              placeholder="Uganda"
              className={`w-full px-4 py-2.5 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow ${
                errors.country ? 'border-destructive' : 'border-border'
              }`}
            />
            {errors.country && <p className="mt-1 text-xs text-destructive">{errors.country}</p>}
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
          <input
            id="isDefault"
            name="isDefault"
            type="checkbox"
            checked={form.isDefault}
            onChange={handleChange}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/40 cursor-pointer"
          />
          <label htmlFor="isDefault" className="cursor-pointer">
            <span className="block text-sm font-medium text-foreground">Set as default address</span>
            <span className="block text-xs text-muted-foreground mt-0.5">
              This address will be pre-selected at checkout
            </span>
          </label>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 sm:flex-none px-8 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </span>
            ) : (
              'Update Address'
            )}
          </button>
          <Link
            href="/customer/addresses"
            className="px-5 py-2.5 border border-border rounded-lg text-foreground hover:bg-muted transition-colors font-medium text-sm"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}