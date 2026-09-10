import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { InventoryItem } from '@/types/inventory';
import { apiClient } from '@/lib/api';

interface EditInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem;
  onUpdated: () => void;
}

export function EditInventoryModal({ isOpen, onClose, item, onUpdated }: EditInventoryModalProps) {
  const [name, setName] = useState(item.name);
  const [sku, setSku] = useState(item.sku || '');
  const [totalQty, setTotalQty] = useState<number | string>(item.totalQty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(item.name);
      setSku(item.sku || '');
      setTotalQty(item.totalQty);
      setError(null);
    }
  }, [isOpen, item]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Item name is required');
      return;
    }

    const parsedQty = typeof totalQty === 'string' ? parseInt(totalQty, 10) : totalQty;
    if (isNaN(parsedQty) || parsedQty < 0) {
      setError('Please enter a valid total quantity (0 or greater).');
      return;
    }

    try {
      setSaving(true);
      // Update metadata (name, sku)
      if (name.trim() !== item.name || sku.trim() !== (item.sku || '')) {
        await apiClient.updateInventoryItem(item.id, {
          name: name.trim(),
          sku: sku.trim() || undefined,
        });
      }

      // Update quantity if changed
      const quantityDelta = parsedQty - item.totalQty;
      if (quantityDelta !== 0) {
        await apiClient.adjustInventoryItem(item.id, {
          quantityDelta,
          notes: 'Adjusted via edit modal',
        });
      }

      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text">Edit Item</h2>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text hover:bg-background-dark rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-text">
                Item Name <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vintage Camera Lens"
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="sku" className="block text-sm font-medium text-text">
                SKU (Optional)
              </label>
              <input
                id="sku"
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. CAM-LENS-01"
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="totalQty" className="block text-sm font-medium text-text">
                Total Quantity <span className="text-red-400">*</span>
              </label>
              <input
                id="totalQty"
                type="number"
                min="0"
                value={totalQty}
                onChange={(e) => setTotalQty(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 mr-3 text-text-muted hover:text-text font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center px-6 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
