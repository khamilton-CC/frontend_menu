'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import FeatureSidebar, { MenuItem } from '@/components/Sidebar/FeatureSidebar';
import PrintPreview from '@/components/Layout/PrintPreview';
import { PrintArea } from '@/components/Print/PrintArea';
import { api } from '@/lib/api';

export default function Home() {
  const { user, role, stores, token, selectedStore, loading: authLoading } = useAuth();
  const router = useRouter();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [prices, setPrices] = useState<Record<string, number | string>>({});

  // 1. STORE_Items_DB: Baseline memory fetched from database
  const [dbLunchItemIds, setDbLunchItemIds] = useState<string[]>([]);
  const [dbDinnerItemIds, setDbDinnerItemIds] = useState<string[]>([]);

  // 2. STORE_Items_Local: Active working states modified by user interactions
  const [lunchItemIds, setLunchItemIds] = useState<string[]>([]);
  const [dinnerItemIds, setDinnerItemIds] = useState<string[]>([]);

  // Synchronous Refs to prevent race conditions during Print/Save
  const lunchIdsRef = useRef(lunchItemIds);
  const dinnerIdsRef = useRef(dinnerItemIds);
  const storeIdRef = useRef(selectedStore?.id);

  useEffect(() => { lunchIdsRef.current = lunchItemIds; }, [lunchItemIds]);
  useEffect(() => { dinnerIdsRef.current = dinnerItemIds; }, [dinnerItemIds]);
  useEffect(() => { storeIdRef.current = selectedStore?.id; }, [selectedStore?.id]);

  // Track which tab is currently active ('lunch' | 'dinner')
  const [activeTab, setActiveTab] = useState<'lunch' | 'dinner'>('lunch');
  const [holidayTitle, setHolidayTitle] = useState('Holiday Specials');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // The master in-page print toggle state
  const [isPrinting, setIsPrinting] = useState(false);

  // Auth & Store Routing Protection
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (role !== 'superadmin' && stores && stores.length === 0) {
      router.push('/select-store');
    }
  }, [user, role, stores, authLoading, router]);

  // Fetch store menu data and separate feature menus when store changes
  useEffect(() => {
    if (!selectedStore?.id || !token) return;

    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const itemsRes = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/menu?storeId=${selectedStore.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const itemsData = await itemsRes.json();

        if (itemsRes.ok && isMounted) {
          setMenuItems(itemsData.items || []);
          setPrices(itemsData.prices || {});
        }

        const savedRes = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/store-menu/${selectedStore.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (savedRes.ok && isMounted) {
          const savedData = await savedRes.json();
          const loadedLunch = savedData?.selected_item_ids || [];
          const loadedDinner = savedData?.selected_item_ids_dinner || [];

          setDbLunchItemIds(loadedLunch);
          setDbDinnerItemIds(loadedDinner);
          setLunchItemIds(loadedLunch);
          setDinnerItemIds(loadedDinner);
        }
      } catch (err) {
        console.error('Failed to load menu data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [selectedStore?.id, token]);

  // Listen for native print dialog completion/cancellation to restore normal UI
  useEffect(() => {
    const handleAfterPrint = () => {
      setIsPrinting(false);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  // Centralized Parent Print Handler (Saves both menus, updates DB memory baselines, and triggers in-page print view)
  const handleParentPrint = async () => {
    const activeStoreId = storeIdRef.current;
    if (!activeStoreId) {
      alert('Error: No active store selected.');
      return;
    }

    try {
      setIsSaving(true);
      // Force save BOTH lunch and dinner states to the database before printing
      await api.saveStoreFeatureMenus(activeStoreId, lunchIdsRef.current, dinnerIdsRef.current);
      
      // Update DB baselines in memory so dirty checks clear out correctly
      setDbLunchItemIds([...lunchIdsRef.current]);
      setDbDinnerItemIds([...dinnerIdsRef.current]);
    } catch (err: unknown) {
      console.error('Save on print failed:', err);
      alert('Failed to save menu changes before printing.');
      setIsSaving(false);
      return;
    } finally {
      setIsSaving(false);
    }

    // Activate the isolated print view layer in DOM
    setIsPrinting(true);

    // Give React one tick to render the print DOM tree, then invoke native print
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePriceChange = (id: string, price: number | string) => {
    setPrices((prev) => ({ ...prev, [id]: price }));
  };

  const handlePriceBlur = async (itemId: string, newPrice: number | string) => {
    if (!selectedStore?.id || !token) return;
    const numericPrice = Number(newPrice) || 0;
    setPrices((prev) => ({ ...prev, [itemId]: numericPrice }));

    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/menu/price`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          storeId: selectedStore.id,
          itemId: itemId,
          price: numericPrice,
        }),
      });
    } catch (err) {
      console.error('Failed to update store price on blur:', err);
    }
  };

  const handleMedallionPriceChange = (size: '6oz' | '9oz', newPrice: number | string) => {
    const targetItem = menuItems.find(
      (i) =>
        (i.short_name?.toLowerCase().includes(size) || i.display_name?.toLowerCase().includes(size)) &&
        (i.type?.toLowerCase().includes('medallion') || i.subtype?.toLowerCase().includes('medallion'))
    );
    if (!targetItem) return;
    setPrices((prev) => ({ ...prev, [targetItem.id]: newPrice }));
  };

  const handleMedallionPriceBlur = async (size: '6oz' | '9oz', newPrice: number | string) => {
    const targetItem = menuItems.find(
      (i) =>
        (i.short_name?.toLowerCase().includes(size) || i.display_name?.toLowerCase().includes(size)) &&
        (i.type?.toLowerCase().includes('medallion') || i.subtype?.toLowerCase().includes('medallion'))
    );
    if (!targetItem) return;
    await handlePriceBlur(targetItem.id, newPrice);
  };

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900 text-slate-300">
        <div className="text-sm">Authenticating...</div>
      </div>
    );
  }

  const m6Item = menuItems.find(
    (i) =>
      (i.short_name?.toLowerCase().includes('6oz') || i.display_name?.toLowerCase().includes('6oz')) &&
      (i.type?.toLowerCase().includes('medallion') || i.subtype?.toLowerCase().includes('medallion'))
  );
  const m9Item = menuItems.find(
    (i) =>
      (i.short_name?.toLowerCase().includes('9oz') || i.display_name?.toLowerCase().includes('9oz')) &&
      (i.type?.toLowerCase().includes('medallion') || i.subtype?.toLowerCase().includes('medallion'))
  );

  const medallion6ozPrice = m6Item ? prices[m6Item.id] ?? '' : '';
  const medallion9ozPrice = m9Item ? prices[m9Item.id] ?? '' : '';

  const currentItemIds = activeTab === 'lunch' ? lunchItemIds : dinnerItemIds;

  const handleToggleSelection = (id: string) => {
    if (activeTab === 'lunch') {
      setLunchItemIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      setDinnerItemIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    }
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden relative" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}>
      
      {/* 1. NORMAL DASHBOARD VIEW (Completely hidden when isPrinting is true) */}
      <div className={`flex-1 flex h-full overflow-hidden w-full ${isPrinting ? 'hidden' : 'flex'}`}>
        <FeatureSidebar
          menuItems={menuItems}
          selectedItemIds={currentItemIds}
          prices={prices}
          medallion6ozPrice={medallion6ozPrice}
          medallion9ozPrice={medallion9ozPrice}
          holidayTitle={holidayTitle}
          hasHolidayFeature={selectedStore?.has_holiday_feature}
          loading={loading}
          onToggleSelection={handleToggleSelection}
          onPriceChange={handlePriceChange}
          onMedallionPriceChange={handleMedallionPriceChange}
          onMedallionPriceBlur={handleMedallionPriceBlur}
          onPriceBlur={handlePriceBlur}
          onHolidayTitleChange={setHolidayTitle}
        />

        <PrintPreview
          storeId={selectedStore?.id}
          storeName={selectedStore?.nickname || selectedStore?.name}
          hasHolidayFeature={selectedStore?.has_holiday_feature}
          holidayTitle={holidayTitle}
          menuItems={menuItems}
          lunchItemIds={lunchItemIds}
          dinnerItemIds={dinnerItemIds}
          dbLunchItemIds={dbLunchItemIds}
          dbDinnerItemIds={dbDinnerItemIds}
          lunchIdsRef={lunchIdsRef}
          dinnerIdsRef={dinnerIdsRef}
          storeIdRef={storeIdRef}
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
          onLunchItemIdsChange={setLunchItemIds}
          onDinnerItemIdsChange={setDinnerItemIds}
          prices={prices}
          loading={loading}
          isSavingParent={isSaving}
          onPrintAction={handleParentPrint}
          onSaveAction={async () => {
            const activeStoreId = storeIdRef.current;
            if (!activeStoreId) return;
            await api.saveStoreFeatureMenus(activeStoreId, lunchIdsRef.current, dinnerIdsRef.current);
            setDbLunchItemIds([...lunchIdsRef.current]);
            setDbDinnerItemIds([...dinnerIdsRef.current]);
          }}
        />
      </div>

      {/* 2. ISOLATED IN-PAGE PRINT LAYER (Visible only during printing) */}
{isPrinting && (
  <div className="fixed inset-0 bg-white z-[99999] flex flex-col m-0 p-0 overflow-hidden">
    <style jsx global>{`
      @page {
        size: 11in 8.5in landscape !important;
        margin: 0.25in !important;
      }
      body {
        background: white !important;
        overflow: hidden !important;
      }
    `}</style>
    <div 
      style={{ 
        width: '1008px', 
        height: '768px', 
        position: 'fixed',
        margin: 0,
        padding: 0,
        display: 'flex', 
        overflow: 'hidden',
        background: 'white',
        boxSizing: 'border-box',
        fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif'
      }}
    >
      <PrintArea
        hasHolidayFeature={selectedStore?.has_holiday_feature}
        holidayTitle={holidayTitle}
        menuItems={menuItems}
        currentItemIds={activeTab === 'lunch' ? lunchItemIds : dinnerItemIds}
        activeTab={activeTab}
        prices={prices}
      />
    </div>
  </div>
)}
    </div>
  );
}