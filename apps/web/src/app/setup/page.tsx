'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

export default function SetupPage() {
  const [businessName, setBusinessName] = useState('');
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refetchSession } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.post('/api/v1/auth/workspace-setup', {
        businessName,
        name,
        timezone
      });
      await refetchSession();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create workspace. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Welcome to TemporalRent</h1>
          <p className="text-text-muted">Let's set up your workspace.</p>
        </div>

        {error && (
          <div className="bg-urgency-critical/10 text-urgency-critical p-3 rounded-md mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="businessName" className="block text-sm font-medium text-text-muted">
              Business name
            </label>
            <input
              id="businessName"
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Sharma Events"
              className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-text-muted">
              Your name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Amit Sharma"
              className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="timezone" className="block text-sm font-medium text-text-muted">
              Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:border-primary transition-colors"
            >
              <option value="Asia/Kolkata">Asia/Kolkata</option>
              <option value="America/New_York">America/New_York</option>
              <option value="America/Los_Angeles">America/Los_Angeles</option>
              <option value="Europe/London">Europe/London</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primaryHover transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating Workspace...' : 'Create Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
}
