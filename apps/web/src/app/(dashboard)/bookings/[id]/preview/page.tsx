'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { AvailabilityResult, BookingDTO } from '@/types/bookings';
import { InventoryItem, InventoryReservation } from '@/types/inventory';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { ConflictModal } from '@/components/bookings/ConflictModal';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function BookingPreviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState<any | null>(null);
  
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [inventoryMap, setInventoryMap] = useState<Record<string, InventoryItem>>({});
  
  const [booking, setBooking] = useState<BookingDTO | null>(null);
  const [status, setStatus] = useState<'DRAFT' | 'QUOTED' | 'CONFIRMED'>('DRAFT');
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [availRes, invRes, bookingRes] = await Promise.all([
        apiClient.checkBookingAvailability(id),
        apiClient.fetchInventoryItems(),
        apiClient.fetchBookingById(id)
      ]);
      
      setAvailability(availRes);
      if (bookingRes.data) {
        setBooking(bookingRes.data);
        setStatus(bookingRes.data.status as any);
      }
      
      const map: Record<string, InventoryItem> = {};
      invRes.data.forEach((i: InventoryItem) => map[i.id] = i);
      setInventoryMap(map);
    } catch (e: any) {
      console.error('Failed to load booking preview:', e);
      if (e.status === 401 || e.code === 'UNAUTHENTICATED') {
        router.push('/login');
        return;
      }
      setError(e.message || 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleQuote = async () => {
    setSubmitting(true);
    try {
      await apiClient.quoteBooking(id);
      setStatus('QUOTED');
    } catch (e: any) {
      setError(e.message || 'Failed to generate quote');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setConflictError(null);
    setError(null);
    try {
      await apiClient.confirmBooking(id, idempotencyKey);
      setStatus('CONFIRMED');
      setTimeout(() => {
        router.push('/bookings');
      }, 1500);
    } catch (e: any) {
      if (e.code === 'INVENTORY_CONFLICT') {
        setConflictError(e);
      } else {
        setError(e.message || e.error || 'Failed to confirm booking');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="h-10 bg-surface border border-border rounded-lg w-48 animate-pulse" />
        <LoadingState variant="page" />
      </div>
    );
  }

  if (error || !availability) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <ErrorState message={error || 'Failed to analyze availability'} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-20">
      <PageHeader
        title="Safety Confirmation & Preview"
        description={`Verifying temporal capacity for ${booking?.eventName || 'Booking'} #${id.substring(0, 8)}`}
        tag={<StatusBadge status={status} />}
        actions={
          <Link
            href={`/bookings/${id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border hover:bg-surface-raised text-text-muted hover:text-text text-xs font-medium rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Detail</span>
          </Link>
        }
      />

      {conflictError && (
        <ConflictModal
          error={conflictError}
          isRefreshing={submitting}
          onClose={() => setConflictError(null)}
          onChangeQuantity={() => {
            router.push(`/bookings/new`); 
          }}
          onChangeDate={() => {
            router.push(`/bookings/new`);
          }}
          onRefresh={async () => {
            setSubmitting(true);
            try {
              const [availRes] = await Promise.all([
                apiClient.checkBookingAvailability(id)
              ]);
              setAvailability(availRes);
              setConflictError(null);
            } catch (e: any) {
              console.error(e);
            } finally {
              setSubmitting(false);
            }
          }}
        />
      )}

      {status === 'CONFIRMED' ? (
        <div className="bg-status-safe/10 border border-status-safe/30 rounded-xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-status-safe/20 text-status-safe flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-text">Reservation Safely Secured</h2>
          <p className="text-xs text-text-muted">Temporal inventory locks have been applied. Redirecting to bookings list...</p>
        </div>
      ) : (
        <>
          {/* Primary Safety Verdict Banner */}
          {availability.available ? (
            <div className="bg-status-safe/10 border border-status-safe/30 rounded-lg p-4 flex items-start gap-3">
              <div className="p-2 bg-status-safe/20 text-status-safe rounded-md shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-status-safe">Safe to Promise — Zero Bottlenecks Detected</h3>
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                  All demanded inventory units are verified available across the complete reservation window, including setup and cleaning turnaround buffers.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-status-danger/10 border border-status-danger/30 rounded-lg p-4 flex items-start gap-3">
              <div className="p-2 bg-status-danger/20 text-status-danger rounded-md shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-status-danger">Inventory Shortages Detected</h3>
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                  One or more items do not have sufficient uncommitted stock for this time slot. Review the breakdown below before confirming.
                </p>
              </div>
            </div>
          )}

          {/* Item Availability Breakdown */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-surface-subtle flex items-center justify-between">
              <h2 className="text-xs font-semibold text-text uppercase tracking-wider">
                Line Items Capacity Analysis
              </h2>
              <span className="text-[10px] font-mono text-text-muted tabular-nums">
                {availability.items.length} ITEMS
              </span>
            </div>

            <div className="divide-y divide-border/60">
              {availability.items.map((item) => {
                const isShortage = item.shortage > 0;
                return (
                  <div key={item.inventoryItemId} className="p-4 hover:bg-surface-raised transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-xs text-text">
                        {inventoryMap[item.inventoryItemId]?.name || 'Inventory Item'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isShortage ? (
                          <span className="text-[10px] font-mono font-bold text-status-danger bg-status-danger/15 px-2 py-0.5 rounded border border-status-danger/30">
                            SHORTAGE: -{item.shortage}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-semibold text-status-safe bg-status-safe/15 px-2 py-0.5 rounded border border-status-safe/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> AVAILABLE
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-border/40 text-xs">
                      <div>
                        <span className="text-[10px] text-text-dim uppercase font-medium">Demanded</span>
                        <span className="font-mono text-text font-semibold tabular-nums block mt-0.5">
                          {item.required} units
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-dim uppercase font-medium">Available</span>
                        <span className="font-mono text-text font-semibold tabular-nums block mt-0.5">
                          {item.available} units
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-dim uppercase font-medium">Buffer Margin</span>
                        <span className={`font-mono font-semibold tabular-nums block mt-0.5 ${isShortage ? 'text-status-danger' : 'text-status-safe'}`}>
                          {item.available - item.required >= 0 ? `+${item.available - item.required}` : `-${item.shortage}`} units
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {status === 'DRAFT' && (
              <button
                onClick={handleQuote}
                disabled={submitting || !availability.available}
                className="px-4 py-2 bg-surface border border-border hover:bg-surface-raised text-text text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? 'Generating Quote...' : 'Generate Quote'}
              </button>
            )}
            
            <button
              onClick={handleConfirm}
              disabled={submitting || !availability.available}
              className="px-5 py-2 bg-status-safe hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{submitting ? 'Confirming Reservation...' : 'Safely Confirm Reservation'}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
