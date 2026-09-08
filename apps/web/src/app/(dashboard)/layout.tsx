'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { MobileNav } from '../../components/layout/MobileNav';
import { useAuth } from '../../hooks/useAuth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, business, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (!business) {
        router.push('/setup');
      }
    }
  }, [user, business, isLoading, router]);

  if (isLoading || !user || !business) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      
      <div className="flex flex-col flex-1 pb-20 md:pb-0">
        <Topbar />
        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
