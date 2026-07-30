'use client';

import { useMemo } from 'react';
import BookingWidget from '@/components/BookingWidget';

interface SeasonConfig {
  backgroundImage: string;
  title: string;
  subtitle: string;
}

const TRUST_FIGURES = [
  '15+ years operating',
  '10,000+ safe trips',
  '4.8★ (500 reviews)',
  '24/7 support',
];

export default function SeasonalHero() {
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

  return (
    <section id="booking" className="relative overflow-hidden">
      {/* Background photo */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${seasonConfig.backgroundImage}')` }}
      />
      {/* Scrim: darker on the left where the headline sits, lighter toward the widget */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/55 to-ink/25" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/20 via-transparent to-ink/30 lg:hidden" />

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-10 lg:pt-28 lg:pb-14">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_420px] lg:gap-12 lg:items-center lg:min-h-[520px]">
          {/* Copy */}
          <div>
            <h1 className="text-[34px] leading-[1.1] md:text-5xl md:leading-[1.08] font-display font-semibold text-white tracking-tight mb-4 max-w-xl">
              {seasonConfig.title}
            </h1>
            <p className="text-base md:text-lg text-white/85 mb-6 max-w-lg">
              {seasonConfig.subtitle}
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
            <BookingWidget />
          </div>
        </div>
      </div>
    </section>
  );
}
