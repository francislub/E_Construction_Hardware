import React from 'react';
import Link from 'next/link';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  editHref?: (item: T) => string;
  loading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onEdit,
  onDelete,
  editHref,
  loading = false,
  emptyMessage = 'No data found',
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/50">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className="px-4 py-3 text-left font-medium text-foreground"
                style={{ width: column.width }}
              >
                {column.label}
              </th>
            ))}
            {(onEdit || onDelete || editHref) && (
              <th className="px-4 py-3 text-left font-medium text-foreground">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-muted/30 transition-colors">
              {columns.map((column) => {
                const value = (row as any)[column.key as string];
                return (
                  <td
                    key={String(column.key)}
                    className="px-4 py-3 text-foreground"
                  >
                    {column.render
                      ? column.render(value, row)
                      : String(value)}
                  </td>
                );
              })}
              {(onEdit || onDelete || editHref) && (
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {editHref && (
                      <Link
                        href={editHref(row)}
                        className="px-3 py-1 rounded bg-primary text-primary-foreground text-xs hover:bg-primary/90 transition-colors"
                      >
                        Edit
                      </Link>
                    )}
                    {onEdit && !editHref && (
                      <button
                        onClick={() => onEdit(row)}
                        className="px-3 py-1 rounded bg-primary text-primary-foreground text-xs hover:bg-primary/90 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure?')) {
                            onDelete(row);
                          }
                        }}
                        className="px-3 py-1 rounded bg-destructive text-destructive-foreground text-xs hover:bg-destructive/90 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
