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
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function ReturnsPage() {
  const router = useRouter();
  const [data, setData] = useState<ReturnsListResponse>({ awaiting: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      setError(null);
      const res = await apiClient.fetchReturnsList();
      setData(res);
    } catch (e: any) {
      console.error('Failed to load returns list', e);
      if (e.status === 401 || e.code === 'UNAUTHENTICATED') {
        router.push('/login');
        return;
      }
      setError(e.message || 'Failed to load returns list');
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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title="Returns & Check-In Inspection"
        description="Reconcile physical inventory returning to warehouse, inspect conditions, and quarantine damages"
        tag={
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-surface-raised border border-border text-text-muted tabular-nums">
            {data.awaiting.length} PENDING INSPECTION
          </span>
        }
      />

      {actionError && (
        <div className="p-3 bg-status-danger/10 border border-status-danger/30 rounded-lg text-status-danger text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-status-danger hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border space-x-2">
        <button
          onClick={() => setActiveTab('AWAITING')}
          className={`pb-2.5 px-3 text-xs font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'AWAITING'
              ? 'border-status-safe text-status-safe'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <span>Awaiting Inspection</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded tabular-nums ${
            activeTab === 'AWAITING' ? 'bg-status-safe/20 text-status-safe' : 'bg-surface-raised text-text-dim'
          }`}>
            {data.awaiting.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('COMPLETED')}
          className={`pb-2.5 px-3 text-xs font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'COMPLETED'
              ? 'border-status-safe text-status-safe'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <span>Completed Inspections</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded tabular-nums ${
            activeTab === 'COMPLETED' ? 'bg-status-safe/20 text-status-safe' : 'bg-surface-raised text-text-dim'
          }`}>
            {data.completed.length}
          </span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12">
          <LoadingState />
        </div>
      ) : error ? (
        <div className="py-8">
          <ErrorState message={error} onRetry={loadData} />
        </div>
      ) : activeTab === 'AWAITING' ? (
        data.awaiting.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl py-16 text-center">
            <ShieldCheck className="w-10 h-10 text-status-safe/60 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-text mb-1">No bookings awaiting return</h3>
            <p className="text-text-muted text-xs">
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
                  className="bg-surface border border-border rounded-xl p-5 hover:border-border-muted transition-colors flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold text-text tracking-tight">
                          {item.eventName}
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-text-muted mt-1">
                          <span className="font-mono">#{item.id.substring(0, 8)}</span>
                          {item.customer && (
                            <>
                              <span>&middot;</span>
                              <span className="text-text-dim">{item.customer.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <StatusBadge status="DISPATCHED" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border text-xs">
                      <div>
                        <div className="text-text-muted flex items-center gap-1 mb-1">
                          <Calendar className="w-3.5 h-3.5" /> Return Expected
                        </div>
                        <div className="text-text font-medium font-mono tabular-nums">
                          {new Date(item.eventEnd).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-text-muted flex items-center gap-1 mb-1">
                          <Package className="w-3.5 h-3.5" /> Dispatched Units
                        </div>
                        <div className="text-text font-medium font-mono tabular-nums">
                          {item.dispatch.lines.length} lines &middot; {totalDispatched} units out
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex gap-2">
                    <button
                      onClick={() => openInspection(item)}
                      className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      Start Return Inspection
                    </button>
                    <Link
                      href={`/bookings/${item.id}`}
                      className="px-3 py-2 bg-surface-raised hover:bg-surface-active text-text-muted hover:text-text border border-border text-xs font-medium rounded-lg flex items-center justify-center transition-colors"
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
          <div className="bg-surface border border-border rounded-xl py-16 text-center">
            <Undo2 className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-text mb-1">No completed returns yet</h3>
            <p className="text-text-muted text-xs">
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
                  className="bg-surface border border-border rounded-xl p-5 hover:border-border-muted transition-colors space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-text">
                          {ret.booking.eventName}
                        </h2>
                        <StatusBadge status="COMPLETED" />
                      </div>
                      <div className="text-xs text-text-muted mt-1 flex items-center gap-2">
                        <span className="font-mono">#{ret.bookingId.substring(0, 8)}</span>
                        <span>&middot;</span>
                        <span className="font-mono tabular-nums">
                          Inspected {ret.inspectedAt ? new Date(ret.inspectedAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
                      <span className="px-2.5 py-1 rounded bg-surface-raised border border-border text-text-muted">
                        Good: <strong className="text-status-safe">{totalGood}</strong>
                      </span>
                      {totalDamaged > 0 && (
                        <span className="px-2.5 py-1 rounded bg-status-danger/10 border border-status-danger/20 text-status-danger font-medium">
                          Damaged: <strong>{totalDamaged}</strong>
                        </span>
                      )}
                      {totalMissing > 0 && (
                        <span className="px-2.5 py-1 rounded bg-status-warning/10 border border-status-warning/20 text-status-warning font-medium">
                          Missing: <strong>{totalMissing}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Lines Breakdown */}
                  <div className="bg-surface-raised border border-border rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-surface-subtle border-b border-border text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-2.5">Item</th>
                          <th className="px-4 py-2.5 text-center">Expected</th>
                          <th className="px-4 py-2.5 text-center">Good</th>
                          <th className="px-4 py-2.5 text-center">Damaged</th>
                          <th className="px-4 py-2.5 text-center">Missing</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {ret.lines.map((l) => (
                          <tr key={l.id} className="hover:bg-surface-subtle/50 transition-colors">
                            <td className="px-4 py-2.5">
                              <div className="font-medium text-text">{l.inventoryItem.name}</div>
                              {l.damageReports && l.damageReports.length > 0 && (
                                <div className="text-status-danger text-[11px] mt-0.5">
                                  Damage note: {l.damageReports[0].description}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-center font-mono tabular-nums text-text-muted">{l.expectedQty}</td>
                            <td className="px-4 py-2.5 text-center font-mono tabular-nums text-status-safe font-medium">{l.returnedGoodQty}</td>
                            <td className="px-4 py-2.5 text-center font-mono tabular-nums">
                              <span className={l.damagedQty > 0 ? 'text-status-danger font-bold' : 'text-text-dim'}>
                                {l.damagedQty}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-center font-mono tabular-nums">
                              <span className={l.missingQty > 0 ? 'text-status-warning font-bold' : 'text-text-dim'}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-none">
          <div className="bg-surface border border-border-muted rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-5 border-b border-border bg-surface-raised">
              <div>
                <h2 className="text-base font-bold text-text tracking-tight">
                  Return Inspection: {selectedBooking.eventName}
                </h2>
                <p className="text-text-muted text-xs mt-0.5">
                  Reconcile quantities based on actual physical inventory received at warehouse.
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  setInspectionData(null);
                }}
                className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-surface-subtle transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {inspectionLoading ? (
                <div className="text-text-muted py-12 text-center text-xs">Loading inspection lines...</div>
              ) : !inspectionData ? (
                <div className="text-status-danger text-center py-8 text-xs">Failed to load inspection data.</div>
              ) : (
                <>
                  <div className="p-3 bg-surface-raised border border-border rounded-lg text-xs text-text-muted space-y-1">
                    <div>
                      <strong className="text-text">Reconciliation Rule:</strong> For every line, <code className="text-text font-mono">Good + Damaged + Missing</code> must exactly equal <code className="text-text font-mono">Expected Return</code>.
                    </div>
                    <div>
                      If damaged units are present, an operational description is strictly mandatory.
                    </div>
                  </div>

                  <div className="space-y-3">
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
                          className={`bg-surface-raised border rounded-lg p-4 space-y-3 transition-colors ${
                            isBalanced ? 'border-border' : 'border-status-danger/40'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="font-semibold text-text text-sm">
                                {line.inventoryItemName}
                              </div>
                              {line.sku && (
                                <div className="text-text-dim text-xs font-mono">SKU: {line.sku}</div>
                              )}
                            </div>
                            <div className="text-xs text-text-muted bg-surface-subtle px-2.5 py-1 rounded border border-border self-start sm:self-auto font-mono tabular-nums">
                              Expected: <strong className="text-text">{line.expectedReturnQty}</strong> units
                            </div>
                          </div>

                          {/* Inputs Grid */}
                          <div className="grid grid-cols-3 gap-3 pt-1">
                            <div>
                              <label className="text-[11px] text-text-muted uppercase font-semibold block mb-1">
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
                                className="w-full px-3 py-1.5 bg-surface border border-border rounded-md text-text text-sm font-mono tabular-nums focus:outline-none focus:border-border-active focus:ring-1 focus:ring-border-active"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] text-status-danger uppercase font-semibold block mb-1">
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
                                className="w-full px-3 py-1.5 bg-surface border border-status-danger/30 rounded-md text-status-danger text-sm font-mono tabular-nums focus:outline-none focus:border-status-danger"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] text-status-warning uppercase font-semibold block mb-1">
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
                                className="w-full px-3 py-1.5 bg-surface border border-status-warning/30 rounded-md text-status-warning text-sm font-mono tabular-nums focus:outline-none focus:border-status-warning"
                              />
                            </div>
                          </div>

                          {/* Dynamic Invariant Display */}
                          <div className="pt-2 flex items-center justify-between text-xs border-t border-border font-mono tabular-nums">
                            <div className="flex items-center gap-1.5">
                              {isBalanced ? (
                                <span className="text-status-safe flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{vals.good} + {vals.damaged} + {vals.missing} = {line.expectedReturnQty} (Balanced)</span>
                                </span>
                              ) : (
                                <span className="text-status-danger font-semibold flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span>{vals.good} + {vals.damaged} + {vals.missing} ≠ {line.expectedReturnQty} (Total: {sum})</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Damage Reason Input (Mandatory when damaged > 0) */}
                          {vals.damaged > 0 && (
                            <div className="pt-2 space-y-1">
                              <label className="text-xs text-status-danger font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Damage Reason / Description <span className="text-status-danger">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="Describe physical damage (e.g. Torn fabric, bent arm)..."
                                value={vals.reason}
                                onChange={(e) => {
                                  const text = e.target.value;
                                  setLineValues((prev) => ({
                                    ...prev,
                                    [line.dispatchLineId]: { ...prev[line.dispatchLineId], reason: text },
                                  }));
                                }}
                                className="w-full px-3 py-1.5 bg-surface border border-status-danger/40 rounded-md text-text text-xs placeholder:text-text-dim focus:outline-none focus:border-status-danger"
                              />
                              {hasMissingReason && (
                                <div className="text-[11px] text-status-danger">
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
            <div className="p-4 border-t border-border bg-surface-raised flex justify-between items-center">
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  setInspectionData(null);
                }}
                className="px-4 py-2 bg-surface hover:bg-surface-subtle text-text-muted hover:text-text text-xs font-medium rounded-lg border border-border transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleCompleteReturn}
                disabled={!isInspectionValid() || isSubmitting}
                className="px-5 py-2 bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
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
