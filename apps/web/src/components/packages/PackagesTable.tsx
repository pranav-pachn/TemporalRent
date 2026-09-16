import React from 'react';
import Link from 'next/link';
import { Package } from '@/types/package';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PackageSearch, ChevronRight, Layers, Trash2 } from 'lucide-react';

interface PackagesTableProps {
  packages: Package[];
  onDelete?: (id: string) => void;
}

export function PackagesTable({ packages, onDelete }: PackagesTableProps) {
  if (packages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-surface border border-dashed border-border rounded-lg text-center">
        <PackageSearch className="w-10 h-10 text-text-muted mb-3" />
        <h3 className="text-sm font-semibold text-text">No packages matched</h3>
        <p className="text-text-muted text-xs mt-1">Get started by creating your first package bundle or adjusting your search.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-surface-subtle text-text-muted border-b border-border uppercase tracking-wider text-[10px] font-semibold">
            <tr>
              <th scope="col" className="px-4 py-3">Package Name</th>
              <th scope="col" className="px-4 py-3 text-center">Active Version</th>
              <th scope="col" className="px-4 py-3 text-right">Consumed Units</th>
              <th scope="col" className="px-4 py-3 text-center">Status</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {packages.map((pkg) => {
              const activeVersion = pkg.packageVersions?.find(v => v.status === 'ACTIVE');
              const latestVersion = pkg.packageVersions?.[0];
              const displayVersion = activeVersion || latestVersion;
              
              const itemCount = displayVersion?.packageComponents?.reduce((acc, c) => acc + c.quantity, 0) || 0;

              return (
                <tr key={pkg.id} className="hover:bg-surface-raised transition-colors group">
                  <td className="px-4 py-3">
                    <Link 
                      href={`/packages/${pkg.id}`}
                      className="font-semibold text-text hover:text-primary transition-colors block"
                    >
                      {pkg.name}
                    </Link>
                    {pkg.description && (
                      <div className="text-[11px] text-text-muted mt-0.5 truncate max-w-[280px]">
                        {pkg.description}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3 text-center font-mono font-medium text-text tabular-nums">
                    {displayVersion ? (
                      <span className="px-2 py-0.5 rounded bg-surface-raised border border-border text-[11px]">
                        v{displayVersion.versionNumber}
                      </span>
                    ) : '—'}
                  </td>

                  <td className="px-4 py-3 text-right font-mono font-medium text-text tabular-nums">
                    {displayVersion ? (
                      <div className="flex justify-end items-center text-text gap-1">
                        <Layers className="w-3.5 h-3.5 text-primary" />
                        <span>{itemCount} units</span>
                      </div>
                    ) : (
                      <span className="text-text-dim">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {displayVersion ? (
                      <StatusBadge status={displayVersion.status} size="sm" />
                    ) : (
                      <span className="text-text-dim">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        href={`/packages/${pkg.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-text-muted hover:text-text px-2 py-1 rounded bg-surface-subtle border border-border transition-colors"
                      >
                        <span>Inspect BOM</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                      {onDelete && (
                        <button
                          onClick={() => onDelete(pkg.id)}
                          className="text-text-dim hover:text-status-danger p-1 rounded hover:bg-surface-subtle transition-colors"
                          title="Delete Package"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
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
