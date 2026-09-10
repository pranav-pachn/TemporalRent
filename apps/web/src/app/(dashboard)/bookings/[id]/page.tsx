'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { BookingDetailDTO } from '@/types/bookings';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ArrowLeft, Package, Calendar, Clock, User, Hash, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleCancelBooking = async () => {
    if (!booking) return;
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await apiClient.cancelBooking(booking.id, crypto.randomUUID(), 'Cancelled via dashboard');
      loadBooking(); // Reload to show updated status
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking');
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <LoadingState />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <ErrorState 
          message={error || 'Booking not found'} 
          onRetry={loadBooking} 
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 p-6">
      <div className="flex items-center space-x-4">
        <Link href="/bookings" className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">{booking.eventName}</h1>
            <p className="text-neutral-500 text-sm mt-0.5">Booking #{booking.id.substring(0, 8)}</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1.5 bg-blue-500/10 text-blue-400 font-medium text-sm rounded-lg border border-blue-500/20 uppercase tracking-wider">
              {booking.status}
            </span>
            {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
              <button
                onClick={handleCancelBooking}
                className="flex items-center px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium text-sm rounded-lg border border-red-500/20 transition-colors"
                title="Cancel Booking"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 space-y-4">
          <div className="flex items-center text-neutral-400 font-medium uppercase tracking-wider text-xs mb-2">
            <User className="w-4 h-4 mr-2" /> Customer Information
          </div>
          <div>
            <div className="text-white font-medium">{booking.customer?.name || 'Walk-in Customer'}</div>
            {booking.customer?.email && <div className="text-neutral-500 text-sm mt-1">{booking.customer.email}</div>}
            {booking.customer?.phone && <div className="text-neutral-500 text-sm mt-1">{booking.customer.phone}</div>}
          </div>
        </div>

        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 space-y-4">
          <div className="flex items-center text-neutral-400 font-medium uppercase tracking-wider text-xs mb-2">
            <Calendar className="w-4 h-4 mr-2" /> Operational Period
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Event Start</div>
              <div className="text-white font-medium">
                {new Date(booking.eventStart).toLocaleDateString()} at {new Date(booking.eventStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div>
              <div className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Event End</div>
              <div className="text-white font-medium">
                {new Date(booking.eventEnd).toLocaleDateString()} at {new Date(booking.eventEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center bg-neutral-950">
          <Package className="w-4 h-4 mr-2 text-neutral-400" />
          <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Requested Items</h2>
        </div>
        <div className="divide-y divide-white/5">
          {booking.bookingLines?.map((line) => (
            <div key={line.id} className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
              <div>
                <div className="text-white font-medium">
                  {line.type === 'PACKAGE' 
                    ? line.packageVersion?.package?.name || 'Package' 
                    : line.inventoryItem?.name || 'Item'}
                </div>
                <div className="text-neutral-500 text-xs mt-1 uppercase tracking-wider">{line.type}</div>
              </div>
              <div className="text-white font-medium bg-neutral-800 px-3 py-1 rounded-lg border border-white/5">
                {line.quantity} units
              </div>
            </div>
          ))}
          {(!booking.bookingLines || booking.bookingLines.length === 0) && (
            <div className="p-8 text-center text-neutral-500 text-sm">No items requested for this booking.</div>
          )}
        </div>
      </div>

      {booking.bookingItemDemands && booking.bookingItemDemands.length > 0 && (
        <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center bg-neutral-950">
            <Hash className="w-4 h-4 mr-2 text-neutral-400" />
            <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Inventory Demand & Commitments</h2>
          </div>
          <div className="divide-y divide-white/5">
            {booking.bookingItemDemands.map((demand) => (
              <div key={demand.id} className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                <div>
                  <div className="text-white font-medium">
                    {demand.inventoryItem?.name || 'Inventory Item'}
                  </div>
                  {demand.inventoryItem?.sku && (
                    <div className="text-neutral-500 text-xs mt-0.5 uppercase tracking-wider">SKU: {demand.inventoryItem.sku}</div>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-amber-400 text-xs uppercase tracking-wider font-medium">Committed</span>
                  <div className="text-white font-medium bg-neutral-800 px-3 py-1 rounded-lg border border-white/5">
                    {demand.quantityDemanded} committed
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {booking.inventoryReservations && booking.inventoryReservations.length > 0 && (
        <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center bg-neutral-950">
            <Clock className="w-4 h-4 mr-2 text-neutral-400" />
            <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Active Reservations (Temporal Locks)</h2>
          </div>
          <div className="divide-y divide-white/5">
            {booking.inventoryReservations.map((res) => (
              <div key={res.id} className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center hover:bg-white/5 transition-colors gap-3">
                <div>
                  <div className="text-white font-medium">
                    {res.inventoryItem?.name || 'Item'}
                  </div>
                  <div className="text-neutral-500 text-xs mt-1 uppercase tracking-wider">Reservation #{res.id.substring(0, 8)}</div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded border border-emerald-500/20 uppercase tracking-wider">
                    {res.status}
                  </span>
                  <div className="text-white font-medium bg-neutral-800 px-3 py-1 rounded-lg border border-white/5">
                    {res.quantity} reserved
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
