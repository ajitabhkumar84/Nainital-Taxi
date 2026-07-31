import { MapPinned, Route } from 'lucide-react';
import type { LandingThemeTokens } from './themes';
import type { LandingPricingLine } from '@/lib/supabase/types';

interface PricingServicesProps {
  theme: LandingThemeTokens;
  lines: LandingPricingLine[];
}

export default function PricingServices({ theme, lines }: PricingServicesProps) {
  const activeLines = lines
    .filter((l) => l.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <section className={`${theme.sectionBg} px-4 py-12`}>
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="font-display text-2xl sm:text-3xl text-ink">Transparent Off-Season Pricing</h2>
          <p className="mt-2 text-sm text-slate-600">
            Per-day rates, driver &amp; fuel included. What we quote is what you pay.
          </p>
        </div>

        {activeLines.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {activeLines.map((line) => (
              <div
                key={line.id}
                className={`rounded-xl bg-white p-4 text-center shadow-retro-sm ${theme.cardAccent}`}
              >
                <p className="text-sm font-bold text-ink">{line.label}</p>
                <p className={`mt-1 text-xl font-extrabold ${theme.priceAccent}`}>
                  {line.priceText}
                </p>
                {line.note && <p className="mt-0.5 text-xs text-slate-500">{line.note}</p>}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <a
            href="#book"
            className={`flex items-start gap-3 rounded-2xl bg-white p-5 shadow-retro transition hover:-translate-y-0.5 ${theme.cardAccent}`}
          >
            <Route className={`h-8 w-8 shrink-0 ${theme.trustIconColor}`} />
            <div>
              <p className="font-bold text-ink">Point-to-Point Transfers</p>
              <p className="mt-1 text-sm text-slate-600">
                Kathgodam, Delhi, Pantnagar → your hotel. Fixed fare, zero waiting.
              </p>
            </div>
          </a>
          <a
            href="#tours"
            className={`flex items-start gap-3 rounded-2xl bg-white p-5 shadow-retro transition hover:-translate-y-0.5 ${theme.cardAccent}`}
          >
            <MapPinned className={`h-8 w-8 shrink-0 ${theme.trustIconColor}`} />
            <div>
              <p className="font-bold text-ink">Tour Packages</p>
              <p className="mt-1 text-sm text-slate-600">
                Lakes, temples &amp; viewpoints — full-day tours with a local driver-guide.
              </p>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
