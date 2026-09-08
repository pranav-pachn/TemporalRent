'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';

type User = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
};

type Business = {
  id: string;
  name: string;
  slug: string;
};

type AuthContextType = {
  user: User | null;
  business: Business | null;
  isLoading: boolean;
  refetchSession: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const data = await apiClient.get('/api/v1/auth/me');
      setUser(data.user);
      setBusiness(data.business);
    } catch (error) {
      setUser(null);
      setBusiness(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/v1/auth/logout', {});
    } catch (error) {
      console.error('Logout failed:', error);
    }
    setUser(null);
    setBusiness(null);
    window.location.href = '/';
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, business, isLoading, refetchSession: fetchSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
