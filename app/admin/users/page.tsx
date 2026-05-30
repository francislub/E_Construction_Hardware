'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Eye, Trash2, Edit2, X, Save, Loader2, AlertTriangle } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  createdAt: string;
}

interface EditFormData {
  name: string;
  phone: string;
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({
  user,
  onClose,
  onSave,
}: {
  user: User;
  onClose: () => void;
  onSave: (updated: User) => void;
}) {
  const [form, setForm] = useState<EditFormData>({
    name: user.name ?? '',
    phone: user.phone ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), phone: form.phone.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Update failed');
      }
      const updated: User = await res.json();
      onSave(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Edit User</h2>
            <p className="text-sm text-gray-500 truncate max-w-xs">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Enter full name"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Enter phone number"
            />
          </div>

          {/* Read-only role pill */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRoleColor(user.role)}`}>
                {user.role}
              </span>
              <span className="text-xs text-gray-400">(role cannot be changed here)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteModal({
  user,
  onClose,
  onConfirm,
}: {
  user: User;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Delete failed');
      }
      onConfirm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setDeleting(false);
    }
  };

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-6 text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-7 h-7 text-red-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Delete User</h2>
          <p className="text-sm text-gray-500 mb-1">
            Are you sure you want to delete
          </p>
          <p className="text-sm font-semibold text-gray-800 mb-4 truncate px-4">
            {user.name || user.email}
          </p>
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
            This action is permanent and cannot be undone.
          </p>

          {error && (
            <div className="mt-3 flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting…
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getRoleColor(role: string) {
  switch (role) {
    case 'ADMIN':          return 'bg-red-100 text-red-800';
    case 'SUPPLIER':       return 'bg-purple-100 text-purple-800';
    case 'DELIVERY_STAFF': return 'bg-orange-100 text-orange-800';
    case 'CUSTOMER':       return 'bg-blue-100 text-blue-800';
    default:               return 'bg-gray-100 text-gray-800';
  }
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal state
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'ALL') params.set('role', roleFilter);

      const res = await fetch(`/api/users?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    fetchUsers();
  }, [session, router, fetchUsers]);

  const handleEditSave = (updated: User) => {
    setUsers(prev => prev.map(u => (u.id === updated.id ? { ...u, ...updated } : u)));
    setEditTarget(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const filteredUsers = users.filter(
    u =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.name ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Edit Modal */}
      {editTarget && (
        <EditModal
          user={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleEditSave}
        />
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Users Management</h1>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by email or name…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="ALL">All Roles</option>
              <option value="CUSTOMER">Customer</option>
              <option value="SUPPLIER">Supplier</option>
              <option value="DELIVERY_STAFF">Delivery Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading users…
            </div>
          ) : fetchError ? (
            <div className="flex items-center justify-center gap-2 p-12 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              {fetchError}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600">Name</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600">Email</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600">Role</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600">Joined</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {user.name || <span className="text-gray-400 italic">—</span>}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {/* View */}
                          <button
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                            title="View profile"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => setEditTarget(user)}
                            title="Edit user"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteTarget(user)}
                            title="Delete user"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Count */}
        {!loading && !fetchError && (
          <p className="mt-4 text-xs text-gray-400 text-right">
            Showing {filteredUsers.length} of {users.length} user{users.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
}