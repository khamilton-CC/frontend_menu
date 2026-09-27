'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import Header from '@/components/Layout/Header';

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/reset-password');

  useEffect(() => {
    if (!loading) {
      if (!user && !isAuthPage) {
        router.push('/login');
      } else if (user && isAuthPage) {
        router.push('/');
      }
    }
  }, [user, loading, isAuthPage, router]);

  // While checking initial auth state, show blank or minimal screen to prevent jarring layout shifts
  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <>
      {!isAuthPage && user && <Header />}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </>
  );
}