'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { BookingDetailDTO } from '@/types/bookings';
import { ArrowLeft, CheckCircle2, Package, Calendar, Clock, User, Hash } from 'lucide-react';
import Link from 'next/link';

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const [booking, setBooking] = useState<BookingDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiClient.fetchBookingById(params.id);
        setBooking(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) return <div className="p-8 text-neutral-400">Loading booking...</div>;
  if (!booking) return <div className="p-8 text-red-400">Booking not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      <div className="flex items-center space-x-4">
        <Link href="/bookings" className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">{booking.eventName}</h1>
            <p className="text-neutral-500 text-sm mt-0.5">Booking #{booking.id.substring(0, 8)}</p>
          </div>
          <span className="px-3 py-1.5 bg-blue-500/10 text-blue-400 font-medium text-sm rounded-lg border border-blue-500/20 uppercase tracking-wider">
            {booking.status}
          </span>
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

      {booking.inventoryReservations && booking.inventoryReservations.length > 0 && (
        <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center bg-neutral-950">
            <Hash className="w-4 h-4 mr-2 text-neutral-400" />
            <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Active Reservations</h2>
          </div>
          <div className="divide-y divide-white/5">
            {booking.inventoryReservations.map((res) => (
              <div key={res.id} className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center hover:bg-white/5 transition-colors gap-3">
                <div>
                  <div className="text-white font-medium">
                    {res.inventoryItem?.name || 'Item'}
                  </div>
                  <div className="text-neutral-500 text-xs mt-1 font-mono">{res.id}</div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-neutral-400 text-sm text-right">
                    <div className="flex items-center justify-end">
                      <Clock className="w-3.5 h-3.5 mr-1.5" />
                      Reserved Window
                    </div>
                  </div>
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
