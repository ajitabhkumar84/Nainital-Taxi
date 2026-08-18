'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import BookingWidget from '@/components/BookingWidget';
import type { PickupLocationRow } from '@/lib/supabase/types';
import type { Package } from '@/lib/supabase';

interface SeasonConfig {
  backgroundImage: string;
  title: string;
  subtitle: string;
}

interface SeasonalHeroProps {
  // Optional admin-set overrides (from the "Home Page" CMS form). Any field
  // left null/empty keeps the automatic seasonal rotation for that field.
  overrideImage?: string | null;
  overrideTitle?: string | null;
  overrideSubtitle?: string | null;
  // Server-fetched (see src/app/page.tsx) and passed straight through to
  // BookingWidget — arrives as part of the initial render payload despite
  // this being a client component, so there's no post-mount fetch/flicker.
  pickupLocations: PickupLocationRow[];
  // Server-fetched getPackages('tour') result, also passed straight through
  // to BookingWidget — see BookingWidgetProps.tourPackages for why this
  // can't be fetched client-side instead.
  tourPackages: Package[];
}

const TRUST_FIGURES = [
  '15+ years operating',
  '10,000+ safe trips',
  '4.8★ (500 reviews)',
  '24/7 support',
];

export default function SeasonalHero({
  overrideImage,
  overrideTitle,
  overrideSubtitle,
  pickupLocations,
  tourPackages,
}: SeasonalHeroProps) {
  const seasonConfig = useMemo<SeasonConfig>(() => {
    const month = new Date().getMonth(); // 0-11

    // Winter: November (10) - February (1)
    if (month === 10 || month === 11 || month === 0 || month === 1) {
      return {
        backgroundImage: '/images/hero/winter.webp',
        title: 'Escape to Snow-Kissed Hills',
        subtitle: 'Experience the magic of winter in the mountains',
      };
    }

    // Spring: March (2) - April (3)
    if (month === 2 || month === 3) {
      return {
        backgroundImage: '/images/hero/spring.webp',
        title: 'Blooming Mountain Paradise',
        subtitle: 'Witness nature\'s colorful awakening',
      };
    }

    // Summer: May (4) - July (6)
    if (month === 4 || month === 5 || month === 6) {
      return {
        backgroundImage: '/images/hero/summer.webp',
        title: 'Your Perfect Summer Getaway',
        subtitle: 'Beat the heat in cool mountain air',
      };
    }

    // Monsoon: August (7) - October (9)
    return {
      backgroundImage: '/images/hero/monsoon.webp',
      title: 'Magical Monsoon Mountains',
      subtitle: 'Embrace the beauty of misty peaks',
    };
  }, []);

  const backgroundImage = overrideImage || seasonConfig.backgroundImage;
  const title = overrideTitle || seasonConfig.title;
  const subtitle = overrideSubtitle || seasonConfig.subtitle;

  return (
    <section id="booking" className="relative overflow-hidden">
      {/*
        Background photo.

        This is the LCP element for the homepage, and it used to be a CSS
        `background-image` on a plain div. The browser's preload scanner cannot
        see a URL that only exists inside a stylesheet, so the largest image on
        the page didn't start downloading until the CSS had been parsed and this
        element laid out — a guaranteed late LCP on a mobile connection, and one
        that no amount of recompressing the file can fix.

        As a next/image with `priority`, it renders a real <img> with fetchpriority
        high and a matching <link rel="preload"> in the document head, so it starts
        downloading in the first round trip. `fill` + the parent's `relative`
        reproduces the old bg-cover behaviour exactly; object-cover/object-center
        replaces bg-center.

        Deliberately NOT `unoptimized`, despite these being local /public files
        already in WebP at 65-165KB. Unoptimized would send the full desktop-width
        file to every 360px phone, and 80% of this site's traffic is mobile; the
        optimizer emits a ~20KB WebP at the right width instead. A responsive
        srcset is worth more here than the handful of transformations it costs.

        That cost is bounded: four source images (one per season), with the
        deviceSizes list in next.config.mjs capping the variants — on the order of
        ~16 transformations per 30-day cache window against a 1,000/month
        allowance. Supabase Storage images stay optimized too, but for a different
        reason: there, Vercel's cache is what keeps their bytes off the 5GB
        Supabase egress quota.

        alt="" because the photo is decorative: the headline immediately below
        carries the same meaning, so announcing it would just be noise.

        sizes="100vw" is correct here, not a bug — this section has no max-width
        container, so the image genuinely spans the full viewport at every
        breakpoint. If Chrome DevTools logs "was preloaded ... but not used within
        a few seconds" for this image, that's a known heuristic false positive for
        the fill + priority + sizes="100vw" combination (the preload IS what's
        painted; Chrome's usage timer just doesn't always detect it in time) —
        don't "fix" this value in response to that warning.
      */}
      <Image
        src={backgroundImage}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      {/* Scrim: darker on the left where the headline sits, lighter toward the widget */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/55 to-ink/25" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/20 via-transparent to-ink/30 lg:hidden" />

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-10 lg:pt-28 lg:pb-14">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_420px] lg:gap-12 lg:items-center lg:min-h-[520px]">
          {/* Copy */}
          <div>
            <h1 className="text-[34px] leading-[1.1] md:text-5xl md:leading-[1.08] font-display font-semibold text-white tracking-tight mb-4 max-w-xl">
              {title}
            </h1>
            <p className="text-base md:text-lg text-white/85 mb-6 max-w-lg">
              {subtitle}
            </p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13px] text-white/75">
              {TRUST_FIGURES.map((figure, i) => (
                <span key={figure} className="flex items-center gap-x-2">
                  {i > 0 && <span className="text-white/30">&middot;</span>}
                  {figure}
                </span>
              ))}
            </div>
          </div>

          {/* Booking widget */}
          <div>
            <BookingWidget pickupLocations={pickupLocations} tourPackages={tourPackages} />
          </div>
        </div>
      </div>
    </section>
  );
}
