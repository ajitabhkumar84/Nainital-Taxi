import { ShieldCheck, Clock, Car, IndianRupee } from 'lucide-react';
import type { LandingThemeTokens } from './themes';

const TRUST_ITEMS = [
  { icon: ShieldCheck, title: 'Verified Local Drivers', sub: 'Hill-road experts, police-verified' },
  { icon: Clock, title: 'On-Time Guarantee', sub: 'We wait for you, never the reverse' },
  { icon: Car, title: 'Clean, Well-Maintained Cabs', sub: 'Sanitized before every trip' },
  { icon: IndianRupee, title: 'Fixed, Honest Fares', sub: 'The quote is the price. Period.' },
];

export default function TrustBar({ theme }: { theme: LandingThemeTokens }) {
  return (
    <section className="border-b border-slate-100 bg-white">
      <div className="mx-auto flex max-w-5xl gap-4 overflow-x-auto px-4 py-5 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible">
        {TRUST_ITEMS.map(({ icon: Icon, title, sub }) => (
          <div
            key={title}
            className="flex min-w-[200px] snap-start flex-col items-center gap-1.5 rounded-xl px-3 py-2 text-center md:min-w-0"
          >
            <Icon className={`h-7 w-7 ${theme.trustIconColor}`} />
            <p className="text-sm font-bold text-ink">{title}</p>
            <p className="text-xs text-slate-500">{sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
