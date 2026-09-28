'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface Store {
  id: string;
  name: string;
  has_holiday_feature: boolean;
  nickname?: string;
  location?: string;
  state?: string;
  division?: string;
}

export default function StoreSettings() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openDivisions, setOpenDivisions] = useState<{ [key: string]: boolean }>({
    connors: true,
    chop_house: true,
  });

  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<{
    name: string;
    nickname: string;
    location: string;
    state: string;
    division: string;
    has_holiday_feature: boolean;
  }>({
    name: '',
    nickname: '',
    location: '',
    state: '',
    division: 'connors',
    has_holiday_feature: false,
  });

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getStores();
      setStores(res.stores || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch stores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const toggleDivision = (division: string) => {
    setOpenDivisions((prev) => ({
      ...prev,
      [division]: !prev[division],
    }));
  };

  const openAddModal = (defaultDivision = 'connors') => {
    setFormData({
      name: '',
      nickname: '',
      location: '',
      state: '',
      division: defaultDivision,
      has_holiday_feature: false,
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (store: Store) => {
    setEditingStore(store);
    setFormData({
      name: store.name || '',
      nickname: store.nickname || '',
      location: store.location || '',
      state: store.state || '',
      division: store.division || 'connors',
      has_holiday_feature: !!store.has_holiday_feature,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingStore) {
        await api.updateStore(editingStore.id, formData);
      } else {
        await api.createStore(formData);
      }
      setIsAddModalOpen(false);
      setEditingStore(null);
      await fetchStores();
    } catch (err: any) {
      setError(err.message || 'Failed to save store details.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleHolidayFeature = async (store: Store) => {
    try {
      const updatedFeature = !store.has_holiday_feature;
      setStores((prev) =>
        prev.map((s) => (s.id === store.id ? { ...s, has_holiday_feature: updatedFeature } : s))
      );
      await api.updateStore(store.id, { has_holiday_feature: updatedFeature });
    } catch (err: any) {
      setError('Failed to update holiday banner setting.');
      fetchStores();
    }
  };

  const connorsStores = stores.filter(
    (s) => s.division?.toLowerCase() === 'connors' || !s.division
  );
  const chopHouseStores = stores.filter(
    (s) => s.division?.toLowerCase() === 'chop_house' || s.division?.toLowerCase() === 'chophouse'
  );
  const otherStores = stores.filter(
    (s) =>
      s.division &&
      !['connors', 'chop_house', 'chophouse'].includes(s.division.toLowerCase())
  );

  const formatDivisionTitle = (key: string) => {
    if (key === 'connors') return "Connors Steak & Seafood";
    if (key === 'chop_house') return "The Chop House";
    return key.replace('_', ' ').toUpperCase();
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 font-medium animate-pulse">
        Loading store configuration...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Store Settings</h2>
          <p className="text-sm text-gray-500">Manage restaurant locations, divisions, and holiday feature banners.</p>
        </div>
        <button
          onClick={() => openAddModal('connors')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Store
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Accordion Drawers */}
      <div className="space-y-4">
        {[
          { key: 'connors', list: connorsStores },
          { key: 'chop_house', list: chopHouseStores },
          ...(otherStores.length > 0 ? [{ key: 'other', list: otherStores }] : []),
        ].map(({ key, list }) => {
          const isOpen = !!openDivisions[key];

          return (
            <div key={key} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Drawer Header */}
              <button
                onClick={() => toggleDivision(key)}
                className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition border-b border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0h4m-4 0H9" />
                  </svg>
                  <span className="font-bold text-gray-800 text-lg">
                    {formatDivisionTitle(key)}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-200 text-gray-700">
                    {list.length} locations
                  </span>
                </div>
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
                </svg>
              </button>

              {/* Drawer Content */}
              {isOpen && (
                <div className="p-4 divide-y divide-gray-100">
                  {list.length === 0 ? (
                    <div className="py-6 text-center text-sm text-gray-400 italic">
                      No store locations listed under this division.
                    </div>
                  ) : (
                    list.map((store) => (
                      <div
                        key={store.id}
                        className="py-3 flex items-center justify-between hover:bg-gray-50 px-3 rounded-lg transition"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800">{store.name}</span>
                            {store.nickname && (
                              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">
                                {store.nickname}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {[store.location, store.state].filter(Boolean).join(', ') || 'No location details'}
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!store.has_holiday_feature}
                              onChange={() => handleToggleHolidayFeature(store)}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-xs font-medium text-gray-600">
                              Holiday Feature
                            </span>
                          </label>

                          <button
                            onClick={() => openEditModal(store)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                            title="Edit Store"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal for Add/Edit Store */}
      {(isAddModalOpen || editingStore) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border">
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">
                {editingStore ? 'Edit Store Location' : 'Add New Store'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStore(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Store Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Connors Knoxville"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Division *</label>
                  <select
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="connors">Connors</option>
                    <option value="chop_house">Chop House</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nickname</label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    placeholder="e.g. Turkey Creek"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">City / Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Knoxville"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="TN"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_holiday_feature}
                    onChange={(e) => setFormData({ ...formData, has_holiday_feature: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-gray-700">Enable Holiday Feature Menu</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStore(null);
                  }}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}