'use client';

import React, { useState } from 'react';
import { PackageVersion } from '@/types/package';
import { PackageStatusBadge } from './PackageStatusBadge';
import { format } from 'date-fns';
import { CheckCircle, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';

export function PackageVersionsTable({ 
  packageId, 
  versions, 
  onRefresh 
}: { 
  packageId: string; 
  versions: PackageVersion[]; 
  onRefresh?: () => void;
}) {
  const router = useRouter();
  const [publishing, setPublishing] = useState<string | null>(null);

  const handlePublish = async (versionId: string) => {
    setPublishing(versionId);
    try {
      await apiClient.activatePackageVersion(packageId, versionId);
      if (onRefresh) {
        onRefresh();
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to publish version:", error);
      alert("Failed to publish version. Please check console.");
    } finally {
      setPublishing(null);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-background-dark/30">
        <h3 className="font-semibold text-text">Version History</h3>
        <span className="text-xs text-text-muted">{versions.length} versions total</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-background-dark text-text-muted border-b border-border">
            <tr>
              <th scope="col" className="px-6 py-4 font-semibold">Version</th>
              <th scope="col" className="px-6 py-4 font-semibold">Status</th>
              <th scope="col" className="px-6 py-4 font-semibold">Components</th>
              <th scope="col" className="px-6 py-4 font-semibold">Bookings (Historical)</th>
              <th scope="col" className="px-6 py-4 font-semibold">Created</th>
              <th scope="col" className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {versions.map((v) => {
              const isPublishing = publishing === v.id;
              
              return (
                <tr key={v.id} className="hover:bg-background-dark/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-text">v{v.versionNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <PackageStatusBadge status={v.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-1">
                      {v.packageComponents.length === 0 ? (
                        <span className="text-text-muted italic text-xs">Empty package</span>
                      ) : (
                        v.packageComponents.map(c => (
                          <div key={c.id} className="text-sm">
                            <span className="font-medium text-text">{c.quantity}x</span>{' '}
                            <span className="text-text-muted">{c.inventoryItem.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-text-muted">{v.bookingCount} bookings</span>
                  </td>
                  <td className="px-6 py-4 text-text-muted">
                    {format(new Date(v.createdAt), 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {v.status === 'DRAFT' && (
                      <button
                        onClick={() => handlePublish(v.id)}
                        disabled={isPublishing}
                        className="inline-flex items-center justify-center px-3 py-1.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-xs disabled:opacity-50"
                      >
                        {isPublishing ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Publish
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
