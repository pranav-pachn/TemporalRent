import React from 'react';
import Link from 'next/link';
import { Package } from '@/types/package';
import { PackageStatusBadge } from './PackageStatusBadge';
import { PackageSearch, ArrowRight, Layers, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface PackagesTableProps {
  packages: Package[];
  onDelete?: (id: string) => void;
}

export function PackagesTable({ packages, onDelete }: PackagesTableProps) {
  if (packages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-surface border border-border rounded-lg text-center">
        <PackageSearch className="w-12 h-12 text-text-muted mb-4" />
        <h3 className="text-lg font-medium text-text">No packages found</h3>
        <p className="text-text-muted mt-2">Get started by creating your first package.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-background-dark text-text-muted border-b border-border">
            <tr>
              <th scope="col" className="px-6 py-4 font-semibold">Package Name</th>
              <th scope="col" className="px-6 py-4 font-semibold text-center">Active Version</th>
              <th scope="col" className="px-6 py-4 font-semibold text-right">Items in Active</th>
              <th scope="col" className="px-6 py-4 font-semibold text-center">Status</th>
              <th scope="col" className="px-6 py-4 font-semibold relative">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {packages.map((pkg) => {
              // Find the active version if any, else the latest version
              const activeVersion = pkg.packageVersions.find(v => v.status === 'ACTIVE');
              const latestVersion = pkg.packageVersions[0];
              const displayVersion = activeVersion || latestVersion;
              
              const itemCount = displayVersion?.packageComponents.reduce((acc, c) => acc + c.quantity, 0) || 0;

              return (
                <tr key={pkg.id} className="hover:bg-background-dark/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-text">{pkg.name}</div>
                    {pkg.description && (
                      <div className="text-xs text-text-muted mt-0.5 truncate max-w-[250px]">
                        {pkg.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center font-medium">
                    {displayVersion ? `v${displayVersion.versionNumber}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {displayVersion ? (
                      <div className="flex justify-end items-center text-text-muted">
                        <Layers className="w-3.5 h-3.5 mr-1" />
                        <span>{itemCount}</span>
                      </div>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {displayVersion ? <PackageStatusBadge status={displayVersion.status} /> : <span className="text-text-muted">-</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onDelete && (
                        <button
                          onClick={() => onDelete(pkg.id)}
                          className="inline-flex items-center justify-center p-2 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Delete Package"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <Link 
                        href={`/packages/${pkg.id}`}
                        className="inline-flex items-center justify-center p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span className="sr-only">View Details</span>
                      </Link>
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
