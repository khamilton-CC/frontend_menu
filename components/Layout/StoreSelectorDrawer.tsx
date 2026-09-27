'use client';

import React, { useState } from 'react';
import { useAuth, Store } from '@/context/AuthContext';

interface StoreSelectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StoreSelectorDrawer({ isOpen, onClose }: StoreSelectorDrawerProps) {
  const { stores, selectedStore, changeStore } = useAuth();

  // Chop House open by default, Connors closed
  const [isChopHouseOpen, setIsChopHouseOpen] = useState(true);
  const [isConnorsOpen, setIsConnorsOpen] = useState(false);

  if (!isOpen) return null;

  // Categorize visible stores into their respective brands
  const chopHouseStores = stores.filter((s) =>
    s.name.toLowerCase().includes('chop house')
  );
  
  const connorsStores = stores.filter((s) =>
    s.name.toLowerCase().includes('connor') || s.name.toLowerCase().includes("connors")
  );

  const handleSelect = (store: Store) => {
    changeStore(store);
    onClose();
  };

  const toggleChopHouse = () => {
    setIsChopHouseOpen((prev) => !prev);
    if (!isChopHouseOpen) setIsConnorsOpen(false); // Accordion effect
  };

  const toggleConnors = () => {
    setIsConnorsOpen((prev) => !prev);
    if (!isConnorsOpen) setIsChopHouseOpen(false); // Accordion effect
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-xs bg-white h-full shadow-2xl flex flex-col border-l border-gray-200">
        {/* Drawer Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-gray-800 text-sm">Select Store Location</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 font-semibold text-sm px-2 py-1 rounded"
          >
            ✕
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          
          {/* 1. CHOP HOUSE DRAWER (Open by default) */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={toggleChopHouse}
              className="w-full text-left font-semibold text-xs px-3 py-2.5 bg-red-950 text-amber-100 flex justify-between items-center"
            >
              <span>The Chop House ({chopHouseStores.length})</span>
              <span>{isChopHouseOpen ? '▲' : '▼'}</span>
            </button>

            {isChopHouseOpen && (
              <div className="p-2 space-y-1 bg-white">
                {chopHouseStores.length > 0 ? (
                  chopHouseStores.map((store) => {
                    const isSelected = selectedStore?.id === store.id;
                    return (
                      <button
                        key={store.id}
                        onClick={() => handleSelect(store)}
                        className={`w-full text-left text-xs p-2.5 rounded font-medium transition flex justify-between items-center ${
                          isSelected
                            ? 'bg-amber-50 text-amber-900 border border-amber-300'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <span>{store.name}</span>
                        {isSelected && <span className="text-amber-700 font-bold">✓</span>}
                      </button>
                    );
                  })
                ) : (
                  <p className="text-[11px] text-gray-400 italic p-2">No assigned Chop House locations</p>
                )}
              </div>
            )}
          </div>

          {/* 2. CONNOR'S DRAWER (Closed by default) */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={toggleConnors}
              className="w-full text-left font-semibold text-xs px-3 py-2.5 bg-slate-900 text-slate-100 flex justify-between items-center"
            >
              <span>Connors Steak & Seafood ({connorsStores.length})</span>
              <span>{isConnorsOpen ? '▲' : '▼'}</span>
            </button>

            {isConnorsOpen && (
              <div className="p-2 space-y-1 bg-white">
                {connorsStores.length > 0 ? (
                  connorsStores.map((store) => {
                    const isSelected = selectedStore?.id === store.id;
                    return (
                      <button
                        key={store.id}
                        onClick={() => handleSelect(store)}
                        className={`w-full text-left text-xs p-2.5 rounded font-medium transition flex justify-between items-center ${
                          isSelected
                            ? 'bg-slate-100 text-slate-900 border border-slate-300'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <span>{store.name}</span>
                        {isSelected && <span className="text-slate-800 font-bold">✓</span>}
                      </button>
                    );
                  })
                ) : (
                  <p className="text-[11px] text-gray-400 italic p-2">No assigned Connors locations</p>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}