'use client';

import React, { useState } from 'react';
import { PackageVersion } from '@/types/package';
import { StatusBadge } from '@/components/ui/StatusBadge';
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
      <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-surface-subtle">
        <h3 className="text-xs font-semibold text-text uppercase tracking-wider">Version History</h3>
        <span className="text-[11px] font-mono text-text-muted tabular-nums">{versions.length} versions total</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-surface-subtle text-text-muted border-b border-border font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th scope="col" className="px-4 py-3">Version</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Bill of Materials</th>
              <th scope="col" className="px-4 py-3 text-right">Bookings</th>
              <th scope="col" className="px-4 py-3">Created</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {versions.map((v) => {
              const isPublishing = publishing === v.id;
              
              return (
                <tr key={v.id} className="hover:bg-surface-raised transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-text">
                    v{v.versionNumber}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={v.status} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col space-y-1">
                      {v.packageComponents.length === 0 ? (
                        <span className="text-text-dim italic text-xs">Empty BOM</span>
                      ) : (
                        v.packageComponents.map(c => (
                          <div key={c.id} className="text-xs">
                            <span className="font-mono font-bold text-text tabular-nums">{c.quantity}×</span>{' '}
                            <span className="text-text-muted">{c.inventoryItem.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-text-muted">
                    {v.bookingCount} bookings
                  </td>
                  <td className="px-4 py-3 text-text-muted font-mono text-[11px] tabular-nums">
                    {format(new Date(v.createdAt), 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {v.status === 'DRAFT' && (
                      <button
                        onClick={() => handlePublish(v.id)}
                        disabled={isPublishing}
                        className="inline-flex items-center justify-center px-3 py-1 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors shadow-sm text-xs disabled:opacity-50"
                      >
                        {isPublishing ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
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
