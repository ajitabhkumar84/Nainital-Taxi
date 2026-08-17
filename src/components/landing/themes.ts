import type { LandingTheme, LandingThemeMode } from '@/lib/supabase/types';

export interface LandingThemeTokens {
  key: LandingTheme;
  label: string;
  emoji: string;
  heroImage: string;
  heroOverlay: string;
  heroText: string;
  badge: string;
  accentText: string;
  priceAccent: string;
  sectionBg: string;
  cardAccent: string;
  ctaCall: string;
  ctaWhatsApp: string;
  trustIconColor: string;
  seasonTagline: string;
}

// Full, static Tailwind class strings only — never construct class names
// dynamically from these tokens, or Tailwind's JIT purge will drop them.
export const LANDING_THEMES: Record<LandingTheme, LandingThemeTokens> = {
  rainy: {
    key: 'rainy',
    label: 'Rainy (Monsoon)',
    emoji: '🌧️',
    heroImage: '/images/hero/monsoon.webp',
    heroOverlay: 'bg-gradient-to-b from-emerald-950/70 via-emerald-900/60 to-teal-950/80',
    heroText: 'text-white',
    badge: 'bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-300/40',
    accentText: 'text-emerald-300',
    priceAccent: 'text-emerald-600',
    sectionBg: 'bg-emerald-50',
    cardAccent: 'ring-1 ring-emerald-200 hover:ring-emerald-400',
    ctaCall: 'bg-emerald-500 hover:bg-emerald-400 text-white',
    ctaWhatsApp: 'bg-whatsapp hover:brightness-95 text-white',
    trustIconColor: 'text-emerald-600',
    seasonTagline: 'Misty lakes, lush green hills — monsoon magic without the crowds 🌿',
  },
  autumn: {
    key: 'autumn',
    label: 'Autumn',
    emoji: '🍂',
    heroImage: '/images/hero/summer.webp',
    heroOverlay: 'bg-gradient-to-b from-orange-950/70 via-amber-900/60 to-stone-950/80',
    heroText: 'text-white',
    badge: 'bg-amber-400/20 text-amber-200 ring-1 ring-amber-300/40',
    accentText: 'text-amber-300',
    priceAccent: 'text-orange-600',
    sectionBg: 'bg-orange-50',
    cardAccent: 'ring-1 ring-amber-200 hover:ring-amber-400',
    ctaCall: 'bg-orange-500 hover:bg-orange-400 text-white',
    ctaWhatsApp: 'bg-whatsapp hover:brightness-95 text-white',
    trustIconColor: 'text-orange-600',
    seasonTagline: "Crisp mountain air, golden forests — autumn's best-kept secret 🍂",
  },
  winter: {
    key: 'winter',
    label: 'Winter',
    emoji: '❄️',
    heroImage: '/images/hero/winter.webp',
    heroOverlay: 'bg-gradient-to-b from-sky-950/70 via-blue-900/60 to-slate-950/80',
    heroText: 'text-white',
    badge: 'bg-sky-300/20 text-sky-100 ring-1 ring-sky-200/40',
    accentText: 'text-sky-300',
    priceAccent: 'text-sky-600',
    sectionBg: 'bg-sky-50',
    cardAccent: 'ring-1 ring-sky-200 hover:ring-sky-400',
    ctaCall: 'bg-sky-500 hover:bg-sky-400 text-white',
    ctaWhatsApp: 'bg-whatsapp hover:brightness-95 text-white',
    trustIconColor: 'text-sky-600',
    seasonTagline: 'Snow-dusted peaks, warm cabs, cozy rides — winter wonderland season ❄️',
  },
};

/**
 * Nainital's climate, not the calendar: monsoon runs late Jun–Aug, so
 * "rainy" is scoped tightly to that window rather than "till Aug end"
 * from an arbitrary March start. Mar–May (spring/early summer, clear
 * skies) has no dedicated theme yet, so it borrows the "autumn" palette
 * as a placeholder — admins can always override via themeMode.
 */
export function resolveTheme(mode: LandingThemeMode, now: Date = new Date()): LandingTheme {
  if (mode !== 'auto') return mode;
  const month = now.getMonth(); // 0-based
  if (month === 11 || month <= 1) return 'winter'; // Dec–Feb
  if (month >= 5 && month <= 7) return 'rainy'; // Jun–Aug
  return 'autumn'; // Sep–Nov, plus Mar–May placeholder
}
