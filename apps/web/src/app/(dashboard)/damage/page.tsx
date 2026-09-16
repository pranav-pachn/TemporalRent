'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { DamageReportDTO } from '@/types/warehouse';
import { 
  AlertTriangle, 
  Search, 
  Calendar, 
  ShieldAlert, 
  Clock,
  ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export default function DamagePage() {
  const router = useRouter();
  const [reports, setReports] = useState<DamageReportDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'DAMAGED' | 'MISSING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadReports = async (type: 'ALL' | 'DAMAGED' | 'MISSING') => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.fetchDamageReports(type);
      setReports(res.data);
    } catch (e: any) {
      console.error('Failed to load damage reports', e);
      if (e.status === 401 || e.code === 'UNAUTHENTICATED') {
        router.push('/login');
        return;
      }
      setError(e.message || 'Failed to load damage reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports(filterType);
  }, [filterType]);

  const filteredReports = reports.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.inventoryItemName.toLowerCase().includes(q) ||
      (r.sku && r.sku.toLowerCase().includes(q)) ||
      (r.bookingName && r.bookingName.toLowerCase().includes(q)) ||
      r.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title="Damage & Loss Traceability"
        description="Operational record of inventory damaged or missing from warehouse fulfillment cycles"
        tag={
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-surface-raised border border-border text-text-muted tabular-nums">
            {reports.length} TOTAL INCIDENTS
          </span>
        }
      />

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex space-x-1.5">
          {(['ALL', 'DAMAGED', 'MISSING'] as const).map((type) => {
            const isActive = filterType === type;
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-surface-raised text-text font-semibold border border-border-active'
                    : 'text-text-muted hover:text-text hover:bg-surface-subtle border border-transparent'
                }`}
              >
                {type === 'ALL' ? 'All Incidents' : type === 'DAMAGED' ? 'Damaged Items' : 'Missing Items'}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            type="text"
            placeholder="Search item, booking, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-border-active"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12">
          <LoadingState />
        </div>
      ) : error ? (
        <div className="py-8">
          <ErrorState message={error} onRetry={() => loadReports(filterType)} />
        </div>
      ) : filteredReports.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No incidents reported"
          description={
            filterType === 'ALL'
              ? 'No damages or missing inventory have been recorded in the warehouse.'
              : `No ${filterType.toLowerCase()} reports found matching your criteria.`
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => {
            const isDamaged = report.type === 'DAMAGED';

            return (
              <div
                key={report.id}
                className="bg-surface border border-border rounded-xl p-4 hover:border-border-muted transition-colors flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-semibold text-text text-sm leading-snug">
                        {report.inventoryItemName}
                      </h2>
                      {report.sku && (
                        <div className="text-[11px] text-text-dim font-mono mt-0.5">
                          SKU: {report.sku}
                        </div>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider tabular-nums ${
                        isDamaged
                          ? 'bg-status-danger/10 text-status-danger border border-status-danger/20'
                          : 'bg-status-warning/10 text-status-warning border border-status-warning/20'
                      }`}
                    >
                      {report.quantity} {isDamaged ? 'DAMAGED' : 'MISSING'}
                    </span>
                  </div>

                  <div className="mt-3 p-3 bg-surface-raised border border-border rounded-lg space-y-2">
                    <div className="text-xs text-text-muted font-medium leading-relaxed italic">
                      &ldquo;{report.description}&rdquo;
                    </div>
                    <div className="text-[10px] text-text-dim flex items-center gap-1.5 pt-1.5 border-t border-border font-mono tabular-nums">
                      <Clock className="w-3 h-3" />
                      Reported {new Date(report.reportedAt).toLocaleDateString()} at{' '}
                      {new Date(report.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                  <div>
                    {report.bookingName ? (
                      <div className="text-text-muted text-[11px] truncate max-w-[170px]">
                        Origin: <strong className="text-text font-medium">{report.bookingName}</strong>
                      </div>
                    ) : (
                      <div className="text-text-dim text-[11px] italic">No linked booking</div>
                    )}
                  </div>

                  {report.bookingId && (
                    <Link
                      href={`/bookings/${report.bookingId}`}
                      className="px-2 py-1 bg-surface-raised hover:bg-surface-active text-text-muted hover:text-text border border-border text-[11px] rounded flex items-center gap-1 transition-colors"
                    >
                      <span>Booking</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
