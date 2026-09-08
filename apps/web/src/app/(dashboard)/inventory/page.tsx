import { apiClient } from '@/lib/api';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { PackageSearch } from 'lucide-react';
import Link from 'next/link';

export default async function InventoryPage() {
  try {
    const response = await apiClient.fetchInventoryItems({
      next: { revalidate: 0 } // no-cache for now, or use tags for revalidation
    });

    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text capitalize">Inventory</h1>
            <p className="text-text-muted mt-1 text-sm">
              Manage your physical items, track availability, and monitor damages.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/inventory/new" 
              className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-sm"
            >
              Add Item
            </Link>
          </div>
        </div>

        <InventoryTable items={response.data} />
      </div>
    );
  } catch (error) {
    console.error("Failed to fetch inventory:", error);
    
    // Provide a fallback or mock state if backend is down / auth is missing in dev
    const mockItems = [
      {
        id: '1',
        businessId: 'b1',
        name: 'VIP Sofa',
        sku: 'SOFA-VIP-01',
        categoryId: null,
        totalQty: 10,
        usableQty: 8,
        damagedQty: 1,
        maintenanceQty: 1,
        missingQty: 0,
        status: 'MAINTENANCE' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        businessId: 'b1',
        name: 'Brass Urli',
        sku: 'URLI-BR-M',
        categoryId: null,
        totalQty: 6,
        usableQty: 6,
        damagedQty: 0,
        maintenanceQty: 0,
        missingQty: 0,
        status: 'HEALTHY' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text capitalize">Inventory</h1>
            <p className="text-text-muted mt-1 text-sm">
              Manage your physical items, track availability, and monitor damages.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button disabled className="inline-flex items-center justify-center px-4 py-2 bg-primary/50 text-primary-foreground font-medium rounded-lg cursor-not-allowed shadow-sm text-sm">
              Add Item
            </button>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 rounded-lg p-4 text-sm mb-6 flex items-start">
          <p>Showing mock data because the API connection failed. Ensure your backend is running.</p>
        </div>

        <InventoryTable items={mockItems} />
      </div>
    );
  }
}
