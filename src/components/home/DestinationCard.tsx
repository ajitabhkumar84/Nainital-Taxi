'use client';

import { useState } from 'react';
import Link from 'next/link';

interface DestinationCardProps {
  slug: string;
  name: string;
  hero_image_url?: string | null;
  distance_from_nainital?: number | null;
  duration?: string | null;
}

export default function DestinationCard({
  slug,
  name,
  hero_image_url,
  distance_from_nainital,
  duration,
}: DestinationCardProps) {
  // A URL can be present but still fail to load (404, blocked host, offline).
  // Fall back to the same neutral block used when no image is set at all,
  // rather than leaving a broken <img> in the card.
  const [imageFailed, setImageFailed] = useState(false);

  const metaParts = [
    distance_from_nainital ? `${distance_from_nainital} km` : null,
    duration ? `${duration} from Nainital` : null,
  ].filter(Boolean);

  return (
    <Link href={`/destinations/${slug}`} className="group block">
      <div className="rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm transition-all group-hover:border-slate-300 group-hover:shadow-md">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {hero_image_url && !imageFailed ? (
            <img
              src={hero_image_url}
              alt={name}
              loading="lazy"
              onError={() => setImageFailed(true)}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-sm text-slate-500">{name}</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-ink">{name}</h3>
          {metaParts.length > 0 && (
            <p className="text-sm text-slate-500 mt-1">{metaParts.join(' · ')}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
