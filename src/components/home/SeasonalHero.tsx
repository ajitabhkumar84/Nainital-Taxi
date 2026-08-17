'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import BookingWidget from '@/components/BookingWidget';
import type { PickupLocationRow } from '@/lib/supabase/types';

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
}: SeasonalHeroProps) {
  const seasonConfig = useMemo<SeasonConfig>(() => {
    const month = new Date().getMonth(); // 0-11

    // Winter: November (10) - February (1)
    if (month === 10 || month === 11 || month === 0 || month === 1) {
      return {
        backgroundImage: '/images/hero/winter.jpg',
        title: 'Escape to Snow-Kissed Hills',
        subtitle: 'Experience the magic of winter in the mountains',
      };
    }

    // Spring: March (2) - April (3)
    if (month === 2 || month === 3) {
      return {
        backgroundImage: '/images/hero/spring.jpg',
        title: 'Blooming Mountain Paradise',
        subtitle: 'Witness nature\'s colorful awakening',
      };
    }

    // Summer: May (4) - July (6)
    if (month === 4 || month === 5 || month === 6) {
      return {
        backgroundImage: '/images/hero/summer.jpg',
        title: 'Your Perfect Summer Getaway',
        subtitle: 'Beat the heat in cool mountain air',
      };
    }

    // Monsoon: August (7) - October (9)
    return {
      backgroundImage: '/images/hero/monsoon.jpg',
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

        Deliberately NOT `unoptimized`, despite these being local /public files.
        The source images are currently 355-467KB JPEGs at full desktop width.
        Serving them unoptimized would push the largest of those to every 360px
        phone — and 80% of this site's traffic is mobile — whereas the optimizer
        emits a ~35-60KB WebP at the right width.

        The transformation cost that buys is negligible and, crucially, bounded:
        there are exactly four source images here (one per season) and the
        deviceSizes list in next.config.mjs caps the variants, so this is on the
        order of ~16 transformations per 30-day cache window against a 1,000/month
        allowance. That is the opposite situation from Supabase Storage images,
        which are unbounded and growing — those stay optimized too, but there the
        reason is that Vercel's cache keeps their bytes off the 5GB Supabase
        egress quota.

        If these four files are ever re-encoded to ~120KB WebP, revisit: at that
        point `unoptimized` becomes defensible, though a responsive srcset would
        still win on mobile.

        alt="" because the photo is decorative: the headline immediately below
        carries the same meaning, so announcing it would just be noise.
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
            <BookingWidget pickupLocations={pickupLocations} />
          </div>
        </div>
      </div>
    </section>
  );
}
