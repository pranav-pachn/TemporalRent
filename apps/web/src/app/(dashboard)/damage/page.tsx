'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { DamageReportDTO } from '@/types/warehouse';
import { 
  AlertTriangle, 
  Search, 
  Calendar, 
  ArrowRight, 
  ShieldAlert, 
  PackageX, 
  HelpCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function DamagePage() {
  const [reports, setReports] = useState<DamageReportDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'DAMAGED' | 'MISSING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadReports = async (type: 'ALL' | 'DAMAGED' | 'MISSING') => {
    try {
      setLoading(true);
      const res = await apiClient.fetchDamageReports(type);
      setReports(res.data);
    } catch (e: any) {
      console.error('Failed to load damage reports', e);
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
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            Damage & Loss Traceability
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Operational record of inventory damaged or missing from warehouse fulfillment cycles.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div className="flex space-x-2">
          {(['ALL', 'DAMAGED', 'MISSING'] as const).map((type) => {
            const isActive = filterType === type;
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-neutral-800 text-white font-semibold border border-white/10'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                {type === 'ALL' ? 'All Incidents' : type === 'DAMAGED' ? 'Damaged Items' : 'Missing Items'}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search item, booking, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-700"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-neutral-400 py-16 text-center">Loading damage records...</div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-neutral-900 border border-white/5 rounded-2xl py-20 text-center">
          <ShieldAlert className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-white mb-1">No incidents reported</h3>
          <p className="text-neutral-400 text-sm">
            {filterType === 'ALL'
              ? 'No damages or missing inventory have been recorded.'
              : `No ${filterType.toLowerCase()} reports found.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => {
            const isDamaged = report.type === 'DAMAGED';

            return (
              <div
                key={report.id}
                className="bg-neutral-900 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-semibold text-white text-base">
                        {report.inventoryItemName}
                      </h2>
                      {report.sku && (
                        <div className="text-xs text-neutral-500 font-mono mt-0.5">
                          SKU: {report.sku}
                        </div>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                        isDamaged
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {report.quantity} {isDamaged ? 'DAMAGED' : 'MISSING'}
                    </span>
                  </div>

                  <div className="mt-4 p-3 bg-neutral-950 border border-white/5 rounded-xl space-y-2">
                    <div className="text-xs text-neutral-300 font-medium leading-relaxed">
                      "{report.description}"
                    </div>
                    <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 pt-1 border-t border-white/5">
                      <Clock className="w-3 h-3" />
                      Reported {new Date(report.reportedAt).toLocaleDateString()} at{' '}
                      {new Date(report.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <div>
                    {report.bookingName ? (
                      <div className="text-neutral-400">
                        Origin: <strong className="text-neutral-200">{report.bookingName}</strong>
                      </div>
                    ) : (
                      <div className="text-neutral-500 italic">No linked booking</div>
                    )}
                  </div>

                  {report.bookingId && (
                    <Link
                      href={`/bookings/${report.bookingId}`}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white rounded-md flex items-center gap-1 transition-colors"
                    >
                      View Booking
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
