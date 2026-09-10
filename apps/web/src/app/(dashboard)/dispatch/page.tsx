'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { DispatchDTO, DispatchStatus } from '@/types/warehouse';
import { 
  Truck, 
  Package, 
  Clock, 
  CheckCircle2, 
  Play, 
  ClipboardList, 
  X, 
  Calendar, 
  User, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

import { useRouter } from 'next/navigation';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';

export default function DispatchPage() {
  const router = useRouter();
  const [dispatches, setDispatches] = useState<DispatchDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'READY' | 'PICKING' | 'DISPATCHED'>('ALL');
  
  // Pick List Modal State
  const [activeDispatch, setActiveDispatch] = useState<DispatchDTO | null>(null);
  const [dispatchedQuantities, setDispatchedQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadDispatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.fetchDispatches();
      setDispatches(res.data);
      return res.data;
    } catch (e: any) {
      console.error('Failed to load dispatches', e);
      if (e.status === 401 || e.code === 'UNAUTHENTICATED') {
        router.push('/login');
        return [];
      }
      setError(e.message || 'Failed to load dispatches');
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDispatches();
  }, []);

  const filteredDispatches = dispatches.filter((d) => {
    if (activeTab === 'ALL') return true;
    return d.status === activeTab;
  });

  const countByStatus = (status: DispatchStatus) => 
    dispatches.filter((d) => d.status === status).length;

  const handleStartPicking = async (dispatch: DispatchDTO) => {
    try {
      setActionError(null);
      await apiClient.startPicking(dispatch.bookingId);
      const updatedDispatches = await loadDispatches();
      
      // Update active dispatch if we are in the modal
      if (activeDispatch && activeDispatch.id === dispatch.id) {
        const updated = updatedDispatches.find((d: DispatchDTO) => d.id === dispatch.id);
        setActiveDispatch(updated || null);
      }
    } catch (e: any) {
      setActionError(e.message || 'Failed to start picking');
    }
  };

  const openPickListModal = (dispatch: DispatchDTO) => {
    setActiveDispatch(dispatch);
    setActionError(null);
    // Initialize quantities to expected or previous dispatchedQty
    const initial: Record<string, number> = {};
    dispatch.lines.forEach((l) => {
      initial[l.id] = dispatch.status === 'DISPATCHED' ? l.dispatchedQty : l.expectedQty;
    });
    setDispatchedQuantities(initial);
  };

  const handleConfirmDispatch = async () => {
    if (!activeDispatch) return;

    try {
      setIsSubmitting(true);
      setActionError(null);

      const payload = activeDispatch.lines.map((l) => ({
        dispatchLineId: l.id,
        dispatchedQty: dispatchedQuantities[l.id] ?? l.expectedQty,
      }));

      const idempotencyKey = crypto.randomUUID();
      await apiClient.confirmDispatch(activeDispatch.bookingId, idempotencyKey, payload);

      setActiveDispatch(null);
      await loadDispatches();
    } catch (e: any) {
      setActionError(e.message || 'Failed to confirm dispatch');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-500" />
            Dispatch Board
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Manage physical fulfillment and warehouse dispatch operations.
          </p>
        </div>
      </div>

      {actionError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/5 space-x-2">
        {(['ALL', 'READY', 'PICKING', 'DISPATCHED'] as const).map((tab) => {
          const count = tab === 'ALL' ? dispatches.length : countByStatus(tab as DispatchStatus);
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                isActive
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <span>{tab === 'ALL' ? 'All Dispatches' : tab}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isActive ? 'bg-blue-500/20 text-blue-300' : 'bg-neutral-800 text-neutral-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12">
          <LoadingState />
        </div>
      ) : error ? (
        <div className="py-8">
          <ErrorState message={error} onRetry={loadDispatches} />
        </div>
      ) : filteredDispatches.length === 0 ? (
        <div className="bg-neutral-900 border border-white/5 rounded-2xl py-20 text-center">
          <Package className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-white mb-1">No dispatches found</h3>
          <p className="text-neutral-400 text-sm">
            {activeTab === 'ALL'
              ? 'No dispatches have been prepared yet. Confirm a booking to get started.'
              : `No dispatches in ${activeTab} status.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDispatches.map((dispatch) => {
            const isReady = dispatch.status === 'READY';
            const isPicking = dispatch.status === 'PICKING';
            const isDispatched = dispatch.status === 'DISPATCHED';

            const statusColor = isReady
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : isPicking
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

            const totalItemsExpected = dispatch.lines.reduce((acc, l) => acc + l.expectedQty, 0);

            return (
              <div
                key={dispatch.id}
                className="bg-neutral-900 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-white tracking-tight">
                        {dispatch.booking.eventName}
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                        <span>Booking #{dispatch.bookingId.substring(0, 8)}</span>
                        {dispatch.booking.customer && (
                          <>
                            <span>&middot;</span>
                            <span className="text-neutral-400">{dispatch.booking.customer.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border uppercase tracking-wider ${statusColor}`}>
                      ● {dispatch.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/5 text-sm">
                    <div>
                      <div className="text-neutral-500 text-xs flex items-center gap-1 mb-1">
                        <Calendar className="w-3.5 h-3.5" /> Event Date
                      </div>
                      <div className="text-neutral-200 font-medium text-xs">
                        {new Date(dispatch.booking.eventStart).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-neutral-500 text-xs flex items-center gap-1 mb-1">
                        <Package className="w-3.5 h-3.5" /> Inventory
                      </div>
                      <div className="text-neutral-200 font-medium text-xs">
                        {dispatch.lines.length} lines &middot; {totalItemsExpected} units
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  <button
                    onClick={() => openPickListModal(dispatch)}
                    className="flex-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    View Pick List
                  </button>

                  {isReady && (
                    <button
                      onClick={() => handleStartPicking(dispatch)}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-[0_0_10px_rgba(37,99,235,0.2)]"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Start Dispatch
                    </button>
                  )}

                  {isPicking && (
                    <button
                      onClick={() => openPickListModal(dispatch)}
                      className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirm Dispatch
                    </button>
                  )}

                  {isDispatched && (
                    <Link
                      href={`/bookings/${dispatch.bookingId}`}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium rounded-lg flex items-center justify-center gap-1 transition-colors"
                    >
                      Booking
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pick List / Dispatch Modal */}
      {activeDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-white/5 bg-neutral-950">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {activeDispatch.booking.eventName}
                  </h2>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-neutral-800 text-neutral-400 border border-white/5">
                    {activeDispatch.status}
                  </span>
                </div>
                <p className="text-neutral-400 text-xs mt-1">
                  Pick List & Physical Dispatch Fulfillment
                </p>
              </div>
              <button
                onClick={() => setActiveDispatch(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {activeDispatch.status === 'READY' && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
                  This dispatch is in <strong>READY</strong> status. Click <strong>Start Dispatch</strong> to transition to <strong>PICKING</strong> before confirming physical item departure.
                </div>
              )}

              {activeDispatch.status === 'PICKING' && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-xs">
                  Review and verify physical quantities leaving the warehouse. If partial items are dispatched, enter actual amounts. Remaining units will be logged.
                </div>
              )}

              {activeDispatch.status === 'DISPATCHED' && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs">
                  This booking has been physically dispatched from the warehouse.
                </div>
              )}

              <div className="bg-neutral-950 border border-white/5 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-900 border-b border-white/5 text-neutral-400 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3 text-center">Expected</th>
                      <th className="px-4 py-3 text-center">Dispatched</th>
                      <th className="px-4 py-3 text-center">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {activeDispatch.lines.map((line) => {
                      const dispatched = dispatchedQuantities[line.id] ?? line.dispatchedQty;
                      const remaining = Math.max(0, line.expectedQty - dispatched);
                      const isPartial = remaining > 0 && activeDispatch.status !== 'READY';

                      return (
                        <tr key={line.id} className="hover:bg-white/5">
                          <td className="px-4 py-3">
                            <div className="font-medium text-white">{line.inventoryItem.name}</div>
                            {line.inventoryItem.sku && (
                              <div className="text-neutral-500 text-xs mt-0.5">SKU: {line.inventoryItem.sku}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center font-medium text-neutral-300">
                            {line.expectedQty}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {activeDispatch.status === 'PICKING' ? (
                              <input
                                type="number"
                                min={0}
                                max={line.expectedQty}
                                value={dispatched}
                                onChange={(e) => {
                                  const val = Math.max(0, Math.min(line.expectedQty, parseInt(e.target.value) || 0));
                                  setDispatchedQuantities((prev) => ({
                                    ...prev,
                                    [line.id]: val,
                                  }));
                                }}
                                className="w-16 px-2 py-1 bg-neutral-900 border border-white/10 rounded text-center text-white font-medium focus:outline-none focus:border-blue-500"
                              />
                            ) : (
                              <span className="font-medium text-white">{line.dispatchedQty}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded font-semibold ${
                              isPartial ? 'bg-amber-500/20 text-amber-400' : 'text-neutral-500'
                            }`}>
                              {remaining}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/5 bg-neutral-950 flex justify-between items-center">
              <button
                onClick={() => setActiveDispatch(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Close
              </button>

              <div className="flex gap-2">
                {activeDispatch.status === 'READY' && (
                  <button
                    onClick={async () => {
                      await handleStartPicking(activeDispatch);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Start Picking
                  </button>
                )}

                {activeDispatch.status === 'PICKING' && (
                  <button
                    onClick={handleConfirmDispatch}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isSubmitting ? 'Confirming...' : 'Confirm Dispatch'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
