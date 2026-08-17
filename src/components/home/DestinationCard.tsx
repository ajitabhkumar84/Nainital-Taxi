'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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

  // prefetch={false} below: this card renders once per destination, so a
  // single grid is dozens of Links. Next prefetches every one that scrolls
  // into view, and because every route in this app renders dynamically (the
  // CSP nonce in the root layout opts the whole app out of static rendering),
  // each prefetch is a real request that runs through middleware. Left on,
  // scrolling this grid costs more Edge invocations than the rest of the
  // session combined.
  //
  // Prefetch is kept ON for the header nav and the primary CTAs — few links,
  // high intent, and there it buys genuinely faster navigation.
  return (
    <Link href={`/destinations/${slug}`} prefetch={false} className="group block">
      <div className="rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm transition-all group-hover:border-slate-300 group-hover:shadow-md">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {hero_image_url && !imageFailed ? (
            // next/image rather than a raw <img>: these are Supabase Storage
            // URLs, and a raw tag makes every visitor fetch the full-size
            // original straight from Supabase — billed against the 5GB/month
            // egress limit, which is the tightest quota this project has.
            // Routing them through the optimizer means Vercel caches a resized
            // WebP on its CDN and Supabase is hit roughly once per variant per
            // cache window instead of once per pageview.
            //
            // `fill` reproduces the previous w-full/h-full behaviour inside the
            // aspect-ratio box. `sizes` is what keeps the generated variants
            // small — without it Next assumes 100vw and serves a desktop-width
            // image to a phone showing a half-width card.
            <Image
              src={hero_image_url}
              alt={name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              onError={() => setImageFailed(true)}
              className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
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
