'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { InventoryReservation, InventoryBooking, InventoryMovement, InventoryDamageReport } from '@/types/inventory';
import { Calendar, PackageOpen, History, ShieldAlert, Loader2 } from 'lucide-react';
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns';

type Tab = 'availability' | 'bookings' | 'movements' | 'damage';

export function InventoryDetailTabs({ itemId }: { itemId: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('availability');

  return (
    <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="flex border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab('availability')}
          className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'availability'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-text-muted hover:text-text hover:bg-background-dark'
          }`}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Availability
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'bookings'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-text-muted hover:text-text hover:bg-background-dark'
          }`}
        >
          <PackageOpen className="w-4 h-4 mr-2" />
          Related Bookings
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'movements'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-text-muted hover:text-text hover:bg-background-dark'
          }`}
        >
          <History className="w-4 h-4 mr-2" />
          Movement Ledger
        </button>
        <button
          onClick={() => setActiveTab('damage')}
          className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'damage'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-text-muted hover:text-text hover:bg-background-dark'
          }`}
        >
          <ShieldAlert className="w-4 h-4 mr-2" />
          Damage History
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'availability' && <AvailabilityTab itemId={itemId} />}
        {activeTab === 'bookings' && <BookingsTab itemId={itemId} />}
        {activeTab === 'movements' && <MovementsTab itemId={itemId} />}
        {activeTab === 'damage' && <DamageTab itemId={itemId} />}
      </div>
    </div>
  );
}

function AvailabilityTab({ itemId }: { itemId: string }) {
  const [reservations, setReservations] = useState<InventoryReservation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // By default, look at current month + next month
  const [currentDate] = useState(new Date());
  const fromDate = startOfMonth(currentDate).toISOString();
  const toDate = endOfMonth(addMonths(currentDate, 2)).toISOString(); // next 2 months

  useEffect(() => {
    async function fetchAvailability() {
      setLoading(true);
      try {
        const res = await apiClient.fetchInventoryReservations(itemId, fromDate, toDate);
        setReservations(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAvailability();
  }, [itemId, fromDate, toDate]);

  if (loading) return <TabLoading />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-text">Upcoming Active Reservations</h4>
        <span className="text-xs text-text-muted">Showing {format(new Date(fromDate), 'MMM yyyy')} - {format(new Date(toDate), 'MMM yyyy')}</span>
      </div>
      
      {reservations.length === 0 ? (
        <p className="text-sm text-text-muted">No reservations found in this period.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap border border-border rounded-lg">
            <thead className="bg-background-dark text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium text-right">Quantity Reserved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reservations.map((r) => (
                <tr key={r.reservationId} className="hover:bg-background-dark/30">
                  <td className="px-4 py-3 font-medium text-text">{r.eventName}</td>
                  <td className="px-4 py-3 text-text-muted">{r.customerName}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {format(new Date(r.start), 'MMM d, h:mm a')} - {format(new Date(r.end), 'MMM d, h:mm a')}
                  </td>
                  <td className="px-4 py-3 font-medium text-right text-text">{r.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BookingsTab({ itemId }: { itemId: string }) {
  const [bookings, setBookings] = useState<InventoryBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      setLoading(true);
      try {
        const res = await apiClient.fetchInventoryBookings(itemId);
        setBookings(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, [itemId]);

  if (loading) return <TabLoading />;

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-text">Related Bookings</h4>
      {bookings.length === 0 ? (
        <p className="text-sm text-text-muted">No bookings found for this item.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap border border-border rounded-lg">
            <thead className="bg-background-dark text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Event Name</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Event Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-background-dark/30">
                  <td className="px-4 py-3 font-medium text-text">{b.eventName}</td>
                  <td className="px-4 py-3 text-text-muted">{b.customer?.name}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {format(new Date(b.eventStart), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-1 text-xs rounded-full bg-background-dark border border-border">
                      {b.status}
                    </span>
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

function MovementsTab({ itemId }: { itemId: string }) {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMovements() {
      setLoading(true);
      try {
        const res = await apiClient.fetchInventoryMovements(itemId);
        setMovements(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMovements();
  }, [itemId]);

  if (loading) return <TabLoading />;

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-text">Movement Ledger</h4>
      {movements.length === 0 ? (
        <p className="text-sm text-text-muted">No physical movements logged.</p>
      ) : (
        <div className="space-y-3">
          {movements.map((m) => (
            <div key={m.id} className="p-4 rounded-lg border border-border bg-background-dark/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    m.quantityDelta > 0 ? 'bg-green-500/10 text-green-500' :
                    m.quantityDelta < 0 ? 'bg-red-500/10 text-red-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {m.movementType.replace(/_/g, ' ')}
                  </span>
                  <span className="text-text-muted text-sm">
                    {format(new Date(m.createdAt), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                {m.notes && <p className="text-sm text-text mt-2">{m.notes}</p>}
                <p className="text-xs text-text-muted mt-1">Logged by: {m.createdByUser?.email}</p>
              </div>
              <div className="text-right">
                <span className={`text-lg font-bold ${
                  m.quantityDelta > 0 ? 'text-green-500' :
                  m.quantityDelta < 0 ? 'text-red-500' :
                  'text-text-muted'
                }`}>
                  {m.quantityDelta > 0 ? '+' : ''}{m.quantityDelta}
                </span>
                <p className="text-xs text-text-muted uppercase">Qty Change</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DamageTab({ itemId }: { itemId: string }) {
  const [damages, setDamages] = useState<InventoryDamageReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDamages() {
      setLoading(true);
      try {
        const res = await apiClient.fetchInventoryDamage(itemId);
        setDamages(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDamages();
  }, [itemId]);

  if (loading) return <TabLoading />;

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-text">Damage History</h4>
      {damages.length === 0 ? (
        <p className="text-sm text-text-muted">No damage reports for this item.</p>
      ) : (
        <div className="space-y-3">
          {damages.map((d) => (
            <div key={d.id} className="p-4 rounded-lg border border-red-500/20 bg-red-500/5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-medium text-red-400">Damaged {d.quantityDamaged} unit{d.quantityDamaged > 1 ? 's' : ''}</span>
                  <span className="text-text-muted text-sm ml-3">{format(new Date(d.createdAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
              <p className="text-sm text-text">{d.description}</p>
              {d.booking && (
                <p className="text-xs text-text-muted mt-2 border-t border-red-500/10 pt-2">
                  Related to booking: {d.booking.eventName}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-text-muted">
      <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
      <p className="text-sm">Loading data...</p>
    </div>
  );
}
