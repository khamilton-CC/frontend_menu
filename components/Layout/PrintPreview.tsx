'use client';

import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { MenuItem } from '../Sidebar/FeatureSidebar';
import { sortEntreesForMenu } from '@/lib/menuOrdering';

interface PrintPreviewProps {
  storeName?: string;
  hasHolidayFeature?: boolean;
  holidayTitle?: string;
  menuItems: MenuItem[];
  selectedItemIds: string[];
  prices: Record<string, number | string>;
}

export default function PrintPreview({
  hasHolidayFeature,
  holidayTitle = 'Holiday Specials',
  menuItems,
  selectedItemIds,
  prices,
}: PrintPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const testContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // 5 discrete font sizing tiers from largest (0) to smallest (4)
  const FONT_LEVELS = [
    { titleSize: 16, titleClass: 'font-bold', desc: 'text-xs leading-snug', header: 'text-base font-bold', spacing: 'space-y-2' },
    { titleSize: 14, titleClass: 'font-bold', desc: 'text-[11px] leading-tight', header: 'text-sm font-bold', spacing: 'space-y-1.5' },
    { titleSize: 12, titleClass: 'font-bold', desc: 'text-[10px] leading-tight', header: 'text-xs font-bold', spacing: 'space-y-1' },
    { titleSize: 11, titleClass: 'font-bold', desc: 'text-[9px] leading-tight', header: 'text-[11px] font-bold', spacing: 'space-y-0.5' },
    { titleSize: 10, titleClass: 'font-bold', desc: 'text-[8.5px] leading-none', header: 'text-[10px] font-bold', spacing: 'space-y-0.5' },
  ];

  const [activeFontLevelIndex, setActiveFontLevelIndex] = useState(0);

  // Handle overall fit-to-view container scaling for the viewport preview
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const parent = containerRef.current.parentElement;
      if (!parent) return;

      const parentWidth = parent.clientWidth - 48;
      const parentHeight = parent.clientHeight - 48;

      const targetWidth = 1056;
      const targetHeight = 816;

      const scaleX = parentWidth / targetWidth;
      const scaleY = parentHeight / targetHeight;
      const newScale = Math.min(scaleX, scaleY, 1);

      setScale(newScale > 0.3 ? newScale : 0.3);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Safeguards against undefined props during initial mounts
  const safeMenuItems = Array.isArray(menuItems) ? menuItems : [];
  const safeItemIds = Array.isArray(selectedItemIds) ? selectedItemIds : [];
  const selectionKey = safeItemIds.slice().sort().join(',');

  // Reset to Level 0 whenever selection changes
  useLayoutEffect(() => {
    setActiveFontLevelIndex(0);
  }, [selectionKey, hasHolidayFeature]);

  // Fluid overflow detection: compares actual content height against its container box height
  useLayoutEffect(() => {
    if (!testContainerRef.current) return;

    const el = testContainerRef.current;
    const isOverflowing = el.scrollHeight > el.clientHeight;

    if (isOverflowing && activeFontLevelIndex < FONT_LEVELS.length - 1) {
      setActiveFontLevelIndex((prev) => prev + 1);
    }
  }, [activeFontLevelIndex, selectionKey, hasHolidayFeature]);

  const currentStyles = FONT_LEVELS[activeFontLevelIndex];

  const handlePrintClick = () => {
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

  const m6Item = safeMenuItems.find((i) => (matchStr(i.short_name).includes('6oz') || matchStr(i.display_name).includes('6oz')) && (matchStr(i.type).includes('medallion') || matchStr(i.subtype).includes('medallion')));
  const m9Item = safeMenuItems.find((i) => (matchStr(i.short_name).includes('9oz') || matchStr(i.display_name).includes('9oz')) && (matchStr(i.type).includes('medallion') || matchStr(i.subtype).includes('medallion')));

  const medallion6ozPrice = m6Item ? prices[m6Item.id] ?? '0' : '0';
  const medallion9ozPrice = m9Item ? prices[m9Item.id] ?? '0' : '0';

  function matchStr(val?: string) {
    return (val || '').toLowerCase().trim();
  }

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

  // Continuous fine-grained shrinking component for individual item titles
  const AutoShrinkTitle = ({ text }: { text: string }) => {
    const textRef = useRef<HTMLDivElement>(null);
    const fontSizes = ['text-sm', 'text-[13px]', 'text-xs', 'text-[11px]', 'text-[10px]', 'text-[9px]'];
    const [sizeIndex, setSizeIndex] = useState(0);

    useLayoutEffect(() => {
      setSizeIndex(0);
    }, [text, activeFontLevelIndex]);

    useLayoutEffect(() => {
      const el = textRef.current;
      if (!el) return;

      if (el.scrollWidth > el.clientWidth && sizeIndex < fontSizes.length - 1) {
        setSizeIndex((prev) => prev + 1);
      }
    }, [sizeIndex, text]);

    return (
      <div
        ref={textRef}
        className={`${fontSizes[sizeIndex]} font-bold text-gray-900 whitespace-nowrap overflow-hidden w-full px-2`}
      >
        {text}
      </div>
    );
  };

  const SingleMenuCard = () => (
    <div className="w-1/2 h-full py-0 text-center font-serif flex flex-col justify-between box-border overflow-hidden px-3">
      {hasHolidayFeature && holidayItems.length > 0 && (
        <div className="w-full">
          <h2 className={`${currentStyles.header} text-amber-900 border-b-2 border-amber-800 pb-0.5 inline-block px-4 tracking-wider uppercase`}>
            {holidayTitle}
          </h2>
          <div className={`mt-1 ${currentStyles.spacing}`}>
            {holidayItems.map((item) => (
              <div key={item.id} className="w-full">
                <AutoShrinkTitle text={getItemHeading(item)} />
                {item.description && <p className={`${currentStyles.desc} text-gray-700 px-1`}>{item.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {sips.length > 0 && (
        <div className="w-full">
          <h2 className={`${currentStyles.header} text-gray-900 border-b-2 border-red-900 pb-0.5 inline-block px-4 tracking-wider uppercase`}>
            Signature Sips
          </h2>
          <div className={`mt-1 ${currentStyles.spacing}`}>
            {sips.map((item) => (
              <div key={item.id} className="w-full">
                <AutoShrinkTitle text={getItemHeading(item)} />
                {item.description && <p className={`${currentStyles.desc} text-gray-700 px-1`}>{item.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {starters.length > 0 && (
        <div className="w-full">
          <h2 className={`${currentStyles.header} text-gray-900 border-b-2 border-red-900 pb-0.5 inline-block px-4 tracking-wider uppercase`}>
            Starters
          </h2>
          <div className={`mt-1 ${currentStyles.spacing}`}>
            {starters.map((item) => (
              <div key={item.id} className="w-full">
                <AutoShrinkTitle text={getItemHeading(item)} />
                {item.description && <p className={`${currentStyles.desc} text-gray-700 px-1`}>{item.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {chefSelections.length > 0 && (
        <div className="w-full">
          <h2 className={`${currentStyles.header} text-gray-900 border-b-2 border-red-900 pb-0.5 inline-block px-4 tracking-wider uppercase`}>
            Chef's Selections
          </h2>
          <div className={`mt-1 ${currentStyles.spacing}`}>
            {chefSelections.map((item) => (
              <div key={item.id} className="w-full">
                <AutoShrinkTitle text={getItemHeading(item)} />
                {item.description && <p className={`${currentStyles.desc} text-gray-700 px-1`}>{item.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {desserts.length > 0 && (
        <div className="w-full">
          <h2 className={`${currentStyles.header} text-gray-900 border-b-2 border-red-900 pb-0.5 inline-block px-4 tracking-wider uppercase`}>
            Homemade Ice Cream
          </h2>
          <p
            style={{ fontSize: `${currentStyles.titleSize}px` }}
            className={`font-bold text-gray-800 tracking-wide px-1 mt-1`}
          >
            {desserts.map((item) => item.display_name).join(' • ')}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 bg-slate-200 overflow-hidden flex flex-col h-full relative">
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: landscape;
            margin: 0.5in;
          }
          .physical-sheet {
            box-shadow: none !important;
            transform: none !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            border: none !important;
            background: white !important;
            padding: 0 !important;
          }
          .printer-margin-border {
            border: none !important;
          }
        }
      `}</style>

      {/* Top action bar */}
      <div className="no-print bg-slate-100 border-b border-slate-300 px-6 py-2.5 flex justify-between items-center shrink-0 shadow-sm">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Live Fit-to-View Print Preview</span>
        <button
          onClick={handlePrintClick}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-1.5 rounded text-sm shadow transition flex items-center space-x-1.5 cursor-pointer"
        >
          <span>🖨️</span>
          <span>Print Menu (2-Up)</span>
        </button>
      </div>

      {/* Scaled Preview Viewport */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-4 overflow-hidden"
      >
        <div
          style={{
            width: '1056px',
            height: '816px',
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
          className="physical-sheet bg-white shadow-2xl rounded relative flex flex-col border border-slate-300 p-[48px]"
        >
          <div className="printer-margin-border w-full h-full relative flex flex-col border border-dashed border-slate-400 bg-white p-0">
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 border-r border-dashed border-gray-400 z-10 pointer-events-none" />

            <div ref={testContainerRef} className="flex w-full h-full justify-between items-stretch overflow-hidden">
              <SingleMenuCard />
              <SingleMenuCard />
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
              To make sure your menus cut perfectly down the center with exact 0.5-inch outer margins, please verify your browser print settings match these options once:
            </p>
            <ul className="text-sm text-gray-700 space-y-2 bg-slate-50 p-3 rounded border border-slate-200 list-disc list-inside">
              <li><strong>Orientation:</strong> Landscape</li>
              <li><strong>Margins:</strong> Default or 0.5 inches</li>
              <li><strong>Headers and footers:</strong> Unchecked (Off)</li>
            </ul>
            <p className="text-xs text-gray-500">
              Your browser will remember these settings for the next month, so you won't see this reminder again soon!
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