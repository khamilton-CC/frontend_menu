'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import StoreSelectorDrawer from '@/components/Layout/StoreSelectorDrawer';

export default function Header() {
  const { role, stores, selectedStore, logout, changeStore, profile, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isSuperadmin = role === 'superadmin';
  const isSettings = pathname?.startsWith('/settings');

  // Format the display name cleanly using the hook values fetched once above
  const displayName =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name.charAt(0)}. ${profile.last_name}`
      : user?.email;

  return (
    <>
      <header className="no-print bg-slate-900 text-white px-6 py-3 flex justify-between items-center shadow border-b border-slate-800 shrink-0">
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-bold tracking-wide">Connor Concepts</h1>

          {stores.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Store:</span>
              {isSuperadmin ? (
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-3 py-1.5 rounded text-sm transition flex items-center space-x-2 cursor-pointer"
                >
                  <span className="font-medium">
                    {selectedStore ? selectedStore.name : 'Select Store...'}
                  </span>
                  <span className="text-slate-400 text-xs">▼</span>
                </button>
              ) : (
                <select
                  value={selectedStore?.id || ''}
                  onChange={(e) => {
                    const store = stores.find((s) => s.id === e.target.value);
                    if (store) changeStore(store);
                  }}
                  className="bg-slate-800 text-white border border-slate-700 px-3 py-1.5 rounded text-sm"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 pl-4 border-l border-slate-800">
            <button
              onClick={() => router.push('/')}
              className={`px-3 py-1.5 text-sm rounded font-medium transition cursor-pointer ${
                !isSettings ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Menu Builder
            </button>
            <button
              onClick={() => router.push('/settings')}
              className={`px-3 py-1.5 text-sm rounded font-medium transition cursor-pointer ${
                isSettings ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>

        {/* User Info & Sign Out */}
        <div className="flex items-center space-x-4">
          <div className="text-right text-xs">
            <div className="font-semibold text-slate-200">{displayName}</div>
            <div className="text-slate-400 capitalize">{role} Role</div>
          </div>
          <button
            onClick={logout}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded border border-slate-700 transition cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      {isSuperadmin && (
        <StoreSelectorDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      )}
    </>
  );
}