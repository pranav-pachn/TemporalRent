'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Package } from '@/types/package';
import { PackagesTable } from '@/components/packages/PackagesTable';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import Link from 'next/link';
import { Plus, Search, Package as PackageIcon } from 'lucide-react';

export default function PackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Delete dialog state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      setIsDeleting(true);
      await apiClient.deletePackage(deletingId);
      setDeletingId(null);
      await loadPackages();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete package');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPackages = useMemo(() => {
    if (!searchQuery) return packages;
    const q = searchQuery.toLowerCase();
    return packages.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))
    );
  }, [packages, searchQuery]);

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
        <ErrorState message={error} onRetry={loadPackages} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Package Bundles & BOM"
        description="Composite bundles with versioned bill-of-materials and atomic physical inventory mapping"
        tag={
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-surface-raised border border-border text-text-muted tabular-nums">
            {packages.length} BUNDLES
          </span>
        }
        actions={
          <Link 
            href="/packages/new" 
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primaryHover transition-colors shadow-sm text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Package Bundle</span>
          </Link>
        }
      />

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-surface border border-border rounded-lg p-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search packages by title or description..."
            className="w-full bg-surface-raised border border-border rounded-md pl-8 pr-3 py-1.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-primary"
          />
        </div>
        <div className="text-[11px] font-mono text-text-dim tabular-nums">
          Showing {filteredPackages.length} of {packages.length}
        </div>
      </div>

      <PackagesTable packages={filteredPackages} onDelete={(id) => setDeletingId(id)} />

      {/* Confirm Deletion Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        title="Delete Package Bundle?"
        description="Deleting this package will remove its configuration and prevent future reservations from bundling these items. Existing confirmed reservations remain locked."
        confirmLabel="Delete Package"
        cancelLabel="Keep Package"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
