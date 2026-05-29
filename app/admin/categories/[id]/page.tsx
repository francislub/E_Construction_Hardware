'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CategoryForm } from '@/components/forms/category-form';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export default function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ✅ Unwrap the params Promise with React.use()
  const { id } = use(params);

  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchCategory() {
      try {
        const res = await fetch(`/api/categories/${id}`);
        if (res.ok) setCategory(await res.json());
      } catch (e) {
        console.error('Failed to fetch category:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchCategory();
  }, [id]);

  async function handleSubmit(data: any) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) router.push('/admin/categories');
    } catch (e) {
      console.error('Failed to update category:', e);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading…</div>;
  if (!category) return <div className="text-center py-12 text-muted-foreground">Category not found</div>;

  return (
    <div className="max-w-2xl">
      <Link href="/admin/categories" className="text-primary hover:underline mb-4 block text-sm">
        ← Back to Categories
      </Link>
      <h1 className="text-3xl font-bold text-foreground mb-6">Edit Category</h1>
      <div className="bg-card p-6 rounded-lg border border-border">
        <CategoryForm initialData={category} onSubmit={handleSubmit} isLoading={submitting} />
      </div>
    </div>
  );
}