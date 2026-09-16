import { PageHeader } from '../ui/PageHeader';
import { Plus, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface DashboardHeaderProps {
  businessName?: string;
  userName: string;
}

export function DashboardHeader({ businessName, userName }: DashboardHeaderProps) {
  return (
    <PageHeader
      title={`Welcome, ${userName}`}
      description={businessName ? `Operations Command Center · ${businessName}` : 'Operations Command Center'}
      tag={
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-status-safe/10 border border-status-safe/25 text-[11px] font-medium text-status-safe">
          <span className="w-1.5 h-1.5 rounded-full bg-status-safe"></span>
          <span>Engine Active</span>
        </div>
      }
      actions={
        <Link
          href="/bookings/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primaryHover transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Reservation</span>
        </Link>
      }
    />
  );
}
