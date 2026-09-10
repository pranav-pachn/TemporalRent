'use client';

import { useState } from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { Bell, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function Topbar() {
  const { user, business, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <Breadcrumbs />
        {business?.name && (
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            {business.name}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <button className="text-text-muted hover:text-text transition-colors">
          <Bell className="h-5 w-5" />
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 hover:bg-surfaceHover p-1 pr-3 rounded-full border border-border transition-colors"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name || ''} className="h-8 w-8 rounded-full" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-border flex items-center justify-center text-text">
                <User className="h-4 w-4" />
              </div>
            )}
            <span className="text-sm font-medium hidden sm:block max-w-[120px] truncate">
              {user?.name || 'User'}
            </span>
          </button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-4 border-b border-border">
                  <div className="font-medium text-text truncate">{user?.name}</div>
                  <div className="text-sm text-text-muted truncate mt-0.5">{business?.name}</div>
                </div>
                
                <div className="p-2">
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-text hover:bg-surfaceHover rounded-md transition-colors">
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-text hover:bg-surfaceHover rounded-md transition-colors mt-1">
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <div className="h-px bg-border my-2" />
                  <button 
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-urgency-critical hover:bg-urgency-critical/10 rounded-md transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
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
