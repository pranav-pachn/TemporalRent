import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { DashboardDTO } from '@/types/dashboard';

interface InventoryAlertsProps {
  alerts: DashboardDTO['inventoryAlerts'];
}

export function InventoryAlerts({ alerts }: InventoryAlertsProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm uppercase tracking-wider text-text-muted flex items-center space-x-2">
          <span>Inventory Alerts</span>
          {alerts.length > 0 && (
            <span className="bg-urgency-critical text-background text-xs font-bold px-2 py-0.5 rounded-full">
              {alerts.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {alerts.length === 0 ? (
          <div className="p-6 text-sm text-text-muted text-center">
            No inventory alerts requiring attention today.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {alerts.map((alert) => (
              <li key={alert.id} className="p-4 flex items-center justify-between hover:bg-surfaceHover transition-colors">
                <div>
                  <p className="font-medium text-text text-sm">{alert.name}</p>
                  <p className="text-xs text-text-muted mt-1">
                    {alert.committedQty} / {alert.totalQty} committed today
                  </p>
                </div>
                <Badge urgency={alert.urgency}>
                  {alert.urgency === 'critical' ? 'Critical' : 'Attention'}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
