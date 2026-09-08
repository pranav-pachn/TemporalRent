'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Calendar, LayoutDashboard, Package, Boxes, Truck, Undo2, AlertTriangle, ScrollText, Settings } from 'lucide-react';

const navGroups = [
  {
    label: 'OVERVIEW',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Calendar', href: '/calendar', icon: Calendar },
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

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-4 flex justify-around items-center z-50">
        <Link href="/dashboard" className={`p-2 rounded-md ${pathname === '/dashboard' ? 'text-primary' : 'text-text-muted'}`}>
          <LayoutDashboard className="h-6 w-6" />
        </Link>
        <Link href="/bookings" className={`p-2 rounded-md ${pathname.startsWith('/bookings') ? 'text-primary' : 'text-text-muted'}`}>
          <ScrollText className="h-6 w-6" />
        </Link>
        <button onClick={() => setOpen(true)} className="p-2 text-text-muted rounded-md bg-surfaceHover border border-border">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-xs bg-surface h-full shadow-xl flex flex-col overflow-y-auto animate-in slide-in-from-left">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <span className="font-bold text-lg text-primary">TemporalRent</span>
              <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <nav className="flex-1 p-4 space-y-6">
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
                          onClick={() => setOpen(false)}
                          className={`flex items-center space-x-3 px-2 py-3 rounded-md transition-colors ${
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
          </div>
        </div>
      )}
    </>
  );
}
