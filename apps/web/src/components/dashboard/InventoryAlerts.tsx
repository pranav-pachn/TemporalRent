import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { DashboardDTO } from '@/types/dashboard';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface InventoryAlertsProps {
  alerts: DashboardDTO['inventoryAlerts'];
}

export function InventoryAlerts({ alerts }: InventoryAlertsProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-3 px-4 flex items-center justify-between border-b border-border bg-surface-subtle">
        <CardTitle className="text-xs uppercase tracking-wider text-text-muted flex items-center gap-2 font-semibold">
          <AlertTriangle className="w-3.5 h-3.5 text-status-warning" />
          <span>Inventory Pressure Alerts</span>
        </CardTitle>
        {alerts.length > 0 && (
          <span className="bg-status-danger/15 text-status-danger border border-status-danger/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full tabular-nums">
            {alerts.length} SHORTAGE{alerts.length > 1 ? 'S' : ''}
          </span>
        )}
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        {alerts.length === 0 ? (
          <div className="p-6 text-xs text-text-muted text-center flex-1 flex flex-col items-center justify-center">
            <span className="text-status-safe font-medium mb-1">Stock Buffers Optimal</span>
            <span>No critical inventory shortages detected for today.</span>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {alerts.map((alert) => (
              <li key={alert.id} className="p-3.5 flex items-center justify-between hover:bg-surface-raised transition-colors">
                <div className="min-w-0 pr-3">
                  <p className="font-medium text-text text-xs truncate">{alert.name}</p>
                  <p className="text-[11px] font-mono text-text-muted mt-0.5 tabular-nums">
                    Committed: <span className="text-text font-semibold">{alert.committedQty}</span> / {alert.totalQty} units
                  </p>
                </div>
                <StatusBadge 
                  status={alert.urgency === 'critical' ? 'CONFLICT' : 'PENDING'} 
                  label={alert.urgency === 'critical' ? 'Critical Shortage' : 'Buffer Warning'}
                  size="sm"
                />
              </li>
            ))}
          </ul>
        )}
        <div className="p-2.5 border-t border-border mt-auto bg-surface-subtle/50 text-right">
          <Link 
            href="/inventory" 
            className="text-[11px] font-medium text-primary hover:text-primaryHover inline-flex items-center gap-1"
          >
            <span>View All Stock</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
