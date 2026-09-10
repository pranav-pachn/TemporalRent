'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { CustomerDTO } from '@/types/bookings';
import { CreateCustomerModal } from '@/components/customers/CreateCustomerModal';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Users, Plus, Search, Mail, Phone, Trash2, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove customer "${name}"?`)) return;

    try {
      setDeletingId(id);
      await apiClient.deleteCustomer(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to remove customer');
    } finally {
      setDeletingId(null);
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-text">Customers</h1>
          </div>
          <p className="text-text-muted text-sm">
            Manage clients, event organizers, and venues for bookings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {customers.length > 0 && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      )}

      {/* Customer List */}
      {customers.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center border border-primary/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text">No Customers Yet</h3>
            <p className="text-text-muted text-sm mt-1">
              Add your first customer to start creating bookings and tracking event rentals.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Customer
          </button>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-muted text-sm">
          No customers matching "{search}"
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-background-dark text-text-muted border-b border-border">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">Customer</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Contact Details</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-background-dark/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center border border-primary/20 text-xs">
                          {cust.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-text">{cust.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {cust.email ? (
                          <div className="flex items-center gap-1.5 text-text-muted text-xs">
                            <Mail className="w-3.5 h-3.5 text-primary" />
                            <span>{cust.email}</span>
                          </div>
                        ) : null}
                        {cust.phone ? (
                          <div className="flex items-center gap-1.5 text-text-muted text-xs">
                            <Phone className="w-3.5 h-3.5 text-green-500" />
                            <span>{cust.phone}</span>
                          </div>
                        ) : null}
                        {!cust.email && !cust.phone && (
                          <span className="text-text-muted italic text-xs">No contact details</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/bookings/new`}
                          className="px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
                        >
                          Book For Client
                        </Link>
                        <button
                          onClick={() => handleDelete(cust.id, cust.name)}
                          disabled={deletingId === cust.id}
                          className="p-1.5 text-text-muted hover:text-urgency-critical hover:bg-urgency-critical/10 rounded-md transition-colors"
                          title="Delete customer"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
