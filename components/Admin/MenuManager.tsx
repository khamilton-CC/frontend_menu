'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import MenuItemModal, { MenuItemData } from './MenuItemModal';

interface RawMenuItem extends MenuItemData {
  id: string;
}

const SECTIONS = [
  { key: 'sips', label: 'Sips', matchValues: ['sips', 'Sips'] },
  { key: 'apps', label: 'Apps / Starters', matchValues: ['apps', 'Starters', 'Apps'] },
  { key: 'entrees', label: 'Entrees / Chef Selections', matchValues: ['entrees', 'Chef Selections', 'Entrees'] },
  { key: 'icecream', label: 'Ice Cream', matchValues: ['icecream', 'Ice Cream'] },
  { key: 'holiday', label: 'Holiday', matchValues: ['holiday', 'Holiday'] },
];

export default function MenuManager() {
  const { token } = useAuth();
  const [items, setItems] = useState<RawMenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Drawer open states
  const [openDivisions, setOpenDivisions] = useState<Record<string, boolean>>({
    chop_house: true,
    connors: true,
  });
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RawMenuItem | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  const fetchMenuItems = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/menu-items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, [token]);

  const toggleDivision = (div: string) => {
    setOpenDivisions((prev) => ({ ...prev, [div]: !prev[div] }));
  };

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveItem = async (itemData: MenuItemData) => {
    const isEdit = !!itemData.id;
    const url = isEdit
      ? `${BACKEND_URL}/api/admin/menu-items/${itemData.id}`
      : `${BACKEND_URL}/api/admin/menu-items`;

    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(itemData),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to save item');
    }

    await fetchMenuItems();
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/menu-items/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert('Failed to delete menu item.');
      }
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  // Helper sorting function: type -> subtype -> short_name (A-Z)
  const sortMenuItems = (itemList: RawMenuItem[]) => {
    return [...itemList].sort((a, b) => {
      const typeA = a.type || '';
      const typeB = b.type || '';
      if (typeA !== typeB) return typeA.localeCompare(typeB);

      const subA = a.subtype || '';
      const subB = b.subtype || '';
      if (subA !== subB) return subA.localeCompare(subB);

      return (a.short_name || '').localeCompare(b.short_name || '');
    });
  };

  const renderSectionItems = (division: string, sectionConfig: typeof SECTIONS[0]) => {
    const sectionItems = items.filter((item) => {
      const itemDivision = (item.division || 'chop_house').toLowerCase();
      const targetDivision = division.toLowerCase();

      if (itemDivision !== targetDivision) return false;

      const itemSection = (item.section || '').trim();
      return sectionConfig.matchValues.some(
        (val) => val.toLowerCase() === itemSection.toLowerCase()
      );
    });

    const sortedItems = sortMenuItems(sectionItems);

    if (sortedItems.length === 0) {
      return <div className="text-xs text-gray-400 italic py-2 px-4">No items in this section.</div>;
    }

    return (
      <div className="divide-y divide-gray-100 bg-white border border-gray-100 rounded my-1">
        {sortedItems.map((item) => {
          // Determine badge text
          let displayBadgeText = null;
          if (sectionConfig.key === 'entrees' && item.type) {
            displayBadgeText = item.type;
          } else if ((sectionConfig.key === 'sips' || sectionConfig.key === 'holiday') && item.subtype) {
            displayBadgeText = item.subtype;
          }

          return (
            <div key={item.id} className="flex justify-between items-center py-2 px-4 hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                {/* Left-aligned Tag Badge */}
                {displayBadgeText && (
                  <span className="w-20 text-center text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium border border-blue-100 shrink-0">
                    {displayBadgeText}
                  </span>
                )}
                <div>
                  <span className="text-sm font-medium text-gray-800">{item.short_name}</span>
                  <span className="text-xs text-gray-400 ml-2">({item.display_name})</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setEditingItem(item);
                    setIsModalOpen(true);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Master Menu Items</h2>
          <p className="text-sm text-gray-500">Manage shared menu items across divisions and sections.</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition"
        >
          + Add New Item
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500 text-center py-8">Loading menu items...</div>
      ) : (
        <div className="space-y-4">
          {['chop_house', 'connors'].map((division) => {
            const divLabel = division === 'chop_house' ? 'Chop House' : 'Connors';
            const isOpen = openDivisions[division];

            return (
              <div key={division} className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleDivision(division)}
                  className="w-full flex justify-between items-center px-5 py-3 bg-gray-800 text-white font-semibold text-left hover:bg-gray-700 transition"
                >
                  <span>{divLabel}</span>
                  <span className="text-xs bg-gray-600 px-2 py-0.5 rounded">{isOpen ? 'Collapse' : 'Expand'}</span>
                </button>

                {isOpen && (
                  <div className="p-4 space-y-3 bg-gray-50">
                    {SECTIONS.map((sec) => {
                      const secKey = `${division}_${sec.key}`;
                      const isSecOpen = openSections[secKey];

                      return (
                        <div key={sec.key} className="border border-gray-200 rounded bg-white overflow-hidden">
                          <button
                            onClick={() => toggleSection(secKey)}
                            className="w-full flex justify-between items-center px-4 py-2.5 bg-gray-100 text-gray-800 font-medium text-sm text-left hover:bg-gray-200 transition"
                          >
                            <span>{sec.label}</span>
                            <span className="text-xs text-gray-500">{isSecOpen ? '▲' : '▼'}</span>
                          </button>

                          {isSecOpen && <div className="p-2">{renderSectionItems(division, sec)}</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Integration */}
      <MenuItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveItem}
        initialData={editingItem}
      />
    </div>
  );
}