'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface ProvidersProps {
  children: ReactNode;
}

function AuthProvider({ children }: ProvidersProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock auth for now - replace with real API calls later
  useEffect(() => {
    console.log('AuthProvider initialized');
    setTimeout(() => {
      setUser({
        id: 1,
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true
      });
      setLoading(false);
    }, 500);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setTimeout(() => {
      setUser({
        id: 1,
        email: email,
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true
      });
      setLoading(false);
    }, 1000);
  };

  const logout = async () => {
    setUser(null);
  };

  const checkAuth = async () => {
    setLoading(false);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
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

// Main Providers component that wraps all providers
export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
