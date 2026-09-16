'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { InventoryItem } from '@/types/inventory';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { InventoryDetailTabs } from '@/components/inventory/InventoryDetailTabs';
import { EditInventoryModal } from '@/components/inventory/EditInventoryModal';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import Link from 'next/link';
import { ArrowLeft, Edit3, Boxes, Wrench, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function InventoryDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadItem = useCallback(async () => {
    if (params.id === 'new') return;
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.fetchInventoryItem(params.id);
      setItem(response.data);
    } catch (err: any) {
      console.error('Failed to fetch inventory item:', err);
      if (err.status === 401 || err.code === 'UNAUTHENTICATED') {
        router.push('/login');
        return;
      }
      setError(err.status === 404 ? 'Inventory item not found' : (err.message || 'Failed to load item'));
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <div className="h-10 bg-surface border border-border rounded-lg w-48 animate-pulse" />
        <LoadingState variant="page" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <ErrorState 
          message={error || 'Item not found'} 
          onRetry={loadItem} 
        />
      </div>
    );
  }

  const availableQty = item.availableQty ?? item.usableQty;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-20">
      <PageHeader
        title={item.name}
        description={`SKU: ${item.sku || 'N/A'} · Item ID #${item.id.substring(0, 8)}`}
        tag={<StatusBadge status={item.status} />}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/inventory"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border hover:bg-surface-raised text-text-muted hover:text-text text-xs font-medium rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Stock</span>
            </Link>
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primaryHover transition-colors shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Stock Ledger Snapshot */}
        <div className="lg:col-span-1 bg-surface border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-text-dim uppercase tracking-wider pb-2 border-b border-border">
            <Boxes className="w-3.5 h-3.5 text-primary" />
            <span>Stock Ledger Balance</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-text-muted">Total Owned</span>
              <span className="font-mono font-bold text-text tabular-nums">{item.totalQty}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-text-muted">Usable Working Stock</span>
              <span className={`font-mono font-bold tabular-nums ${item.usableQty === 0 ? 'text-status-danger' : 'text-text'}`}>
                {item.usableQty}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-text-muted">Currently Committed</span>
              <span className={`font-mono font-bold tabular-nums ${(item.committedQty ?? 0) > 0 ? 'text-status-warning' : 'text-text-dim'}`}>
                {item.committedQty ?? 0}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="font-semibold text-text">Available Right Now</span>
              <span className={`font-mono text-sm font-bold tabular-nums ${availableQty === 0 ? 'text-status-danger' : 'text-status-safe'}`}>
                {availableQty}
              </span>
            </div>
          </div>

          {/* Physical Discrepancies */}
          <div className="border-t border-border pt-3 space-y-2 text-xs">
            <div className="text-[10px] font-semibold text-text-dim uppercase tracking-wider mb-2">
              Quarantine / Exclusions
            </div>
            
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-text-muted flex items-center gap-1.5">
                <Wrench className="w-3 h-3 text-status-info" /> In Maintenance
              </span>
              <span className="font-mono font-semibold text-status-info tabular-nums">{item.maintenanceQty}</span>
            </div>

            <div className="flex justify-between items-center text-[11px]">
              <span className="text-text-muted flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-status-warning" /> Damaged Units
              </span>
              <span className="font-mono font-semibold text-status-warning tabular-nums">{item.damagedQty}</span>
            </div>

            <div className="flex justify-between items-center text-[11px]">
              <span className="text-text-muted flex items-center gap-1.5">
                <ShieldAlert className="w-3 h-3 text-status-danger" /> Missing Units
              </span>
              <span className="font-mono font-semibold text-status-danger tabular-nums">{item.missingQty}</span>
            </div>
          </div>
        </div>

        {/* Operational Detail Tabs */}
        <div className="lg:col-span-3">
          <InventoryDetailTabs itemId={item.id} />
        </div>
      </div>

      <EditInventoryModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={item}
        onUpdated={loadItem}
      />
    </div>
  );
}
