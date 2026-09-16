import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { DashboardDTO } from '@/types/dashboard';
import { format } from 'date-fns';
import { Truck, Undo2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface TodayOperationsProps {
  dispatches: DashboardDTO['todayDispatches'];
  returns: DashboardDTO['todayReturns'];
}

export function TodayOperations({ dispatches, returns }: TodayOperationsProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-3 px-4 flex items-center justify-between border-b border-border bg-surface-subtle">
        <CardTitle className="text-xs uppercase tracking-wider text-text-muted flex items-center gap-2 font-semibold">
          <Truck className="w-3.5 h-3.5 text-primary" />
          <span>Today's Warehouse Queue</span>
        </CardTitle>
        <span className="text-[10px] font-mono text-text-muted tabular-nums">
          {dispatches.length + returns.length} JOBS
        </span>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        
        {/* Dispatches Section */}
        <div className="border-b border-border/80 flex-1">
          <div className="bg-surface-raised px-4 py-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Truck className="w-3 h-3 text-primary" />
              <span>Outbound Dispatches</span>
            </span>
            <span className="font-mono tabular-nums text-text-dim">{dispatches.length}</span>
          </div>
          {dispatches.length === 0 ? (
            <div className="p-4 text-xs text-text-muted text-center">No dispatches scheduled today.</div>
          ) : (
            <ul className="divide-y divide-border/60">
              {dispatches.map((dispatch) => (
                <li key={dispatch.id} className="p-3 flex items-center justify-between hover:bg-surface-raised transition-colors">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="text-xs font-mono font-medium text-text-muted tabular-nums bg-surface-subtle px-1.5 py-0.5 rounded border border-border shrink-0">
                      {dispatch.scheduledTime ? format(new Date(dispatch.scheduledTime), 'HH:mm') : '--:--'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text truncate">{dispatch.clientName}</p>
                      <p className="text-[11px] text-text-muted tabular-nums">{dispatch.itemCount} items scheduled</p>
                    </div>
                  </div>
                  <StatusBadge 
                    status={dispatch.status === 'READY' ? 'CONFIRMED' : dispatch.status === 'PICKING' ? 'PENDING' : 'DRAFT'}
                    label={dispatch.status}
                    size="sm"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Returns Section */}
        <div className="flex-1">
          <div className="bg-surface-raised px-4 py-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Undo2 className="w-3 h-3 text-status-info" />
              <span>Inbound Returns</span>
            </span>
            <span className="font-mono tabular-nums text-text-dim">{returns.length}</span>
          </div>
          {returns.length === 0 ? (
            <div className="p-4 text-xs text-text-muted text-center">No returns expected today.</div>
          ) : (
            <ul className="divide-y divide-border/60">
              {returns.map((ret) => (
                <li key={ret.id} className="p-3 flex items-center justify-between hover:bg-surface-raised transition-colors">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="text-xs font-mono font-medium text-text-muted tabular-nums bg-surface-subtle px-1.5 py-0.5 rounded border border-border shrink-0">
                      {ret.scheduledTime ? format(new Date(ret.scheduledTime), 'HH:mm') : '--:--'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text truncate">{ret.clientName}</p>
                      <p className="text-[11px] text-text-muted tabular-nums">{ret.itemCount} items to inspect</p>
                    </div>
                  </div>
                  <StatusBadge 
                    status={ret.status === 'EXPECTED' ? 'PENDING' : ret.status === 'INSPECTION' ? 'MAINTENANCE' : 'CONFIRMED'}
                    label={ret.status}
                    size="sm"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-2.5 border-t border-border mt-auto bg-surface-subtle/50 flex items-center justify-between text-[11px] font-medium text-primary">
          <Link href="/dispatch" className="hover:text-primaryHover inline-flex items-center gap-0.5">
            <span>Dispatch Queue</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
          <Link href="/returns" className="hover:text-primaryHover inline-flex items-center gap-0.5">
            <span>Returns Queue</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
