'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

export default function SetupPage() {
  const [businessName, setBusinessName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refetchSession } = useAuth();

  useEffect(() => {
    try {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      setTimezone('UTC');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.post('/api/v1/auth/workspace-setup', {
        businessName,
        timezone
      });
      await refetchSession();
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Failed to create workspace. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-xl p-8 space-y-8">
        
        <div className="text-center space-y-2">
          <div className="font-mono text-xs font-semibold tracking-widest text-text-muted uppercase">
            Create Your Workspace
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text">
            Finalize Setup
          </h1>
          <p className="text-text-muted text-sm">
            We'll use this information for calendars, event dates, and operational boundaries.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-status-conflict/10 border border-status-conflict/20 text-status-conflict rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="businessName" className="block text-sm font-semibold text-text-muted">
              Business name
            </label>
            <input
              id="businessName"
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Acme Event Rentals"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-text"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="timezone" className="block text-sm font-semibold text-text-muted">
              Business timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-text"
            >
              {timezone && <option value={timezone}>{timezone}</option>}
              <option value="Asia/Kolkata">Asia/Kolkata</option>
              <option value="America/New_York">America/New_York</option>
              <option value="America/Los_Angeles">America/Los_Angeles</option>
              <option value="Europe/London">Europe/London</option>
              <option value="UTC">UTC</option>
            </select>
            <p className="text-xs font-mono text-text-muted pt-1">
              {timezone ? 'Detected from your browser' : 'Select your operational timezone'}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:bg-primaryHover transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating Workspace...' : 'Create Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
}
