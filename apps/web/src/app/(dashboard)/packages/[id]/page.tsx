'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Package } from '@/types/package';
import { PackageVersionsTable } from '@/components/packages/PackageVersionsTable';
import { CreateVersionModal } from '@/components/packages/CreateVersionModal';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Link from 'next/link';
import { ArrowLeft, Plus, CheckCircle2, Layers } from 'lucide-react';

export default function PackageDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadPackage = useCallback(async () => {
    if (params.id === 'new') return;
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.fetchPackage(params.id);
      setPkg(response.data);
    } catch (err: any) {
      console.error('Failed to fetch package:', err);
      if (err.status === 401 || err.code === 'UNAUTHENTICATED') {
        router.push('/login');
        return;
      }
      setError(err.status === 404 ? 'Package not found' : (err.message || 'Failed to load package'));
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    loadPackage();
  }, [loadPackage]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <div className="h-10 bg-surface border border-border rounded-lg w-48 animate-pulse" />
        <LoadingState variant="page" />
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <ErrorState 
          message={error || 'Package not found'} 
          onRetry={loadPackage} 
        />
      </div>
    );
  }

  const activeVersion = pkg.packageVersions?.find((v: any) => v.status === 'ACTIVE');

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-20">
      <PageHeader
        title={pkg.name}
        description={pkg.description || 'Bill of Materials & versioned physical inventory bundle'}
        tag={
          activeVersion ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-status-safe/15 text-status-safe border border-status-safe/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ACTIVE: v{activeVersion.versionNumber}</span>
            </span>
          ) : (
            <span className="text-xs text-text-muted">Draft Bundle</span>
          )
        }
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/packages"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border hover:bg-surface-raised text-text-muted hover:text-text text-xs font-medium rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Packages</span>
            </Link>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primaryHover transition-colors shadow-sm text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{pkg.packageVersions?.length === 0 ? 'Create Version 1' : 'New Version'}</span>
            </button>
          </div>
        }
      />

      <div className="space-y-4">
        <PackageVersionsTable 
          packageId={pkg.id} 
          versions={pkg.packageVersions || []} 
          onRefresh={loadPackage}
        />
      </div>

      <CreateVersionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        packageId={pkg.id}
        packageName={pkg.name}
        onSuccess={loadPackage}
      />
    </div>
  );
}
