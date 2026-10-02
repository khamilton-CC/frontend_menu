'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MenuItem } from '../Sidebar/FeatureSidebar';
import { api } from '@/lib/api';
import { PrintArea, PrintAreaHandle, TYPOGRAPHY_LEVELS } from '../Print/PrintArea';

interface PrintPreviewProps {
  storeId?: string;
  storeName?: string;
  hasHolidayFeature?: boolean;
  holidayTitle?: string;
  menuItems: MenuItem[];
  lunchItemIds: string[];
  dinnerItemIds: string[];
  dbLunchItemIds: string[];
  dbDinnerItemIds: string[];
  lunchIdsRef: React.MutableRefObject<string[]>;
  dinnerIdsRef: React.MutableRefObject<string[]>;
  storeIdRef: React.MutableRefObject<string | undefined>;
  activeTab: 'lunch' | 'dinner';
  onActiveTabChange: (tab: 'lunch' | 'dinner') => void;
  onLunchItemIdsChange: (ids: string[]) => void;
  onDinnerItemIdsChange: (ids: string[]) => void;
  prices: Record<string, number | string>;
  loading?: boolean;
  isSavingParent?: boolean;
  onPrintAction: () => Promise<void>;
  onSaveAction: () => Promise<void>;
}

export const PRINT_SHEET_WIDTH = 1056; // 11 inches @ 96 DPI
export const PRINT_SHEET_HEIGHT = 816; // 8.5 inches @ 96 DPI

export default function PrintPreview({
  storeId,
  hasHolidayFeature,
  holidayTitle = 'Holiday Specials',
  menuItems,
  lunchItemIds,
  dinnerItemIds,
  dbLunchItemIds,
  dbDinnerItemIds,
  lunchIdsRef,
  dinnerIdsRef,
  storeIdRef,
  activeTab,
  onActiveTabChange,
  prices,
  loading,
  isSavingParent,
  onPrintAction,
  onSaveAction,
}: PrintPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const printAreaRef = useRef<PrintAreaHandle>(null);
  const [scale, setScale] = useState(1);

  const [isManualSaving, setIsManualSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  // Track the active step index in state so the UI re-renders on change
  const [displayLevelIndex, setDisplayLevelIndex] = useState(0);

  // Compute dirty state by comparing active working states to database baselines
  const isLunchDirty = useMemo(() => {
    const sortedCurrent = [...lunchItemIds].sort().join(',');
    const sortedDb = [...dbLunchItemIds].sort().join(',');
    return sortedCurrent !== sortedDb;
  }, [lunchItemIds, dbLunchItemIds]);

  const isDinnerDirty = useMemo(() => {
    const sortedCurrent = [...dinnerItemIds].sort().join(',');
    const sortedDb = [...dbDinnerItemIds].sort().join(',');
    return sortedCurrent !== sortedDb;
  }, [dinnerItemIds, dbDinnerItemIds]);

  const isAnyDirty = isLunchDirty || isDinnerDirty;

  // Active items based on current tab
  const currentItemIds = activeTab === 'lunch' ? lunchItemIds : dinnerItemIds;

  const handleManualSave = async () => {
    const activeStoreId = storeIdRef.current;
    if (!activeStoreId) {
      console.warn('Cannot save: storeId is missing');
      return;
    }

    setIsManualSaving(true);
    setSaveStatus('idle');
    try {
      await onSaveAction();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Failed manual save:', message);
      setSaveStatus('error');
    } finally {
      setIsManualSaving(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const parent = containerRef.current.parentElement;
      if (!parent) return;

      const parentWidth = parent.clientWidth - 48;
      const parentHeight = parent.clientHeight - 48;

      const scaleX = parentWidth / PRINT_SHEET_WIDTH;
      const scaleY = parentHeight / PRINT_SHEET_HEIGHT;
      const newScale = Math.min(scaleX, scaleY, 1);

      setScale(newScale > 0.3 ? newScale : 0.3);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePrintClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    await onPrintAction();
  };

  const handleTabSwitch = (newTab: 'lunch' | 'dinner') => {
    if (newTab === activeTab) return;
    onActiveTabChange(newTab);
  };

  // Wrapper handlers to call PrintArea methods AND update parent state
  const handleSizeUpClick = () => {
    printAreaRef.current?.handleSizeUp();
    if (printAreaRef.current) {
      setDisplayLevelIndex(printAreaRef.current.activeLevelIndex);
    }
  };

  const handleSizeDownClick = () => {
    printAreaRef.current?.handleSizeDown();
    if (printAreaRef.current) {
      setDisplayLevelIndex(printAreaRef.current.activeLevelIndex);
    }
  };

  const isSaving = isSavingParent || isManualSaving;

  return (
    <div className="flex-1 bg-slate-200 overflow-hidden flex flex-col h-full relative" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}>
      
      {/* Top UI Toolbar */}
      <div className="bg-slate-100 border-b border-slate-300 px-6 py-2.5 flex justify-between items-center shrink-0 shadow-sm">
        <div className="flex items-center space-x-4">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Live Fit-to-View Print Preview</span>
          
          <div className="flex items-center space-x-1 bg-slate-200 p-1 rounded-md border border-slate-300">
            <button
              type="button"
              onClick={() => handleTabSwitch('lunch')}
              className={`px-3 py-1 text-xs font-semibold rounded transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'lunch' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Lunch Menu</span>
              {isLunchDirty && <span className="w-2 h-2 rounded-full bg-amber-500" title="Unsaved changes" />}
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('dinner')}
              className={`px-3 py-1 text-xs font-semibold rounded transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'dinner' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Dinner Menu</span>
              {isDinnerDirty && <span className="w-2 h-2 rounded-full bg-amber-500" title="Unsaved changes" />}
            </button>
          </div>

          <div className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded px-2 py-1 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Size Step: {displayLevelIndex + 1}/{TYPOGRAPHY_LEVELS.length}</span>
            <button
              type="button"
              onClick={handleSizeUpClick}
              disabled={displayLevelIndex === 0}
              title="Make text larger"
              className="px-1.5 py-0.5 text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded text-slate-700 font-bold cursor-pointer"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={handleSizeDownClick}
              disabled={displayLevelIndex === TYPOGRAPHY_LEVELS.length - 1}
              title="Make text smaller"
              className="px-1.5 py-0.5 text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded text-slate-700 font-bold cursor-pointer"
            >
              ▼
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleManualSave}
            disabled={isSaving}
            className={`font-medium px-3.5 py-1.5 rounded text-sm shadow transition flex items-center space-x-1.5 cursor-pointer ${
              isAnyDirty 
                ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse' 
                : 'bg-slate-700 hover:bg-slate-800 text-white'
            } disabled:opacity-50`}
          >
            <span>💾</span>
            <span>{isSaving ? 'Saving...' : saveStatus === 'saved' ? 'All Changes Saved! ✓' : isAnyDirty ? 'Save Changes *' : 'Saved'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrintClick}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-1.5 rounded text-sm shadow transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>🖨️</span>
            <span>Print {activeTab}</span>
          </button>
        </div>
      </div>

      {/* Screen Preview Container */}
      <div ref={containerRef} className="flex-1 bg-slate-200 grid place-content-center p-4 overflow-hidden relative">
        <div
          style={{
            width: `${PRINT_SHEET_WIDTH * scale}px`,
            height: `${PRINT_SHEET_HEIGHT * scale}px`,
          }}
          className="relative"
        >
          {/* Physical Sheet Container */}
          <div
            style={{
              width: `${PRINT_SHEET_WIDTH}px`,
              height: `${PRINT_SHEET_HEIGHT}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
            className="absolute top-0 left-0 physical-sheet shadow-2xl rounded flex flex-col bg-white overflow-hidden box-border"
          >
            {/* Paper Sheet Margins / Guide Lines Layer */}
            <div className="absolute inset-[24px] pointer-events-none z-20">
              <div className="absolute inset-0 border border-dashed border-slate-400" />
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-l border-dashed border-slate-400" />
            </div>

            {/* PrintArea */}
            <div className="absolute inset-[24px] z-10 flex">
              <PrintArea
                ref={printAreaRef}
                hasHolidayFeature={hasHolidayFeature}
                holidayTitle={holidayTitle}
                menuItems={menuItems}
                currentItemIds={currentItemIds}
                activeTab={activeTab}
                prices={prices}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}