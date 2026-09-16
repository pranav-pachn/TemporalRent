import { StatCard } from '../ui/StatCard';
import { Calendar, Truck, Undo2 } from 'lucide-react';

interface TodaySummaryBarProps {
  events: number;
  dispatches: number;
  returns: number;
}

export function TodaySummaryBar({ events, dispatches, returns }: TodaySummaryBarProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        title="Events Active Today"
        value={events}
        subtitle="View scheduled timeline"
        icon={Calendar}
        accent="default"
        href="/calendar"
      />
      <StatCard
        title="Dispatches Required"
        value={dispatches}
        subtitle={dispatches > 0 ? "Outgoing warehouse queue" : "No dispatches pending"}
        icon={Truck}
        accent={dispatches > 0 ? "warning" : "default"}
        href="/dispatch"
      />
      <StatCard
        title="Returns Expected"
        value={returns}
        subtitle={returns > 0 ? "Check-in & inspection queue" : "No returns expected"}
        icon={Undo2}
        accent="default"
        href="/returns"
      />
    </div>
  );
}
