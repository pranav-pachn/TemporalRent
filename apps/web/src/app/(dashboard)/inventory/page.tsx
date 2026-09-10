'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { InventoryItem } from '@/types/inventory';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import Link from 'next/link';

export default function InventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) return;
    try {
      await apiClient.deleteInventoryItem(id);
      loadInventory();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete inventory item');
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorState 
          message={error} 
          onRetry={loadInventory} 
        />
      </div>
    );
  }

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

      <InventoryTable items={items} onDelete={handleDeleteItem} />
    </div>
  );
}
