import { format } from 'date-fns';

interface DashboardHeaderProps {
  businessName?: string;
  userName: string;
}

export function DashboardHeader({ businessName, userName }: DashboardHeaderProps) {
  const today = new Date();
  
  return (
    <div className="mb-8">
      {businessName && (
        <div className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-primary mb-1">
          {businessName}
        </div>
      )}
      <h1 className="text-2xl sm:text-3xl font-bold text-text mb-1">
        Welcome, {userName}
      </h1>
      <p className="text-text-muted text-sm">
        {format(today, 'EEEE, MMMM d, yyyy')}
      </p>
    </div>
  );
}
