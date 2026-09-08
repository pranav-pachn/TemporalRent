import { apiClient } from '@/lib/api';
import { InventoryStatusBadge } from '@/components/inventory/InventoryStatusBadge';
import { InventoryDetailTabs } from '@/components/inventory/InventoryDetailTabs';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function InventoryDetailPage({ params }: { params: { id: string } }) {
  let item;
  try {
    const response = await apiClient.fetchInventoryItem(params.id, {
      next: { revalidate: 0 }
    });
    item = response.data;
  } catch (error) {
    // If not found, return 404
    console.error("Failed to fetch inventory item", error);
    notFound();
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 text-sm text-text-muted mb-4">
        <Link href="/inventory" className="hover:text-primary transition-colors flex items-center">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Inventory
        </Link>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-2xl font-bold text-text">{item.name}</h1>
            <InventoryStatusBadge status={item.status} />
          </div>
          <div className="text-sm text-text-muted space-x-4">
            <span>SKU: <span className="text-text font-medium">{item.sku || 'N/A'}</span></span>
            <span>ID: <span className="text-text font-medium text-xs">{item.id}</span></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center justify-center px-4 py-2 border border-border bg-background text-text font-medium rounded-lg hover:bg-background-dark transition-colors shadow-sm text-sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-text uppercase tracking-wider mb-4">Stock Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Total Owned</span>
                <span className="font-medium text-text">{item.totalQty}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Usable</span>
                <span className={`font-medium ${item.usableQty === 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {item.usableQty}
                </span>
              </div>
              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-muted">In Maintenance</span>
                  <span className="font-medium text-blue-500">{item.maintenanceQty}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-muted">Damaged</span>
                  <span className="font-medium text-yellow-500">{item.damagedQty}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-muted">Missing</span>
                  <span className="font-medium text-orange-500">{item.missingQty}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <InventoryDetailTabs itemId={item.id} />
        </div>
      </div>
    </div>
  );
}
