'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [beforeHours, setBeforeHours] = useState<number>(0);
  const [afterHours, setAfterHours] = useState<number>(0);

  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await apiClient.getBusinessSettings();
        setBeforeHours(data.defaultBufferBeforeMinutes / 60);
        setAfterHours(data.defaultBufferAfterMinutes / 60);
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to load business settings' });
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiClient.updateBusinessSettings({
        defaultBufferBeforeMinutes: beforeHours * 60,
        defaultBufferAfterMinutes: afterHours * 60,
      });
      setMessage({ type: 'success', text: 'Operational settings saved successfully.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex justify-center py-16">
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title="Operational Settings"
        description="Configure default temporal buffer windows, prep lead times, and turnaround intervals"
        tag={
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-surface-raised border border-border text-text-muted tabular-nums">
            WORKSPACE POLICY
          </span>
        }
      />

      {message && (
        <div className={`p-3.5 rounded-lg flex items-center justify-between text-xs font-medium border ${
          message.type === 'success' 
            ? 'bg-status-safe/10 text-status-safe border-status-safe/25' 
            : 'bg-status-danger/10 text-status-danger border-status-danger/25'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-text-muted hover:text-text font-bold">
            &times;
          </button>
        </div>
      )}

      <div className="space-y-6">
        {/* Operational Buffers Section */}
        <section className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-border bg-surface-raised flex items-center gap-3">
            <div className="p-2 bg-surface-subtle border border-border rounded-lg text-text">
              <Clock className="w-4 h-4 text-text-dim" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text">Temporal Buffer Windows</h2>
              <p className="text-xs text-text-muted">Automatic protection periods wrapped around every reservation</p>
            </div>
          </div>
          
          <div className="p-5 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Pre-Event Buffer (Prep & Transit)
                </label>
                <div className="flex items-center gap-2.5">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={beforeHours}
                    onChange={(e) => setBeforeHours(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-28 bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text font-mono tabular-nums focus:outline-none focus:border-border-active transition-colors"
                  />
                  <span className="text-text-muted text-xs font-medium">hours prior</span>
                </div>
                <p className="text-[11px] text-text-dim">
                  Covers picking, staging, QC inspection, and transport delivery.
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Post-Event Buffer (Turnaround & QC)
                </label>
                <div className="flex items-center gap-2.5">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={afterHours}
                    onChange={(e) => setAfterHours(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-28 bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text font-mono tabular-nums focus:outline-none focus:border-border-active transition-colors"
                  />
                  <span className="text-text-muted text-xs font-medium">hours after</span>
                </div>
                <p className="text-[11px] text-text-dim">
                  Covers pickup transit, physical check-in, cleaning, and maintenance check.
                </p>
              </div>
            </div>

            <div className="text-xs text-text-muted leading-relaxed bg-surface-raised p-4 rounded-lg border border-border space-y-1">
              <span className="font-semibold text-text block">Safety Guarantee:</span>
              <p>
                The TemporalRent engine automatically expands reservation locks by these durations. Other bookings attempting to overlap the expanded window will trigger capacity alerts or conflicts to prevent double-booking.
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors shadow-sm"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
