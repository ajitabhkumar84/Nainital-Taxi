'use client';

import React from 'react';
import { AddonWithPrice } from '@/lib/supabase/types';
import { Check } from 'lucide-react';

interface AddonCardProps {
  addon: AddonWithPrice;
  isSelected: boolean;
  onToggle: () => void;
}

export default function AddonCard({ addon, isSelected, onToggle }: AddonCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div
      onClick={onToggle}
      className={`
        relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
        ${isSelected
          ? 'border-green-500 bg-green-50 shadow-md'
          : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm'
        }
      `}
    >
      {/* Selection Checkmark Badge */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 shadow-md">
          <Check className="w-4 h-4 text-white" strokeWidth={3} />
        </div>
      )}

      {/* Popular Badge */}
      {addon.is_featured && !isSelected && (
        <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
          POPULAR
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        {addon.icon_emoji && (
          <div className="text-3xl flex-shrink-0">
            {addon.icon_emoji}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-base mb-1 ${isSelected ? 'text-green-800' : 'text-gray-900'}`}>
            {addon.name}
          </h3>

          {addon.short_description && (
            <p className={`text-sm mb-2 ${isSelected ? 'text-green-700' : 'text-gray-600'}`}>
              {addon.short_description}
            </p>
          )}

          {/* Price */}
          <div className="flex items-center justify-between">
            <span className={`text-lg font-bold ${isSelected ? 'text-green-600' : 'text-gray-900'}`}>
              {formatPrice(addon.price)}
            </span>

            {/* Selection Indicator */}
            <span className={`text-xs font-semibold ${isSelected ? 'text-green-600' : 'text-gray-400'}`}>
              {isSelected ? '✓ Added' : 'Add +'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
