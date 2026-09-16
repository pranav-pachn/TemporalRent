'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { CustomerDTO } from '@/types/bookings';
import { X, UserPlus, AlertCircle, Check, Loader2 } from 'lucide-react';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: CustomerDTO) => void;
}

export function CreateCustomerModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateCustomerModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Customer name is required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient.createCustomer({
        name: name.trim(),
        email: email.trim() ? email.trim() : undefined,
        phone: phone.trim() ? phone.trim() : undefined,
      });

      setName('');
      setEmail('');
      setPhone('');
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      console.error('Failed to create customer:', err);
      setError(err.message || 'Failed to create customer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-none animate-in fade-in duration-150">
      <div className="bg-surface border border-border-muted rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-border bg-surface-raised flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-surface-subtle text-text border border-border">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text">New Client / Customer</h2>
              <p className="text-xs text-text-muted">Register a client for reservation tracking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text hover:bg-surface-subtle rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-status-danger/10 border border-status-danger/25 text-status-danger text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <div>
            <label htmlFor="custName" className="block text-xs font-semibold text-text mb-1">
              Customer / Organizer Name <span className="text-status-danger">*</span>
            </label>
            <input
              id="custName"
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apex Events / Sarah Jenkins"
              className="w-full px-3 py-2 bg-surface-raised border border-border rounded-lg text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-border-active transition-colors"
            />
          </div>

          <div>
            <label htmlFor="custEmail" className="block text-xs font-semibold text-text mb-1">
              Email Address
            </label>
            <input
              id="custEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. contact@apexevents.com"
              className="w-full px-3 py-2 bg-surface-raised border border-border rounded-lg text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-border-active transition-colors"
            />
          </div>

          <div>
            <label htmlFor="custPhone" className="block text-xs font-semibold text-text mb-1">
              Phone Number
            </label>
            <input
              id="custPhone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +1 (555) 019-2834"
              className="w-full px-3 py-2 bg-surface-raised border border-border rounded-lg text-xs text-text font-mono placeholder:text-text-dim focus:outline-none focus:border-border-active transition-colors"
            />
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-text-muted hover:text-text hover:bg-surface-raised rounded-lg border border-border transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Save Customer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
