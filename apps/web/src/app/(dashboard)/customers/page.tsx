'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { CustomerDTO } from '@/types/bookings';
import { CreateCustomerModal } from '@/components/customers/CreateCustomerModal';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Users, Plus, Search, Mail, Phone, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Confirm Delete Dialog state
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.fetchCustomers();
      setCustomers(res.data);
    } catch (err: any) {
      console.error('Failed to load customers:', err);
      if (err.status === 401 || err.code === 'UNAUTHENTICATED') {
        router.push('/login');
        return;
      }
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    try {
      setIsDeleting(true);
      await apiClient.deleteCustomer(pendingDelete.id);
      setCustomers((prev) => prev.filter((c) => c.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err: any) {
      alert(err.message || 'Failed to remove customer');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorState message={error} onRetry={loadCustomers} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title="Customers & Organizers"
        description="Manage clients, corporate organizers, and event venues for reservation assignments"
        tag={
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-surface-raised border border-border text-text-muted tabular-nums">
            {customers.length} REGISTERED CLIENTS
          </span>
        }
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Customer
          </button>
        }
      />

      {/* Search Bar */}
      {customers.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-text-dim absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-border-active"
          />
        </div>
      )}

      {/* Customer List */}
      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Customers Yet"
          description="Add your first client to start creating reservations and scheduling inventory."
          action={
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Customer
            </button>
          }
        />
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-muted text-xs">
          No clients matching &ldquo;{search}&rdquo;
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-surface-subtle text-text-muted border-b border-border uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th scope="col" className="px-5 py-3">Client / Organization</th>
                  <th scope="col" className="px-5 py-3">Contact Information</th>
                  <th scope="col" className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-raised text-text font-bold flex items-center justify-center border border-border text-xs font-mono">
                          {cust.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-text text-sm">{cust.name}</div>
                          <div className="text-[10px] text-text-dim font-mono">ID: {cust.id.substring(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="space-y-1">
                        {cust.email ? (
                          <div className="flex items-center gap-1.5 text-text-muted text-xs">
                            <Mail className="w-3.5 h-3.5 text-text-dim" />
                            <span>{cust.email}</span>
                          </div>
                        ) : null}
                        {cust.phone ? (
                          <div className="flex items-center gap-1.5 text-text-muted text-xs font-mono tabular-nums">
                            <Phone className="w-3.5 h-3.5 text-text-dim" />
                            <span>{cust.phone}</span>
                          </div>
                        ) : null}
                        {!cust.email && !cust.phone && (
                          <span className="text-text-dim italic text-xs">No direct contacts</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href="/bookings/new"
                          className="px-2.5 py-1 text-xs font-medium text-text bg-surface-raised hover:bg-surface-active border border-border rounded-md transition-colors"
                        >
                          Book For Client
                        </Link>
                        <button
                          onClick={() => setPendingDelete({ id: cust.id, name: cust.name })}
                          className="p-1.5 text-text-dim hover:text-status-danger hover:bg-status-danger/10 rounded-md transition-colors"
                          title="Remove customer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Customer Modal */}
      <CreateCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(newCust) => {
          setCustomers((prev) => [newCust, ...prev]);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="Remove Customer"
        description={`Are you sure you want to remove customer "${pendingDelete?.name}"? Historical bookings will retain customer metadata.`}
        confirmLabel="Remove Customer"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
