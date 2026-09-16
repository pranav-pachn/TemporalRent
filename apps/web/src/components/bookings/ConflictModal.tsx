import React from 'react';
import { AlertTriangle, X, Calendar, Edit3, ArrowLeft, RefreshCw, ChevronRight } from 'lucide-react';
import { InventoryConflictErrorResponse } from '@/types/bookings';
import Link from 'next/link';

interface ConflictModalProps {
  error: InventoryConflictErrorResponse;
  onClose: () => void;
  onChangeQuantity: () => void;
  onChangeDate: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function ConflictModal({ 
  error, 
  onClose, 
  onChangeQuantity, 
  onChangeDate, 
  onRefresh,
  isRefreshing = false 
}: ConflictModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-surface border border-border rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border bg-status-danger/10">
          <div className="flex items-center gap-3 text-status-danger">
            <div className="p-2 rounded-lg bg-status-danger/20 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text">Capacity Conflict Detected</h2>
              <p className="text-status-danger text-xs mt-0.5">
                {error.conflicts.length} item{error.conflicts.length !== 1 ? 's' : ''} cannot be safely promised due to physical shortage
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-text-muted hover:text-text rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice */}
        <div className="px-5 py-2.5 bg-surface-subtle border-b border-border text-xs text-text-muted">
          Temporal locks are already active on competing bookings during this window. Reduce demanded quantities or select alternative dates.
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {error.conflicts.map((conflict, idx) => (
            <div key={idx} className="bg-surface-raised border border-border rounded-lg overflow-hidden">
              <div className="p-3.5 border-b border-border flex justify-between items-center bg-surface-subtle">
                <h3 className="font-semibold text-text text-xs">{conflict.inventoryItemName}</h3>
                <span className="px-2 py-0.5 bg-status-danger/20 text-status-danger text-[10px] font-mono font-bold rounded border border-status-danger/30 uppercase tracking-wider">
                  SHORTAGE: -{conflict.shortageQty}
                </span>
              </div>
              
              <div className="p-3.5 border-b border-border/60 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-text-dim uppercase font-medium">Demanded</span>
                  <span className="font-mono text-text font-semibold tabular-nums block mt-0.5">
                    {conflict.requiredQty} units
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-dim uppercase font-medium">Available</span>
                  <span className="font-mono text-text font-semibold tabular-nums block mt-0.5">
                    {conflict.availableQty} units
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-dim uppercase font-medium">Shortfall</span>
                  <span className="font-mono text-status-danger font-bold tabular-nums block mt-0.5">
                    -{conflict.shortageQty} units
                  </span>
                </div>
              </div>

              {conflict.conflictingReservations.length > 0 && (
                <div className="p-3.5">
                  <div className="text-[11px] font-semibold text-text-dim uppercase tracking-wider mb-2">
                    Overlapping Confirmed Bookings:
                  </div>
                  <div className="space-y-2">
                    {conflict.conflictingReservations.map((res, ridx) => {
                      const startDate = new Date(res.start);
                      const endDate = new Date(res.end);
                      
                      const dateStr = startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                      const startTimeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                      const endTimeStr = endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

                      return (
                        <div key={ridx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-surface rounded-md border border-border gap-2 text-xs">
                          <div>
                            <div className="font-medium text-text">
                              {res.eventName || res.bookingName || `Booking #${res.bookingId.substring(0, 8)}`}
                            </div>
                            <div className="text-[11px] text-text-muted font-mono mt-0.5 tabular-nums">
                              {dateStr} · {startTimeStr} – {endTimeStr}
                            </div>
                            <div className="text-[11px] text-text-dim mt-0.5 font-mono">
                              Committed: <span className="text-text font-semibold">{res.quantity}</span> units
                            </div>
                          </div>
                          <Link 
                            href={`/bookings/${res.bookingId}`}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primaryHover whitespace-nowrap mt-1 sm:mt-0"
                          >
                            <span>Inspect Booking</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-border bg-surface-subtle flex flex-wrap gap-2.5 justify-between items-center">
          <div className="flex gap-2">
            <button 
              onClick={onChangeQuantity}
              className="px-3 py-1.5 bg-surface border border-border hover:bg-surface-raised text-text text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-text-muted" />
              <span>Change Quantity</span>
            </button>
            <button 
              onClick={onChangeDate}
              className="px-3 py-1.5 bg-surface border border-border hover:bg-surface-raised text-text text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-text-muted" />
              <span>Change Dates</span>
            </button>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={onClose}
              className="px-3 py-1.5 bg-surface border border-border hover:bg-surface-raised text-text text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-text-muted" />
              <span>Dismiss</span>
            </button>
            <button 
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-1.5 bg-primary hover:bg-primaryHover disabled:opacity-50 text-primary-foreground text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Re-check Availability</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
