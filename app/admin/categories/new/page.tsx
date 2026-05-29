'use client';

import { useRouter } from 'next/navigation';
import { CategoryForm } from '@/components/forms/category-form';
import Link from 'next/link';
import { useState } from 'react';

export default function NewCategoryPage() {
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(data: any) {
    try {
      setSubmitting(true);
      const res = await fetch('/api/categories/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        router.push('/admin/categories');
      }
    } catch (error) {
      console.error('Failed to create category:', error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <Link href="/admin/categories" className="text-primary hover:underline mb-4 block">
        ← Back to Categories
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-6">Create New Category</h1>

      <div className="bg-card p-6 rounded-lg border border-border">
        <CategoryForm onSubmit={handleSubmit} isLoading={submitting} />
      </div>
    </div>
  );
}
