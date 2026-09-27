'use client';

import React from 'react';

export default function StoreSettings() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Store Settings</h2>
        <p className="text-sm text-gray-500">Enable/disable holiday banners per location.</p>
      </div>
      <div className="bg-white rounded shadow p-4 border text-sm text-gray-600">
        Store configuration controls will render here.
      </div>
    </div>
  );
}