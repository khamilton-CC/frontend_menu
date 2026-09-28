'use client';

import React, { useEffect, useRef, useState, useLayoutEffect, useMemo } from 'react';
import { MenuItem } from '../Sidebar/FeatureSidebar';
import { sortEntreesForMenu } from '@/lib/menuOrdering';
import { api } from '@/lib/api';

interface PrintPreviewProps {
  storeId?: string;
  storeName?: string;
  hasHolidayFeature?: boolean;
  holidayTitle?: string;
  menuItems: MenuItem[];
  selectedItemIds: string[];
  prices: Record<string, number | string>;
}

const TYPOGRAPHY_LEVELS = [
  { headerSize: 24, itemSize: 20, descSize: 14, sectionMarginTop: 24, itemGap: 8 },
  { headerSize: 23, itemSize: 19, descSize: 13.5, sectionMarginTop: 20, itemGap: 8 },
  { headerSize: 22, itemSize: 18, descSize: 13, sectionMarginTop: 20, itemGap: 6 },
  { headerSize: 21, itemSize: 17, descSize: 12.5, sectionMarginTop: 18, itemGap: 6 },
  { headerSize: 20, itemSize: 16.5, descSize: 12, sectionMarginTop: 16, itemGap: 6 },
  { headerSize: 19, itemSize: 16, descSize: 11.5, sectionMarginTop: 14, itemGap: 4 },
  { headerSize: 18, itemSize: 15, descSize: 11, sectionMarginTop: 12, itemGap: 4 },
  { headerSize: 17, itemSize: 14, descSize: 10.5, sectionMarginTop: 10, itemGap: 4 },
  { headerSize: 16, itemSize: 13, descSize: 10, sectionMarginTop: 8, itemGap: 2 },
  { headerSize: 15, itemSize: 12, descSize: 9.5, sectionMarginTop: 8, itemGap: 2 },
  { headerSize: 14, itemSize: 11, descSize: 9, sectionMarginTop: 6, itemGap: 2 },
  { headerSize: 13, itemSize: 10, descSize: 8.5, sectionMarginTop: 4, itemGap: 2 },
];

export default function PrintPreview({
  storeId,
  hasHolidayFeature,
  holidayTitle = 'Holiday Specials',
  menuItems,
  selectedItemIds,
  prices,
}: PrintPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardMeasureRef = useRef<HTMLDivElement>(null);
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [showPrintModal, setShowPrintModal] = useState(false);
  
  const [activeLevelIndex, setActiveLevelIndex] = useState(0);
  const [userLevelOverride, setUserLevelOverride] = useState<number | null>(null);
  const [titleScaleFactors, setTitleScaleFactors] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  // Guard to prevent autosaving empty arrays before the store's initial menu loads
  const hasHydratedRef = useRef(false);

  const safeMenuItems = Array.isArray(menuItems) ? menuItems : [];
  const safeItemIds = Array.isArray(selectedItemIds) ? selectedItemIds : [];
  const selectionKey = useMemo(() => safeItemIds.slice().sort().join(','), [safeItemIds]);
  const pricesKey = useMemo(() => JSON.stringify(prices), [prices]);

  // Once items are successfully passed down and non-empty (or store changes), mark as hydrated
  useEffect(() => {
    if (safeItemIds.length > 0) {
      hasHydratedRef.current = true;
    }
  }, [selectionKey]);

  // Reset hydration guard when switching stores
  useEffect(() => {
    hasHydratedRef.current = false;
  }, [storeId]);

  // Explicit Manual Save Handler (Floppy Disk) - Updates existing store file
  const handleManualSave = async () => {
    if (!storeId) {
      console.warn('Cannot save: storeId is missing');
      return;
    }
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await api.saveStoreFeatureMenu(storeId, safeItemIds);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      console.error('Failed manual save:', err?.message || err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  // Sync menu updates back to backend automatically only AFTER initial hydration
  useEffect(() => {
    if (!storeId) return;
    if (!hasHydratedRef.current) return; // Skip saving until data has loaded from backend

    const saveMenuToBackend = async () => {
      try {
        await api.saveStoreFeatureMenu(storeId, safeItemIds);
      } catch (err: any) {
        console.error('Failed to sync menu selections to backend:', err?.message || err);
      }
    };

    saveMenuToBackend();
  }, [storeId, selectionKey]);

  // Viewport scaling
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const parent = containerRef.current.parentElement;
      if (!parent) return;

      const parentWidth = parent.clientWidth - 48;
      const parentHeight = parent.clientHeight - 48;

      const scaleX = parentWidth / 1056;
      const scaleY = parentHeight / 816;
      const newScale = Math.min(scaleX, scaleY, 1);

      setScale(newScale > 0.3 ? newScale : 0.3);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pass 1: Measure natural stacked height and step down if it exceeds available sheet height
  useLayoutEffect(() => {
    if (userLevelOverride !== null) return;

    const el = cardMeasureRef.current;
    if (!el) return;

    const AVAILABLE_CONTENT_HEIGHT = 768;

    let bestIndex = 0;
    for (let i = 0; i < TYPOGRAPHY_LEVELS.length; i++) {
      const level = TYPOGRAPHY_LEVELS[i];

      el.style.setProperty('--header-size', `${level.headerSize}px`);
      el.style.setProperty('--item-size', `${level.itemSize}px`);
      el.style.setProperty('--desc-size', `${level.descSize}px`);
      el.style.setProperty('--section-mt', `${level.sectionMarginTop}px`);
      el.style.setProperty('--item-gap', `${level.itemGap}px`);

      if (el.scrollHeight <= AVAILABLE_CONTENT_HEIGHT) {
        bestIndex = i;
        break;
      }
      bestIndex = i;
    }

    setActiveLevelIndex(bestIndex);
  }, [selectionKey, hasHolidayFeature, pricesKey, userLevelOverride]);

  useEffect(() => {
    setUserLevelOverride(null);
  }, [selectionKey, pricesKey, hasHolidayFeature]);

  // Pass 2: Check horizontal overflow cleanly using actual clientWidth (including Ice Cream single-line section)
  useLayoutEffect(() => {
    const colEl = leftColumnRef.current;
    if (!colEl) return;

    const availableWidth = colEl.clientWidth;
    const titleNodes = colEl.querySelectorAll<HTMLElement>('[data-title-id]');
    const newScales: Record<string, number> = {};

    const currentLevel = TYPOGRAPHY_LEVELS[activeLevelIndex];

    titleNodes.forEach((node) => {
      const id = node.getAttribute('data-title-id');
      const type = node.getAttribute('data-title-type');
      if (!id) return;

      const baseFontSize = type === 'header' ? currentLevel.headerSize : currentLevel.itemSize;
      let currentFontSize = baseFontSize;

      node.style.fontSize = `${currentFontSize}px`;
      const originalWhiteSpace = node.style.whiteSpace;
      node.style.whiteSpace = 'nowrap';

      while (node.scrollWidth > availableWidth && currentFontSize > 11) {
        currentFontSize -= 0.5;
        node.style.fontSize = `${currentFontSize}px`;
      }

      node.style.whiteSpace = originalWhiteSpace;

      if (currentFontSize < baseFontSize) {
        newScales[id] = currentFontSize / baseFontSize;
      }
    });

    setTitleScaleFactors(newScales);
  }, [activeLevelIndex, selectionKey, pricesKey]);

  const currentStyles = TYPOGRAPHY_LEVELS[activeLevelIndex];

  const handleSizeUp = () => {
    const nextIndex = Math.max(0, activeLevelIndex - 1);
    setUserLevelOverride(nextIndex);
    setActiveLevelIndex(nextIndex);
  };

  const handleSizeDown = () => {
    const nextIndex = Math.min(TYPOGRAPHY_LEVELS.length - 1, activeLevelIndex + 1);
    setUserLevelOverride(nextIndex);
    setActiveLevelIndex(nextIndex);
  };

  const handlePrintClick = async () => {
    if (storeId) {
      try {
        await api.saveStoreFeatureMenu(storeId, safeItemIds);
      } catch (err) {
        console.error('Autosave on print failed:', err);
      }
    }

    const lastPrintTime = localStorage.getItem('last_menu_print_timestamp');
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    if (!lastPrintTime || now - parseInt(lastPrintTime, 10) > thirtyDaysInMs) {
      setShowPrintModal(true);
    } else {
      window.print();
    }
  };

  const confirmAndPrint = () => {
    localStorage.setItem('last_menu_print_timestamp', Date.now().toString());
    setShowPrintModal(false);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const activeItems = safeMenuItems.filter((item) => safeItemIds.includes(item.id));

  const getCategory = (item: MenuItem) => (item.section || '').toLowerCase();
  const getSubtype = (item: MenuItem) => (item.subtype || '').toLowerCase();
  const getType = (item: MenuItem) => (item.type || '').toLowerCase();

  function matchStr(val?: string) {
    return (val || '').toLowerCase().trim();
  }

  const m6Item = safeMenuItems.find(
    (i) =>
      (matchStr(i.short_name).includes('6oz') || matchStr(i.display_name).includes('6oz')) &&
      (matchStr(i.type).includes('medallion') || matchStr(i.subtype).includes('medallion'))
  );
  const m9Item = safeMenuItems.find(
    (i) =>
      (matchStr(i.short_name).includes('9oz') || matchStr(i.display_name).includes('9oz')) &&
      (matchStr(i.type).includes('medallion') || matchStr(i.subtype).includes('medallion'))
  );

  const medallion6ozPrice = m6Item ? prices[m6Item.id] ?? '0' : '0';
  const medallion9ozPrice = m9Item ? prices[m9Item.id] ?? '0' : '0';

  const getItemHeading = (item: MenuItem & { price?: number | string }) => {
    const isMedallion =
      getType(item).includes('medallion') ||
      getSubtype(item).includes('medallion') ||
      item.short_name.toLowerCase().includes('medallion') ||
      item.display_name.toLowerCase().includes('medallion');

    if (isMedallion) {
      const p6Val = medallion6ozPrice !== '' ? medallion6ozPrice : '0';
      const p9Val = medallion9ozPrice !== '' ? medallion9ozPrice : '0';
      return `${item.display_name} - 6oz $${p6Val} / 9oz $${p9Val}`;
    }

    const rawPrice = item.price ?? prices[item.id];
    const priceVal = rawPrice !== undefined && rawPrice !== '' ? rawPrice : '0';
    return `${item.display_name} - $${priceVal}`;
  };

  const sips = activeItems
    .filter((item) => !item.is_holiday_only && (getCategory(item).includes('sip') || getCategory(item).includes('drink')))
    .sort((a, b) => {
      const typeA = getSubtype(a);
      const typeB = getSubtype(b);
      if (typeA.includes('cocktail') && !typeB.includes('cocktail')) return -1;
      if (!typeA.includes('cocktail') && typeB.includes('cocktail')) return 1;
      return 0;
    });

  const starters = activeItems.filter(
    (item) => !item.is_holiday_only && (getCategory(item).includes('starter') || getCategory(item).includes('app'))
  );

  const rawChefItems = activeItems
    .filter(
      (item) =>
        !item.is_holiday_only &&
        (getCategory(item).includes('chef') ||
          getCategory(item).includes('entree') ||
          getCategory(item).includes('steak') ||
          getCategory(item).includes('fish'))
    )
    .map((item) => ({
      ...item,
      price: Number(prices[item.id] ?? 0),
    }));

  const chefSelections = sortEntreesForMenu(rawChefItems);

  const desserts = activeItems
    .filter((item) => !item.is_holiday_only && (getCategory(item).includes('cream') || getCategory(item).includes('dessert')))
    .sort((a, b) => {
      const getPriority = (name: string) => {
        if (name.includes('1.') || name.includes('heath')) return 1;
        if (name.includes('2.') || name.includes('vanilla')) return 2;
        return 3;
      };
      return getPriority(a.short_name.toLowerCase()) - getPriority(b.short_name.toLowerCase()) || a.short_name.localeCompare(b.short_name);
    });

  const holidayItems = activeItems.filter((item) => item.is_holiday_only || getCategory(item).includes('holiday'));

  const CardContent = ({ styleVars }: { styleVars?: React.CSSProperties }) => {
    let isFirstSection = true;

    const renderHeader = (title: string, sectionId: string, customColorClass = 'text-gray-900 border-red-900') => {
      const isFirst = isFirstSection;
      isFirstSection = false;
      const scale = titleScaleFactors[sectionId] ?? 1;
      const computedFontSize = `calc(var(--header-size, 20px) * ${scale})`;

      return (
        <div
          className="w-full"
          style={{ marginTop: isFirst ? 0 : 'var(--section-mt, 16px)' }}
        >
          <h2
            data-title-id={sectionId}
            data-title-type="header"
            style={{ fontSize: computedFontSize }}
            className={`font-bold border-b-2 pb-0.5 inline-block px-3 uppercase tracking-wider ${customColorClass} whitespace-nowrap`}
          >
            {title}
          </h2>
        </div>
      );
    };

    const renderItemHeading = (item: MenuItem, headingText: string) => {
      const scale = titleScaleFactors[item.id] ?? 1;
      const computedFontSize = `calc(var(--item-size, 16px) * ${scale})`;

      return (
        <div
          data-title-id={item.id}
          data-title-type="item"
          style={{ fontSize: computedFontSize }}
          className="font-bold text-gray-900 leading-tight whitespace-nowrap"
        >
          {headingText}
        </div>
      );
    };

    return (
      <div className="flex flex-col w-full text-center" style={styleVars}>
        {hasHolidayFeature && holidayItems.length > 0 && (
          <div className="w-full">
            {renderHeader(holidayTitle, 'sec-holiday', 'text-amber-900 border-amber-800')}
            <div className="mt-1 flex flex-col w-full" style={{ gap: 'var(--item-gap, 6px)' }}>
              {holidayItems.map((item) => (
                <div key={item.id} className="w-full">
                  {renderItemHeading(item, getItemHeading(item))}
                  {item.description && (
                    <p style={{ fontSize: 'var(--desc-size, 12px)' }} className="text-gray-700 leading-normal mt-0.5 px-1">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {sips.length > 0 && (
          <div className="w-full">
            {renderHeader('Signature Sips', 'sec-sips')}
            <div className="mt-1 flex flex-col w-full" style={{ gap: 'var(--item-gap, 6px)' }}>
              {sips.map((item) => (
                <div key={item.id} className="w-full">
                  {renderItemHeading(item, getItemHeading(item))}
                  {item.description && (
                    <p style={{ fontSize: 'var(--desc-size, 12px)' }} className="text-gray-700 leading-normal mt-0.5 px-1">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {starters.length > 0 && (
          <div className="w-full">
            {renderHeader('Starters', 'sec-starters')}
            <div className="mt-1 flex flex-col w-full" style={{ gap: 'var(--item-gap, 6px)' }}>
              {starters.map((item) => (
                <div key={item.id} className="w-full">
                  {renderItemHeading(item, getItemHeading(item))}
                  {item.description && (
                    <p style={{ fontSize: 'var(--desc-size, 12px)' }} className="text-gray-700 leading-normal mt-0.5 px-1">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {chefSelections.length > 0 && (
          <div className="w-full">
            {renderHeader("Chef's Selections", 'sec-chef')}
            <div className="mt-1 flex flex-col w-full" style={{ gap: 'var(--item-gap, 6px)' }}>
              {chefSelections.map((item) => (
                <div key={item.id} className="w-full">
                  {renderItemHeading(item, getItemHeading(item))}
                  {item.description && (
                    <p style={{ fontSize: 'var(--desc-size, 12px)' }} className="text-gray-700 leading-normal mt-0.5 px-1">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {desserts.length > 0 && (
          <div className="w-full">
            {renderHeader('Homemade Ice Cream', 'sec-desserts')}
            <div
              data-title-id="sec-desserts-line"
              data-title-type="item"
              style={{
                fontSize: `calc(var(--item-size, 16px) * ${titleScaleFactors['sec-desserts-line'] ?? 1})`,
              }}
              className="font-bold text-gray-800 tracking-wide mt-1 px-1 whitespace-nowrap"
            >
              {desserts.map((item) => item.display_name).join(' • ')}
            </div>
          </div>
        )}
      </div>
    );
  };

  const currentCSSVars = {
    '--header-size': `${currentStyles.headerSize}px`,
    '--item-size': `${currentStyles.itemSize}px`,
    '--desc-size': `${currentStyles.descSize}px`,
    '--section-mt': `${currentStyles.sectionMarginTop}px`,
    '--item-gap': `${currentStyles.itemGap}px`,
  } as React.CSSProperties;

  return (
    <div className="print-root flex-1 bg-slate-200 overflow-hidden flex flex-col h-full relative" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print, .print-root > div:first-child {
            display: none !important;
          }
          .physical-sheet, .physical-sheet * {
            visibility: visible;
          }
          .physical-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            transform: none !important;
            box-shadow: none !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .printer-margin-border {
            border: none !important;
            background: transparent !important;
          }
          .printer-margin-border > div.absolute {
            display: block !important;
            border-left: 1px solid #94a3b8 !important;
          }
        }
      `}} />

      <div className="no-print bg-slate-100 border-b border-slate-300 px-6 py-2.5 flex justify-between items-center shrink-0 shadow-sm">
        <div className="flex items-center space-x-4">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Live Fit-to-View Print Preview</span>
          
          <div className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded px-2 py-1 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Size Step: {activeLevelIndex + 1}/{TYPOGRAPHY_LEVELS.length}</span>
            <button
              onClick={handleSizeUp}
              disabled={activeLevelIndex === 0}
              title="Make text larger (Size Up)"
              className="px-1.5 py-0.5 text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded text-slate-700 font-bold cursor-pointer"
            >
              ▲
            </button>
            <button
              onClick={handleSizeDown}
              disabled={activeLevelIndex === TYPOGRAPHY_LEVELS.length - 1}
              title="Make text smaller (Size Down)"
              className="px-1.5 py-0.5 text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded text-slate-700 font-bold cursor-pointer"
            >
              ▼
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleManualSave}
            disabled={isSaving}
            title="Save Menu Selections"
            className="bg-slate-700 hover:bg-slate-800 text-white font-medium px-3.5 py-1.5 rounded text-sm shadow transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>💾</span>
            <span>{isSaving ? 'Saving...' : saveStatus === 'saved' ? 'Saved! ✓' : 'Save'}</span>
          </button>

          <button
            onClick={handlePrintClick}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-1.5 rounded text-sm shadow transition flex items-center space-x-1.5 cursor-pointer"
          >
            <span>🖨️</span>
            <span>Print Menu (2-Up)</span>
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div
          style={{
            width: '1056px',
            height: '816px',
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
          className="physical-sheet bg-white shadow-2xl rounded relative flex flex-col p-[24px]"
        >
          <div className="printer-margin-border w-full h-full relative flex border border-dashed border-slate-300 bg-white overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 border-l border-slate-400 z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-4 border-l border-slate-400 z-10 pointer-events-none" />

            <div ref={leftColumnRef} className="w-1/2 h-full pt-4 pb-4 pl-2 pr-[24px] flex flex-col justify-center box-border overflow-hidden">
              <CardContent styleVars={currentCSSVars} />
            </div>

            <div className="w-1/2 h-full pt-4 pb-4 pl-[24px] pr-2 flex flex-col justify-center box-border overflow-hidden">
              <CardContent styleVars={currentCSSVars} />
            </div>

            <div
              ref={cardMeasureRef}
              style={{ width: 'calc(50% - 16px)' }}
              className="absolute left-0 top-0 pointer-events-none opacity-0 invisible pl-2 pr-[24px] pt-4 pb-4 box-border flex flex-col justify-center"
            >
              <CardContent />
            </div>
          </div>
        </div>
      </div>

      {showPrintModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl space-y-4 text-gray-800">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">⚙️</span>
              <h3 className="text-xl font-bold text-gray-900">Quick Print Check</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              To ensure exact 0.25-inch outer margins and accurate center cut positioning, please verify your browser print settings once:
            </p>
            <ul className="text-sm text-gray-700 space-y-2 bg-slate-50 p-3 rounded border border-slate-200 list-disc list-inside">
              <li><strong>Orientation:</strong> Landscape</li>
              <li><strong>Margins:</strong> 0.25 all around</li>
              <li><strong>Headers and footers:</strong> Unchecked (Off)</li>
            </ul>
            <p className="text-xs text-gray-500">
              Your browser will save these settings so you won't need to adjust them again!
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmAndPrint}
                className="px-5 py-2 text-sm font-medium bg-red-900 hover:bg-red-800 text-white rounded shadow cursor-pointer"
              >
                Continue to Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}