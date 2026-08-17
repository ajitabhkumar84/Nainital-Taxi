'use client';

import { useState } from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Image from 'next/image';

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
      {/* prefetch={false} — one Link per package in a long grid; see the note
          in src/components/home/DestinationCard.tsx for why. */}
      <Link href={`/tour/${slug}`} prefetch={false} className="group block">
        <div className="relative aspect-video overflow-hidden bg-slate-100">
          {imageUrl && !imageFailed ? (
            // See the note in src/components/home/DestinationCard.tsx — same
            // Supabase-egress reasoning, same fill/sizes treatment.
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImageFailed(true)}
              className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
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

        <Button variant="primary" size="sm" asChild className="mt-4 w-full min-h-[44px]">
          <Link href={`/tour/${slug}`}>
            View details
          </Link>
        </Button>
      </div>
    </div>
  );
}
