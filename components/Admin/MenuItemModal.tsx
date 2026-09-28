'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface MenuItemData {
  id?: string;
  division: 'chop_house' | 'connors';
  section: string;
  type: string;
  subtype: string | null;
  short_name: string;
  display_name: string;
  description: string;
  is_holiday_only: boolean;
}

interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: MenuItemData) => Promise<void>;
  initialData?: MenuItemData | null;
}

// Maps any variations into our clean internal keys for dropdown state
const getSectionKey = (rawSection?: string): string => {
  if (!rawSection) return 'apps';
  const clean = rawSection.trim().toLowerCase();

  if (clean === 'starters' || clean === 'apps') return 'apps';
  if (clean === 'chef selections' || clean === 'entrees') return 'entrees';
  if (clean === 'sips') return 'sips';
  if (clean === 'ice cream' || clean === 'icecream') return 'icecream';
  if (clean === 'holiday') return 'holiday';

  return clean;
};

// Returns the exact capitalized string to save to the database for 'section'
const getCapitalizedSection = (sectionKey: string): string => {
  switch (sectionKey) {
    case 'apps':
      return 'Apps';
    case 'entrees':
      return 'Entrees';
    case 'sips':
      return 'Sips';
    case 'icecream':
      return 'Ice Cream';
    case 'holiday':
      return 'Holiday';
    default:
      return sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1);
  }
};

export default function MenuItemModal({ isOpen, onClose, onSave, initialData }: MenuItemModalProps) {
  const [division, setDivision] = useState<'chop_house' | 'connors'>('chop_house');
  const [sectionKey, setSectionKey] = useState('apps');
  const [type, setType] = useState('Starters');
  const [subtype, setSubtype] = useState<string>('');
  const [shortName, setShortName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isUserChange = useRef(false);

  // Populate or reset form fields
  useEffect(() => {
    if (isOpen) {
      isUserChange.current = false;

      if (initialData) {
        setDivision(initialData.division || 'chop_house');
        setSectionKey(getSectionKey(initialData.section));
        setType(initialData.type || 'Starters');
        setSubtype(initialData.subtype || '');
        setShortName(initialData.short_name || '');
        setDisplayName(initialData.display_name || '');
        setDescription(initialData.description || '');
      } else {
        setDivision('chop_house');
        setSectionKey('apps');
        setType('Starters');
        setSubtype('');
        setShortName('');
        setDisplayName('');
        setDescription('');
      }
      setError('');
    }
  }, [initialData, isOpen]);

  // Handle manual section change & auto-populate capitalized 'type' and 'subtype' defaults
  const handleSectionChange = (newKey: string) => {
    isUserChange.current = true;
    setSectionKey(newKey);

    switch (newKey) {
      case 'apps':
        setType('Starters');
        setSubtype('');
        break;
      case 'entrees':
        setType('Steaks');
        setSubtype('');
        break;
      case 'sips':
        setType('Sips');
        setSubtype('Cocktail');
        break;
      case 'icecream':
        setType('Ice Cream');
        setSubtype('');
        break;
      case 'holiday':
        setType('Holiday');
        setSubtype('Special');
        break;
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortName || !displayName) {
      setError('Short Name and Display Name are required.');
      return;
    }

    setSaving(true);
    setError('');

    // Ensure hidden types are assigned based on section choice
    let finalType = type;
    if (sectionKey === 'apps') finalType = 'Starters';
    if (sectionKey === 'sips') finalType = 'Sips';
    if (sectionKey === 'icecream') finalType = 'Ice Cream';
    if (sectionKey === 'holiday') finalType = 'Holiday';

    const dbSection = getCapitalizedSection(sectionKey);
    const isHolidayOnly = sectionKey === 'holiday';

    try {
      await onSave({
        id: initialData?.id,
        division,
        section: dbSection, // e.g. "Apps", "Entrees", "Sips", "Ice Cream", "Holiday"
        type: finalType,    // e.g. "Starters", "Steaks", "Sips", "Ice Cream", "Holiday"
        subtype: subtype ? subtype : null, // e.g. "Cocktail", "Wine", "Title", "Special"
        short_name: shortName,
        display_name: displayName,
        description,
        is_holiday_only: isHolidayOnly,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save menu item.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-gray-200">
        <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {initialData ? 'Edit Menu Item' : 'Create New Menu Item'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-700 text-xs p-3 rounded border border-red-200">{error}</div>}

          {/* Division */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Division</label>
            <select
              value={division}
              onChange={(e) => setDivision(e.target.value as 'chop_house' | 'connors')}
              className="w-full border rounded p-2 text-sm bg-white text-gray-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="chop_house">Chop House</option>
              <option value="connors">Connors</option>
            </select>
          </div>

          {/* Section */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Section</label>
            <select
              value={sectionKey}
              onChange={(e) => handleSectionChange(e.target.value)}
              className="w-full border rounded p-2 text-sm bg-white text-gray-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="sips">Sips</option>
              <option value="apps">Apps (Starters)</option>
              <option value="entrees">Entrees (Chef Selections)</option>
              <option value="icecream">Ice Cream</option>
              <option value="holiday">Holiday</option>
            </select>
          </div>

          {/* Type Select for Entrees */}
          {sectionKey === 'entrees' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border rounded p-2 text-sm bg-white text-gray-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="Steaks">Steaks</option>
                <option value="Medallions">Medallions</option>
                <option value="Fish">Fish</option>
                <option value="Entree">Entree</option>
              </select>
            </div>
          )}

          {/* Subtype Select for Sips */}
          {sectionKey === 'sips' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Subtype</label>
              <select
                value={subtype}
                onChange={(e) => setSubtype(e.target.value)}
                className="w-full border rounded p-2 text-sm bg-white text-gray-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="Cocktail">Cocktail</option>
                <option value="Wine">Wine</option>
              </select>
            </div>
          )}

          {/* Subtype Select for Holiday */}
          {sectionKey === 'holiday' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Subtype</label>
              <select
                value={subtype}
                onChange={(e) => setSubtype(e.target.value)}
                className="w-full border rounded p-2 text-sm bg-white text-gray-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="Title">Title</option>
                <option value="Special">Special</option>
                <option value="Wine">Wine</option>
              </select>
            </div>
          )}

          {/* Text Inputs */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Short Name (Internal / Sidebar)</label>
            <input
              type="text"
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              placeholder="e.g. 6oz Filet"
              className="w-full border rounded p-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Display Name (Menu Print Title)</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Center-Cut Filet Mignon 6oz"
              className="w-full border rounded p-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Menu description text..."
              rows={3}
              className="w-full border rounded p-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : initialData ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}