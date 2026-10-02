'use client';

import React from 'react';
import { MenuItem } from '../Sidebar/FeatureSidebar';

interface CardContentProps {
  styleVars?: React.CSSProperties;
  hasHolidayFeature?: boolean;
  holidayTitle: string;
  holidayItems: MenuItem[];
  sips: MenuItem[];
  starters: MenuItem[];
  chefSelections: (MenuItem & { price: number })[];
  desserts: MenuItem[];
  titleScaleFactors: Record<string, number>;
  getItemHeading: (item: MenuItem) => string;
}

export default function CardContent({
  styleVars,
  hasHolidayFeature,
  holidayTitle,
  holidayItems,
  sips,
  starters,
  chefSelections,
  desserts,
  titleScaleFactors,
  getItemHeading,
}: CardContentProps) {
  let isFirstSection = true;

  const renderHeader = (title: string, sectionId: string, customColorClass = 'text-gray-900 border-red-900') => {
    const isFirst = isFirstSection;
    isFirstSection = false;
    const scale = titleScaleFactors[sectionId] ?? 1;

    return (
      <div className="w-full text-center" style={{ marginTop: isFirst ? 0 : 'var(--section-mt, 16px)' }}>
        <h2
          data-title-id={sectionId}
          data-title-type="header"
          style={{ fontSize: `calc(var(--header-size, 20px) * ${scale})` }}
          className={`font-bold border-b-2 pb-0.5 inline-block px-3 uppercase tracking-wider ${customColorClass} whitespace-nowrap`}
        >
          {title}
        </h2>
      </div>
    );
  };

  const renderItemHeading = (item: MenuItem, headingText: string) => {
    const scale = titleScaleFactors[item.id] ?? 1;
    return (
      <div className="w-full text-center flex justify-center">
        <div
          data-title-id={item.id}
          data-title-type="item"
          style={{ fontSize: `calc(var(--item-size, 16px) * ${scale})` }}
          className="font-bold text-gray-900 leading-tight inline-block whitespace-nowrap"
        >
          {headingText}
        </div>
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
          <div className="w-full text-center flex justify-center mt-1">
            <div
              data-title-id="sec-desserts-line"
              data-title-type="item"
              style={{ fontSize: `calc(var(--item-size, 16px) * ${titleScaleFactors['sec-desserts-line'] ?? 1})` }}
              className="font-bold text-gray-800 tracking-wide px-1 inline-block whitespace-nowrap"
            >
              {desserts.map((item) => item.display_name).join(' • ')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}