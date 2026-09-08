'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, LayoutDashboard, Package, Boxes, Truck, Undo2, AlertTriangle, ScrollText, Settings, CalendarDays } from 'lucide-react';

const navGroups = [
  {
    label: 'OVERVIEW',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Calendar', href: '/calendar', icon: CalendarDays },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { name: 'Bookings', href: '/bookings', icon: ScrollText },
      { name: 'Inventory', href: '/inventory', icon: Boxes },
      { name: 'Packages', href: '/packages', icon: Package },
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
    label: 'SYSTEM',
    items: [
      { name: 'Audit Log', href: '/audit', icon: ScrollText },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-border h-screen sticky top-0">
      <div className="p-6">
        <div className="font-bold text-xl text-primary flex items-center space-x-2">
          <span>TemporalRent</span>
        </div>
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
