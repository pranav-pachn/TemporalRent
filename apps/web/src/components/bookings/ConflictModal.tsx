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
              <p className="text-red-300/80 text-sm mt-1">{error.conflicts.length} inventory conflicts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="px-6 py-4 bg-neutral-950 border-b border-white/5 text-sm text-neutral-400">
          Availability changed since your last check. 
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
              
              <div className="p-4 grid grid-cols-3 gap-4 border-b border-white/5 text-sm">
                <div>
                  <div className="text-neutral-500 mb-1">Required</div>
                  <div className="text-white text-lg font-medium">{conflict.requiredQty}</div>
                </div>
                <div>
                  <div className="text-neutral-500 mb-1">Available</div>
                  <div className="text-white text-lg font-medium">{conflict.availableQty}</div>
                </div>
                <div>
                  <div className="text-red-400/80 mb-1">Shortage</div>
                  <div className="text-red-400 text-lg font-medium">{conflict.shortageQty}</div>
                </div>
              </div>

              {conflict.conflictingReservations.length > 0 && (
                <div className="p-4">
                  <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Conflicting Bookings</div>
                  <div className="space-y-3">
                    {conflict.conflictingReservations.map((res, ridx) => (
                      <div key={ridx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-neutral-900 rounded-lg border border-white/5 gap-3">
                        <div>
                          <div className="font-medium text-white flex items-center">
                            {res.bookingName || `Booking #${res.bookingId.substring(0, 8)}`}
                            <span className="ml-3 text-neutral-500 text-sm font-normal">{res.quantity} units</span>
                          </div>
                          <div className="text-neutral-400 text-sm mt-1 flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1.5" />
                            {new Date(res.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &middot; {new Date(res.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} &ndash; {new Date(res.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </div>
                        </div>
                        <Link 
                          href={`/bookings/${res.bookingId}`}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-md transition-colors text-center whitespace-nowrap"
                        >
                          View Booking
                        </Link>
                      </div>
                    ))}
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
