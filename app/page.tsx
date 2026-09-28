'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import FeatureSidebar, { MenuItem } from '@/components/Sidebar/FeatureSidebar';
import PrintPreview from '@/components/Layout/PrintPreview';

export default function Home() {
  const { user, role, stores, token, selectedStore, loading: authLoading } = useAuth();
  const router = useRouter();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [prices, setPrices] = useState<Record<string, number | string>>({});

  const [holidayTitle, setHolidayTitle] = useState('Holiday Specials');
  const [loading, setLoading] = useState(true);

  // Auth & Store Routing Protection
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // Regular users/admins with 0 stores MUST go to /select-store
    if (role !== 'superadmin' && stores && stores.length === 0) {
      router.push('/select-store');
    }
  }, [user, role, stores, authLoading, router]);

  // Fetch store menu data
  useEffect(() => {
    if (!selectedStore || !token) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const itemsRes = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/menu?storeId=${selectedStore.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const itemsData = await itemsRes.json();

        if (itemsRes.ok) {
          setMenuItems(itemsData.items || []);
          setSelectedItemIds(itemsData.activeSelections || []);
          setPrices(itemsData.prices || {});
        }

        const savedRes = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/store-menu/${selectedStore.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (savedRes.ok) {
          const savedData = await savedRes.json();
          if (savedData && savedData.selected_item_ids) {
            setSelectedItemIds(savedData.selected_item_ids);
          }
        }
      } catch (err) {
        console.error('Failed to load menu data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedStore, token]);

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
    if (!selectedStore?.id || !token) return;

    const targetItem = menuItems.find(
      (i) =>
        (i.short_name?.toLowerCase().includes(size) || i.display_name?.toLowerCase().includes(size)) &&
        (i.type?.toLowerCase().includes('medallion') || i.subtype?.toLowerCase().includes('medallion'))
    );

    if (!targetItem) return;

    await handlePriceBlur(targetItem.id, newPrice);
  };

  // Show clean spinner while verifying Auth State
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

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      <FeatureSidebar
        menuItems={menuItems}
        selectedItemIds={selectedItemIds}
        prices={prices}
        medallion6ozPrice={medallion6ozPrice}
        medallion9ozPrice={medallion9ozPrice}
        holidayTitle={holidayTitle}
        hasHolidayFeature={selectedStore?.has_holiday_feature}
        loading={loading}
        onToggleSelection={(id) =>
          setSelectedItemIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
          )
        }
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
        selectedItemIds={selectedItemIds}
        prices={prices}
      />
    </div>
  );
}