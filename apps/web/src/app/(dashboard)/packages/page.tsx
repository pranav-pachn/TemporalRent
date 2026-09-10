'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Package } from '@/types/package';
import { PackagesTable } from '@/components/packages/PackagesTable';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import Link from 'next/link';

export default function PackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPackages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.fetchPackages();
      setPackages(response.data);
    } catch (err: any) {
      console.error('Failed to fetch packages:', err);
      if (err.status === 401 || err.code === 'UNAUTHENTICATED') {
        router.push('/login');
        return;
      }
      setError(err.message || 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const handleDeletePackage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;
    try {
      await apiClient.deletePackage(id);
      loadPackages();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete package');
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
          onRetry={loadPackages} 
        />
      </div>
    );
  }

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

      <PackagesTable packages={packages} onDelete={handleDeletePackage} />
    </div>
  );
}
