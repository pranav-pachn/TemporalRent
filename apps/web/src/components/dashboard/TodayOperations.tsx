import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { DashboardDTO } from '@/types/dashboard';
import { format } from 'date-fns';

interface TodayOperationsProps {
  dispatches: DashboardDTO['todayDispatches'];
  returns: DashboardDTO['todayReturns'];
}

export function TodayOperations({ dispatches, returns }: TodayOperationsProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm uppercase tracking-wider text-text-muted">
          Today's Operations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        
        {/* Dispatches Section */}
        <div className="border-b border-border last:border-0">
          <div className="bg-surfaceHover px-4 py-2 text-xs font-semibold text-text-muted uppercase">
            Dispatches
          </div>
          {dispatches.length === 0 ? (
            <div className="p-4 text-sm text-text-muted">No dispatches scheduled for today.</div>
          ) : (
            <ul className="divide-y divide-border">
              {dispatches.map((dispatch) => (
                <li key={dispatch.id} className="p-4 flex items-center justify-between hover:bg-surfaceHover transition-colors">
                  <div className="grid grid-cols-[60px_1fr] gap-4 w-full">
                    <div className="text-sm text-text-muted font-medium">
                      {dispatch.scheduledTime ? format(new Date(dispatch.scheduledTime), 'HH:mm') : '--:--'}
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text">{dispatch.clientName}</p>
                        <p className="text-xs text-text-muted mt-0.5">{dispatch.itemCount} items</p>
                      </div>
                      <div className="mt-2 md:mt-0">
                        <Badge 
                          urgency={dispatch.status === 'READY' ? 'success' : dispatch.status === 'PICKING' ? 'attention' : 'normal'}
                        >
                          {dispatch.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Returns Section */}
        <div>
          <div className="bg-surfaceHover px-4 py-2 text-xs font-semibold text-text-muted uppercase border-t border-border">
            Returns
          </div>
          {returns.length === 0 ? (
            <div className="p-4 text-sm text-text-muted">No returns expected today.</div>
          ) : (
            <ul className="divide-y divide-border">
              {returns.map((ret) => (
                <li key={ret.id} className="p-4 flex items-center justify-between hover:bg-surfaceHover transition-colors">
                  <div className="grid grid-cols-[60px_1fr] gap-4 w-full">
                    <div className="text-sm text-text-muted font-medium">
                      {ret.scheduledTime ? format(new Date(ret.scheduledTime), 'HH:mm') : '--:--'}
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text">{ret.clientName}</p>
                        <p className="text-xs text-text-muted mt-0.5">{ret.itemCount} items</p>
                      </div>
                      <div className="mt-2 md:mt-0">
                        <Badge 
                          urgency={ret.status === 'EXPECTED' ? 'attention' : ret.status === 'INSPECTION' ? 'normal' : 'success'}
                        >
                          {ret.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
