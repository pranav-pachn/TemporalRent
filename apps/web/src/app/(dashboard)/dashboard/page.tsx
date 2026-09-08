import { Suspense } from 'react';
import { apiClient } from '@/lib/api';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { TodaySummaryBar } from '@/components/dashboard/TodaySummaryBar';
import { InventoryAlerts } from '@/components/dashboard/InventoryAlerts';
import { TodayOperations } from '@/components/dashboard/TodayOperations';
import { UpcomingBookings } from '@/components/dashboard/UpcomingBookings';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';

// In a real implementation with auth, this token would come from cookies/session
const dummyAuthHeader = {
  // We'll pass some stub headers just to make the backend happy for phase 22 if needed,
  // But Next.js Server Components need to pass cookies from next/headers in real app.
};

async function DashboardContent() {
  try {
    const data = await apiClient.fetchDashboard({
      headers: {
        // "Authorization": `Bearer ...`
      },
      next: { revalidate: 60 } // Cache for 60s
    });

    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <DashboardHeader userName={data.user.name} />
        <TodaySummaryBar {...data.today} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <InventoryAlerts alerts={data.inventoryAlerts} />
          </div>
          <div className="lg:col-span-1">
            <TodayOperations 
              dispatches={data.todayDispatches}
              returns={data.todayReturns} 
            />
          </div>
          <div className="lg:col-span-1">
            <UpcomingBookings bookings={data.upcomingBookings} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.warn("Dashboard fetch failed, falling back to mock data for demonstration:", error);
    
    const mockData = {
      user: { name: 'Admin (Demo Mode)' },
      today: { events: 12, dispatches: 8, returns: 5 },
      inventoryAlerts: [
        { id: '1', name: 'QSC K12.2 Speakers', totalQty: 10, committedQty: 10, availableQty: 0, urgency: 'attention' as const },
        { id: '2', name: 'Chauvet Wash Lights', totalQty: 8, committedQty: 12, availableQty: -4, urgency: 'critical' as const }
      ],
      todayDispatches: [
        { id: '1', bookingId: 'b1', clientName: 'Stark Industries', scheduledTime: new Date().toISOString(), itemCount: 4, status: 'PICKING' },
        { id: '2', bookingId: 'b2', clientName: 'Wayne Enterprises', scheduledTime: new Date(Date.now() + 3600000).toISOString(), itemCount: 12, status: 'READY' }
      ],
      todayReturns: [
        { id: '3', bookingId: 'b3', clientName: 'Oscorp', scheduledTime: new Date().toISOString(), itemCount: 6, status: 'EXPECTED' }
      ],
      upcomingBookings: [
        { id: '4', clientName: 'Daily Planet', eventDate: new Date(Date.now() + 86400000).toISOString(), status: 'CONFIRMED' }
      ]
    };

    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="bg-urgency-attention/10 text-urgency-attention p-3 rounded-md text-sm mb-4 border border-urgency-attention/20">
          Showing mock data because backend authentication is not fully configured yet.
        </div>
        <DashboardHeader userName={mockData.user.name} />
        <TodaySummaryBar {...mockData.today} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <InventoryAlerts alerts={mockData.inventoryAlerts} />
          </div>
          <div className="lg:col-span-1">
            <TodayOperations 
              dispatches={mockData.todayDispatches}
              returns={mockData.todayReturns} 
            />
          </div>
          <div className="lg:col-span-1">
            <UpcomingBookings bookings={mockData.upcomingBookings} />
          </div>
        </div>
      </div>
    );
  }
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-6 max-w-7xl mx-auto"><LoadingState /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
