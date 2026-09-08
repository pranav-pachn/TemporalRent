import { format } from 'date-fns';

interface DashboardHeaderProps {
  userName: string;
  // This could take a timezone if we want the client to format it locally, 
  // or just use the system's local time if it's acceptable for the frontend.
  // We'll format the local date.
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  // Normally, we'd use the business timezone to render this date accurately.
  // Assuming the user's browser is somewhat aligned or using a server-passed date string.
  // For now, we'll format the current date.
  const today = new Date();
  
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-text mb-1">
        Good morning, {userName}
      </h1>
      <p className="text-text-muted">
        {format(today, 'EEEE, MMMM d')}
      </p>
    </div>
  );
}
