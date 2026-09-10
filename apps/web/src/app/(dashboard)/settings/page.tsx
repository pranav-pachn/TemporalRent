'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api';

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
        setMessage({ type: 'error', text: 'Failed to load settings' });
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
      setMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-text mb-6 capitalize">Settings</h1>

      {message && (
        <div className={`p-4 mb-6 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Operational Buffers Section */}
        <section className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-brand-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text">Operational Buffers</h2>
              <p className="text-sm text-neutral-400">Default inventory buffer</p>
            </div>
          </div>
          
          <div className="p-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Before event</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={beforeHours}
                    onChange={(e) => setBeforeHours(parseInt(e.target.value) || 0)}
                    className="w-24 bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                  <span className="text-neutral-400 text-sm">hours</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">After event</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={afterHours}
                    onChange={(e) => setAfterHours(parseInt(e.target.value) || 0)}
                    className="w-24 bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                  <span className="text-neutral-400 text-sm">hours</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-neutral-400 leading-relaxed bg-neutral-900/50 p-4 rounded-lg border border-white/5">
              These buffers reserve inventory before and after an event for preparation, transportation, setup, pickup, and reconciliation.
            </p>

            <div className="flex justify-end pt-4 border-t border-border">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
