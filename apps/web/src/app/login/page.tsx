'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient, setAuthToken } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { refetchSession } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.post('/api/v1/auth/login', { email, password });
      if (data.sessionToken) setAuthToken(data.sessionToken);
      await refetchSession();
      window.location.href = '/dashboard';
    } catch (e: any) {
      console.error('Login failed', e);
      setError(e.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-xl p-8 text-center space-y-8">
        <div>
          <Link href="/" className="text-3xl font-bold tracking-tight text-text inline-block mb-2 hover:text-primary transition-colors">
            TemporalRent
          </Link>
          <div className="font-mono text-xs font-semibold tracking-widest text-text-muted uppercase mt-2">
            Welcome back
          </div>
          <p className="text-text-muted text-sm mt-2">Manage inventory across every event.</p>
        </div>

        {error && (
          <div className="p-3 bg-status-conflict/10 border border-status-conflict/20 text-status-conflict rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <a 
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/google`}
            className="flex items-center justify-center gap-3 w-full bg-white text-black font-bold px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </a>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-border w-full"></div>
            <span className="bg-surface px-3 font-mono text-xs text-text-muted uppercase tracking-widest">or</span>
            <div className="border-t border-border w-full"></div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-text-muted">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-text"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-text-muted">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-text"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primaryHover text-primary-foreground font-bold px-4 py-3 rounded-lg transition-colors disabled:opacity-50 mt-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              <span>Sign in</span>
            </button>
          </form>
        </div>

        <div className="pt-4 border-t border-border">
          <Link href="/signup" className="text-sm font-medium text-text hover:text-primary transition-colors">
            New to TemporalRent? Create workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
