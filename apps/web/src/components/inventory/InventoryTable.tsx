import React from 'react';
import Link from 'next/link';
import { InventoryItem } from '@/types/inventory';
import { InventoryStatusBadge } from './InventoryStatusBadge';
import { PackageSearch, ArrowRight, AlertCircle, Wrench, ShieldAlert, Trash2 } from 'lucide-react';

interface InventoryTableProps {
  items: InventoryItem[];
  onDelete?: (id: string) => void;
}

export function InventoryTable({ items, onDelete }: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-surface border border-border rounded-lg text-center">
        <PackageSearch className="w-12 h-12 text-text-muted mb-4" />
        <h3 className="text-lg font-medium text-text">No inventory items found</h3>
        <p className="text-text-muted mt-2">Get started by creating your first inventory item.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-background-dark text-text-muted border-b border-border">
            <tr>
              <th scope="col" className="px-6 py-4 font-semibold">Item Name</th>
              <th scope="col" className="px-6 py-4 font-semibold">SKU</th>
              <th scope="col" className="px-6 py-4 font-semibold text-right">Total Owned</th>
              <th scope="col" className="px-6 py-4 font-semibold text-right">Usable</th>
              <th scope="col" className="px-6 py-4 font-semibold text-right">Committed</th>
              <th scope="col" className="px-6 py-4 font-semibold text-right">Available</th>
              <th scope="col" className="px-6 py-4 font-semibold text-center">Physical State</th>
              <th scope="col" className="px-6 py-4 font-semibold text-center">Status</th>
              <th scope="col" className="px-6 py-4 font-semibold relative">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-background-dark/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-text">{item.name}</div>
                </td>
                <td className="px-6 py-4 text-text-muted">
                  {item.sku || '-'}
                </td>
                <td className="px-6 py-4 text-right font-medium">
                  {item.totalQty}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`font-medium ${item.usableQty === 0 ? 'text-red-500' : 'text-text'}`}>
                    {item.usableQty}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`font-medium ${(item.committedQty ?? 0) > 0 ? 'text-amber-400 font-semibold' : 'text-text-muted'}`}>
                    {item.committedQty ?? 0}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`font-medium ${(item.availableQty ?? item.usableQty) === 0 ? 'text-red-500' : 'text-emerald-400 font-semibold'}`}>
                    {item.availableQty ?? item.usableQty}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center space-x-3 text-xs">
                    {item.maintenanceQty > 0 && (
                      <div className="flex items-center text-blue-500" title={`${item.maintenanceQty} in maintenance`}>
                        <Wrench className="w-3.5 h-3.5 mr-1" />
                        <span>{item.maintenanceQty}</span>
                      </div>
                    )}
                    {item.damagedQty > 0 && (
                      <div className="flex items-center text-yellow-500" title={`${item.damagedQty} damaged`}>
                        <AlertCircle className="w-3.5 h-3.5 mr-1" />
                        <span>{item.damagedQty}</span>
                      </div>
                    )}
                    {item.missingQty > 0 && (
                      <div className="flex items-center text-orange-500" title={`${item.missingQty} missing`}>
                        <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                        <span>{item.missingQty}</span>
                      </div>
                    )}
                    {item.maintenanceQty === 0 && item.damagedQty === 0 && item.missingQty === 0 && (
                      <span className="text-text-muted">-</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <InventoryStatusBadge status={item.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item.id)}
                        className="inline-flex items-center justify-center p-2 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <Link 
                      href={`/inventory/${item.id}`}
                      className="inline-flex items-center justify-center p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span className="sr-only">View Details</span>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
