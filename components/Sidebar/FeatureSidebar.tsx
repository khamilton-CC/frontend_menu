'use client';

import React, { useState } from 'react';

export interface MenuItem {
  id: string;
  section: string;
  type?: string;
  subtype?: string;
  short_name: string;
  display_name: string;
  description?: string;
  is_holiday_only?: boolean;
}

interface FeatureSidebarProps {
  menuItems: MenuItem[];
  selectedItemIds: string[];
  prices: Record<string, number | string>;
  holidayTitle: string;
  hasHolidayFeature?: boolean;
  loading: boolean;
  medallion6ozPrice?: number | string;
  medallion9ozPrice?: number | string;
  onToggleSelection: (itemId: string) => void;
  onPriceChange: (itemId: string, price: number | string) => void;
  onPriceBlur: (itemId: string, price: number | string) => void;
  onMedallionPriceChange?: (size: '6oz' | '9oz', price: number | string) => void;
  onMedallionPriceBlur?: (size: '6oz' | '9oz', price: number | string) => void;
  onHolidayTitleChange: (title: string) => void;
}

export default function FeatureSidebar({
  menuItems,
  selectedItemIds,
  prices,
  holidayTitle,
  hasHolidayFeature = false,
  loading,
  medallion6ozPrice = '',
  medallion9ozPrice = '',
  onToggleSelection,
  onPriceChange,
  onPriceBlur,
  onMedallionPriceChange,
  onMedallionPriceBlur,
  onHolidayTitleChange,
}: FeatureSidebarProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [openSipType, setOpenSipType] = useState<string | null>(null);
  const [openEntreeType, setOpenEntreeType] = useState<string | null>(null);
  const [openHolidayType, setOpenHolidayType] = useState<string | null>(null);

  const toggleSection = (key: string) => setOpenSection((prev) => (prev === key ? null : key));
  const toggleSipType = (key: string) => setOpenSipType((prev) => (prev === key ? null : key));
  const toggleEntreeType = (key: string) => setOpenEntreeType((prev) => (prev === key ? null : key));
  const toggleHolidayType = (key: string) => setOpenHolidayType((prev) => (prev === key ? null : key));

  const matchStr = (val?: string) => (val || '').toLowerCase().trim();
  const sortAbc = (items: MenuItem[]) => [...items].sort((a, b) => a.short_name.localeCompare(b.short_name));
  const getSelectedCount = (items: MenuItem[]) => items.filter((item) => selectedItemIds.includes(item.id)).length;

  const sipItems = menuItems.filter((item) => matchStr(item.section).includes('sip') && !item.is_holiday_only);
  const cocktails = sortAbc(sipItems.filter((i) => matchStr(i.subtype).includes('cocktail') || matchStr(i.type).includes('cocktail')));
  const wines = sortAbc(sipItems.filter((i) => matchStr(i.subtype).includes('wine') || matchStr(i.type).includes('wine')));

  const starters = sortAbc(menuItems.filter((item) => !item.is_holiday_only && (matchStr(item.section).includes('starter') || matchStr(item.section).includes('app'))));

  const entreeItems = menuItems.filter((item) => !item.is_holiday_only && (matchStr(item.section).includes('chef') || matchStr(item.section).includes('entree') || matchStr(item.section).includes('main')));

  const specials = sortAbc(entreeItems.filter((i) => matchStr(i.type).includes('special') || matchStr(i.type).includes('entree') || matchStr(i.type) === ''));
  const steaks = sortAbc(entreeItems.filter((i) => matchStr(i.type).includes('steak')));
  
  const medallions = sortAbc(entreeItems.filter((i) => (matchStr(i.type).includes('medallion') || matchStr(i.subtype).includes('medallion')) && !matchStr(i.short_name).includes('6oz') && !matchStr(i.short_name).includes('9oz')));

  const fish = sortAbc(entreeItems.filter((i) => matchStr(i.type).includes('fish') || matchStr(i.type).includes('seafood')));

  const rawIceCream = menuItems.filter((item) => !item.is_holiday_only && (matchStr(item.section).includes('cream') || matchStr(item.section).includes('dessert') || matchStr(item.section).includes('ice')));
  const iceCream = [...rawIceCream].sort((a, b) => {
    const nameA = a.short_name.toLowerCase();
    const nameB = b.short_name.toLowerCase();
    const getPriority = (name: string) => {
      if (name.includes('1.') || name.includes('heath')) return 1;
      if (name.includes('2.') || name.includes('vanilla')) return 2;
      return 3;
    };
    return getPriority(nameA) - getPriority(nameB) || a.short_name.localeCompare(b.short_name);
  });

  const holidayItems = menuItems.filter((item) => item.is_holiday_only || matchStr(item.section).includes('holiday'));
  const holidaySpecials = sortAbc(holidayItems.filter((i) => matchStr(i.type).includes('special') || matchStr(i.type).includes('entree')));
  const holidayWines = sortAbc(holidayItems.filter((i) => matchStr(i.type).includes('bottle') || matchStr(i.type).includes('wine') || matchStr(i.subtype).includes('wine')));

  const countCocktails = getSelectedCount(cocktails);
  const countWines = getSelectedCount(wines);
  const countStarters = getSelectedCount(starters);
  const countSpecials = getSelectedCount(specials);
  const countSteaks = getSelectedCount(steaks);
  const countMedallions = getSelectedCount(medallions);
  const countFish = getSelectedCount(fish);
  const countIceCream = getSelectedCount(iceCream);
  const countHolidaySpecials = getSelectedCount(holidaySpecials);
  const countHolidayWines = getSelectedCount(holidayWines);

  const totalSips = countCocktails + countWines;
  const totalEntrees = countSpecials + countSteaks + countMedallions + countFish;
  const totalHoliday = countHolidaySpecials + countHolidayWines;

  const renderBadge = (count: number, min: number, max: number) => {
    const isExceeded = count > max;
    const isUnder = count < min;
    let style = 'bg-slate-200 text-slate-700 font-semibold';
    if (isExceeded) style = 'bg-amber-100 text-amber-800 border border-amber-300 font-bold';
    else if (isUnder) style = 'bg-blue-50 text-blue-700 border border-blue-200 font-medium';

    return (
      <span className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full ${style}`}>
        ({count})
        {isExceeded && <span title="Exceeds expected item count">⚠️</span>}
      </span>
    );
  };

  const renderItemList = (items: MenuItem[], hidePrices = false) => {
    if (items.length === 0) {
      return <div className="text-xs text-gray-400 italic pl-2 py-1">No items available</div>;
    }

    return (
      <div className="space-y-1.5 pl-1">
        {items.map((item) => {
          const isSelected = selectedItemIds.includes(item.id);
          const rawPrice = prices[item.id];
          const displayPrice = rawPrice !== undefined && rawPrice !== null ? String(rawPrice) : '';

          return (
            <div
              key={item.id}
              onClick={() => onToggleSelection(item.id)}
              className="flex items-center justify-between bg-slate-50 p-2 rounded border border-gray-100 hover:bg-slate-100 transition cursor-pointer select-none"
            >
              <div className="flex items-center space-x-2 text-sm text-gray-800 flex-1">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                />
                <span className="font-medium text-xs sm:text-sm">{item.short_name}</span>
              </div>

              {!hidePrices && (
                <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                  <span className="text-xs text-gray-400">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={displayPrice}
                    placeholder="0"
                    onChange={(e) => onPriceChange(item.id, e.target.value)}
                    onBlur={() => onPriceBlur(item.id, prices[item.id] ?? '')}
                    className="w-14 text-right border p-1 rounded text-xs text-gray-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="no-print w-80 bg-white border-r border-gray-200 overflow-y-auto p-4 space-y-4">
      <h2 className="font-bold text-gray-800 text-lg border-b pb-2">Select Features</h2>

      {loading ? (
        <div className="text-sm text-gray-500 py-4 text-center">Loading menu items...</div>
      ) : (
        <div className="space-y-3">
          {/* Sips */}
          <div className="border rounded-md overflow-hidden border-gray-200">
            <button
              onClick={() => toggleSection('sips')}
              className="w-full bg-slate-100 px-3 py-2 text-left text-xs font-bold uppercase text-slate-700 tracking-wider flex justify-between items-center hover:bg-slate-200 transition"
            >
              <div className="flex items-center gap-1.5">
                <span>Signature Sips</span>
                {renderBadge(totalSips, 1, 2)}
              </div>
              <span className="text-sm">{openSection === 'sips' ? '−' : '+'}</span>
            </button>
            {openSection === 'sips' && (
              <div className="p-2 space-y-2 bg-white">
                <div className="border rounded border-gray-100">
                  <button onClick={() => toggleSipType('cocktails')} className="w-full bg-slate-50 px-2 py-1 text-left text-[11px] font-bold uppercase text-red-900 flex justify-between items-center">
                    <div className="flex items-center gap-1.5"><span>Cocktails</span>{renderBadge(countCocktails, 1, 1)}</div>
                    <span>{openSipType === 'cocktails' ? '−' : '+'}</span>
                  </button>
                  {openSipType === 'cocktails' && <div className="p-1.5">{renderItemList(cocktails)}</div>}
                </div>
                <div className="border rounded border-gray-100">
                  <button onClick={() => toggleSipType('wines')} className="w-full bg-slate-50 px-2 py-1 text-left text-[11px] font-bold uppercase text-red-900 flex justify-between items-center">
                    <div className="flex items-center gap-1.5"><span>Wines</span>{renderBadge(countWines, 0, 1)}</div>
                    <span>{openSipType === 'wines' ? '−' : '+'}</span>
                  </button>
                  {openSipType === 'wines' && <div className="p-1.5">{renderItemList(wines)}</div>}
                </div>
              </div>
            )}
          </div>

          {/* Starters */}
          <div className="border rounded-md overflow-hidden border-gray-200">
            <button
              onClick={() => toggleSection('starters')}
              className="w-full bg-slate-100 px-3 py-2 text-left text-xs font-bold uppercase text-slate-700 tracking-wider flex justify-between items-center hover:bg-slate-200 transition"
            >
              <div className="flex items-center gap-1.5">
                <span>Starters</span>
                {renderBadge(countStarters, 0, 1)}
              </div>
              <span className="text-sm">{openSection === 'starters' ? '−' : '+'}</span>
            </button>
            {openSection === 'starters' && <div className="p-2 bg-white">{renderItemList(starters)}</div>}
          </div>

          {/* Chef's Selections */}
          <div className="border rounded-md overflow-hidden border-gray-200">
            <button
              onClick={() => toggleSection('entrees')}
              className="w-full bg-slate-100 px-3 py-2 text-left text-xs font-bold uppercase text-slate-700 tracking-wider flex justify-between items-center hover:bg-slate-200 transition"
            >
              <div className="flex items-center gap-1.5">
                <span>Chef's Selections</span>
                {renderBadge(totalEntrees, 5, 5)}
              </div>
              <span className="text-sm">{openSection === 'entrees' ? '−' : '+'}</span>
            </button>
            {openSection === 'entrees' && (
              <div className="p-2 space-y-2 bg-white">
                <div className="border rounded border-gray-100">
                  <button onClick={() => toggleEntreeType('specials')} className="w-full bg-slate-50 px-2 py-1 text-left text-[11px] font-bold uppercase text-red-900 flex justify-between items-center">
                    <div className="flex items-center gap-1.5"><span>Specials / Entrees</span>{renderBadge(countSpecials, 0, 1)}</div>
                    <span>{openEntreeType === 'specials' ? '−' : '+'}</span>
                  </button>
                  {openEntreeType === 'specials' && <div className="p-1.5">{renderItemList(specials)}</div>}
                </div>
                <div className="border rounded border-gray-100">
                  <button onClick={() => toggleEntreeType('steaks')} className="w-full bg-slate-50 px-2 py-1 text-left text-[11px] font-bold uppercase text-red-900 flex justify-between items-center">
                    <div className="flex items-center gap-1.5"><span>Steaks</span>{renderBadge(countSteaks, 2, 2)}</div>
                    <span>{openEntreeType === 'steaks' ? '−' : '+'}</span>
                  </button>
                  {openEntreeType === 'steaks' && <div className="p-1.5">{renderItemList(steaks)}</div>}
                </div>
                <div className="border rounded border-gray-100">
                  <button onClick={() => toggleEntreeType('medallions')} className="w-full bg-slate-50 px-2 py-1 text-left text-[11px] font-bold uppercase text-red-900 flex justify-between items-center">
                    <div className="flex items-center gap-1.5"><span>Medallions</span>{renderBadge(countMedallions, 1, 1)}</div>
                    <span>{openEntreeType === 'medallions' ? '−' : '+'}</span>
                  </button>
                  {openEntreeType === 'medallions' && (
                    <div className="p-1.5 space-y-2">
                      <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded border border-gray-200">
                        <div className="flex items-center gap-1 text-xs text-gray-700 font-semibold" onClick={(e) => e.stopPropagation()}>
                          <span>6oz: $</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={String(medallion6ozPrice ?? '')}
                            placeholder="0"
                            onChange={(e) => onMedallionPriceChange?.('6oz', e.target.value)}
                            onBlur={(e) => onMedallionPriceBlur?.('6oz', e.target.value)}
                            className="w-14 text-right border p-1 rounded text-xs text-gray-800 font-semibold bg-white"
                          />
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-700 font-semibold" onClick={(e) => e.stopPropagation()}>
                          <span>9oz: $</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={String(medallion9ozPrice ?? '')}
                            placeholder="0"
                            onChange={(e) => onMedallionPriceChange?.('9oz', e.target.value)}
                            onBlur={(e) => onMedallionPriceBlur?.('9oz', e.target.value)}
                            className="w-14 text-right border p-1 rounded text-xs text-gray-800 font-semibold bg-white"
                          />
                        </div>
                      </div>
                      {renderItemList(medallions, true)}
                    </div>
                  )}
                </div>
                <div className="border rounded border-gray-100">
                  <button onClick={() => toggleEntreeType('fish')} className="w-full bg-slate-50 px-2 py-1 text-left text-[11px] font-bold uppercase text-red-900 flex justify-between items-center">
                    <div className="flex items-center gap-1.5"><span>Fish & Seafood</span>{renderBadge(countFish, 1, 1)}</div>
                    <span>{openEntreeType === 'fish' ? '−' : '+'}</span>
                  </button>
                  {openEntreeType === 'fish' && <div className="p-1.5">{renderItemList(fish)}</div>}
                </div>
              </div>
            )}
          </div>

          {/* Ice Cream */}
          <div className="border rounded-md overflow-hidden border-gray-200">
            <button
              onClick={() => toggleSection('dessert')}
              className="w-full bg-slate-100 px-3 py-2 text-left text-xs font-bold uppercase text-slate-700 tracking-wider flex justify-between items-center hover:bg-slate-200 transition"
            >
              <div className="flex items-center gap-1.5">
                <span>Homemade Ice Cream</span>
                {renderBadge(countIceCream, 3, 3)}
              </div>
              <span className="text-sm">{openSection === 'dessert' ? '−' : '+'}</span>
            </button>
            {openSection === 'dessert' && <div className="p-2 bg-white">{renderItemList(iceCream, true)}</div>}
          </div>

          {/* Holiday */}
          {hasHolidayFeature && (
            <div className="border rounded-md overflow-hidden border-amber-300 bg-amber-50/50">
              <button
                onClick={() => toggleSection('holiday')}
                className="w-full bg-amber-100 px-3 py-2 text-left text-xs font-bold uppercase text-amber-900 tracking-wider flex justify-between items-center hover:bg-amber-200 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Holiday Specials</span>
                  <span className="text-[11px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-full">({totalHoliday})</span>
                </div>
                <span className="text-sm">{openSection === 'holiday' ? '−' : '+'}</span>
              </button>
              {openSection === 'holiday' && (
                <div className="p-2 space-y-3 bg-white">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-amber-800 tracking-wider">Holiday Banner Title</label>
                    <input
                      type="text"
                      value={holidayTitle}
                      onChange={(e) => onHolidayTitleChange(e.target.value)}
                      placeholder="e.g. Easter Features"
                      className="w-full border p-1.5 text-xs rounded bg-white font-medium text-gray-800"
                    />
                  </div>
                  <div className="border rounded border-amber-100">
                    <button onClick={() => toggleHolidayType('specials')} className="w-full bg-amber-50 px-2 py-1 text-left text-[11px] font-bold uppercase text-amber-900 flex justify-between items-center">
                      <span>Holiday Specials ({countHolidaySpecials})</span>
                      <span>{openHolidayType === 'specials' ? '−' : '+'}</span>
                    </button>
                    {openHolidayType === 'specials' && <div className="p-1.5">{renderItemList(holidaySpecials)}</div>}
                  </div>
                  <div className="border rounded border-amber-100">
                    <button onClick={() => toggleHolidayType('wines')} className="w-full bg-amber-50 px-2 py-1 text-left text-[11px] font-bold uppercase text-amber-900 flex justify-between items-center">
                      <span>Holiday Wines ({countHolidayWines})</span>
                      <span>{openHolidayType === 'wines' ? '−' : '+'}</span>
                    </button>
                    {openHolidayType === 'wines' && <div className="p-1.5">{renderItemList(holidayWines)}</div>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}