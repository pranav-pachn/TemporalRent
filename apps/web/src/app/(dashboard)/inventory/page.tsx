'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { InventoryItem } from '@/types/inventory';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import Link from 'next/link';
import { Plus, Boxes, Search, CheckCircle2, AlertTriangle, Wrench } from 'lucide-react';

export default function InventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.fetchInventoryItems();
      setItems(response.data);
    } catch (err: any) {
      console.error('Failed to fetch inventory:', err);
      if (err.status === 401 || err.code === 'UNAUTHENTICATED') {
        router.push('/login');
        return;
      }
      setError(err.message || 'Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      setIsDeleting(true);
      await apiClient.deleteInventoryItem(deletingId);
      setDeletingId(null);
      await loadInventory();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete inventory item');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (i) => i.name.toLowerCase().includes(q) || (i.sku && i.sku.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  // Operational metrics
  const metrics = useMemo(() => {
    const totalSKUs = items.length;
    const totalPhysical = items.reduce((acc, i) => acc + (i.totalQty || 0), 0);
    const totalCommitted = items.reduce((acc, i) => acc + (i.committedQty || 0), 0);
    const totalMaintenance = items.reduce((acc, i) => acc + (i.maintenanceQty || 0) + (i.damagedQty || 0), 0);
    return { totalSKUs, totalPhysical, totalCommitted, totalMaintenance };
  }, [items]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <div className="h-10 bg-surface border border-border rounded-lg w-48 animate-pulse" />
        <LoadingState variant="table" rows={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <ErrorState message={error} onRetry={loadInventory} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Physical Inventory"
        description="Real-time stock ledger, operational availability, and quarantine maintenance tracking"
        tag={
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-surface-raised border border-border text-text-muted tabular-nums">
            {metrics.totalSKUs} SKUS
          </span>
        }
        actions={
          <Link 
            href="/inventory/new" 
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primaryHover transition-colors shadow-sm text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Inventory Item</span>
          </Link>
        }
      />

      {/* Operational Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          title="Active SKUs"
          value={metrics.totalSKUs}
          subtitle="Catalog cataloged items"
          icon={Boxes}
          accent="default"
        />
        <StatCard
          title="Physical Units"
          value={metrics.totalPhysical}
          subtitle="Total asset inventory"
          icon={CheckCircle2}
          accent="default"
        />
        <StatCard
          title="Committed Now"
          value={metrics.totalCommitted}
          subtitle="Reserved across bookings"
          icon={AlertTriangle}
          accent={metrics.totalCommitted > 0 ? "warning" : "default"}
        />
        <StatCard
          title="In Quarantine / Repair"
          value={metrics.totalMaintenance}
          subtitle="Damaged or in service"
          icon={Wrench}
          accent={metrics.totalMaintenance > 0 ? "danger" : "default"}
        />
      </div>

      {/* Search Filter Bar */}
      <div className="flex items-center justify-between gap-3 bg-surface border border-border rounded-lg p-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by item name or SKU..."
            className="w-full bg-surface-raised border border-border rounded-md pl-8 pr-3 py-1.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-primary"
          />
        </div>
        <div className="text-[11px] font-mono text-text-dim tabular-nums">
          Showing {filteredItems.length} of {items.length}
        </div>
      </div>

      <InventoryTable items={filteredItems} onDelete={(id) => setDeletingId(id)} />

      {/* Explicit Destructive Action Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        title="Delete Inventory Item?"
        description="Permanently removing this item will delete its stock ledger records and disconnect it from future reservation builders. This action cannot be undone."
        confirmLabel="Delete Item"
        cancelLabel="Keep Item"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
