'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, LayoutDashboard, Package, Boxes, Truck, Undo2, AlertTriangle, ScrollText, Settings, CalendarDays, Building2, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const navGroups = [
  {
    label: 'OPERATIONS',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Calendar', href: '/calendar', icon: CalendarDays },
      { name: 'Bookings', href: '/bookings', icon: ScrollText },
      { name: 'Customers', href: '/customers', icon: Users },
    ],
  },
  {
    label: 'WAREHOUSE',
    items: [
      { name: 'Dispatch', href: '/dispatch', icon: Truck },
      { name: 'Returns', href: '/returns', icon: Undo2 },
      { name: 'Damage', href: '/damage', icon: AlertTriangle },
    ],
  },
  {
    label: 'INVENTORY',
    items: [
      { name: 'Inventory', href: '/inventory', icon: Boxes },
      { name: 'Packages', href: '/packages', icon: Package },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { name: 'Audit Log', href: '/audit', icon: ScrollText },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { business } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-60 bg-surface border-r border-border h-screen sticky top-0 shrink-0 select-none">
      <div className="p-4 border-b border-border/80">
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight text-text">
            Temporal<span className="text-primary">Rent</span>
          </span>
          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface-raised border border-border text-text-dim">
            B2B
          </span>
        </div>
        {business?.name && (
          <div className="mt-3 flex items-center gap-2 px-2.5 py-1.5 bg-surface-raised border border-border rounded-md text-xs font-medium text-text">
            <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{business.name}</span>
          </div>
        )}
      </div>
      
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <h3 className="text-[10px] font-semibold text-text-dim mb-1.5 uppercase tracking-wider px-2">
              {group.label}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-surface-active text-text font-semibold border-l-2 border-primary shadow-sm'
                        : 'text-text-muted hover:bg-surface-raised hover:text-text'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-text-muted'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-border/80 text-[11px] text-text-dim flex items-center justify-between">
        <span>Engine: Temporal 1.0</span>
        <span className="w-2 h-2 rounded-full bg-status-safe"></span>
      </div>
    </aside>
  );
}
