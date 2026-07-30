'use client';

import { useState } from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';

interface PackageCardProps {
  slug: string;
  title: string;
  imageUrl?: string | null;
  duration?: string | null;
  placesCovered?: string[] | null;
  minPrice?: number | null;
  availabilityStatus?: string | null;
}

const AVAILABILITY_LABELS: Record<string, { label: string; variant: 'available' | 'limited' | 'soldout' }> = {
  available: { label: 'Available', variant: 'available' },
  limited: { label: 'Limited', variant: 'limited' },
  sold_out: { label: 'Sold out', variant: 'soldout' },
};

export default function PackageCard({
  slug,
  title,
  imageUrl,
  duration,
  placesCovered,
  minPrice,
  availabilityStatus,
}: PackageCardProps) {
  // A URL can be present but still fail to load (404, blocked host, offline).
  const [imageFailed, setImageFailed] = useState(false);

  const places = (placesCovered || []).join(' · ');
  const availability = availabilityStatus
    ? AVAILABILITY_LABELS[availabilityStatus]
    : undefined;

  return (
    <div className="flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden transition-all hover:border-slate-300 hover:shadow-md">
      <Link href={`/tour/${slug}`} className="group block">
        <div className="relative aspect-video overflow-hidden bg-slate-100">
          {imageUrl && !imageFailed ? (
            <img
              src={imageUrl}
              alt={title}
              loading="lazy"
              onError={() => setImageFailed(true)}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-sm text-slate-500 px-4 text-center">{title}</span>
            </div>
          )}
          {duration && (
            <span className="absolute bottom-3 left-3 rounded bg-ink/75 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {duration}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/tour/${slug}`}>
          <h3 className="text-lg font-semibold text-ink hover:text-sunshine transition-colors">
            {title}
          </h3>
        </Link>
        {places && (
          <p className="mt-1 text-[13px] text-slate-500 truncate" title={places}>
            {places}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
          {minPrice ? (
            <span className="text-sm text-slate-500">
              From{' '}
              <span className="text-base font-semibold tabular-nums text-ink">
                ₹{minPrice.toLocaleString('en-IN')}
              </span>
            </span>
          ) : (
            <span className="text-sm text-slate-500">Price on request</span>
          )}
          {availability && (
            <Badge variant={availability.variant} size="sm">
              {availability.label}
            </Badge>
          )}
        </div>

        <Link
          href={`/tour/${slug}`}
          className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-slate-50"
        >
          View details
        </Link>
      </div>
    </div>
  );
}
