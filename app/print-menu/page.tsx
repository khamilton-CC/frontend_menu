'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PrintArea } from '@/components/Print/PrintArea';
import { MenuItem } from '@/components/Sidebar/FeatureSidebar';

function PrintMenuContent() {
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'lunch' | 'dinner') || 'lunch';

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [currentItemIds, setCurrentItemIds] = useState<string[]>([]);
  const [prices, setPrices] = useState<Record<string, number | string>>({});
  const [holidayTitle, setHolidayTitle] = useState('Holiday Specials');
  const [hasHolidayFeature, setHasHolidayFeature] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedPayload = sessionStorage.getItem('print_menu_payload');
      if (storedPayload) {
        const data = JSON.parse(storedPayload);
        setMenuItems(data.menuItems || []);
        setCurrentItemIds(data.currentItemIds || []);
        setPrices(data.prices || {});
        setHasHolidayFeature(data.hasHolidayFeature || false);
        if (data.holidayTitle) setHolidayTitle(data.holidayTitle);
      }
    } catch (err) {
      console.error('Failed to load print payload from session storage:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        window.print();
        // Automatically close the popup window once the print dialog closes/cancels.
        // This prevents any residual browser states from poking or reloading the parent tab.
        window.close();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white text-slate-600 font-serif text-lg">
        Preparing menu for printing...
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @page {
          size: 11in 8.5in landscape !important;
          margin: 0.25in !important;
        }
        html, body {
          width: 1056px !important;
          height: 768px !important;
          max-width: 1056px !important;
          max-height: 768px !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          background: white !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      `}</style>
      <div 
        style={{ 
          width: '1056px', 
          height: '768px', 
          position: 'fixed',
          top: 0,
          left: 0,
          margin: 0,
          padding: 0,
          display: 'flex', 
          overflow: 'hidden',
          background: 'white',
          boxSizing: 'border-box',
          fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif'
        }}
      >
        <div style={{ width: '1056px', height: '768px', margin: 0, padding: 0, display: 'flex', boxSizing: 'border-box', overflow: 'hidden' }}>
          <PrintArea
            hasHolidayFeature={hasHolidayFeature}
            holidayTitle={holidayTitle}
            menuItems={menuItems}
            currentItemIds={currentItemIds}
            activeTab={activeTab}
            prices={prices}
          />
        </div>
      </div>
    </>
  );
}

export default function PrintMenuPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-serif">Loading...</div>}>
      <PrintMenuContent />
    </Suspense>
  );
}