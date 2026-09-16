'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Calendar, LayoutDashboard, Package, Boxes, Truck, Undo2, AlertTriangle, ScrollText, Settings, Users } from 'lucide-react';

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
      { name: 'Customers', href: '/customers', icon: Users },
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border px-3 py-2 flex justify-around items-center z-40">
        <Link 
          href="/dashboard" 
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md transition-colors ${
            pathname === '/dashboard' ? 'text-primary' : 'text-text-muted hover:text-text'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="text-[10px] font-medium">Overview</span>
        </Link>

        <Link 
          href="/calendar" 
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md transition-colors ${
            pathname.startsWith('/calendar') ? 'text-primary' : 'text-text-muted hover:text-text'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span className="text-[10px] font-medium">Calendar</span>
        </Link>

        <Link 
          href="/bookings" 
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md transition-colors ${
            pathname.startsWith('/bookings') ? 'text-primary' : 'text-text-muted hover:text-text'
          }`}
        >
          <ScrollText className="h-4 w-4" />
          <span className="text-[10px] font-medium">Bookings</span>
        </Link>

        <Link 
          href="/dispatch" 
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md transition-colors ${
            pathname.startsWith('/dispatch') ? 'text-primary' : 'text-text-muted hover:text-text'
          }`}
        >
          <Truck className="h-4 w-4" />
          <span className="text-[10px] font-medium">Dispatch</span>
        </Link>

        <button 
          onClick={() => setOpen(true)} 
          className="flex flex-col items-center gap-1 py-1 px-2 rounded-md text-text-muted hover:text-text"
        >
          <Menu className="h-4 w-4" />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-xs bg-surface h-full shadow-2xl flex flex-col overflow-y-auto z-10 animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-border flex justify-between items-center bg-surface-subtle">
              <span className="font-bold text-base text-text">
                Temporal<span className="text-primary">Rent</span>
              </span>
              <button 
                onClick={() => setOpen(false)} 
                className="text-text-muted hover:text-text p-1 rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <nav className="flex-1 p-3 space-y-5">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <h3 className="text-[10px] font-semibold text-text-dim mb-1 uppercase tracking-wider px-2">
                    {group.label}
                  </h3>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-surface-active text-text font-semibold border-l-2 border-primary'
                              : 'text-text-muted hover:bg-surface-raised hover:text-text'
                          }`}
                        >
                          <item.icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-text-muted'}`} />
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
