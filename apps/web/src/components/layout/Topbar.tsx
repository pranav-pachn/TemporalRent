'use client';

import { useState } from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { Bell, User, LogOut, Settings, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';

export function Topbar() {
  const { user, business, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        <Breadcrumbs />
      </div>

      <div className="flex items-center space-x-3">
        {/* Operational Date Tag */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-surface-raised border border-border rounded-md text-[11px] font-medium text-text-muted">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span>{todayStr}</span>
        </div>

        <button 
          type="button" 
          aria-label="Notifications"
          className="text-text-muted hover:text-text p-1.5 rounded-md hover:bg-surface-raised transition-colors"
        >
          <Bell className="h-4 w-4" />
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 hover:bg-surface-raised p-1 pr-2.5 rounded-full border border-border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name || ''} className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <div className="h-7 w-7 rounded-full bg-surface-raised border border-border flex items-center justify-center text-text-muted">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
            <span className="text-xs font-medium text-text hidden sm:block max-w-[120px] truncate">
              {user?.name || 'User'}
            </span>
          </button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="p-3.5 border-b border-border bg-surface-subtle">
                  <div className="text-xs font-semibold text-text truncate">{user?.name}</div>
                  <div className="text-[11px] text-text-muted truncate mt-0.5">{business?.name || user?.email}</div>
                </div>
                
                <div className="p-1.5">
                  <Link 
                    href="/settings"
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-text-muted hover:text-text hover:bg-surface-raised rounded-md transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-text-dim" />
                    <span>Settings</span>
                  </Link>
                  <div className="h-px bg-border my-1" />
                  <button 
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-status-danger hover:bg-status-danger/10 rounded-md transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
