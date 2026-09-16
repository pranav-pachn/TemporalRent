import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { DashboardDTO } from '@/types/dashboard';
import { format } from 'date-fns';
import { CalendarDays, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface UpcomingBookingsProps {
  bookings: DashboardDTO['upcomingBookings'];
}

export function UpcomingBookings({ bookings }: UpcomingBookingsProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-3 px-4 flex items-center justify-between border-b border-border bg-surface-subtle">
        <CardTitle className="text-xs uppercase tracking-wider text-text-muted flex items-center gap-2 font-semibold">
          <CalendarDays className="w-3.5 h-3.5 text-primary" />
          <span>Upcoming Reservations</span>
        </CardTitle>
        <span className="text-[10px] font-mono text-text-muted tabular-nums">NEXT 7 DAYS</span>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        {bookings.length === 0 ? (
          <div className="p-6 text-xs text-text-muted text-center flex-1 flex flex-col items-center justify-center">
            <span>No upcoming reservations scheduled for the next 7 days.</span>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {bookings.map((booking) => {
              const eventDate = new Date(booking.eventDate);
              return (
                <li key={booking.id} className="p-3 flex items-center justify-between hover:bg-surface-raised transition-colors">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="flex flex-col items-center justify-center bg-surface-raised border border-border rounded px-2 py-1 text-center min-w-[2.75rem] shrink-0">
                      <span className="text-[10px] font-medium text-text-dim uppercase leading-none">{format(eventDate, 'MMM')}</span>
                      <span className="text-xs font-mono font-bold text-text tabular-nums leading-tight mt-0.5">{format(eventDate, 'd')}</span>
                    </div>
                    <div className="min-w-0">
                      <Link 
                        href={`/bookings/${booking.id}`} 
                        className="text-xs font-medium text-text hover:text-primary transition-colors block truncate"
                      >
                        {booking.clientName}
                      </Link>
                      <p className="text-[11px] text-text-muted">{format(eventDate, 'EEEE')}</p>
                    </div>
                  </div>
                  <StatusBadge status={booking.status} size="sm" />
                </li>
              );
            })}
          </ul>
        )}
        <div className="p-2.5 border-t border-border mt-auto bg-surface-subtle/50 text-right">
          <Link 
            href="/bookings" 
            className="text-[11px] font-medium text-primary hover:text-primaryHover inline-flex items-center gap-1"
          >
            <span>All Bookings</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
