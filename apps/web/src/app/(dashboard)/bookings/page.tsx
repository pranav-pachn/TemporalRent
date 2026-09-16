'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { BookingDTO } from '@/types/bookings';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import Link from 'next/link';
import { Plus, ChevronRight, Calendar, Trash2, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Cancel dialog state
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.fetchBookingsList(1, 100);
      setBookings(res.data);
    } catch (err: any) {
      console.error('Failed to load bookings:', err);
      if (err.status === 401 || err.code === 'UNAUTHENTICATED') {
        router.push('/login');
        return;
      }
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleConfirmCancel = async () => {
    if (!cancellingId) return;
    try {
      setIsCancelling(true);
      await apiClient.cancelBooking(cancellingId, crypto.randomUUID(), 'Cancelled via operations dashboard');
      setCancellingId(null);
      await loadBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesStatus = statusFilter === 'ALL' || b.status.toUpperCase() === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        !q ||
        b.eventName.toLowerCase().includes(q) ||
        b.customerId.toLowerCase().includes(q) ||
        ((b as any).customer?.name && (b as any).customer.name.toLowerCase().includes(q)) ||
        b.id.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [bookings, statusFilter, searchQuery]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <div className="h-10 bg-surface border border-border rounded-lg w-48 animate-pulse" />
        <LoadingState variant="table" rows={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <ErrorState message={error} onRetry={loadBookings} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Reservations & Bookings"
        description="Temporal inventory reservations, safe confirmation statuses, and customer commitments"
        tag={
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-surface-raised border border-border text-text-muted tabular-nums">
            {bookings.length} TOTAL
          </span>
        }
        actions={
          <Link 
            href="/bookings/new" 
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:bg-primaryHover text-primary-foreground text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Reservation</span>
          </Link>
        }
      />

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border border-border rounded-lg p-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event, customer, or ID..."
              className="w-full bg-surface-raised border border-border rounded-md pl-8 pr-3 py-1.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'DRAFT', 'CONFIRMED', 'DISPATCHED', 'COMPLETED', 'CANCELLED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === s
                  ? 'bg-surface-active text-text font-semibold border border-border'
                  : 'text-text-muted hover:text-text hover:bg-surface-raised'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={searchQuery || statusFilter !== 'ALL' ? 'No matching bookings found' : 'No bookings registered yet'}
          description={
            searchQuery || statusFilter !== 'ALL'
              ? 'Try adjusting your search criteria or status filter tabs.'
              : 'Create your first reservation to begin tracking equipment allocations and safe confirmation.'
          }
          action={
            <Link
              href="/bookings/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primaryHover transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Reservation</span>
            </Link>
          }
        />
      ) : (
        <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle border-b border-border text-text-muted uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-3">Reservation & Client</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Event Window</th>
                  <th className="px-4 py-3">ID Reference</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredBookings.map((booking) => {
                  const startDate = new Date(booking.eventStart);
                  const endDate = new Date(booking.eventEnd);

                  return (
                    <tr key={booking.id} className="hover:bg-surface-raised transition-colors group">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-text">{booking.eventName}</div>
                        <div className="text-text-muted text-[11px] mt-0.5">
                          {(booking as any).customer?.name || `Customer #${booking.customerId.slice(0, 8)}`}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={booking.status} size="sm" />
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-text font-mono tabular-nums text-[11px]">
                          {format(startDate, 'MMM d, yyyy')}
                        </div>
                        <div className="text-text-dim text-[10px] mt-0.5">
                          {format(startDate, 'h:mm a')} – {format(endDate, 'h:mm a')}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-text-muted tabular-nums">
                        #{booking.id.substring(0, 8)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {booking.status === 'DRAFT' && (
                            <Link
                              href={`/bookings/${booking.id}/preview`}
                              className="px-2 py-1 bg-status-safe/10 hover:bg-status-safe/20 text-status-safe text-[11px] font-semibold rounded border border-status-safe/30 transition-colors"
                            >
                              Verify Safety
                            </Link>
                          )}
                          <Link 
                            href={`/bookings/${booking.id}`}
                            className="inline-flex items-center gap-1 text-text-muted hover:text-text px-2 py-1 rounded bg-surface-subtle border border-border text-[11px] font-medium transition-colors"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                          {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                            <button
                              onClick={() => setCancellingId(booking.id)}
                              className="text-text-dim hover:text-status-danger p-1 rounded hover:bg-surface-raised transition-colors"
                              title="Cancel Reservation"
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
      )}

      {/* Explicit Destructive Action Dialog */}
      <ConfirmDialog
        isOpen={Boolean(cancellingId)}
        title="Cancel Reservation?"
        description="Cancelling this booking will immediately release all locked physical inventory reservations back into the pool. This cannot be undone."
        confirmLabel="Release & Cancel Booking"
        cancelLabel="Keep Reservation"
        isDestructive={true}
        isLoading={isCancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancellingId(null)}
      />
    </div>
  );
}
