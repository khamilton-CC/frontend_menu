'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface UserRecord {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'user' | 'admin' | 'superadmin';
  primary_store_id?: string;
  store_ids: string[];
}

interface StoreRecord {
  id: string;
  name: string;
  nickname: string;
  division: 'chop_house' | 'connors';
}

export default function UserManager() {
  const { token, role } = useAuth();
  const isSuperadmin = role === 'superadmin';

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Track open/closed state for main categories & unassigned drawer
  const [mainDrawers, setMainDrawers] = useState<{ unassigned: boolean; chop_house: boolean; connors: boolean }>({
    unassigned: true,
    chop_house: true,
    connors: false,
  });

  // Track open/closed state for individual store drawers inside the main categories
  const [storeDrawers, setStoreDrawers] = useState<Record<string, boolean>>({});

  // Modals & Action States
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Edit Form States
const [editFirstName, setEditFirstName] = useState('');
const [editLastName, setEditLastName] = useState('');
const [editRole, setEditRole] = useState<'user' | 'admin' | 'superadmin'>('user');
const [editPrimaryStoreId, setEditPrimaryStoreId] = useState('');
const [editStoreIds, setEditStoreIds] = useState<string[]>([]);

// Password Reset Form State
const [overridePassword, setOverridePassword] = useState('');

// Create Form States
const [newEmail, setNewEmail] = useState('');
const [newFirstName, setNewFirstName] = useState('');
const [newLastName, setNewLastName] = useState('');
const [newPasswordCreate, setNewPasswordCreate] = useState('');
const [newRole, setNewRole] = useState<'user' | 'admin' | 'superadmin'>('user');
const [newPrimaryStore, setNewPrimaryStore] = useState('');
const [newAssignedStores, setNewAssignedStores] = useState<string[]>([]);

  useEffect(() => {
    fetchUsersAndStores();
  }, [token]);

  const fetchUsersAndStores = async () => {
    setLoading(true);
    try {
      const [usersRes, storesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stores`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (usersRes.ok && storesRes.ok) {
        const userData = await usersRes.json();
        const storeData = await storesRes.json();

        setUsers(userData.users || []);
        setStores(storeData.stores || []);

        const initialStoreDrawers: Record<string, boolean> = {};
        storeData.stores.forEach((s: StoreRecord) => {
          initialStoreDrawers[s.id] = true;
        });
        setStoreDrawers(initialStoreDrawers);
      }
    } catch (err) {
      console.error('Failed to load user management data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (user: UserRecord) => {
    setSelectedUser(user);
    setEditFirstName(user.first_name || '');
    setEditLastName(user.last_name || '');
    setEditRole(user.role);
    setEditPrimaryStoreId(user.primary_store_id || '');
    setEditStoreIds(user.store_ids || []);
    setIsEditModalOpen(true);
  };

  const handleOpenPassword = (user: UserRecord) => {
    setSelectedUser(user);
    setOverridePassword('');
    setIsPasswordModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedUser) return;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/users/${selectedUser.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        first_name: editFirstName,
        last_name: editLastName,
        role: isSuperadmin ? editRole : selectedUser.role,
        primary_store_id: isSuperadmin ? editPrimaryStoreId : selectedUser.primary_store_id,
        store_ids: isSuperadmin ? editStoreIds : selectedUser.store_ids,
      }),
    });

    if (res.ok) {
      setIsEditModalOpen(false);
      fetchUsersAndStores();
    } else {
      alert('Failed to update user');
    }
  } catch (err) {
    console.error('Error updating user:', err);
  }
};

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !overridePassword) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: overridePassword,
        }),
      });

      if (res.ok) {
        setIsPasswordModalOpen(false);
        setOverridePassword('');
        alert('Password successfully updated.');
      } else {
        alert('Failed to update password');
      }
    } catch (err) {
      console.error('Error updating password:', err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user account?')) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchUsersAndStores();
      } else {
        alert('Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newEmail,
          first_name: newFirstName,
          last_name: newLastName,
          password: newPasswordCreate,
          role: newRole,
          primary_store_id: newPrimaryStore,
          store_ids: newAssignedStores,
        }),
      });

      if (res.ok) {
        setIsCreateModalOpen(false);
        setNewEmail('');
        setNewFirstName('');
        setNewLastName('');
        setNewPasswordCreate('');
        setNewPrimaryStore('');
        setNewAssignedStores([]);
        fetchUsersAndStores();
      } else {
        alert('Failed to create user');
      }
    } catch (err) {
      console.error('Error creating user:', err);
    }
  };

  const chopHouseStores = stores
    .filter((s) => s.division === 'chop_house')
    .sort((a, b) => a.nickname.localeCompare(b.nickname));

  const connorsStores = stores
    .filter((s) => s.division === 'connors')
    .sort((a, b) => a.nickname.localeCompare(b.nickname));

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unassignedUsers = filteredUsers
    .filter((u) => !u.store_ids || u.store_ids.length < 1)
    .sort((a, b) => {
      const lastA = (a.last_name || '').toLowerCase();
      const lastB = (b.last_name || '').toLowerCase();
      if (lastA !== lastB) return lastA.localeCompare(lastB);
      return (a.first_name || '').toLowerCase().localeCompare((b.first_name || '').toLowerCase());
    });

  // Helper to handle Primary Store change + auto-include in assigned stores
  const handlePrimaryStoreChange = (
    storeId: string,
    currentAssigned: string[],
    setAssigned: (ids: string[]) => void,
    setPrimary: (id: string) => void
  ) => {
    setPrimary(storeId);
    if (storeId && !currentAssigned.includes(storeId)) {
      setAssigned([...currentAssigned, storeId]);
    }
  };

  // Bulk selection helpers for Edit form
  const allStoreIds = stores.map((s) => s.id);
  const chopHouseIds = chopHouseStores.map((s) => s.id);
  const connorsIds = connorsStores.map((s) => s.id);

  const isAllSelected = (currentAssigned: string[]) => allStoreIds.length > 0 && allStoreIds.every((id) => currentAssigned.includes(id));
  const isChopHouseSelected = (currentAssigned: string[]) => chopHouseIds.length > 0 && chopHouseIds.every((id) => currentAssigned.includes(id));
  const isConnorsSelected = (currentAssigned: string[]) => connorsIds.length > 0 && connorsIds.every((id) => currentAssigned.includes(id));

  const handleToggleAll = (currentAssigned: string[], setAssigned: (ids: string[]) => void, primaryStore: string) => {
    if (isAllSelected(currentAssigned)) {
      setAssigned(primaryStore ? [primaryStore] : []);
    } else {
      setAssigned([...allStoreIds]);
    }
  };

  const handleToggleDivision = (
    divisionIds: string[], 
    currentAssigned: string[], 
    setAssigned: (ids: string[]) => void, 
    isSelected: boolean, 
    primaryStore: string
  ) => {
    if (isSelected) {
      const remaining = currentAssigned.filter((id) => !divisionIds.includes(id));
      if (primaryStore && divisionIds.includes(primaryStore)) {
        remaining.push(primaryStore);
      }
      setAssigned(remaining);
    } else {
      const combined = Array.from(new Set([...currentAssigned, ...divisionIds]));
      setAssigned(combined);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-700 font-medium">Loading user management directory...</div>;
  }

  const renderStoreSection = (storeList: StoreRecord[]) => (
    <div className="space-y-3 pl-4 sm:pl-6 py-2 border-l-2 border-slate-200 my-2">
      {storeList.map((store) => {
        const storeUsers = filteredUsers
          .filter((u) => u.store_ids?.includes(store.id))
          .sort((a, b) => {
            const lastA = (a.last_name || '').toLowerCase();
            const lastB = (b.last_name || '').toLowerCase();
            if (lastA !== lastB) return lastA.localeCompare(lastB);
            return (a.first_name || '').toLowerCase().localeCompare((b.first_name || '').toLowerCase());
          });

        const isStoreOpen = storeDrawers[store.id] ?? true;

        return (
          <div key={store.id} className="bg-white rounded-lg shadow-sm border border-slate-300 overflow-hidden">
            <button
              onClick={() => setStoreDrawers((prev) => ({ ...prev, [store.id]: !isStoreOpen }))}
              className="w-full px-5 py-3 bg-slate-100 hover:bg-slate-200 flex justify-between items-center transition cursor-pointer border-b border-slate-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-slate-600 text-xs font-bold">{isStoreOpen ? '▼' : '▶'}</span>
                <span className="font-bold text-slate-900 text-sm">{store.nickname}</span>
                <span className="bg-slate-300 text-slate-900 text-xs px-2 py-0.5 rounded-full font-semibold">
                  {storeUsers.length} {storeUsers.length === 1 ? 'user' : 'users'}
                </span>
              </div>
            </button>

            {isStoreOpen && (
              <div className="p-4">
                {storeUsers.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 text-xs italic font-medium">
                    No users assigned to this store.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                          <th className="pb-3 px-3">Name</th>
                          <th className="pb-3 px-3">Email</th>
                          <th className="pb-3 px-3">Role</th>
                          <th className="pb-3 px-3">Primary Store</th>
                          <th className="pb-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {storeUsers.map((user) => {
                          const isPrimary = user.primary_store_id === store.id;
                          const primaryStoreObj = stores.find((s) => s.id === user.primary_store_id);
                          const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');

                          return (
                            <tr key={`${store.id}-${user.id}`} className="hover:bg-slate-50 transition">
                              <td className="py-3 px-3 font-semibold text-slate-900">{fullName || '—'}</td>
                              <td className="py-3 px-3 text-slate-800 font-medium">{user.email}</td>
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-block px-2 py-0.5 text-xs rounded font-bold capitalize ${
                                    user.role === 'superadmin'
                                      ? 'bg-purple-200 text-purple-900'
                                      : 'bg-blue-200 text-blue-900'
                                  }`}
                                >
                                  {user.role}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-xs text-slate-800 font-medium">
                                {primaryStoreObj?.nickname || 'None'}
                                {isPrimary && (
                                  <span className="ml-1.5 text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.5 rounded">
                                    Primary
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right space-x-2">
                                <button
                                  onClick={() => handleOpenEdit(user)}
                                  className="text-xs text-blue-700 hover:text-blue-900 font-bold cursor-pointer"
                                >
                                  Edit
                                </button>
                                {isSuperadmin && (
                                  <>
                                    <button
                                      onClick={() => handleOpenPassword(user)}
                                      className="text-xs text-amber-700 hover:text-amber-900 font-bold cursor-pointer"
                                    >
                                      Password
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(user.id)}
                                      className="text-xs text-rose-700 hover:text-rose-900 font-bold cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 text-slate-900">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-300">
        <div>
          <h2 className="text-lg font-bold text-slate-900">User Management</h2>
          <p className="text-xs text-slate-700 font-medium">Manage user access, store assignments, and credentials.</p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-400 rounded-md bg-white text-slate-900 placeholder:text-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 w-full sm:w-64"
          />
          {isSuperadmin && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-1.5 rounded-md text-sm font-bold transition cursor-pointer whitespace-nowrap shadow-sm"
            >
              + New User
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Unassigned Users Box */}
        {unassignedUsers.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-amber-400 overflow-hidden">
            <button
              onClick={() => setMainDrawers((prev) => ({ ...prev, unassigned: !prev.unassigned }))}
              className="w-full px-6 py-4 bg-amber-600 text-white flex justify-between items-center transition cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-amber-100 text-sm font-bold">{mainDrawers.unassigned ? '▼' : '▶'}</span>
                <span className="font-bold text-base tracking-wide">Unassigned Users</span>
                <span className="bg-amber-700 text-white text-xs px-2.5 py-0.5 rounded-full font-bold border border-amber-500">
                  {unassignedUsers.length} {unassignedUsers.length === 1 ? 'user' : 'users'}
                </span>
              </div>
              <span className="text-xs text-amber-100 font-bold">Requires Store Assignment</span>
            </button>

            {mainDrawers.unassigned && (
              <div className="p-4 bg-amber-50/50">
                <div className="overflow-x-auto bg-white rounded-lg border border-slate-300 p-2">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                        <th className="pb-3 px-3">Name</th>
                        <th className="pb-3 px-3">Email</th>
                        <th className="pb-3 px-3">Role</th>
                        <th className="pb-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {unassignedUsers.map((user) => {
                        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
                        return (
                          <tr key={user.id} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-3 font-semibold text-slate-900">{fullName || '—'}</td>
                            <td className="py-3 px-3 text-slate-800 font-medium">{user.email}</td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-block px-2 py-0.5 text-xs rounded font-bold capitalize ${
                                  user.role === 'superadmin'
                                    ? 'bg-purple-200 text-purple-900'
                                    : 'bg-blue-200 text-blue-900'
                                }`}
                              >
                                {user.role}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right space-x-2">
                              <button
                                onClick={() => handleOpenEdit(user)}
                                className="text-xs text-blue-700 hover:text-blue-900 font-bold cursor-pointer"
                              >
                                Assign Store
                              </button>
                              {isSuperadmin && (
                                <>
                                  <button
                                    onClick={() => handleOpenPassword(user)}
                                    className="text-xs text-amber-700 hover:text-amber-900 font-bold cursor-pointer"
                                  >
                                    Password
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="text-xs text-rose-700 hover:text-rose-900 font-bold cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chop House Main Drawer */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-300 overflow-hidden">
          <button
            onClick={() => setMainDrawers((prev) => ({ ...prev, chop_house: !prev.chop_house }))}
            className="w-full px-6 py-4 bg-slate-900 text-white flex justify-between items-center transition cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <span className="text-slate-300 text-sm font-bold">{mainDrawers.chop_house ? '▼' : '▶'}</span>
              <span className="font-bold text-base tracking-wide">Chop House Locations</span>
              <span className="bg-slate-800 text-slate-100 text-xs px-2.5 py-0.5 rounded-full font-bold border border-slate-700">
                {chopHouseStores.length} {chopHouseStores.length === 1 ? 'store' : 'stores'}
              </span>
            </div>
            <span className="text-xs text-slate-300 font-medium">Division: chop_house</span>
          </button>

          {mainDrawers.chop_house && <div className="p-4 bg-slate-50">{renderStoreSection(chopHouseStores)}</div>}
        </div>

        {/* Connors Main Drawer */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-300 overflow-hidden">
          <button
            onClick={() => setMainDrawers((prev) => ({ ...prev, connors: !prev.connors }))}
            className="w-full px-6 py-4 bg-slate-900 text-white flex justify-between items-center transition cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <span className="text-slate-300 text-sm font-bold">{mainDrawers.connors ? '▼' : '▶'}</span>
              <span className="font-bold text-base tracking-wide">Connors Locations</span>
              <span className="bg-slate-800 text-slate-100 text-xs px-2.5 py-0.5 rounded-full font-bold border border-slate-700">
                {connorsStores.length} {connorsStores.length === 1 ? 'store' : 'stores'}
              </span>
            </div>
            <span className="text-xs text-slate-300 font-medium">Division: connors</span>
          </button>

          {mainDrawers.connors && <div className="p-4 bg-slate-50">{renderStoreSection(connorsStores)}</div>}
        </div>
      </div>

      {/* Edit User Modal */}
{isEditModalOpen && selectedUser && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-300 max-h-[90vh] overflow-y-auto">
      <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3 flex justify-between items-center">
        <span>Edit User: <span className="font-normal text-slate-700">{selectedUser.email}</span></span>
        {!isSuperadmin && (
          <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded border border-amber-300">
            Read-Only Permissions
          </span>
        )}
      </h3>

      <form onSubmit={handleSaveUser} className="space-y-4">
        {/* First Name & Last Name (Editable by both Admin and Superadmin) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">First Name</label>
            <input
              type="text"
              value={editFirstName}
              onChange={(e) => setEditFirstName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-400 rounded-md bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Last Name</label>
            <input
              type="text"
              value={editLastName}
              onChange={(e) => setEditLastName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-400 rounded-md bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Role Select (Disabled if not Superadmin) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">Role</label>
          <select
            value={editRole}
            disabled={!isSuperadmin}
            onChange={(e) => setEditRole(e.target.value as 'user' | 'admin' | 'superadmin')}
            className={`w-full px-3 py-2 text-sm border border-slate-400 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 ${
              !isSuperadmin ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-300' : 'bg-white text-slate-900'
            }`}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </div>

        {/* Primary Store Select (Disabled if not Superadmin) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">Primary Store</label>
          <select
            value={editPrimaryStoreId}
            disabled={!isSuperadmin}
            onChange={(e) =>
              handlePrimaryStoreChange(e.target.value, editStoreIds, setEditStoreIds, setEditPrimaryStoreId)
            }
            className={`w-full px-3 py-2 text-sm border border-slate-400 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 ${
              !isSuperadmin ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-300' : 'bg-white text-slate-900'
            }`}
          >
            <option value="">Select Primary Store...</option>
            <optgroup label="Chop House Locations">
              {chopHouseStores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nickname}
                </option>
              ))}
            </optgroup>
            <optgroup label="Connors Locations">
              {connorsStores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nickname}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Assigned Stores Checkboxes (Disabled if not Superadmin) */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-bold text-slate-800">Assigned Stores</label>
            {isSuperadmin && (
              <button
                type="button"
                onClick={() => handleToggleAll(editStoreIds, setEditStoreIds, editPrimaryStoreId)}
                className="text-xs text-blue-700 hover:text-blue-900 font-bold cursor-pointer"
              >
                {isAllSelected(editStoreIds) ? 'Deselect All Stores' : 'Select All Stores'}
              </button>
            )}
          </div>

          <div className={`max-h-56 overflow-y-auto border rounded-md p-3 space-y-4 ${
            !isSuperadmin ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-400'
          }`}>
            {/* Chop House Group */}
            <div>
              <div className="flex justify-between items-center mb-1.5 border-b border-slate-200 pb-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Chop House Locations
                </span>
                {isSuperadmin && (
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleDivision(
                        chopHouseIds,
                        editStoreIds,
                        setEditStoreIds,
                        isChopHouseSelected(editStoreIds),
                        editPrimaryStoreId
                      )
                    }
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                  >
                    {isChopHouseSelected(editStoreIds) ? 'Deselect Chop House' : 'Select All Chop House'}
                  </button>
                )}
              </div>
              <div className="space-y-1.5 pl-1">
                {chopHouseStores.map((s) => (
                  <label
                    key={s.id}
                    className={`flex items-center space-x-2.5 text-sm font-medium p-1 rounded ${
                      !isSuperadmin ? 'text-slate-500 cursor-not-allowed' : 'text-slate-900 cursor-pointer hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={!isSuperadmin}
                      checked={editStoreIds.includes(s.id)}
                      onChange={(e) => {
                        if (!isSuperadmin) return;
                        if (e.target.checked) {
                          setEditStoreIds([...editStoreIds, s.id]);
                        } else {
                          if (s.id === editPrimaryStoreId) {
                            alert('Cannot uncheck the Primary Store while it is set as primary.');
                            return;
                          }
                          setEditStoreIds(editStoreIds.filter((id) => id !== s.id));
                        }
                      }}
                      className="rounded border-slate-400 text-blue-700 focus:ring-blue-600 h-4 w-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span>{s.nickname}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Connors Group */}
            <div className="pt-2">
              <div className="flex justify-between items-center mb-1.5 border-b border-slate-200 pb-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Connors Locations
                </span>
                {isSuperadmin && (
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleDivision(
                        connorsIds,
                        editStoreIds,
                        setEditStoreIds,
                        isConnorsSelected(editStoreIds),
                        editPrimaryStoreId
                      )
                    }
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                  >
                    {isConnorsSelected(editStoreIds) ? 'Deselect Connors' : 'Select All Connors'}
                  </button>
                )}
              </div>
              <div className="space-y-1.5 pl-1">
                {connorsStores.map((s) => (
                  <label
                    key={s.id}
                    className={`flex items-center space-x-2.5 text-sm font-medium p-1 rounded ${
                      !isSuperadmin ? 'text-slate-500 cursor-not-allowed' : 'text-slate-900 cursor-pointer hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={!isSuperadmin}
                      checked={editStoreIds.includes(s.id)}
                      onChange={(e) => {
                        if (!isSuperadmin) return;
                        if (e.target.checked) {
                          setEditStoreIds([...editStoreIds, s.id]);
                        } else {
                          if (s.id === editPrimaryStoreId) {
                            alert('Cannot uncheck the Primary Store while it is set as primary.');
                            return;
                          }
                          setEditStoreIds(editStoreIds.filter((id) => id !== s.id));
                        }
                      }}
                      className="rounded border-slate-400 text-blue-700 focus:ring-blue-600 h-4 w-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span>{s.nickname}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setIsEditModalOpen(false)}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold text-white bg-blue-700 rounded-md hover:bg-blue-800 cursor-pointer shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {/* Dedicated Reset Password Modal */}
      {isPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-300">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">
              Reset Password: <span className="font-normal text-slate-700">{selectedUser.email}</span>
            </h3>

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">New Temporary Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={overridePassword}
                  onChange={(e) => setOverridePassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-400 rounded-md bg-white text-slate-900 placeholder:text-slate-500 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-200 rounded-md font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-amber-600 hover:bg-amber-700 text-white rounded-md font-bold transition cursor-pointer shadow-sm"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-300 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">Create New User</h3>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Email <span className="font-normal text-slate-600">(@connorconcepts.com)</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@connorconcepts.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-400 rounded-md bg-white text-slate-900 placeholder:text-slate-500 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="John"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-400 rounded-md bg-white text-slate-900 placeholder:text-slate-500 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Doe"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-400 rounded-md bg-white text-slate-900 placeholder:text-slate-500 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPasswordCreate}
                  onChange={(e) => setNewPasswordCreate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-400 rounded-md bg-white text-slate-900 placeholder:text-slate-500 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'user' | 'admin' | 'superadmin')}
                  className="w-full px-3 py-2 text-sm border border-slate-400 rounded-md bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Primary Store</label>
                <select
                  value={newPrimaryStore}
                  onChange={(e) =>
                    handlePrimaryStoreChange(e.target.value, newAssignedStores, setNewAssignedStores, setNewPrimaryStore)
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-400 rounded-md bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Select Primary Store...</option>
                  <optgroup label="Chop House Locations">
                    {chopHouseStores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nickname}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Connors Locations">
                    {connorsStores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nickname}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-800">Assigned Stores</label>
                  <button
                    type="button"
                    onClick={() => handleToggleAll(newAssignedStores, setNewAssignedStores, newPrimaryStore)}
                    className="text-xs text-blue-700 hover:text-blue-900 font-bold cursor-pointer"
                  >
                    {isAllSelected(newAssignedStores) ? 'Deselect All Stores' : 'Select All Stores'}
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto border border-slate-400 rounded-md p-3 space-y-4 bg-white">
                  {/* Chop House Group */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5 border-b border-slate-200 pb-1">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Chop House Locations
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleDivision(
                            chopHouseIds,
                            newAssignedStores,
                            setNewAssignedStores,
                            isChopHouseSelected(newAssignedStores),
                            newPrimaryStore
                          )
                        }
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                      >
                        {isChopHouseSelected(newAssignedStores) ? 'Deselect Chop House' : 'Select All Chop House'}
                      </button>
                    </div>
                    <div className="space-y-1.5 pl-1">
                      {chopHouseStores.map((s) => (
                        <label
                          key={s.id}
                          className="flex items-center space-x-2.5 text-sm text-slate-900 font-medium cursor-pointer hover:bg-slate-50 p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={newAssignedStores.includes(s.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewAssignedStores([...newAssignedStores, s.id]);
                              } else {
                                if (s.id === newPrimaryStore) {
                                  alert('Cannot uncheck the Primary Store while it is set as primary.');
                                  return;
                                }
                                setNewAssignedStores(newAssignedStores.filter((id) => id !== s.id));
                              }
                            }}
                            className="rounded border-slate-400 text-blue-700 focus:ring-blue-600 h-4 w-4"
                          />
                          <span>{s.nickname}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Connors Group */}
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-1.5 border-b border-slate-200 pb-1">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Connors Locations
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleDivision(
                            connorsIds,
                            newAssignedStores,
                            setNewAssignedStores,
                            isConnorsSelected(newAssignedStores),
                            newPrimaryStore
                          )
                        }
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                      >
                        {isConnorsSelected(newAssignedStores) ? 'Deselect Connors' : 'Select All Connors'}
                      </button>
                    </div>
                    <div className="space-y-1.5 pl-1">
                      {connorsStores.map((s) => (
                        <label
                          key={s.id}
                          className="flex items-center space-x-2.5 text-sm text-slate-900 font-medium cursor-pointer hover:bg-slate-50 p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={newAssignedStores.includes(s.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewAssignedStores([...newAssignedStores, s.id]);
                              } else {
                                if (s.id === newPrimaryStore) {
                                  alert('Cannot uncheck the Primary Store while it is set as primary.');
                                  return;
                                }
                                setNewAssignedStores(newAssignedStores.filter((id) => id !== s.id));
                              }
                            }}
                            className="rounded border-slate-400 text-blue-700 focus:ring-blue-600 h-4 w-4"
                          />
                          <span>{s.nickname}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-200 rounded-md font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-700 hover:bg-blue-800 text-white rounded-md font-bold transition cursor-pointer shadow-sm"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}