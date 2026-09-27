'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Layout/Header';
import FeatureSidebar, { MenuItem } from '@/components/Sidebar/FeatureSidebar';
import PrintPreview from '@/components/Layout/PrintPreview';

export default function Home() {
  const { user, token, selectedStore } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'editor' | 'users' | 'items' | 'settings'>('editor');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});

  const [holidayTitle, setHolidayTitle] = useState('Holiday Specials');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

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

  const handlePriceBlur = async (itemId: string, newPrice: number | string) => {
    if (!selectedStore?.id || !token) return;

    setPrices((prev) => ({ ...prev, [itemId]: Number(newPrice) || 0 }));

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
          price: newPrice,
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

    setPrices((prev) => ({ ...prev, [targetItem.id]: Number(newPrice) || 0 }));
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

  const handlePrint = async () => {
    if (selectedStore && token) {
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/store-menu/${selectedStore.id}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ selectedItemIds }),
          }
        );
      } catch (err) {
        console.error('Auto-save selections before print failed:', err);
      }
    }

    window.print();
  };

  if (!user) return null;

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
    <div className="h-screen w-screen flex flex-col bg-gray-100 text-gray-900 overflow-hidden">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex h-full overflow-hidden">
        {activeTab === 'editor' && (
          <>
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
              onPriceChange={(id, price) =>
                setPrices((prev) => ({ ...prev, [id]: Number(price) || 0 }))
              }
              onMedallionPriceChange={handleMedallionPriceChange}
              onMedallionPriceBlur={handleMedallionPriceBlur}
              onPriceBlur={handlePriceBlur}
              onHolidayTitleChange={setHolidayTitle}
            />

            <PrintPreview
              storeName={selectedStore?.name}
              hasHolidayFeature={selectedStore?.has_holiday_feature}
              holidayTitle={holidayTitle}
              menuItems={menuItems}
              selectedItemIds={selectedItemIds}
              prices={prices}
            />
          </>
        )}

        {activeTab === 'items' && <div className="p-8 overflow-y-auto flex-1">Menu Manager Component</div>}
        {activeTab === 'users' && <div className="p-8 overflow-y-auto flex-1">User Manager Component</div>}
        {activeTab === 'settings' && <div className="p-8 overflow-y-auto flex-1">Store Settings Component</div>}
      </div>
    </div>
  );
}