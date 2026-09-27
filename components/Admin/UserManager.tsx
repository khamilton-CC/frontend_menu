'use client';

import React from 'react';

export default function UserManager() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">User Manager</h2>
          <p className="text-sm text-gray-500">Manage user roles, assigned stores, and reset passwords.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">
          + Add New User
        </button>
      </div>
      <div className="bg-white rounded shadow p-4 border text-sm text-gray-600">
        User table, store assignment checkboxes, role updates, and password reset form will render here.
      </div>
    </div>
  );
}