'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { 
  ReturnsListResponse, 
  AwaitingReturnDTO, 
  ReturnDTO, 
  ReturnInspectionDTO,
  ReturnInspectionLineInput 
} from '@/types/warehouse';
import { 
  Undo2, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ClipboardCheck, 
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  User,
  Package
} from 'lucide-react';
import Link from 'next/link';

export default function ReturnsPage() {
  const [data, setData] = useState<ReturnsListResponse>({ awaiting: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'AWAITING' | 'COMPLETED'>('AWAITING');

  // Inspection Modal State
  const [selectedBooking, setSelectedBooking] = useState<AwaitingReturnDTO | null>(null);
  const [inspectionData, setInspectionData] = useState<ReturnInspectionDTO | null>(null);
  const [inspectionLoading, setInspectionLoading] = useState(false);
  
  // Line values: lineId -> { good, damaged, missing, reason, notes }
  const [lineValues, setLineValues] = useState<Record<string, {
    good: number;
    damaged: number;
    missing: number;
    reason: string;
    notes: string;
  }>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.fetchReturnsList();
      setData(res);
    } catch (e: any) {
      console.error('Failed to load returns list', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openInspection = async (booking: AwaitingReturnDTO) => {
    setSelectedBooking(booking);
    setActionError(null);
    try {
      setInspectionLoading(true);
      const res = await apiClient.fetchReturnInspection(booking.id);
      setInspectionData(res.data);

      // Initialize inputs: default to 100% good return
      const initial: Record<string, { good: number; damaged: number; missing: number; reason: string; notes: string }> = {};
      res.data.dispatch.lines.forEach((l) => {
        initial[l.dispatchLineId] = {
          good: l.expectedReturnQty,
          damaged: 0,
          missing: 0,
          reason: '',
          notes: '',
        };
      });
      setLineValues(initial);
    } catch (e: any) {
      setActionError(e.message || 'Failed to load inspection data');
    } finally {
      setInspectionLoading(false);
    }
  };

  // Validation Check:
  // 1. Good + Damaged + Missing == Expected for every line
  // 2. If Damaged > 0, reason must be non-empty
  const isInspectionValid = () => {
    if (!inspectionData) return false;

    return inspectionData.dispatch.lines.every((line) => {
      const vals = lineValues[line.dispatchLineId];
      if (!vals) return false;
      const sum = (vals.good || 0) + (vals.damaged || 0) + (vals.missing || 0);
      if (sum !== line.expectedReturnQty) return false;
      if (vals.damaged > 0 && !vals.reason.trim()) return false;
      return true;
    });
  };

  const handleCompleteReturn = async () => {
    if (!selectedBooking || !inspectionData || !isInspectionValid()) return;

    try {
      setIsSubmitting(true);
      setActionError(null);

      const payload: ReturnInspectionLineInput[] = inspectionData.dispatch.lines.map((line) => {
        const vals = lineValues[line.dispatchLineId];
        return {
          dispatchLineId: line.dispatchLineId,
          returnedGoodQty: vals.good,
          damagedQty: vals.damaged,
          missingQty: vals.missing,
          damageDetails: vals.damaged > 0 ? vals.reason.trim() : undefined,
          notes: vals.notes.trim() || undefined,
        };
      });

      const idempotencyKey = crypto.randomUUID();
      await apiClient.completeReturn(selectedBooking.id, idempotencyKey, payload);

      setSelectedBooking(null);
      setInspectionData(null);
      await loadData();
      setActiveTab('COMPLETED');
    } catch (e: any) {
      setActionError(e.message || 'Failed to complete return inspection');
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
            <Undo2 className="w-6 h-6 text-emerald-500" />
            Returns & Inspection
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Reconcile physical inventory returning to the warehouse, verify conditions, and record damages.
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
        <button
          onClick={() => setActiveTab('AWAITING')}
          className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'AWAITING'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <span>Awaiting Return</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activeTab === 'AWAITING' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-neutral-800 text-neutral-500'
          }`}>
            {data.awaiting.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('COMPLETED')}
          className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'COMPLETED'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <span>Completed Returns</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activeTab === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-neutral-800 text-neutral-500'
          }`}>
            {data.completed.length}
          </span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-neutral-400 py-16 text-center">Loading returns data...</div>
      ) : activeTab === 'AWAITING' ? (
        data.awaiting.length === 0 ? (
          <div className="bg-neutral-900 border border-white/5 rounded-2xl py-20 text-center">
            <ShieldCheck className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">No bookings awaiting return</h3>
            <p className="text-neutral-400 text-sm">
              All dispatched bookings have been reconciled and returned.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.awaiting.map((item) => {
              const totalDispatched = item.dispatch.lines.reduce((acc, l) => acc + l.dispatchedQty, 0);

              return (
                <div
                  key={item.id}
                  className="bg-neutral-900 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-white tracking-tight">
                          {item.eventName}
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                          <span>Booking #{item.id.substring(0, 8)}</span>
                          {item.customer && (
                            <>
                              <span>&middot;</span>
                              <span className="text-neutral-400">{item.customer.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-md border uppercase tracking-wider bg-blue-500/10 text-blue-400 border-blue-500/20">
                        DISPATCHED
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/5 text-sm">
                      <div>
                        <div className="text-neutral-500 text-xs flex items-center gap-1 mb-1">
                          <Calendar className="w-3.5 h-3.5" /> Return Expected
                        </div>
                        <div className="text-neutral-200 font-medium text-xs">
                          {new Date(item.eventEnd).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-neutral-500 text-xs flex items-center gap-1 mb-1">
                          <Package className="w-3.5 h-3.5" /> Dispatched Units
                        </div>
                        <div className="text-neutral-200 font-medium text-xs">
                          {item.dispatch.lines.length} lines &middot; {totalDispatched} units out
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex gap-2">
                    <button
                      onClick={() => openInspection(item)}
                      className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      Start Return Inspection
                    </button>
                    <Link
                      href={`/bookings/${item.id}`}
                      className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium rounded-lg flex items-center justify-center transition-colors"
                    >
                      View Booking
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Completed Returns List */
        data.completed.length === 0 ? (
          <div className="bg-neutral-900 border border-white/5 rounded-2xl py-20 text-center">
            <Undo2 className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">No completed returns yet</h3>
            <p className="text-neutral-400 text-sm">
              Completed return inspections will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.completed.map((ret) => {
              const totalGood = ret.lines.reduce((acc, l) => acc + l.returnedGoodQty, 0);
              const totalDamaged = ret.lines.reduce((acc, l) => acc + l.damagedQty, 0);
              const totalMissing = ret.lines.reduce((acc, l) => acc + l.missingQty, 0);

              return (
                <div
                  key={ret.id}
                  className="bg-neutral-900 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-white">
                          {ret.booking.eventName}
                        </h2>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                          COMPLETED
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500 mt-1 flex items-center gap-2">
                        <span>Booking #{ret.bookingId.substring(0, 8)}</span>
                        <span>&middot;</span>
                        <span>
                          Inspected on {ret.inspectedAt ? new Date(ret.inspectedAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="px-2.5 py-1 rounded bg-neutral-800 text-neutral-300">
                        Good: <strong className="text-white">{totalGood}</strong>
                      </span>
                      {totalDamaged > 0 && (
                        <span className="px-2.5 py-1 rounded bg-red-500/20 text-red-400 font-medium">
                          Damaged: <strong>{totalDamaged}</strong>
                        </span>
                      )}
                      {totalMissing > 0 && (
                        <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 font-medium">
                          Missing: <strong>{totalMissing}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Lines Breakdown */}
                  <div className="bg-neutral-950 border border-white/5 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-neutral-900 border-b border-white/5 text-neutral-400 uppercase font-semibold">
                        <tr>
                          <th className="px-4 py-2.5">Item</th>
                          <th className="px-4 py-2.5 text-center">Expected</th>
                          <th className="px-4 py-2.5 text-center">Good</th>
                          <th className="px-4 py-2.5 text-center">Damaged</th>
                          <th className="px-4 py-2.5 text-center">Missing</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {ret.lines.map((l) => (
                          <tr key={l.id} className="hover:bg-white/5">
                            <td className="px-4 py-2.5">
                              <div className="font-medium text-white">{l.inventoryItem.name}</div>
                              {l.damageReports && l.damageReports.length > 0 && (
                                <div className="text-red-400/80 text-[11px] mt-0.5">
                                  Damage note: {l.damageReports[0].description}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-center text-neutral-400">{l.expectedQty}</td>
                            <td className="px-4 py-2.5 text-center text-emerald-400 font-medium">{l.returnedGoodQty}</td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={l.damagedQty > 0 ? 'text-red-400 font-bold' : 'text-neutral-500'}>
                                {l.damagedQty}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={l.missingQty > 0 ? 'text-amber-400 font-bold' : 'text-neutral-500'}>
                                {l.missingQty}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Return Inspection Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-white/5 bg-neutral-950">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Return Inspection: {selectedBooking.eventName}
                  </h2>
                </div>
                <p className="text-neutral-400 text-xs mt-1">
                  Reconcile quantities based on actual dispatched physical inventory.
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  setInspectionData(null);
                }}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {inspectionLoading ? (
                <div className="text-neutral-400 py-12 text-center">Loading inspection lines...</div>
              ) : !inspectionData ? (
                <div className="text-red-400 text-center py-8">Failed to load inspection data.</div>
              ) : (
                <>
                  <div className="p-3.5 bg-neutral-950 border border-white/5 rounded-xl text-xs text-neutral-400 space-y-1">
                    <div>
                      <strong>Invariant Rule:</strong> For every line, <code className="text-neutral-200">Good + Damaged + Missing</code> must exactly equal <code className="text-neutral-200">Expected Return</code>.
                    </div>
                    <div>
                      If items are damaged, an operational damage reason is strictly mandatory.
                    </div>
                  </div>

                  <div className="space-y-4">
                    {inspectionData.dispatch.lines.map((line) => {
                      const vals = lineValues[line.dispatchLineId] || {
                        good: line.expectedReturnQty,
                        damaged: 0,
                        missing: 0,
                        reason: '',
                        notes: '',
                      };
                      const sum = (vals.good || 0) + (vals.damaged || 0) + (vals.missing || 0);
                      const isBalanced = sum === line.expectedReturnQty;
                      const hasMissingReason = vals.damaged > 0 && !vals.reason.trim();

                      return (
                        <div
                          key={line.dispatchLineId}
                          className={`bg-neutral-950 border rounded-xl p-4 space-y-3 transition-colors ${
                            isBalanced ? 'border-white/5' : 'border-red-500/30'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="font-semibold text-white text-sm">
                                {line.inventoryItemName}
                              </div>
                              {line.sku && (
                                <div className="text-neutral-500 text-xs">SKU: {line.sku}</div>
                              )}
                            </div>
                            <div className="text-xs text-neutral-400 bg-neutral-900 px-3 py-1 rounded-md border border-white/5 self-start sm:self-auto">
                              Expected Return: <strong className="text-white">{line.expectedReturnQty}</strong> units
                            </div>
                          </div>

                          {/* Inputs Grid */}
                          <div className="grid grid-cols-3 gap-3 pt-2">
                            <div>
                              <label className="text-[11px] text-neutral-400 uppercase font-medium block mb-1">
                                Good Condition
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={line.expectedReturnQty}
                                value={vals.good}
                                onChange={(e) => {
                                  const v = Math.max(0, parseInt(e.target.value) || 0);
                                  setLineValues((prev) => ({
                                    ...prev,
                                    [line.dispatchLineId]: { ...prev[line.dispatchLineId], good: v },
                                  }));
                                }}
                                className="w-full px-3 py-1.5 bg-neutral-900 border border-white/10 rounded-lg text-white text-sm font-medium focus:outline-none focus:border-emerald-500"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] text-red-400/90 uppercase font-medium block mb-1">
                                Damaged
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={line.expectedReturnQty}
                                value={vals.damaged}
                                onChange={(e) => {
                                  const v = Math.max(0, parseInt(e.target.value) || 0);
                                  setLineValues((prev) => ({
                                    ...prev,
                                    [line.dispatchLineId]: { ...prev[line.dispatchLineId], damaged: v },
                                  }));
                                }}
                                className="w-full px-3 py-1.5 bg-neutral-900 border border-white/10 rounded-lg text-red-400 text-sm font-medium focus:outline-none focus:border-red-500"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] text-amber-400/90 uppercase font-medium block mb-1">
                                Missing
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={line.expectedReturnQty}
                                value={vals.missing}
                                onChange={(e) => {
                                  const v = Math.max(0, parseInt(e.target.value) || 0);
                                  setLineValues((prev) => ({
                                    ...prev,
                                    [line.dispatchLineId]: { ...prev[line.dispatchLineId], missing: v },
                                  }));
                                }}
                                className="w-full px-3 py-1.5 bg-neutral-900 border border-white/10 rounded-lg text-amber-400 text-sm font-medium focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>

                          {/* Dynamic Invariant Display */}
                          <div className="pt-2 flex items-center justify-between text-xs border-t border-white/5">
                            <div className="flex items-center gap-1.5">
                              {isBalanced ? (
                                <span className="text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{vals.good} + {vals.damaged} + {vals.missing} = {line.expectedReturnQty} ✓</span>
                                </span>
                              ) : (
                                <span className="text-red-400 font-semibold flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span>{vals.good} + {vals.damaged} + {vals.missing} ≠ {line.expectedReturnQty} (Total: {sum})</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Damage Reason Input (Mandatory when damaged > 0) */}
                          {vals.damaged > 0 && (
                            <div className="pt-2 space-y-1">
                              <label className="text-xs text-red-300 font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Damage Reason / Description <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="Describe physical damage (e.g. Torn upholstery, cracked frame)..."
                                value={vals.reason}
                                onChange={(e) => {
                                  const text = e.target.value;
                                  setLineValues((prev) => ({
                                    ...prev,
                                    [line.dispatchLineId]: { ...prev[line.dispatchLineId], reason: text },
                                  }));
                                }}
                                className="w-full px-3 py-2 bg-neutral-900 border border-red-500/30 rounded-lg text-white text-xs placeholder:text-neutral-600 focus:outline-none focus:border-red-500"
                              />
                              {hasMissingReason && (
                                <div className="text-[11px] text-red-400">
                                  A description of the damage is required before completing inspection.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/5 bg-neutral-950 flex justify-between items-center">
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  setInspectionData(null);
                }}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleCompleteReturn}
                disabled={!isInspectionValid() || isSubmitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmitting ? 'Processing Return...' : 'Complete Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
