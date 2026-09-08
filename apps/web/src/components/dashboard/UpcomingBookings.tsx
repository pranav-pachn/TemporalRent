import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { DashboardDTO } from '@/types/dashboard';
import { format } from 'date-fns';

interface UpcomingBookingsProps {
  bookings: DashboardDTO['upcomingBookings'];
}

export function UpcomingBookings({ bookings }: UpcomingBookingsProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm uppercase tracking-wider text-text-muted">
          Upcoming Bookings
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {bookings.length === 0 ? (
          <div className="p-6 text-sm text-text-muted text-center">
            No upcoming bookings in the next 7 days.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {bookings.map((booking) => {
              const eventDate = new Date(booking.eventDate);
              return (
                <li key={booking.id} className="p-4 flex items-center justify-between hover:bg-surfaceHover transition-colors">
                  <div className="grid grid-cols-[60px_1fr] gap-4 w-full">
                    <div className="flex flex-col items-center justify-center bg-surface border border-border rounded-md px-2 py-1 text-center min-w-[3rem]">
                      <span className="text-xs text-text-muted uppercase">{format(eventDate, 'MMM')}</span>
                      <span className="text-sm font-bold text-text leading-tight">{format(eventDate, 'd')}</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text">{booking.clientName}</p>
                        <p className="text-xs text-text-muted mt-0.5">{format(eventDate, 'EEEE')}</p>
                      </div>
                      <div className="mt-2 md:mt-0">
                        <Badge>{booking.status}</Badge>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
