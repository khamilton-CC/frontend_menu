'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import StoreSelectorDrawer from '@/components/Layout/StoreSelectorDrawer';

interface HeaderProps {
  activeTab?: 'editor' | 'users' | 'items' | 'settings';
  setActiveTab?: (tab: 'editor' | 'users' | 'items' | 'settings') => void;
}

export default function Header({ activeTab = 'editor', setActiveTab }: HeaderProps) {
  const { user, role, stores, selectedStore, changeStore, logout } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isSuperadmin = role === 'superadmin';
  const isAdminOrSuperadmin = role === 'admin' || isSuperadmin;

  return (
    <>
      <header className="no-print bg-slate-900 text-white px-6 py-3 flex justify-between items-center shadow border-b border-slate-800 shrink-0">
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-bold tracking-wide">Connor Concepts</h1>

          {/* Store Selector */}
          {stores.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Store:</span>

              {isSuperadmin ? (
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-3 py-1.5 rounded text-sm transition flex items-center space-x-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  className="bg-slate-800 text-white border border-slate-700 px-3 py-1.5 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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

          {/* Navigation Tabs */}
          {setActiveTab && (
            <nav className="flex items-center space-x-1 pl-4 border-l border-slate-800">
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1.5 text-sm rounded font-medium transition ${
                  activeTab === 'editor' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Menu Builder
              </button>

              {isAdminOrSuperadmin && (
                <>
                  <button
                    onClick={() => setActiveTab('items')}
                    className={`px-3 py-1.5 text-sm rounded font-medium transition ${
                      activeTab === 'items' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Menu Manager
                  </button>
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`px-3 py-1.5 text-sm rounded font-medium transition ${
                      activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    User Manager
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-3 py-1.5 text-sm rounded font-medium transition ${
                      activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Settings
                  </button>
                </>
              )}
            </nav>
          )}
        </div>

        {/* User Account Controls */}
        <div className="flex items-center space-x-4">
          <div className="text-right text-xs">
            <div className="font-semibold text-slate-200">{user?.email}</div>
            <div className="text-slate-400 capitalize">{role} Role</div>
          </div>

          <button
            onClick={logout}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded border border-slate-700 transition"
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