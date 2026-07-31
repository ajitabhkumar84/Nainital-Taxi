import Image from 'next/image';
import { Phone, MessageCircle } from 'lucide-react';
import type { LandingThemeTokens } from './themes';
import type { LandingPageConfig } from '@/lib/supabase/types';

interface LandingHeroProps {
  theme: LandingThemeTokens;
  hero: LandingPageConfig['hero'];
  telHref: string;
  whatsappHref: string;
}

export default function LandingHero({ theme, hero, telHref, whatsappHref }: LandingHeroProps) {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src={theme.heroImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className={`absolute inset-0 ${theme.heroOverlay}`} />
      </div>

      <div className={`mx-auto max-w-3xl px-4 pt-10 pb-14 sm:pt-16 sm:pb-20 text-center ${theme.heroText}`}>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold ${theme.badge}`}>
          {hero.badgeText}
        </span>

        <h1 className="mt-5 font-display text-3xl leading-tight sm:text-5xl">
          {hero.headline}
        </h1>

        <p className="mt-4 text-base sm:text-lg text-white/90">
          {hero.subheadline}
        </p>

        <p className={`mt-2 text-sm font-medium ${theme.accentText}`}>
          {theme.seasonTagline}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={telHref}
            className={`flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-2xl px-6 text-lg font-bold shadow-retro-lg transition sm:flex-none sm:px-10 ${theme.ctaCall}`}
          >
            <Phone className="h-6 w-6" />
            Call Now — Instant Booking
          </a>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-2xl px-6 text-lg font-bold shadow-retro-lg transition sm:flex-none sm:px-10 ${theme.ctaWhatsApp}`}
          >
            <MessageCircle className="h-6 w-6" />
            Book on WhatsApp
          </a>
        </div>

        <p className="mt-4 text-xs text-white/70">
          Replies in under 5 minutes · 7 AM – 10 PM
        </p>
      </div>
    </section>
  );
}
