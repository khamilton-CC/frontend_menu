export interface SelectedMenuItem {
  id: string;
  section: string;
  type?: string;
  subtype?: string;
  short_name: string;
  display_name: string;
  description?: string;
  price?: number;
}

export function sortEntreesForMenu<T extends SelectedMenuItem>(entreeItems: T[]): T[] {
  const match = (val?: string) => (val || '').toLowerCase().trim();

  const getTypeOrder = (item: T): number => {
    const t = match(item.type);
    const st = match(item.subtype);

    if (t.includes('special') || t.includes('entree') || t === '') return 1;
    if (t.includes('steak')) return 2;
    if (t.includes('medallion') || st.includes('medallion')) return 3;
    if (t.includes('fish') || t.includes('seafood')) return 4;
    return 5;
  };

  return [...entreeItems].sort((a, b) => {
    const orderA = getTypeOrder(a);
    const orderB = getTypeOrder(b);

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    if (orderA === 2) {
      const priceA = a.price ?? 0;
      const priceB = b.price ?? 0;
      if (priceA !== priceB) {
        return priceB - priceA;
      }
    }

    return a.short_name.localeCompare(b.short_name);
  });
}