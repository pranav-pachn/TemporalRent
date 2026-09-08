import { apiClient } from '@/lib/api';
import { PackagesTable } from '@/components/packages/PackagesTable';
import Link from 'next/link';

export default async function PackagesPage() {
  try {
    const response = await apiClient.fetchPackages({
      next: { revalidate: 0 }
    });

    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text capitalize">Packages</h1>
            <p className="text-text-muted mt-1 text-sm">
              Bundle items together with version control to prevent historical conflicts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/packages/new" 
              className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-sm"
            >
              Create Package
            </Link>
          </div>
        </div>

        <PackagesTable packages={response.data} />
      </div>
    );
  } catch (error) {
    console.error("Failed to fetch packages:", error);
    
    // Provide a fallback or mock state
    const mockPackages = [
      {
        id: '1',
        businessId: 'b1',
        name: 'Wedding Platinum Package',
        description: 'Complete wedding setup with sofas, tables, and lighting',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        packageVersions: [
          {
            id: 'v2',
            packageId: '1',
            versionNumber: 2,
            status: 'ACTIVE' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            bookingCount: 15,
            packageComponents: [
              { id: 'c1', inventoryItemId: 'i1', quantity: 4, inventoryItem: { id: 'i1', name: 'VIP Sofa', sku: 'SOFA-VIP', totalQty: 10 } },
              { id: 'c2', inventoryItemId: 'i2', quantity: 10, inventoryItem: { id: 'i2', name: 'Banquet Chair', sku: 'CHAIR-BQ', totalQty: 200 } }
            ]
          },
          {
            id: 'v1',
            packageId: '1',
            versionNumber: 1,
            status: 'ARCHIVED' as const,
            createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
            updatedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
            bookingCount: 42,
            packageComponents: []
          }
        ]
      }
    ];

    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text capitalize">Packages</h1>
            <p className="text-text-muted mt-1 text-sm">
              Bundle items together with version control to prevent historical conflicts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button disabled className="inline-flex items-center justify-center px-4 py-2 bg-primary/50 text-primary-foreground font-medium rounded-lg cursor-not-allowed shadow-sm text-sm">
              Create Package
            </button>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 rounded-lg p-4 text-sm mb-6 flex items-start">
          <p>Showing mock data because the API connection failed. Ensure your backend is running.</p>
        </div>

        <PackagesTable packages={mockPackages} />
      </div>
    );
  }
}
