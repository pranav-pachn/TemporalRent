'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Check, AlertCircle, Plus, Trash2, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { InventoryItem } from '@/types/inventory';
import { PageHeader } from '@/components/ui/PageHeader';

interface ComponentRow {
  inventoryItemId: string;
  quantity: number;
}

export default function NewPackagePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [components, setComponents] = useState<ComponentRow[]>([
    { inventoryItemId: '', quantity: 1 },
  ]);
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick item creation
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickItemName, setQuickItemName] = useState('');
  const [quickItemQty, setQuickItemQty] = useState(10);
  const [quickAdding, setQuickAdding] = useState(false);

  useEffect(() => {
    async function loadInventory() {
      try {
        setLoadingItems(true);
        const res = await apiClient.fetchInventoryItems();
        setItems(res.data);
      } catch (err) {
        console.error('Failed to load inventory items:', err);
      } finally {
        setLoadingItems(false);
      }
    }
    loadInventory();
  }, []);

  const handleAddComponent = () => {
    setComponents([...components, { inventoryItemId: '', quantity: 1 }]);
  };

  const handleRemoveComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const handleComponentChange = (index: number, field: keyof ComponentRow, value: any) => {
    const updated = [...components];
    updated[index] = { ...updated[index], [field]: value };
    setComponents(updated);
  };

  const handleQuickAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickItemName.trim()) return;

    try {
      setQuickAdding(true);
      const res = await apiClient.createInventoryItem({
        name: quickItemName.trim(),
        totalQty: Number(quickItemQty) || 10,
      });

      const newItem = res.data;
      setItems((prev) => [...prev, newItem]);

      const emptyIndex = components.findIndex((c) => !c.inventoryItemId);
      if (emptyIndex !== -1) {
        handleComponentChange(emptyIndex, 'inventoryItemId', newItem.id);
      } else {
        setComponents([...components, { inventoryItemId: newItem.id, quantity: 1 }]);
      }

      setQuickItemName('');
      setShowQuickAdd(false);
    } catch (err: any) {
      console.error('Failed to quick-add item:', err);
      setError(err.message || 'Failed to create inventory item.');
    } finally {
      setQuickAdding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Package name is required.');
      return;
    }

    const validComponents = components.filter(
      (c) => c.inventoryItemId && c.quantity > 0
    );

    // Check for duplicate components
    const itemIds = validComponents.map((c) => c.inventoryItemId);
    if (new Set(itemIds).size !== itemIds.length) {
      setError('Each inventory item can only be added once. Adjust the quantities instead.');
      return;
    }

    try {
      setSubmitting(true);

      // 1. Create Package
      const res = await apiClient.createPackage({
        name: name.trim(),
        description: description.trim() ? description.trim() : undefined,
      });

      const createdPkg = res.data;

      // 2. If components are provided, create v1
      if (createdPkg?.id && validComponents.length > 0) {
        const versionRes = await apiClient.createPackageVersion(createdPkg.id, {
          components: validComponents,
        });

        // 3. If publish immediately requested, activate version
        if (publishImmediately && versionRes.data?.id) {
          await apiClient.activatePackageVersion(createdPkg.id, versionRes.data.id);
        }
      }

      if (createdPkg?.id) {
        router.push(`/packages/${createdPkg.id}`);
      } else {
        router.push('/packages');
      }
    } catch (err: any) {
      console.error('Failed to create package:', err);
      if (err.status === 401 || err.code === 'UNAUTHENTICATED') {
        router.push('/login');
      } else {
        setError(err.message || 'Failed to create package. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <Link 
        href="/packages"
        className="inline-flex items-center text-xs font-medium text-text-muted hover:text-text transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
        Back to Packages Catalog
      </Link>

      <PageHeader
        title="Create Package Bundle"
        description="Bundle inventory items into a bookable rental package with versioned bill-of-materials"
        tag={
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-surface-raised border border-border text-text-muted">
            PACKAGE BUILDER
          </span>
        }
      />

      {error && (
        <div className="p-3.5 rounded-lg bg-status-danger/10 border border-status-danger/25 text-status-danger text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details */}
        <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text">Package Information</h2>
          <div>
            <label htmlFor="packageName" className="block text-xs font-semibold uppercase tracking-wider text-text mb-1.5">
              Package Name <span className="text-status-danger">*</span>
            </label>
            <input
              id="packageName"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Premium Haldi Mandap"
              className="w-full px-3.5 py-2 bg-surface-raised border border-border rounded-lg text-text text-sm placeholder:text-text-dim focus:outline-none focus:border-border-active transition-colors"
            />
          </div>

          <div>
            <label htmlFor="packageDescription" className="block text-xs font-semibold uppercase tracking-wider text-text mb-1.5">
              Description
            </label>
            <textarea
              id="packageDescription"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Complete traditional yellow floral and seating decor package."
              className="w-full px-3.5 py-2 bg-surface-raised border border-border rounded-lg text-text text-sm placeholder:text-text-dim focus:outline-none focus:border-border-active transition-colors"
            />
          </div>
        </div>

        {/* Components / Bill of Materials */}
        <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-text">Bill of Materials (Version 1)</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Select inventory items and component quantities bundled into this package.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="text-xs font-semibold text-primary hover:text-primary-hover self-start sm:self-auto"
            >
              {showQuickAdd ? 'Hide Quick Add' : '+ Quick Add Item to Catalog'}
            </button>
          </div>

          {showQuickAdd && (
            <div className="p-4 bg-surface-raised border border-border rounded-lg space-y-3">
              <div className="text-xs font-semibold text-text uppercase tracking-wider">
                Create Missing Inventory Item
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Item name (e.g. VIP Sofa, Brass Urli, Jhoola, Carpet)"
                    value={quickItemName}
                    onChange={(e) => setQuickItemName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-surface border border-border rounded-md text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-border-active"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    min={0}
                    placeholder="Total Qty"
                    value={quickItemQty}
                    onChange={(e) => setQuickItemQty(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-1.5 bg-surface border border-border rounded-md text-xs text-text font-mono tabular-nums focus:outline-none focus:border-border-active"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleQuickAddItem}
                  disabled={quickAdding || !quickItemName.trim()}
                  className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-50"
                >
                  {quickAdding ? 'Adding...' : 'Create & Add to Package'}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {components.map((comp, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="flex-1">
                  <select
                    value={comp.inventoryItemId}
                    onChange={(e) => handleComponentChange(idx, 'inventoryItemId', e.target.value)}
                    className="w-full px-3 py-2 bg-surface-raised border border-border rounded-lg text-xs text-text focus:outline-none focus:border-border-active transition-colors"
                  >
                    <option value="">Select an inventory item...</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} {item.sku ? `(${item.sku})` : ''} — {item.totalQty} total fleet
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-28 flex items-center gap-1.5">
                  <span className="text-text-muted text-xs font-medium">×</span>
                  <input
                    type="number"
                    min={1}
                    value={comp.quantity}
                    onChange={(e) =>
                      handleComponentChange(
                        idx,
                        'quantity',
                        parseInt(e.target.value, 10) || 1
                      )
                    }
                    className="w-full px-2.5 py-2 bg-surface-raised border border-border rounded-lg text-xs text-text font-mono tabular-nums text-center focus:outline-none focus:border-border-active transition-colors"
                  />
                </div>

                {components.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveComponent(idx)}
                    className="p-1.5 text-text-dim hover:text-status-danger hover:bg-status-danger/10 rounded-md transition-colors"
                    title="Remove component"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddComponent}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover transition-colors mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Component
            </button>
          </div>

          <div className="pt-4 border-t border-border">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={publishImmediately}
                onChange={(e) => setPublishImmediately(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-surface"
              />
              <div>
                <div className="text-xs font-semibold text-text">Publish Version 1 immediately</div>
                <div className="text-[11px] text-text-muted">
                  Sets status to <span className="text-status-safe font-semibold">PUBLISHED</span> so it is immediately selectable in booking reservations.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Link
            href="/packages"
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
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Creating Package...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Create & Publish Package
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
