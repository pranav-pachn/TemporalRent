import { Card, CardContent } from '../ui/Card';
import { Calendar, Truck, Undo2 } from 'lucide-react';

interface TodaySummaryBarProps {
  events: number;
  dispatches: number;
  returns: number;
}

export function TodaySummaryBar({ events, dispatches, returns }: TodaySummaryBarProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card>
        <CardContent className="py-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-muted mb-1">Events Today</p>
            <p className="text-3xl font-bold text-text">{events}</p>
          </div>
          <div className="bg-primary/10 p-3 rounded-full">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="py-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-muted mb-1">Dispatches</p>
            <p className="text-3xl font-bold text-text">{dispatches}</p>
          </div>
          <div className="bg-surfaceHover p-3 rounded-full border border-border">
            <Truck className="h-6 w-6 text-text-muted" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-muted mb-1">Returns</p>
            <p className="text-3xl font-bold text-text">{returns}</p>
          </div>
          <div className="bg-surfaceHover p-3 rounded-full border border-border">
            <Undo2 className="h-6 w-6 text-text-muted" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
