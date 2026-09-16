'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { InventoryItem } from '@/types/inventory';
import { Plus, Trash2, X, AlertCircle, Check, Loader2 } from 'lucide-react';

interface ComponentRow {
  inventoryItemId: string;
  quantity: number;
}

interface CreateVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageId: string;
  packageName: string;
  onSuccess: () => void;
}

export function CreateVersionModal({
  isOpen,
  onClose,
  packageId,
  packageName,
  onSuccess,
}: CreateVersionModalProps) {
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

  const loadItems = async () => {
    try {
      setLoadingItems(true);
      const res = await apiClient.fetchInventoryItems();
      setItems(res.data);
    } catch (err) {
      console.error('Failed to load inventory items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadItems();
      setComponents([{ inventoryItemId: '', quantity: 1 }]);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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

    const validComponents = components.filter(
      (c) => c.inventoryItemId && c.quantity > 0
    );

    if (validComponents.length === 0) {
      setError('Please add at least one component with a quantity of 1 or more.');
      return;
    }

    // Check for duplicates
    const itemIds = validComponents.map((c) => c.inventoryItemId);
    if (new Set(itemIds).size !== itemIds.length) {
      setError('Each inventory item can only be added once per version. Adjust quantities instead.');
      return;
    }

    try {
      setSubmitting(true);
      const versionRes = await apiClient.createPackageVersion(packageId, {
        components: validComponents,
      });

      if (publishImmediately && versionRes.data?.id) {
        await apiClient.activatePackageVersion(packageId, versionRes.data.id);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to create package version:', err);
      setError(err.message || 'Failed to create package version.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-none animate-in fade-in duration-150">
      <div className="bg-surface border border-border-muted rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-border bg-surface-raised flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-text">New Package Version</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Define components and quantities for <span className="font-semibold text-text">{packageName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text hover:bg-surface-subtle rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-status-danger/10 border border-status-danger/25 text-status-danger text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text">
                Components & Quantities <span className="text-status-danger">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowQuickAdd(!showQuickAdd)}
                className="text-xs font-medium text-primary hover:text-primary-hover"
              >
                {showQuickAdd ? 'Hide Quick Add' : '+ Quick Add Item to Catalog'}
              </button>
            </div>

            {showQuickAdd && (
              <div className="p-3.5 bg-surface-raised border border-border rounded-lg space-y-3">
                <div className="text-[11px] font-semibold text-text uppercase tracking-wider">
                  Quick Add Inventory Item
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Item name (e.g. VIP Sofa)"
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
                    className="px-3 py-1 bg-primary text-white text-xs font-medium rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50"
                  >
                    {quickAdding ? 'Adding...' : 'Create & Select'}
                  </button>
                </div>
              </div>
            )}

            {components.map((comp, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="flex-1">
                  <select
                    required
                    value={comp.inventoryItemId}
                    onChange={(e) => handleComponentChange(idx, 'inventoryItemId', e.target.value)}
                    className="w-full px-3 py-2 bg-surface-raised border border-border rounded-lg text-xs text-text focus:outline-none focus:border-border-active transition-colors"
                  >
                    <option value="">Select an inventory item...</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} {item.sku ? `(${item.sku})` : ''} — {item.totalQty} in fleet
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-28 flex items-center gap-1.5">
                  <span className="text-text-muted text-xs font-medium">×</span>
                  <input
                    type="number"
                    min={1}
                    required
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
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover transition-colors mt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Component
            </button>
          </div>

          <div className="pt-3 border-t border-border">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={publishImmediately}
                onChange={(e) => setPublishImmediately(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-surface"
              />
              <div>
                <div className="text-xs font-semibold text-text">Publish version immediately</div>
                <div className="text-[11px] text-text-muted">
                  Sets status to <span className="text-status-safe font-semibold">PUBLISHED</span> so it is immediately bookable.
                </div>
              </div>
            </label>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-text-muted hover:text-text hover:bg-surface-raised border border-border rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving Version...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  {publishImmediately ? 'Create & Publish Version' : 'Create Draft Version'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
