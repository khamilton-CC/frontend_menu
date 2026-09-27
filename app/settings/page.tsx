'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import UserManager from '@/components/Admin/UserManager';
import MenuManager from '@/components/Admin/MenuManager';
import StoreSettings from '@/components/Admin/StoreSettings';

export default function SettingsPage() {
  const { user } = useAuth();
  const [subTab, setSubTab] = useState<'users' | 'menu' | 'stores'>('users');

  if (!user) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Filing Cabinet Sub-Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-8 pt-4 flex space-x-2 shrink-0">
        <button
          onClick={() => setSubTab('users')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg border-t border-l border-r transition cursor-pointer ${
            subTab === 'users'
              ? 'bg-gray-50 text-blue-600 border-gray-200 shadow-sm font-semibold'
              : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200'
          }`}
        >
          User Manager
        </button>
        <button
          onClick={() => setSubTab('menu')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg border-t border-l border-r transition cursor-pointer ${
            subTab === 'menu'
              ? 'bg-gray-50 text-blue-600 border-gray-200 shadow-sm font-semibold'
              : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200'
          }`}
        >
          Menu Manager
        </button>
        <button
          onClick={() => setSubTab('stores')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg border-t border-l border-r transition cursor-pointer ${
            subTab === 'stores'
              ? 'bg-gray-50 text-blue-600 border-gray-200 shadow-sm font-semibold'
              : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200'
          }`}
        >
          Store Manager
        </button>
      </div>

      {/* Sub-Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-8">
        {subTab === 'users' && <UserManager />}
        {subTab === 'menu' && <MenuManager />}
        {subTab === 'stores' && <StoreSettings />}
      </div>
    </div>
  );
}