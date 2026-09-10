'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { DashboardDTO } from '@/types/dashboard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { TodaySummaryBar } from '@/components/dashboard/TodaySummaryBar';
import { InventoryAlerts } from '@/components/dashboard/InventoryAlerts';
import { TodayOperations } from '@/components/dashboard/TodayOperations';
import { UpcomingBookings } from '@/components/dashboard/UpcomingBookings';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const router = useRouter();
  const { user: authUser, business: authBusiness } = useAuth();
  const [data, setData] = useState<DashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.fetchDashboard();
      setData(res);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      if (err.status === 401 || err.code === 'UNAUTHENTICATED') {
        router.push('/login');
        return;
      }
      if (err.status === 403 && err.code === 'ONBOARDING_INCOMPLETE') {
        router.push('/setup');
        return;
      }
      setError(err.message || 'Failed to load dashboard operational data');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <LoadingState />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorState 
          message={error || 'Failed to load operational data'} 
          onRetry={loadDashboard} 
        />
      </div>
    );
  }

  const businessName = data.business?.name || authBusiness?.name;
  const userName = data.user?.name || authUser?.name || 'User';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <DashboardHeader businessName={businessName} userName={userName} />
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
}
