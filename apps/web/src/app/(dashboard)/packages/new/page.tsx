'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Check, AlertCircle, Plus, Trash2, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { InventoryItem } from '@/types/inventory';

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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <Link 
          href="/packages"
          className="inline-flex items-center text-sm font-medium text-text-muted hover:text-text mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Packages
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text">Create Package</h1>
            <p className="text-text-muted text-sm mt-0.5">
              Define a package and bundle components into Version 1.
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-text">Package Details</h2>
          <div>
            <label htmlFor="packageName" className="block text-sm font-medium text-text mb-1.5">
              Package Name <span className="text-urgency-critical">*</span>
            </label>
            <input
              id="packageName"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Premium Haldi"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>

          <div>
            <label htmlFor="packageDescription" className="block text-sm font-medium text-text mb-1.5">
              Description
            </label>
            <textarea
              id="packageDescription"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Complete traditional yellow floral and seating decor package."
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>
        </div>

        {/* Components / Bill of Materials */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-text">Components (Version 1)</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Select inventory items and quantities to bundle into this package.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="text-xs font-semibold text-primary hover:underline self-start sm:self-auto"
            >
              {showQuickAdd ? 'Hide Quick Add' : '+ Quick Add Item to Catalog'}
            </button>
          </div>

          {showQuickAdd && (
            <div className="p-4 bg-background border border-border rounded-lg space-y-3">
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
                    className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm text-text focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    min={0}
                    placeholder="Total Qty"
                    value={quickItemQty}
                    onChange={(e) => setQuickItemQty(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm text-text focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleQuickAddItem}
                  disabled={quickAdding || !quickItemName.trim()}
                  className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
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
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="">Select an inventory item...</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} {item.sku ? `(${item.sku})` : ''} — {item.totalQty} total
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-28 flex items-center gap-1.5">
                  <span className="text-text-muted text-sm font-medium">×</span>
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
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary transition-colors text-center font-medium"
                  />
                </div>

                {components.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveComponent(idx)}
                    className="p-2 text-text-muted hover:text-urgency-critical hover:bg-urgency-critical/10 rounded-lg transition-colors"
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
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primaryHover transition-colors mt-2"
            >
              <Plus className="w-4 h-4" />
              Add Another Component
            </button>
          </div>

          <div className="pt-4 border-t border-border">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={publishImmediately}
                onChange={(e) => setPublishImmediately(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <div>
                <div className="text-sm font-medium text-text">Publish Version 1 immediately</div>
                <div className="text-xs text-text-muted">
                  Sets status to <span className="text-green-500 font-semibold">PUBLISHED</span> so it is immediately bookable on calendar and bookings.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/packages"
            className="px-4 py-2.5 text-sm font-medium text-text-muted hover:text-text hover:bg-surfaceHover rounded-lg transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Package & Version...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Create & Publish Package
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
