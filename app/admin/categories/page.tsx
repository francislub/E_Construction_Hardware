'use client';

import { useEffect, useState } from 'react';
import { CategoryForm } from '@/components/forms/category-form';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  _count?: { products: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch('/api/categories/manage');
      if (res.ok) setCategories(await res.json());
    } catch (e) {
      console.error('Failed to fetch categories:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleEditSubmit(data: any) {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/categories/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setCategories((prev) =>
          prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
        );
        setEditTarget(null);
      }
    } catch (e) {
      console.error('Failed to update category:', e);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteCategory(id: string) {
    setDeleteId(id);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error('Failed to delete category:', e);
    } finally {
      setDeleteId(null);
    }
  }

  function closeModal() {
    setEditTarget(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground mt-1">Manage product categories</p>
        </div>
        <Link
          href="/admin/categories/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          + Add Category
        </Link>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading…</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No categories yet.
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr>
                {['Name', 'Slug', 'Products', 'Description', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-semibold text-foreground tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((cat) => (
                <tr
                  key={cat.id}
                  className="bg-card hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {cat.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {cat.slug}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {cat._count?.products ?? 0}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                    {cat.description
                      ? cat.description.substring(0, 60) +
                        (cat.description.length > 60 ? '…' : '')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditTarget(cat)}
                        className="px-3 py-1 text-xs rounded-md bg-primary/10 text-primary hover:bg-primary/20 font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        disabled={deleteId === cat.id}
                        className="px-3 py-1 text-xs rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 font-medium transition-colors disabled:opacity-50"
                      >
                        {deleteId === cat.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Edit Category
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Updating:{' '}
                  <span className="font-medium text-foreground">
                    {editTarget.name}
                  </span>
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Close modal"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5">
              <CategoryForm
                initialData={editTarget}
                onSubmit={handleEditSubmit}
                onCancel={closeModal}  
                isLoading={submitting}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}