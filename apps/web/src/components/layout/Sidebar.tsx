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
    <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-border h-screen sticky top-0">
      <div className="p-5 border-b border-border/60">
        <div className="font-bold text-xl text-primary flex items-center space-x-2">
          <span>TemporalRent</span>
        </div>
        {business?.name && (
          <div className="mt-2.5 flex items-center gap-1.5 px-2.5 py-1.5 bg-surfaceHover border border-border rounded-lg text-xs font-medium text-text">
            <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{business.name}</span>
          </div>
        )}
      </div>
      
      <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-8">
        {navGroups.map((group) => (
          <div key={group.label}>
            <h3 className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider px-2">
              {group.label}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-2 py-2 rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-text-muted hover:bg-surfaceHover hover:text-text'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
