import React from 'react';
import Link from 'next/link';
import { InventoryItem } from '@/types/inventory';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PackageSearch, ChevronRight, AlertCircle, Wrench, ShieldAlert, Trash2 } from 'lucide-react';

interface InventoryTableProps {
  items: InventoryItem[];
  onDelete?: (id: string) => void;
}

export function InventoryTable({ items, onDelete }: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-surface border border-dashed border-border rounded-lg text-center">
        <PackageSearch className="w-10 h-10 text-text-muted mb-3" />
        <h3 className="text-sm font-semibold text-text">No inventory items matched</h3>
        <p className="text-text-muted text-xs mt-1">Get started by creating your first inventory item or adjusting your search.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-surface-subtle text-text-muted border-b border-border uppercase tracking-wider text-[10px] font-semibold">
            <tr>
              <th scope="col" className="px-4 py-3">Item Name</th>
              <th scope="col" className="px-4 py-3">SKU</th>
              <th scope="col" className="px-4 py-3 text-right">Total Owned</th>
              <th scope="col" className="px-4 py-3 text-right">Usable</th>
              <th scope="col" className="px-4 py-3 text-right">Committed</th>
              <th scope="col" className="px-4 py-3 text-right">Available Now</th>
              <th scope="col" className="px-4 py-3 text-center">Physical State</th>
              <th scope="col" className="px-4 py-3 text-center">Status</th>
              <th scope="col" className="px-4 py-3 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {items.map((item) => {
              const availableQty = item.availableQty ?? item.usableQty;
              const isShort = availableQty === 0;

              return (
                <tr key={item.id} className="hover:bg-surface-raised transition-colors group">
                  <td className="px-4 py-3">
                    <Link 
                      href={`/inventory/${item.id}`}
                      className="font-semibold text-text hover:text-primary transition-colors block"
                    >
                      {item.name}
                    </Link>
                  </td>

                  <td className="px-4 py-3 font-mono text-text-muted text-[11px] tabular-nums">
                    {item.sku || '—'}
                  </td>

                  <td className="px-4 py-3 text-right font-mono font-medium text-text tabular-nums">
                    {item.totalQty}
                  </td>

                  <td className="px-4 py-3 text-right font-mono font-medium text-text tabular-nums">
                    <span className={item.usableQty === 0 ? 'text-status-danger font-bold' : 'text-text'}>
                      {item.usableQty}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    <span className={(item.committedQty ?? 0) > 0 ? 'text-status-warning font-semibold' : 'text-text-dim'}>
                      {item.committedQty ?? 0}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold">
                    <span className={isShort ? 'text-status-danger font-bold' : 'text-status-safe'}>
                      {availableQty}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2.5 text-xs font-mono tabular-nums">
                      {item.maintenanceQty > 0 && (
                        <div className="flex items-center text-status-info gap-1" title={`${item.maintenanceQty} in maintenance`}>
                          <Wrench className="w-3 h-3" />
                          <span>{item.maintenanceQty}</span>
                        </div>
                      )}
                      {item.damagedQty > 0 && (
                        <div className="flex items-center text-status-warning gap-1" title={`${item.damagedQty} damaged`}>
                          <AlertCircle className="w-3 h-3" />
                          <span>{item.damagedQty}</span>
                        </div>
                      )}
                      {item.missingQty > 0 && (
                        <div className="flex items-center text-status-danger gap-1" title={`${item.missingQty} missing`}>
                          <ShieldAlert className="w-3 h-3" />
                          <span>{item.missingQty}</span>
                        </div>
                      )}
                      {item.maintenanceQty === 0 && item.damagedQty === 0 && item.missingQty === 0 && (
                        <span className="text-text-dim">—</span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={item.status} size="sm" />
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        href={`/inventory/${item.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-text-muted hover:text-text px-2 py-1 rounded bg-surface-subtle border border-border transition-colors"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item.id)}
                          className="text-text-dim hover:text-status-danger p-1 rounded hover:bg-surface-subtle transition-colors"
                          title="Delete Item"
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
