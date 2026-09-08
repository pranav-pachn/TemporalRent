'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { BookingDTO } from '@/types/bookings';
import Link from 'next/link';
import { Plus, ChevronRight, Calendar } from 'lucide-react';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiClient.fetchBookingsList(1, 50);
        setBookings(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">Bookings</h1>
        <Link 
          href="/bookings/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg flex items-center transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Booking
        </Link>
      </div>

      {loading ? (
        <div className="text-neutral-400 py-12 text-center">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="bg-neutral-900 border border-white/5 rounded-2xl py-24 text-center">
          <Calendar className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No bookings yet</h3>
          <p className="text-neutral-400">Create your first booking to get started.</p>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-950 border-b border-white/5 text-neutral-400 uppercase tracking-wider text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Event & ID</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Dates</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{booking.eventName}</div>
                    <div className="text-neutral-500 text-xs mt-1">#{booking.id.substring(0, 8)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-white/10 text-white text-xs font-medium rounded-md">
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-neutral-300">
                      {new Date(booking.eventStart).toLocaleDateString()} &ndash; {new Date(booking.eventEnd).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/bookings/${booking.id}`}
                      className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium"
                    >
                      View
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
