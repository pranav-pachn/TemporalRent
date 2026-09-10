import React from 'react';
import { AlertTriangle, X, Calendar, Edit3, ArrowLeft, RefreshCw } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/5 bg-red-500/10">
          <div className="flex items-center space-x-3 text-red-400">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-semibold uppercase tracking-wider">Booking Cannot Be Confirmed</h2>
              <p className="text-red-300/80 text-sm mt-1">
                {error.conflicts.length} item{error.conflicts.length !== 1 ? 's' : ''} with inventory shortage
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="px-6 py-3 bg-neutral-950 border-b border-white/5 text-sm text-neutral-400">
          There is not enough inventory available to confirm this booking.
          Review the conflicts below and adjust the quantity, change the event dates, or wait for other bookings to free up.
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error.conflicts.map((conflict, idx) => (
            <div key={idx} className="bg-neutral-950 border border-white/5 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-neutral-900/50">
                <h3 className="font-medium text-white uppercase tracking-wider text-sm">{conflict.inventoryItemName}</h3>
                <span className="px-2.5 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded uppercase tracking-wider">
                  SHORT {conflict.shortageQty}
                </span>
              </div>
              
              <div className="p-5 border-b border-white/5 bg-neutral-900/30 font-mono text-sm space-y-2">
                <div className="flex justify-between max-w-[200px]">
                  <span className="text-neutral-400">Required</span>
                  <span className="text-white">{conflict.requiredQty}</span>
                </div>
                <div className="flex justify-between max-w-[200px]">
                  <span className="text-neutral-400">Available</span>
                  <span className="text-white">{conflict.availableQty}</span>
                </div>
                <div className="flex justify-between max-w-[200px] font-semibold text-red-400 pt-1 border-t border-white/10 mt-1">
                  <span>Shortage</span>
                  <span>{conflict.shortageQty}</span>
                </div>
              </div>

              {conflict.conflictingReservations.length > 0 && (
                <div className="p-5">
                  <div className="text-sm text-neutral-400 mb-4">Conflicting booking:</div>
                  <div className="space-y-4">
                    {conflict.conflictingReservations.map((res, ridx) => {
                      const startDate = new Date(res.start);
                      const endDate = new Date(res.end);
                      
                      const dateStr = startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                      const startTimeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                      const endTimeStr = endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

                      return (
                        <div key={ridx} className="flex flex-col sm:flex-row sm:items-start justify-between p-4 bg-neutral-950 rounded-lg border border-white/5 gap-4">
                          <div className="space-y-1">
                            <div className="font-semibold text-white text-base">
                              {res.eventName || res.bookingName || `Booking #${res.bookingId.substring(0, 8)}`}
                            </div>
                            <div className="text-neutral-400 text-sm">{dateStr}</div>
                            <div className="text-neutral-400 text-sm">
                              {startTimeStr} &ndash; {endTimeStr}
                            </div>
                            <div className="text-neutral-300 text-sm mt-2 pt-2 border-t border-white/5">
                              Quantity: <span className="text-white font-medium">{res.quantity}</span>
                            </div>
                          </div>
                          <Link 
                            href={`/bookings/${res.bookingId}`}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors text-center whitespace-nowrap mt-2 sm:mt-0"
                          >
                            View Booking
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
        <div className="p-4 border-t border-white/5 bg-neutral-950 flex flex-wrap gap-3 justify-between items-center">
          <div className="flex gap-2">
            <button 
              onClick={onChangeQuantity}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg flex items-center transition-colors"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Change Quantity
            </button>
            <button 
              onClick={onChangeDate}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg flex items-center transition-colors"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Change Date
            </button>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium rounded-lg flex items-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Booking
            </button>
            <button 
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg flex items-center transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Availability
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
