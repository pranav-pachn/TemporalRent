'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Box, Check, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';

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
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <Link 
          href="/inventory"
          className="inline-flex items-center text-sm font-medium text-text-muted hover:text-text mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Inventory
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text">Add Inventory Item</h1>
            <p className="text-text-muted text-sm mt-0.5">
              Create a new physical rental item in your workspace catalog.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-urgency-critical/10 border border-urgency-critical/30 text-urgency-critical text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="itemName" className="block text-sm font-medium text-text mb-1.5">
              Item Name <span className="text-urgency-critical">*</span>
            </label>
            <input
              id="itemName"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mahogany Chiavari Chair"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary transition-colors text-sm"
            />
            <p className="text-xs text-text-muted mt-1">
              Descriptive name used in packages, availability lookups, and dispatch sheets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="itemSku" className="block text-sm font-medium text-text mb-1.5">
                SKU / Barcode
              </label>
              <input
                id="itemSku"
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. CHR-MAH-01"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary transition-colors text-sm uppercase"
              />
              <p className="text-xs text-text-muted mt-1">
                Optional unique identifier for warehouse tracking.
              </p>
            </div>

            <div>
              <label htmlFor="totalQty" className="block text-sm font-medium text-text mb-1.5">
                Total Owned Quantity <span className="text-urgency-critical">*</span>
              </label>
              <input
                id="totalQty"
                type="number"
                min={0}
                required
                value={totalQty}
                onChange={(e) => setTotalQty(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary transition-colors text-sm"
              />
              <p className="text-xs text-text-muted mt-1">
                Total physical stock owned in your fleet.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
          <Link
            href="/inventory"
            className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text hover:bg-surfaceHover rounded-lg transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>Creating Item...</>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Create Item
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
