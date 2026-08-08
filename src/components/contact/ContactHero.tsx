'use client';

import type { ContactBadge } from '@/lib/supabase/types';

interface ContactHeroProps {
  title?: string;
  subtitle?: string;
  badges?: ContactBadge[];
}

export default function ContactHero({
  title = "Get in Touch",
  subtitle = "Book your reliable ride across the region. Request a quote below for our best rates.",
  badges = [
    { label: 'Experienced Drivers' },
    { label: 'Transparent Pricing' },
    { label: 'Free Quote' },
  ],
}: ContactHeroProps) {
  return (
    <section className="relative min-h-[280px] md:min-h-[400px] flex items-center justify-center overflow-hidden">
      {/* Background with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/95 to-ink">
        {/* Decorative floating elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-sunshine/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-teal/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-coral/15 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-8 md:py-20">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display text-white mb-4 drop-shadow-lg">
          {title}
        </h1>
        <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto font-body drop-shadow-md">
          {subtitle}
        </p>

        {/* Quick Contact Badges */}
        {badges.length > 0 && (
          <div className="mt-4 md:mt-8 flex flex-wrap justify-center gap-4 text-sm">
            {badges.map((badge, index) => (
              <div
                key={index}
                className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white border-2 border-white/20"
              >
                <svg className="w-5 h-5 text-sunshine mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-body font-semibold">{badge.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
