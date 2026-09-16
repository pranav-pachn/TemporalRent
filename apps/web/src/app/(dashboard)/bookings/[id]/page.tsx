'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { BookingDetailDTO } from '@/types/bookings';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ArrowLeft, Package, Calendar, Clock, User, Hash, Trash2, ShieldCheck, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation modal state
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadBooking = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.fetchBookingById(params.id);
      setBooking(res.data);
    } catch (err: any) {
      console.error('Failed to load booking:', err);
      if (err.status === 401 || err.code === 'UNAUTHENTICATED') {
        router.push('/login');
        return;
      }
      setError(err.status === 404 ? 'Booking not found' : (err.message || 'Failed to load booking'));
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  const handleConfirmCancel = async () => {
    if (!booking) return;
    try {
      setIsCancelling(true);
      await apiClient.cancelBooking(booking.id, crypto.randomUUID(), 'Cancelled via booking detail');
      setIsCancelOpen(false);
      loadBooking();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        <div className="h-10 bg-surface border border-border rounded-lg w-48 animate-pulse" />
        <LoadingState variant="page" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <ErrorState 
          message={error || 'Booking not found'} 
          onRetry={loadBooking} 
        />
      </div>
    );
  }

  const startDate = new Date(booking.eventStart);
  const endDate = new Date(booking.eventEnd);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-20">
      <PageHeader
        title={booking.eventName}
        description={`Reservation #${booking.id.substring(0, 8)} · Created for ${booking.customer?.name || 'Walk-in Client'}`}
        tag={<StatusBadge status={booking.status} />}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/bookings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border hover:bg-surface-raised text-text-muted hover:text-text text-xs font-medium rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Link>

            {booking.status === 'DRAFT' && (
              <Link
                href={`/bookings/${booking.id}/preview`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-status-safe text-white hover:bg-emerald-600 text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verify & Confirm</span>
              </Link>
            )}

            {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
              <button
                onClick={() => setIsCancelOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-status-danger/10 hover:bg-status-danger/20 text-status-danger border border-status-danger/30 text-xs font-medium rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        }
      />

      {/* Primary Task Visual: Temporal Event Window + Customer Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer Information Card */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-text-dim uppercase tracking-wider mb-2">
            <User className="w-3.5 h-3.5 text-primary" />
            <span>Customer Information</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-text">{booking.customer?.name || 'Walk-in Client'}</div>
            {booking.customer?.email && (
              <div className="text-xs text-text-muted mt-0.5 font-mono">{booking.customer.email}</div>
            )}
            {booking.customer?.phone && (
              <div className="text-xs text-text-muted mt-0.5 font-mono">{booking.customer.phone}</div>
            )}
          </div>
        </div>

        {/* Operational Period Card */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-text-dim uppercase tracking-wider mb-2">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>Temporal Commitment Window</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-text-dim uppercase font-medium block">Event Start</span>
              <span className="font-mono text-text font-semibold tabular-nums mt-0.5 block">
                {format(startDate, 'MMM d, yyyy')}
              </span>
              <span className="text-[11px] text-text-muted font-mono">{format(startDate, 'h:mm a')}</span>
            </div>
            <div>
              <span className="text-[10px] text-text-dim uppercase font-medium block">Event End</span>
              <span className="font-mono text-text font-semibold tabular-nums mt-0.5 block">
                {format(endDate, 'MMM d, yyyy')}
              </span>
              <span className="text-[11px] text-text-muted font-mono">{format(endDate, 'h:mm a')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Requested Items (Bill of Materials) */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-surface-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-3.5 h-3.5 text-primary" />
            <h2 className="text-xs font-semibold text-text uppercase tracking-wider">Requested Line Items</h2>
          </div>
          <span className="text-[10px] font-mono text-text-muted tabular-nums">
            {booking.bookingLines?.length || 0} ITEMS
          </span>
        </div>

        <div className="divide-y divide-border/60">
          {booking.bookingLines?.map((line) => (
            <div key={line.id} className="p-3.5 flex justify-between items-center hover:bg-surface-raised transition-colors">
              <div>
                <div className="text-xs font-semibold text-text">
                  {line.type === 'PACKAGE' 
                    ? line.packageVersion?.package?.name || 'Package' 
                    : line.inventoryItem?.name || 'Item'}
                </div>
                <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider mt-0.5">
                  {line.type}
                </div>
              </div>
              <div className="text-xs font-mono font-bold text-text bg-surface-raised px-2.5 py-1 rounded border border-border tabular-nums">
                {line.quantity} units
              </div>
            </div>
          ))}
          {(!booking.bookingLines || booking.bookingLines.length === 0) && (
            <div className="p-6 text-center text-text-muted text-xs">No items requested for this booking.</div>
          )}
        </div>
      </div>

      {/* Inventory Demands Breakdown */}
      {booking.bookingItemDemands && booking.bookingItemDemands.length > 0 && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-surface-subtle flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-primary" />
              <h2 className="text-xs font-semibold text-text uppercase tracking-wider">
                Physical Inventory Demanded (Atomic Units)
              </h2>
            </div>
            <span className="text-[10px] font-mono text-text-muted tabular-nums">
              {booking.bookingItemDemands.length} ALLOCATIONS
            </span>
          </div>

          <div className="divide-y divide-border/60">
            {booking.bookingItemDemands.map((demand) => (
              <div key={demand.id} className="p-3.5 flex justify-between items-center hover:bg-surface-raised transition-colors">
                <div>
                  <div className="text-xs font-semibold text-text">
                    {demand.inventoryItem?.name || 'Inventory Item'}
                  </div>
                  {demand.inventoryItem?.sku && (
                    <div className="text-[10px] font-mono text-text-muted mt-0.5 tabular-nums">
                      SKU: {demand.inventoryItem.sku}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-semibold text-status-warning uppercase tracking-wider">
                    Committed
                  </span>
                  <div className="text-xs font-mono font-bold text-text bg-surface-raised px-2.5 py-1 rounded border border-border tabular-nums">
                    {demand.quantityDemanded} units
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Temporal Locks (Reservations) */}
      {booking.inventoryReservations && booking.inventoryReservations.length > 0 && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-surface-subtle flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-status-safe" />
              <h2 className="text-xs font-semibold text-text uppercase tracking-wider">
                Active Temporal Locks (Inventory Guaranteed)
              </h2>
            </div>
            <span className="text-[10px] font-mono text-status-safe font-semibold">
              PROTECTED
            </span>
          </div>

          <div className="divide-y divide-border/60">
            {booking.inventoryReservations.map((res) => (
              <div key={res.id} className="p-3.5 flex justify-between items-center hover:bg-surface-raised transition-colors">
                <div>
                  <div className="text-xs font-semibold text-text">
                    {res.inventoryItem?.name || 'Item'}
                  </div>
                  <div className="text-[10px] font-mono text-text-dim mt-0.5 tabular-nums">
                    Lock #{res.id.substring(0, 8)}
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <StatusBadge status={res.status} size="sm" />
                  <div className="text-xs font-mono font-bold text-text bg-surface-raised px-2.5 py-1 rounded border border-border tabular-nums">
                    {res.quantity} locked
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Destructive Confirmation Modal */}
      <ConfirmDialog
        isOpen={isCancelOpen}
        title="Cancel Reservation?"
        description="Cancelling this booking will immediately release all locked physical inventory reservations back into the pool. This cannot be undone."
        confirmLabel="Release & Cancel Booking"
        cancelLabel="Keep Reservation"
        isDestructive={true}
        isLoading={isCancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setIsCancelOpen(false)}
      />
    </div>
  );
}
