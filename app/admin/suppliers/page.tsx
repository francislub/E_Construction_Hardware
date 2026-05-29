'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Supplier {
  id: string;
  companyName: string;
  user: { email: string };
  phone: string;
  verified: boolean;
  createdAt: string;
}

type FilterValue = 'ALL' | 'true' | 'false';

function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border ${
        verified
          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25'
          : 'bg-amber-500/10 text-amber-600 border-amber-500/25'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${verified ? 'bg-emerald-500' : 'bg-amber-400'}`} />
      {verified ? 'Verified' : 'Pending'}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 bg-muted rounded animate-pulse" style={{ width: `${50 + i * 8}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function AdminSuppliersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<FilterValue>('ALL');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        verificationFilter === 'ALL'
          ? '/api/suppliers'
          : `/api/suppliers?verified=${verificationFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data.suppliers ?? []);
      }
    } catch {
      showToast('Failed to load suppliers', 'error');
    } finally {
      setLoading(false);
    }
  }, [verificationFilter]);

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    fetchSuppliers();
  }, [session, router, fetchSuppliers]);

  const toggleVerification = async (id: string, current: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: !current }),
      });
      if (!res.ok) throw new Error();
      setSuppliers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, verified: !current } : s))
      );
      showToast(
        `Supplier ${!current ? 'verified' : 'unverified'} successfully`,
        'success'
      );
    } catch {
      showToast('Failed to update supplier', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const deleteSupplier = async (id: string) => {
    setConfirmDelete(null);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Delete failed');
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      showToast('Supplier deleted', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete supplier', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = suppliers.filter(
    (s) =>
      s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: suppliers.length,
    verified: suppliers.filter((s) => s.verified).length,
    pending: suppliers.filter((s) => !s.verified).length,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium border transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
              : 'bg-destructive/10 border-destructive/30 text-destructive'
          }`}
        >
          {toast.type === 'success' ? (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toast.message}
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-full bg-destructive/10 shrink-0">
                <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Delete Supplier</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This action is permanent and cannot be undone. Suppliers with active products cannot be deleted.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteSupplier(confirmDelete)}
                className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Suppliers</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage and verify your supplier network
            </p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-foreground' },
            { label: 'Verified', value: stats.verified, color: 'text-emerald-600' },
            { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl px-5 py-4">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by company or email…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Filter pills */}
            <div className="flex gap-2 shrink-0">
              {(['ALL', 'true', 'false'] as FilterValue[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVerificationFilter(v)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors border ${
                    verificationFilter === v
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  {v === 'ALL' ? 'All' : v === 'true' ? 'Verified' : 'Pending'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                        </svg>
                        <p className="font-medium">No suppliers found</p>
                        <p className="text-xs">Try adjusting your search or filter</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((supplier) => {
                    const isToggling = togglingId === supplier.id;
                    const isDeleting = deletingId === supplier.id;
                    return (
                      <tr
                        key={supplier.id}
                        className={`group transition-colors hover:bg-muted/30 ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {/* Avatar initial */}
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                              {supplier.companyName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-foreground">{supplier.companyName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">{supplier.user.email}</td>
                        <td className="px-5 py-4 text-muted-foreground font-mono text-xs">{supplier.phone}</td>
                        <td className="px-5 py-4">
                          <VerifiedBadge verified={supplier.verified} />
                        </td>
                        <td className="px-5 py-4 text-muted-foreground text-xs">
                          {new Date(supplier.createdAt).toLocaleDateString('en-UG', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {/* Verify / Unverify */}
                            <button
                              onClick={() => toggleVerification(supplier.id, supplier.verified)}
                              disabled={isToggling}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors disabled:opacity-50 ${
                                supplier.verified
                                  ? 'border-amber-500/30 text-amber-600 hover:bg-amber-500/10'
                                  : 'border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10'
                              }`}
                            >
                              {isToggling ? (
                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                              ) : supplier.verified ? (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              ) : (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              {supplier.verified ? 'Unverify' : 'Verify'}
                            </button>

                            {/* View */}
                            {/* <button
                              onClick={() => router.push(`/admin/suppliers/${supplier.id}`)}
                              className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              title="View details"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button> */}

                            {/* Delete */}
                            <button
                              onClick={() => setConfirmDelete(supplier.id)}
                              disabled={isDeleting}
                              className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-colors disabled:opacity-50"
                              title="Delete supplier"
                            >
                              {isDeleting ? (
                                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
              Showing {filtered.length} of {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}