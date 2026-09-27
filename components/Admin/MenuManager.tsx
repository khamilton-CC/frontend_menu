'use client';

import React from 'react';

export default function MenuManager() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Master Menu Items</h2>
          <p className="text-sm text-gray-500">Add or edit shared menu items across all locations.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">
          + Add New Item
        </button>
      </div>
      <div className="bg-white rounded shadow p-4 border text-sm text-gray-600">
        Master item listing with section categorizations and holiday flag controls will render here.
      </div>
    </div>
  );
}