'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { AuditEventDTO, AuditAction, AuditEntityType } from '@/types/audit';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDistanceToNow, format } from 'date-fns';
import Link from 'next/link';
import { 
  History, 
  Search, 
  X, 
  AlertTriangle, 
  User as UserIcon, 
  Monitor,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEventDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 50;

  // Filters
  const [actionFilter, setActionFilter] = useState<AuditAction | ''>('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<AuditEntityType | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: any = { page, limit };
      if (actionFilter) filters.action = actionFilter;
      if (entityTypeFilter) filters.entityType = entityTypeFilter;
      if (dateFrom) filters.from = new Date(dateFrom).toISOString();
      
      // If dateTo is selected, we want to include the entire day
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        filters.to = toDate.toISOString();
      }

      const response = await apiClient.fetchAuditEvents(filters);
      setEvents(response.events);
      setTotalPages(Math.ceil(response.total / limit));
    } catch (e: any) {
      setError('Something went wrong while loading operational history.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, actionFilter, entityTypeFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const resetFilters = () => {
    setActionFilter('');
    setEntityTypeFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const renderActionLabel = (action: AuditAction) => {
    const map: Record<AuditAction, { label: string; color: string }> = {
      CREATE: { label: 'Created', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
      UPDATE: { label: 'Updated', color: 'text-neutral-300 bg-neutral-500/10 border-neutral-500/20' },
      DELETE: { label: 'Deleted', color: 'text-neutral-300 bg-neutral-500/10 border-neutral-500/20' },
      CONFIRM: { label: 'Confirmed', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
      CANCEL: { label: 'Cancelled', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
      RESCHEDULE: { label: 'Rescheduled', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
      START_PICKING: { label: 'Started Picking', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
      DISPATCH: { label: 'Dispatched', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
      RETURN: { label: 'Returned', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
      DAMAGE: { label: 'Damage Reported', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
      OVERRIDE: { label: 'Override', color: 'text-red-500 bg-red-500/10 border-red-500/20 font-bold' },
    };

    const config = map[action] || { label: action, color: 'text-neutral-400 bg-neutral-800 border-neutral-700' };

    return (
      <span className={`px-2.5 py-0.5 rounded text-xs border ${config.color} uppercase tracking-wider`}>
        {action === 'OVERRIDE' && <AlertTriangle className="inline w-3 h-3 mr-1 -mt-0.5" />}
        {config.label}
      </span>
    );
  };

  const renderEntityLink = (event: AuditEventDTO) => {
    const { entityType, entityId, bookingId } = event;

    const formatEntity = (label: string, id: string, href?: string) => {
      const displayId = id.split('-')[0].toUpperCase();
      const text = `${label} #${displayId}`;
      
      if (href) {
        return (
          <Link href={href} className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
            {text} →
          </Link>
        );
      }
      return <span className="text-neutral-300 font-medium">{label}</span>;
    };

    // If it's related to a booking, prioritize linking to the booking context
    if (entityType === 'BOOKING' || bookingId) {
      return formatEntity('Booking', bookingId || entityId, `/bookings/${bookingId || entityId}`);
    }

    switch (entityType) {
      case 'INVENTORY_ITEM':
        return formatEntity('Inventory Item', entityId, `/inventory/${entityId}`);
      case 'DAMAGE_REPORT':
        return formatEntity('Damage Report', entityId);
      case 'DISPATCH':
        return formatEntity('Dispatch', entityId, '/dispatch');
      case 'RETURN':
        return formatEntity('Return', entityId, '/returns');
      default:
        // Generic fallback with nice casing
        const fallbackLabel = entityType.replace(/_/g, ' ').replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
        return <span className="text-neutral-300 font-medium">{fallbackLabel}</span>;
    }
  };

  const renderActor = (event: AuditEventDTO) => {
    if (event.actor) {
      return (
        <div className="flex flex-col">
          <span className="text-white font-medium text-sm flex items-center gap-1.5">
            <UserIcon className="w-4 h-4 text-neutral-400" />
            {event.actor.name || 'User'}
          </span>
          {event.actor.email && <span className="text-neutral-400 text-xs ml-5.5">{event.actor.email}</span>}
        </div>
      );
    }
    
    if (event.userId) {
      return (
        <div className="flex flex-col">
          <span className="text-white font-medium text-sm flex items-center gap-1.5">
            <UserIcon className="w-4 h-4 text-neutral-400" />
            User
          </span>
          <span className="text-neutral-500 text-xs ml-5.5 font-mono">{event.userId.split('-')[0]}...</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        <span className="text-neutral-300 font-medium text-sm flex items-center gap-1.5">
          <Monitor className="w-4 h-4 text-neutral-500" />
          System
        </span>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 uppercase">
          <History className="w-6 h-6 text-blue-500" />
          Audit Log
        </h1>
        <p className="text-neutral-400 text-sm mt-1">
          Immutable operational history
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface border border-white/5 rounded-xl p-4 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">Action</label>
          <select 
            value={actionFilter} 
            onChange={(e) => { setActionFilter(e.target.value as AuditAction); setPage(1); }}
            className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">All Actions</option>
            {['CREATE', 'UPDATE', 'DELETE', 'CONFIRM', 'CANCEL', 'RESCHEDULE', 'START_PICKING', 'DISPATCH', 'RETURN', 'DAMAGE', 'OVERRIDE'].map(a => (
              <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">Entity Type</label>
          <select 
            value={entityTypeFilter} 
            onChange={(e) => { setEntityTypeFilter(e.target.value as AuditEntityType); setPage(1); }}
            className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">All Entities</option>
            {['BUSINESS', 'USER', 'CUSTOMER', 'INVENTORY_ITEM', 'PACKAGE', 'PACKAGE_VERSION', 'BOOKING', 'DISPATCH', 'RETURN', 'DAMAGE_REPORT'].map(e => (
              <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">From Date</label>
          <input 
            type="date" 
            value={dateFrom} 
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 [color-scheme:dark]"
          />
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">To Date</label>
          <input 
            type="date" 
            value={dateTo} 
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 [color-scheme:dark]"
          />
        </div>

        <button 
          onClick={resetFilters}
          className="h-[38px] px-4 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors border border-white/10 flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-surface border border-white/5 rounded-xl overflow-hidden relative min-h-[400px]">
        {isLoading ? (
          <div className="p-6 space-y-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4">
                <div className="w-48 h-10 bg-white/5 rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-32 bg-white/5 rounded animate-pulse" />
                  <div className="h-4 w-48 bg-white/5 rounded animate-pulse" />
                </div>
                <div className="w-24 h-4 bg-white/5 rounded animate-pulse mt-1" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 flex flex-col items-center justify-center text-center h-full">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2 uppercase tracking-wide">Unable to Load Audit Log</h3>
            <p className="text-neutral-400 max-w-md mb-6">{error}</p>
            <button 
              onClick={loadEvents}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center h-[400px]">
            <Search className="w-12 h-12 text-neutral-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2 uppercase tracking-wide">No Audit Events</h3>
            <p className="text-neutral-400 max-w-md mb-6">No events match the selected filters.</p>
            {(actionFilter || entityTypeFilter || dateFrom || dateTo) && (
              <button 
                onClick={resetFilters}
                className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-sm font-medium transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {events.map((event) => (
              <div key={event.id} className="p-5 flex flex-col sm:flex-row sm:items-start gap-4 hover:bg-white/[0.02] transition-colors group">
                {/* Actor column */}
                <div className="w-full sm:w-48 flex-shrink-0 pt-1">
                  {renderActor(event)}
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    {renderActionLabel(event.action)}
                  </div>
                  
                  <div className="text-sm">
                    {renderEntityLink(event)}
                  </div>

                  {event.action === 'OVERRIDE' && event.reason && (
                    <div className="mt-3 p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                      <span className="text-xs font-semibold text-red-400 uppercase tracking-wider block mb-1">Reason:</span>
                      <p className="text-sm text-neutral-300">{event.reason}</p>
                    </div>
                  )}
                  
                  {/* Optional: if there's generic reason not an override, we can also show it nicely */}
                  {event.action !== 'OVERRIDE' && event.reason && (
                    <div className="mt-2 text-sm text-neutral-400 italic">
                      "{event.reason}"
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <div className="w-full sm:w-32 flex-shrink-0 sm:text-right pt-1">
                  <span 
                    className="text-sm text-neutral-400 cursor-help"
                    title={format(new Date(event.createdAt), 'MMM d, yyyy \at h:mm:ss a')}
                  >
                    {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && !error && events.length > 0 && (
        <div className="flex items-center justify-between bg-surface border border-white/5 rounded-xl p-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          
          <span className="text-sm text-neutral-400">
            Page <span className="text-white font-medium">{page}</span> of <span className="text-white font-medium">{totalPages || 1}</span>
          </span>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
