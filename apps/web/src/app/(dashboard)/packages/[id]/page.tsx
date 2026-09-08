import { apiClient } from '@/lib/api';
import { PackageVersionsTable } from '@/components/packages/PackageVersionsTable';
import Link from 'next/link';
import { ArrowLeft, Edit, Plus } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function PackageDetailPage({ params }: { params: { id: string } }) {
  let pkg;
  try {
    const response = await apiClient.fetchPackage(params.id, {
      next: { revalidate: 0 }
    });
    pkg = response.data;
  } catch (error) {
    console.error("Failed to fetch package", error);
    notFound();
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
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-2xl font-bold text-text">{pkg.name}</h1>
          </div>
          {pkg.description && (
            <p className="text-text-muted mb-3 max-w-2xl text-sm">{pkg.description}</p>
          )}
          <div className="text-sm text-text-muted space-x-4">
            <span>ID: <span className="text-text font-medium text-xs">{pkg.id}</span></span>
            {activeVersion && (
              <span>Active Version: <span className="text-text font-medium text-xs">v{activeVersion.versionNumber}</span></span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 min-w-[150px]">
          <button className="inline-flex items-center justify-center px-4 py-2 border border-border bg-background text-text font-medium rounded-lg hover:bg-background-dark transition-colors shadow-sm text-sm w-full">
            <Edit className="w-4 h-4 mr-2" />
            Edit Package Info
          </button>
          {!draftVersion && (
            <button className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-sm w-full">
              <Plus className="w-4 h-4 mr-2" />
              New Draft Version
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <PackageVersionsTable packageId={pkg.id} versions={pkg.packageVersions} />
      </div>
    </div>
  );
}
