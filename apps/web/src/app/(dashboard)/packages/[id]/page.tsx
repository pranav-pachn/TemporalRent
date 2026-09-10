'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Package } from '@/types/package';
import { PackageVersionsTable } from '@/components/packages/PackageVersionsTable';
import { CreateVersionModal } from '@/components/packages/CreateVersionModal';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import Link from 'next/link';
import { ArrowLeft, Plus, CheckCircle2 } from 'lucide-react';

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
      <div className="p-6 max-w-7xl mx-auto">
        <LoadingState />
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorState 
          message={error || 'Package not found'} 
          onRetry={loadPackage} 
        />
      </div>
    );
  }

  const activeVersion = pkg.packageVersions.find((v: any) => v.status === 'ACTIVE');
  const draftVersion = pkg.packageVersions.find((v: any) => v.status === 'DRAFT');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 text-sm text-text-muted mb-4">
        <Link href="/packages" className="hover:text-primary transition-colors flex items-center">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Packages
        </Link>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-text">{pkg.name}</h1>
          </div>
          {pkg.description && (
            <p className="text-text-muted mb-3 max-w-2xl text-sm">{pkg.description}</p>
          )}
          
          <div className="flex flex-wrap items-center gap-4 text-sm mt-3 pt-3 border-t border-border">
            {activeVersion ? (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-text">v{activeVersion.versionNumber}</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  STATUS: PUBLISHED
                </span>
              </div>
            ) : (
              <span className="text-text-muted text-xs">No active version published yet</span>
            )}
            <span className="text-text-muted text-xs">
              Total Versions: <strong className="text-text">{pkg.packageVersions.length}</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 min-w-[170px]">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-sm w-full cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            {pkg.packageVersions.length === 0 ? 'Create Version 1' : 'New Version'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <PackageVersionsTable 
          packageId={pkg.id} 
          versions={pkg.packageVersions} 
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
