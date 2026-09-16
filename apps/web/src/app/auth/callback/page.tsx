'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setAuthToken } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refetchSession } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const next = searchParams.get('next') || '/dashboard';
    const error = searchParams.get('error');

    if (error) {
      router.replace(`/login?error=${error}`);
      return;
    }

    if (token) {
      setAuthToken(token);
      // Refetch session so AuthProvider has the user before we navigate
      refetchSession().then(() => {
        router.replace(next);
      });
    } else {
      router.replace('/login?error=missing_token');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-text-muted text-sm">Signing you in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-sm">Loading…</p>
        </div>
      }>
        <AuthCallbackContent />
      </Suspense>
    </div>
  );
}
