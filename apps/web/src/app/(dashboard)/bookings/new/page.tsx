'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { CustomerDTO, BookingLineInput, AvailabilityResult, InventoryConflictErrorResponse } from '@/types/bookings';
import { Package } from '@/types/package';
import { InventoryItem } from '@/types/inventory';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { ConflictModal } from '@/components/bookings/ConflictModal';

export default function BookingBuilderPage() {
  const router = useRouter();
  
  // Data State
  const [customers, setCustomers] = useState<CustomerDTO[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  
  // Form State
  const [customerId, setCustomerId] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventStart, setEventStart] = useState('');
  const [eventEnd, setEventEnd] = useState('');
  const [lines, setLines] = useState<BookingLineInput[]>([]);
  
  // Availability State
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  
  // Confirmation State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState<InventoryConflictErrorResponse | null>(null);
  const [status, setStatus] = useState<'DRAFT' | 'CONFIRMED'>('DRAFT');
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Initial Options
  useEffect(() => {
    async function load() {
      try {
        const [custRes, packRes, invRes] = await Promise.all([
          apiClient.fetchCustomers(),
          apiClient.fetchPackages(),
          apiClient.fetchInventoryItems()
        ]);
        setCustomers(custRes.data);
        setPackages(packRes.data);
        setInventory(invRes.data);
      } catch (e: any) {
        console.error('Failed to load initial data', e);
      } finally {
        setLoadingInitial(false);
      }
    }
    load();
  }, []);

  // Real-time Availability Check
  useEffect(() => {
    const isValidDates = eventStart && eventEnd && new Date(eventStart) < new Date(eventEnd);
    const hasLines = lines.length > 0 && lines.every(l => 
      (l.type === 'PACKAGE' && l.packageVersionId) || 
      (l.type === 'INVENTORY_ITEM' && l.inventoryItemId)
    );

    if (!isValidDates || !hasLines) {
      setAvailability(null);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setCheckingAvailability(true);
      
      try {
        const startIso = new Date(eventStart).toISOString();
        const endIso = new Date(eventEnd).toISOString();
        
        const res = await apiClient.checkRealTimeAvailability(lines, startIso, endIso, {
          signal: abortControllerRef.current.signal
        });
        
        setAvailability(res.data);
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error('Availability check failed:', e);
          setAvailability(null);
        }
      } finally {
        setCheckingAvailability(false);
      }
    }, 400); // 400ms debounce

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [eventStart, eventEnd, JSON.stringify(lines)]);

  const addLine = (type: 'PACKAGE' | 'INVENTORY_ITEM') => {
    setLines([...lines, { type, quantity: 1 }]);
  };

  const updateLine = (index: number, updates: Partial<BookingLineInput>) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], ...updates };
    setLines(newLines);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const getInventoryName = (id: string) => inventory.find(i => i.id === id)?.name || 'Unknown Item';

  const handleConfirmBooking = async () => {
    if (!customerId || !eventName || !eventStart || !eventEnd || lines.length === 0) {
      setSubmitError('Please fill in all required fields');
      return;
    }
    
    setSubmitting(true);
    setSubmitError(null);
    setConflictError(null);
    
    try {
      const startIso = new Date(eventStart).toISOString();
      const endIso = new Date(eventEnd).toISOString();
      
      // 1. Create Draft
      const draftRes = await apiClient.createBookingDraft({
        customerId,
        eventName,
        eventStart: startIso,
        eventEnd: endIso,
        lines
      });
      const bookingId = draftRes.data.id;
      
      // 2. Quote Booking
      await apiClient.quoteBooking(bookingId);
      
      // 3. Transactional Confirm
      const idempotencyKey = crypto.randomUUID();
      await apiClient.confirmBooking(bookingId, idempotencyKey);
      
      setStatus('CONFIRMED');
      setTimeout(() => {
        router.push(`/bookings/${bookingId}`);
      }, 1500);
      
    } catch (e: any) {
      if (e.code === 'INVENTORY_CONFLICT') {
        setConflictError(e);
      } else {
        setSubmitError(e.message || e.error || 'Failed to complete booking transaction');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) return <div className="p-8 text-neutral-400">Loading builder...</div>;

  const hasShortages = availability && !availability.available;
  const isFormComplete = customerId && eventName && eventStart && eventEnd && lines.length > 0;

  if (status === 'CONFIRMED') {
    return (
      <div className="max-w-4xl mx-auto pt-16">
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center space-y-4">
          <div className="flex justify-center"><CheckCircle2 className="w-12 h-12 text-green-500" /></div>
          <h2 className="text-2xl font-medium text-green-400">Reservation Secured</h2>
          <p className="text-neutral-400">Transaction completed successfully. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      <div className="flex items-center space-x-4">
        <Link href="/bookings" className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-white tracking-tight">Booking Builder</h1>
          <span className="text-sm font-medium px-2 py-1 bg-neutral-800 text-neutral-300 rounded">DRAFT</span>
        </div>
      </div>

      {submitError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
          {submitError}
        </div>
      )}

      {conflictError && (
        <ConflictModal
          error={conflictError}
          isRefreshing={checkingAvailability}
          onClose={() => setConflictError(null)}
          onChangeQuantity={() => {
            setConflictError(null);
            // In a fuller implementation, we could highlight rows here
          }}
          onChangeDate={() => {
            setConflictError(null);
            // Let the user scroll to the date section
          }}
          onRefresh={async () => {
            // Trigger availability check, keep modal open to show loading, then maybe dismiss
            // The useEffect will pick up if we set some refresh flag, but we can just clear the error
            // so the real-time availability takes over. The UI handles the rest.
            setConflictError(null);
          }}
        />
      )}

      <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 space-y-6">
        <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Customer & Event</h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-300">Customer</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">Select a customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-300">Event</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="e.g. Wedding Reception"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-300">Start Date & Time</label>
            <input
              type="datetime-local"
              value={eventStart}
              onChange={(e) => setEventStart(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-300">End Date & Time</label>
            <input
              type="datetime-local"
              value={eventEnd}
              onChange={(e) => setEventEnd(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>
      </div>

      <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 space-y-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Demand</h2>
          <div className="flex space-x-2">
            <button type="button" onClick={() => addLine('PACKAGE')} className="flex items-center px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs rounded-lg transition-colors">
              <Plus className="w-3 h-3 mr-1" /> Package
            </button>
            <button type="button" onClick={() => addLine('INVENTORY_ITEM')} className="flex items-center px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs rounded-lg transition-colors">
              <Plus className="w-3 h-3 mr-1" /> Item
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {lines.map((line, index) => (
            <div key={index} className="flex gap-4 items-center bg-neutral-950 p-3 rounded-xl border border-white/5">
              <div className="w-20">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                  {line.type === 'PACKAGE' ? 'PACK' : 'ITEM'}
                </span>
              </div>
              
              <div className="flex-1">
                {line.type === 'PACKAGE' ? (
                  <select
                    value={line.packageVersionId || ''}
                    onChange={(e) => updateLine(index, { packageVersionId: e.target.value })}
                    className="w-full bg-transparent text-white text-sm focus:outline-none"
                  >
                    <option value="" className="bg-neutral-900">Select Package...</option>
                    {packages.map(p => (
                      p.publishedVersionId && (
                        <option key={p.id} value={p.publishedVersionId} className="bg-neutral-900">
                          {p.name} (V{p.versionCount})
                        </option>
                      )
                    ))}
                  </select>
                ) : (
                  <select
                    value={line.inventoryItemId || ''}
                    onChange={(e) => updateLine(index, { inventoryItemId: e.target.value })}
                    className="w-full bg-transparent text-white text-sm focus:outline-none"
                  >
                    <option value="" className="bg-neutral-900">Select Item...</option>
                    {inventory.map(i => (
                      <option key={i.id} value={i.id} className="bg-neutral-900">
                        {i.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center">
                <span className="text-neutral-500 text-sm mr-2">×</span>
                <input
                  type="number"
                  min="1"
                  value={line.quantity}
                  onChange={(e) => updateLine(index, { quantity: parseInt(e.target.value) || 1 })}
                  className="w-16 bg-neutral-900 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none text-center"
                />
              </div>

              <button type="button" onClick={() => removeLine(index)} className="p-2 text-neutral-500 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          {lines.length === 0 && (
            <div className="text-center py-6 text-neutral-600 text-sm border border-dashed border-white/5 rounded-xl">
              Add a package or item to build demand.
            </div>
          )}
        </div>
      </div>

      <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 min-h-[160px]">
        <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-6">Availability</h2>
        
        {checkingAvailability ? (
          <div className="flex items-center justify-center h-20 text-neutral-500 text-sm">
            <div className="animate-pulse flex items-center">Analyzing temporal inventory...</div>
          </div>
        ) : !availability ? (
          <div className="flex items-center justify-center h-20 text-neutral-600 text-sm">
            Fill out dates and items to see live availability.
          </div>
        ) : (
          <div className="space-y-4">
            {availability.items.map((item) => {
              const isShortage = item.shortage > 0;
              return (
                <div key={item.inventoryItemId} className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {isShortage ? (
                        <XCircle className="w-4 h-4 text-red-500 mr-3" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-3" />
                      )}
                      <span className={isShortage ? 'text-red-400' : 'text-neutral-200'}>
                        {getInventoryName(item.inventoryItemId)}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-neutral-500 mr-2">Req: {item.required}</span>
                      <span className={isShortage ? 'text-red-400 font-medium' : 'text-green-400 font-medium'}>
                        Avail: {item.available}
                      </span>
                    </div>
                  </div>
                  {isShortage && (
                    <div className="pl-7 mt-1 text-xs text-red-400/80">
                      Shortage: {item.shortage} units
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-white/5 flex flex-col items-center">
        {hasShortages && (
          <div className="flex items-center text-red-400 text-sm font-medium mb-4">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Inventory shortages detected
          </div>
        )}
        
        <button
          onClick={handleConfirmBooking}
          disabled={!isFormComplete || checkingAvailability || submitting}
          className={`w-full py-4 rounded-xl font-medium text-lg transition-colors ${
            hasShortages
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
              : 'bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:bg-neutral-800 disabled:text-neutral-500'
          }`}
        >
          {submitting ? 'Securing Transaction...' : hasShortages ? 'Resolve Inventory Shortage' : 'Confirm Booking'}
        </button>
      </div>
    </div>
  );
}
