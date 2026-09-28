'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface Store {
  id: string;
  name: string;
  nickname?: string;
  has_holiday_feature: boolean;
}

export interface UserProfile {
  first_name: string;
  last_name: string;
  primary_store_id?: string | null;
}

interface AuthContextType {
  user: SupabaseUser | null;
  session: Session | null;
  token: string | null;
  role: 'admin' | 'user' | 'superadmin';
  profile: UserProfile | null;
  stores: Store[];
  selectedStore: Store | null;
  logout: () => Promise<void>;
  changeStore: (store: Store) => void;
  fetchUserData: (currentUser: SupabaseUser) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [role, setRole] = useState<'admin' | 'user' | 'superadmin'>('user');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const syncTokenToLocalStorage = (token: string | null) => {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('cc_token', token);
      } else {
        localStorage.removeItem('cc_token');
      }
    }
  };

  useEffect(() => {
    // 1. Fetch initial session on app load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      syncTokenToLocalStorage(session?.access_token || null);

      if (session) {
        fetchUserData(session.user);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      syncTokenToLocalStorage(session?.access_token || null);

      if (session) {
        fetchUserData(session.user);
      } else {
        setStores([]);
        setProfile(null);
        setSelectedStore(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (currentUser: SupabaseUser) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      syncTokenToLocalStorage(session.access_token);

      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

      const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const userStores: Store[] = data.stores || [];
        const userProfile: UserProfile | null = data.profile || null;

        setRole(data.role);
        setStores(userStores);
        setProfile(userProfile);

        if (data.role !== 'superadmin' && userStores.length === 0) {
          if (window.location.pathname !== '/select-store') {
            window.location.href = '/select-store';
          }
        } else if (userStores.length > 0) {
          // Priority 1: Match store using profile.primary_store_id
          let storeToSelect = userStores.find(
            (s) => s.id === userProfile?.primary_store_id
          );

          // Priority 2: Fall back to explicitly saved store in localStorage if primary wasn't found
          if (!storeToSelect) {
            const savedStoreRaw = localStorage.getItem('cc_selected_store');
            if (savedStoreRaw) {
              const parsedSavedStore = JSON.parse(savedStoreRaw);
              storeToSelect = userStores.find((s) => s.id === parsedSavedStore.id);
            }
          }

          // Priority 3: Fall back to first store in list
          if (!storeToSelect) {
            storeToSelect = userStores[0];
          }

          setSelectedStore(storeToSelect);
          localStorage.setItem('cc_selected_store', JSON.stringify(storeToSelect));
        }
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    syncTokenToLocalStorage(null);
    localStorage.removeItem('cc_selected_store');
    setUser(null);
    setSession(null);
    setProfile(null);
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
        profile,
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