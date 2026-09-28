'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface StoreOption {
  id: string;
  name: string;
  nickname?: string;
}

export default function SelectStorePage() {
  const { user, stores, token, fetchUserData, profile } = useAuth();
  const [availableStores, setAvailableStores] = useState<StoreOption[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  
  // New state fields for capturing names if they are missing
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // If user already has stores assigned, redirect them back to dashboard
    if (stores && stores.length > 0) {
      router.push('/');
      return;
    }

    // Fetch master list of stores including nickname
    const fetchAllStores = async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, nickname')
        .order('name');
      if (!error && data) {
        setAvailableStores(data);
      }
    };

    fetchAllStores();
  }, [stores, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId) return;

    // Optional: Validate that names are filled out if they are blank in the profile
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please provide your first and last name.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

      const res = await fetch(`${BACKEND_URL}/api/user/assign-first-store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          storeId: selectedStoreId,
          first_name: firstName.trim(),
          last_name: lastName.trim()
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to set account details.');
      }

      if (user) {
        await fetchUserData(user);
      }

      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-1 text-center">Welcome to Connor Concepts</h2>
        <p className="text-xs text-gray-500 mb-6 text-center">
          Please complete your profile and select your primary store location.
        </p>

        {error && <div className="bg-red-100 text-red-700 p-2 text-xs rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="First Name"
                className="w-full border p-2 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="Last Name"
                className="w-full border p-2 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Primary Store Location</label>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              required
              className="w-full border p-2 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select a store...</option>
              {availableStores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.nickname || store.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-[11px] text-amber-800">
            <strong>Note:</strong> This initial selection locks your account to this location. Any future store adjustments or additions must be submitted to a Superadmin.
          </div>

          <button
            type="submit"
            disabled={!selectedStoreId || loading}
            className="w-full bg-blue-600 text-white p-2 rounded font-medium hover:bg-blue-700 transition disabled:opacity-50 text-sm"
          >
            {loading ? 'Saving Profile...' : 'Confirm Account Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}