'use client';

import { createContext, useContext, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase-client';

const SupabaseContext = createContext(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [supabase] = useState(() => createSupabaseClient());

  return (
    <SupabaseContext.Provider value={supabase as any}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);

  if (context === undefined) {
    throw new Error('useSupabase must be used within an AuthProvider');
  }

  return context;
};
