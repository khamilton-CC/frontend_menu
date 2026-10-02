'use client';

import React, { useEffect, useRef, useState, useLayoutEffect, useMemo } from 'react';
import { MenuItem } from '../Sidebar/FeatureSidebar';
import { sortEntreesForMenu } from '@/lib/menuOrdering';
import CardContent from './CardContent';

interface PrintAreaProps {
  hasHolidayFeature?: boolean;
  holidayTitle?: string;
  menuItems: MenuItem[];
  currentItemIds: string[];
  activeTab: 'lunch' | 'dinner';
  prices: Record<string, number | string>;
}

export const TYPOGRAPHY_LEVELS = [
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

export interface PrintAreaHandle {
  activeLevelIndex: number;
  handleSizeUp: () => void;
  handleSizeDown: () => void;
}

export const PrintArea = React.forwardRef<PrintAreaHandle, PrintAreaProps>(({
  hasHolidayFeature,
  holidayTitle = 'Holiday Specials',
  menuItems,
  currentItemIds,
  activeTab,
  prices,
}, ref) => {
  const cardMeasureRef = useRef<HTMLDivElement>(null);
  const leftColumnRef = useRef<HTMLDivElement>(null);

  const [activeLevelIndex, setActiveLevelIndex] = useState(0);
  const [userLevelOverride, setUserLevelOverride] = useState<number | null>(null);
  const [titleScaleFactors, setTitleScaleFactors] = useState<Record<string, number>>({});

  const safeMenuItems = Array.isArray(menuItems) ? menuItems : [];
  const selectionKey = useMemo(() => currentItemIds.slice().sort().join(','), [currentItemIds]);
  const pricesKey = useMemo(() => JSON.stringify(prices), [prices]);

  const activeItems = useMemo(
    () => safeMenuItems.filter((item) => currentItemIds.includes(item.id)),
    [safeMenuItems, currentItemIds]
  );

  const matchStr = (val?: string) => (val || '').toLowerCase().trim();

  const m6Item = useMemo(
    () =>
      safeMenuItems.find(
        (i) =>
          (matchStr(i.short_name).includes('6oz') || matchStr(i.display_name).includes('6oz')) &&
          (matchStr(i.type).includes('medallion') || matchStr(i.subtype).includes('medallion'))
      ),
    [safeMenuItems]
  );

  const m9Item = useMemo(
    () =>
      safeMenuItems.find(
        (i) =>
          (matchStr(i.short_name).includes('9oz') || matchStr(i.display_name).includes('9oz')) &&
          (matchStr(i.type).includes('medallion') || matchStr(i.subtype).includes('medallion'))
      ),
    [safeMenuItems]
  );

  const medallion6ozPrice = m6Item ? prices[m6Item.id] ?? '0' : '0';
  const medallion9ozPrice = m9Item ? prices[m9Item.id] ?? '0' : '0';

  const getItemHeading = (item: MenuItem & { price?: number | string }) => {
    const isMedallion =
      matchStr(item.type).includes('medallion') ||
      matchStr(item.subtype).includes('medallion') ||
      item.short_name.toLowerCase().includes('medallion') ||
      item.display_name.toLowerCase().includes('medallion');

    if (isMedallion) {
      return `${item.display_name} - 6oz $${medallion6ozPrice} / 9oz $${medallion9ozPrice}`;
    }

    const rawPrice = item.price ?? prices[item.id];
    const priceVal = rawPrice !== undefined && rawPrice !== '' ? rawPrice : '0';
    return `${item.display_name} - $${priceVal}`;
  };

  const sips = useMemo(
    () => activeItems.filter((item) => !item.is_holiday_only && (matchStr(item.section).includes('sip') || matchStr(item.section).includes('drink'))),
    [activeItems]
  );

  const starters = useMemo(
    () => activeItems.filter((item) => !item.is_holiday_only && (matchStr(item.section).includes('starter') || matchStr(item.section).includes('app'))),
    [activeItems]
  );

  const chefSelections = useMemo(() => {
    const rawChefItems = activeItems
      .filter(
        (item) =>
          !item.is_holiday_only &&
          (matchStr(item.section).includes('chef') ||
            matchStr(item.section).includes('entree') ||
            matchStr(item.section).includes('steak') ||
            matchStr(item.section).includes('fish'))
      )
      .map((item) => ({ ...item, price: Number(prices[item.id] ?? 0) }));
    return sortEntreesForMenu(rawChefItems);
  }, [activeItems, prices]);

  const desserts = useMemo(
    () => activeItems.filter((item) => !item.is_holiday_only && (matchStr(item.section).includes('cream') || matchStr(item.section).includes('dessert'))),
    [activeItems]
  );

  const holidayItems = useMemo(
    () => activeItems.filter((item) => item.is_holiday_only || matchStr(item.section).includes('holiday')),
    [activeItems]
  );

  useLayoutEffect(() => {
    if (userLevelOverride !== null) return;
    const el = cardMeasureRef.current;
    if (!el) return;

    const availableHeight = el.clientHeight;
    let bestIndex = 0;

    for (let i = 0; i < TYPOGRAPHY_LEVELS.length; i++) {
      const level = TYPOGRAPHY_LEVELS[i];
      el.style.setProperty('--header-size', `${level.headerSize}px`);
      el.style.setProperty('--item-size', `${level.itemSize}px`);
      el.style.setProperty('--desc-size', `${level.descSize}px`);
      el.style.setProperty('--section-mt', `${level.sectionMarginTop}px`);
      el.style.setProperty('--item-gap', `${level.itemGap}px`);

      if (el.scrollHeight <= availableHeight) {
        bestIndex = i;
        break;
      }
      bestIndex = i;
    }
    setActiveLevelIndex(bestIndex);
  }, [selectionKey, hasHolidayFeature, pricesKey, userLevelOverride, activeTab]);

  useEffect(() => {
    setUserLevelOverride(null);
  }, [selectionKey, pricesKey, hasHolidayFeature, activeTab]);

  useLayoutEffect(() => {
    const colEl = leftColumnRef.current;
    if (!colEl) return;

    const availableWidth = colEl.clientWidth - 24;
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

      // Check with a 2px buffer to ensure it safely fits within the available width bounds
      while (node.scrollWidth + 2 > availableWidth && currentFontSize > 10) {
        currentFontSize -= 0.5;
        node.style.fontSize = `${currentFontSize}px`;
      }
      node.style.whiteSpace = originalWhiteSpace;

      if (currentFontSize < baseFontSize) {
        newScales[id] = currentFontSize / baseFontSize;
      }
    });

    setTitleScaleFactors(newScales);
  }, [activeLevelIndex, selectionKey, pricesKey, activeTab]);

  const currentStyles = TYPOGRAPHY_LEVELS[activeLevelIndex];

  const handleSizeUp = () => {
    setActiveLevelIndex((prev) => {
      const nextIndex = Math.max(0, prev - 1);
      setUserLevelOverride(nextIndex);
      return nextIndex;
    });
  };

  const handleSizeDown = () => {
    setActiveLevelIndex((prev) => {
      const nextIndex = Math.min(TYPOGRAPHY_LEVELS.length - 1, prev + 1);
      setUserLevelOverride(nextIndex);
      return nextIndex;
    });
  };

  React.useImperativeHandle(ref, () => ({
    activeLevelIndex,
    handleSizeUp,
    handleSizeDown,
  }));

  const currentCSSVars = {
    '--header-size': `${currentStyles.headerSize}px`,
    '--item-size': `${currentStyles.itemSize}px`,
    '--desc-size': `${currentStyles.descSize}px`,
    '--section-mt': `${currentStyles.sectionMarginTop}px`,
    '--item-gap': `${currentStyles.itemGap}px`,
  } as React.CSSProperties;

  const cardContentProps = {
    hasHolidayFeature,
    holidayTitle,
    holidayItems,
    sips,
    starters,
    chefSelections,
    desserts,
    titleScaleFactors,
    getItemHeading,
  };

  return (
    <div className="w-full h-full relative flex bg-white overflow-hidden box-border">
      <div className="absolute top-1 left-1/2 -translate-x-1/2 h-2 border-l-2 border-dashed border-slate-300 z-30 pointer-events-none" />
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-2 border-l-2 border-dashed border-slate-300 z-30 pointer-events-none" />

      {/* Left Column */}
      <div ref={leftColumnRef} className="w-1/2 h-full py-0 pl-0 pr-6 flex flex-col justify-center box-border overflow-hidden">
        <CardContent styleVars={currentCSSVars} {...cardContentProps} />
      </div>

      {/* Right Column */}
      <div className="w-1/2 h-full py-0 pr-0 pl-6 flex flex-col justify-center box-border overflow-hidden">
        <CardContent styleVars={currentCSSVars} {...cardContentProps} />
      </div>

      {/* Hidden measurement container */}
      <div
        ref={cardMeasureRef}
        style={{ width: 'calc(50% - 24px)' }}
        className="absolute left-0 top-0 h-full pointer-events-none opacity-0 invisible pl-0 pr-6 py-0 box-border flex flex-col justify-center"
      >
        <CardContent {...cardContentProps} />
      </div>
    </div>
  );
});

PrintArea.displayName = 'PrintArea';