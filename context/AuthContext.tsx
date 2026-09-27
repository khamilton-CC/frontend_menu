'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface Store {
  id: string;
  name: string;
  has_holiday_feature: boolean;
}

interface AuthContextType {
  user: SupabaseUser | null;
  session: Session | null;
  token: string | null;
  role: 'admin' | 'user' | 'superadmin';
  stores: Store[];
  selectedStore: Store | null;
  logout: () => Promise<void>;
  changeStore: (store: Store) => void;
  fetchUserData: (currentUser: SupabaseUser) => Promise<void>; // <--- Add this line
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [role, setRole] = useState<'admin' | 'user' | 'superadmin'>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch initial session on app load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) fetchUserData(session.user);
      setLoading(false);
    });

    // 2. Listen for auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        fetchUserData(session.user);
      } else {
        setStores([]);
        setSelectedStore(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (currentUser: SupabaseUser) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

      const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setRole(data.role);
        setStores(data.stores);

        if (data.role !== 'superadmin' && (!data.stores || data.stores.length === 0)) {
          if (window.location.pathname !== '/select-store') {
            window.location.href = '/select-store';
          }
        } else {
          const savedStore = localStorage.getItem('cc_selected_store');
          if (savedStore) {
            setSelectedStore(JSON.parse(savedStore));
          } else if (data.stores && data.stores.length > 0) {
            setSelectedStore(data.stores[0]);
            localStorage.setItem('cc_selected_store', JSON.stringify(data.stores[0]));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('cc_selected_store');
    setUser(null);
    setSession(null);
    setSelectedStore(null);
  };

  const changeStore = (store: Store) => {
    setSelectedStore(store);
    localStorage.setItem('cc_selected_store', JSON.stringify(store));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        token: session?.access_token || null,
        role,
        stores,
        selectedStore,
        logout,
        changeStore,
        fetchUserData,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};