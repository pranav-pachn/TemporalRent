'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { AuditEventDTO, AuditAction, AuditEntityType } from '@/types/audit';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
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
  ShieldAlert
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

  const renderActionBadge = (action: AuditAction) => {
    const map: Record<AuditAction, { label: string; style: string }> = {
      CREATE: { label: 'Created', style: 'text-status-info bg-status-info/10 border-status-info/20' },
      UPDATE: { label: 'Updated', style: 'text-text-muted bg-surface-raised border-border' },
      DELETE: { label: 'Deleted', style: 'text-status-danger bg-status-danger/10 border-status-danger/20' },
      CONFIRM: { label: 'Confirmed', style: 'text-status-safe bg-status-safe/10 border-status-safe/20' },
      CANCEL: { label: 'Cancelled', style: 'text-status-danger bg-status-danger/10 border-status-danger/20' },
      RESCHEDULE: { label: 'Rescheduled', style: 'text-status-info bg-status-info/10 border-status-info/20' },
      START_PICKING: { label: 'Picking Started', style: 'text-status-warning bg-status-warning/10 border-status-warning/20' },
      DISPATCH: { label: 'Dispatched', style: 'text-status-warning bg-status-warning/10 border-status-warning/20' },
      RETURN: { label: 'Returned', style: 'text-status-safe bg-status-safe/10 border-status-safe/20' },
      DAMAGE: { label: 'Damage Reported', style: 'text-status-danger bg-status-danger/10 border-status-danger/20 font-semibold' },
      OVERRIDE: { label: 'Manual Override', style: 'text-status-danger bg-status-danger/15 border-status-danger/30 font-bold' },
    };

    const config = map[action] || { label: action, style: 'text-text-muted bg-surface-raised border-border' };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${config.style}`}>
        {action === 'OVERRIDE' && <AlertTriangle className="inline w-3 h-3 mr-1" />}
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
          <Link href={href} className="text-text hover:text-primary transition-colors font-medium underline underline-offset-2 decoration-border hover:decoration-primary font-mono text-xs">
            {text}
          </Link>
        );
      }
      return <span className="text-text-muted font-medium font-mono text-xs">{label} #{displayId}</span>;
    };

    // If it's related to a booking, prioritize linking to the booking context
    if (entityType === 'BOOKING' || bookingId) {
      return formatEntity('Booking', bookingId || entityId, `/bookings/${bookingId || entityId}`);
    }

    switch (entityType) {
      case 'INVENTORY_ITEM':
        return formatEntity('Item', entityId, `/inventory/${entityId}`);
      case 'DAMAGE_REPORT':
        return formatEntity('Damage Report', entityId, '/damage');
      case 'DISPATCH':
        return formatEntity('Dispatch', entityId, '/dispatch');
      case 'RETURN':
        return formatEntity('Return', entityId, '/returns');
      default:
        const fallbackLabel = entityType.replace(/_/g, ' ').replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
        return <span className="text-text font-medium text-xs">{fallbackLabel}</span>;
    }
  };

  const renderActor = (event: AuditEventDTO) => {
    if (event.actor) {
      return (
        <div className="flex flex-col">
          <span className="text-text font-medium text-xs flex items-center gap-1.5">
            <UserIcon className="w-3.5 h-3.5 text-text-dim" />
            {event.actor.name || 'User'}
          </span>
          {event.actor.email && <span className="text-text-dim text-[11px] ml-5">{event.actor.email}</span>}
        </div>
      );
    }
    
    if (event.userId) {
      return (
        <div className="flex flex-col">
          <span className="text-text font-medium text-xs flex items-center gap-1.5">
            <UserIcon className="w-3.5 h-3.5 text-text-dim" />
            User
          </span>
          <span className="text-text-dim text-[11px] ml-5 font-mono">{event.userId.split('-')[0]}...</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        <span className="text-text-muted font-medium text-xs flex items-center gap-1.5">
          <Monitor className="w-3.5 h-3.5 text-text-dim" />
          System Engine
        </span>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title="Audit & Operational Log"
        description="Immutable chronological log of inventory reservations, temporal locks, dispatch events, and manual overrides"
        tag={
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-surface-raised border border-border text-text-muted tabular-nums">
            IMMUTABLE LEDGER
          </span>
        }
      />

      {/* Filters Bar */}
      <div className="bg-surface border border-border rounded-xl p-4 flex flex-wrap gap-3 items-end text-xs">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">Action</label>
          <select 
            value={actionFilter} 
            onChange={(e) => { setActionFilter(e.target.value as AuditAction); setPage(1); }}
            className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none focus:border-border-active"
          >
            <option value="">All Actions</option>
            {['CREATE', 'UPDATE', 'DELETE', 'CONFIRM', 'CANCEL', 'RESCHEDULE', 'START_PICKING', 'DISPATCH', 'RETURN', 'DAMAGE', 'OVERRIDE'].map(a => (
              <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 min-w-[140px]">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">Entity Type</label>
          <select 
            value={entityTypeFilter} 
            onChange={(e) => { setEntityTypeFilter(e.target.value as AuditEntityType); setPage(1); }}
            className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none focus:border-border-active"
          >
            <option value="">All Entities</option>
            {['BUSINESS', 'USER', 'CUSTOMER', 'INVENTORY_ITEM', 'PACKAGE', 'PACKAGE_VERSION', 'BOOKING', 'DISPATCH', 'RETURN', 'DAMAGE_REPORT'].map(e => (
              <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">From Date</label>
          <input 
            type="date" 
            value={dateFrom} 
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none focus:border-border-active [color-scheme:dark]"
          />
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">To Date</label>
          <input 
            type="date" 
            value={dateTo} 
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none focus:border-border-active [color-scheme:dark]"
          />
        </div>

        <button 
          onClick={resetFilters}
          className="h-[32px] px-3 bg-surface-raised hover:bg-surface-active text-text-muted hover:text-text rounded-lg text-xs font-medium transition-colors border border-border flex items-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden relative min-h-[360px]">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex gap-4 items-center">
                <div className="w-40 h-8 bg-surface-raised rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-surface-raised rounded animate-pulse" />
                  <div className="h-3 w-48 bg-surface-raised rounded animate-pulse" />
                </div>
                <div className="w-24 h-4 bg-surface-raised rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 flex flex-col items-center justify-center text-center h-full">
            <AlertTriangle className="w-10 h-10 text-status-danger mb-3" />
            <h3 className="text-sm font-semibold text-text mb-1">Unable to Load Audit Log</h3>
            <p className="text-text-muted text-xs max-w-md mb-4">{error}</p>
            <button 
              onClick={loadEvents}
              className="px-3.5 py-1.5 bg-surface-raised hover:bg-surface-active border border-border text-text rounded-lg text-xs font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={History}
            title="No Audit Events Found"
            description="No logged operational events match the selected filters."
            action={
              (actionFilter || entityTypeFilter || dateFrom || dateTo) ? (
                <button 
                  onClick={resetFilters}
                  className="px-3.5 py-1.5 bg-surface-raised hover:bg-surface-active border border-border text-text rounded-lg text-xs font-medium transition-colors"
                >
                  Clear Filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {events.map((event) => (
              <div key={event.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-surface-subtle/50 transition-colors group text-xs">
                {/* Actor column */}
                <div className="w-full sm:w-44 flex-shrink-0">
                  {renderActor(event)}
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {renderActionBadge(event.action)}
                    <span className="text-text-dim text-[11px]">&middot;</span>
                    {renderEntityLink(event)}
                  </div>

                  {event.action === 'OVERRIDE' && event.reason && (
                    <div className="mt-2 p-2.5 bg-status-danger/10 border border-status-danger/25 rounded-lg text-xs">
                      <span className="text-[10px] font-mono font-semibold text-status-danger uppercase tracking-wider block mb-0.5">Override Justification:</span>
                      <p className="text-text-muted">{event.reason}</p>
                    </div>
                  )}
                  
                  {event.action !== 'OVERRIDE' && event.reason && (
                    <div className="text-[11px] text-text-dim italic mt-0.5">
                      &ldquo;{event.reason}&rdquo;
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <div className="w-full sm:w-36 flex-shrink-0 sm:text-right">
                  <span 
                    className="text-[11px] text-text-muted font-mono tabular-nums cursor-help"
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
        <div className="flex items-center justify-between bg-surface border border-border rounded-xl p-3 text-xs">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded border border-border bg-surface-raised"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>
          
          <span className="text-text-muted font-mono tabular-nums">
            Page <strong className="text-text">{page}</strong> of <strong className="text-text">{totalPages || 1}</strong>
          </span>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded border border-border bg-surface-raised"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
