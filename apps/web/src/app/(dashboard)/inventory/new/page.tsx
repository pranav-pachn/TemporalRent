'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Box, Check, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';

export default function NewInventoryItemPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [totalQty, setTotalQty] = useState<number | string>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedQty = typeof totalQty === 'string' ? parseInt(totalQty, 10) : totalQty;
    if (isNaN(parsedQty) || parsedQty < 0) {
      setError('Please enter a valid total quantity (0 or greater).');
      return;
    }

    if (!name.trim()) {
      setError('Item name is required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient.createInventoryItem({
        name: name.trim(),
        sku: sku.trim() ? sku.trim() : undefined,
        totalQty: parsedQty,
      });

      if (res?.data?.id) {
        router.push(`/inventory/${res.data.id}`);
      } else {
        router.push('/inventory');
      }
    } catch (err: any) {
      console.error('Failed to create inventory item:', err);
      if (err.code === 'SKU_ALREADY_EXISTS') {
        setError('An item with this SKU already exists in your inventory. Please use a unique SKU.');
      } else if (err.status === 401 || err.code === 'UNAUTHENTICATED') {
        router.push('/login');
      } else {
        setError(err.message || 'Failed to create inventory item. Please verify your inputs and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <Link 
        href="/inventory"
        className="inline-flex items-center text-xs font-medium text-text-muted hover:text-text transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
        Back to Inventory Fleet
      </Link>

      <PageHeader
        title="Register Inventory Item"
        description="Add physical stock to your workspace fleet catalog to track availability and reservations"
        tag={
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-surface-raised border border-border text-text-muted">
            CATALOG ENTRY
          </span>
        }
      />

      {error && (
        <div className="p-3.5 rounded-lg bg-status-danger/10 border border-status-danger/25 text-status-danger text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="space-y-4">
          <div>
            <label htmlFor="itemName" className="block text-xs font-semibold uppercase tracking-wider text-text mb-1.5">
              Item Name <span className="text-status-danger">*</span>
            </label>
            <input
              id="itemName"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mahogany Chiavari Chair"
              className="w-full px-3.5 py-2 bg-surface-raised border border-border rounded-lg text-text text-sm placeholder:text-text-dim focus:outline-none focus:border-border-active transition-colors"
            />
            <p className="text-[11px] text-text-dim mt-1">
              Descriptive name used in packages, availability lookups, and dispatch sheets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="itemSku" className="block text-xs font-semibold uppercase tracking-wider text-text mb-1.5">
                SKU / Barcode
              </label>
              <input
                id="itemSku"
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. CHR-MAH-01"
                className="w-full px-3.5 py-2 bg-surface-raised border border-border rounded-lg text-text text-sm font-mono uppercase placeholder:text-text-dim focus:outline-none focus:border-border-active transition-colors"
              />
              <p className="text-[11px] text-text-dim mt-1">
                Optional unique identifier for warehouse tracking.
              </p>
            </div>

            <div>
              <label htmlFor="totalQty" className="block text-xs font-semibold uppercase tracking-wider text-text mb-1.5">
                Total Owned Units <span className="text-status-danger">*</span>
              </label>
              <input
                id="totalQty"
                type="number"
                min={0}
                required
                value={totalQty}
                onChange={(e) => setTotalQty(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2 bg-surface-raised border border-border rounded-lg text-text text-sm font-mono tabular-nums focus:outline-none focus:border-border-active transition-colors"
              />
              <p className="text-[11px] text-text-dim mt-1">
                Physical fleet quantity owned by your rental operation.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-end gap-2.5">
          <Link
            href="/inventory"
            className="px-3.5 py-2 text-xs font-medium text-text-muted hover:text-text hover:bg-surface-raised border border-border rounded-lg transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50"
          >
            {submitting ? (
              <>Registering...</>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Register Item
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
