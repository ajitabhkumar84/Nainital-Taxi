import { Phone, MessageCircle } from 'lucide-react';
import type { LandingThemeTokens } from './themes';
// Client leaves rendered from this server component, so the PPC page's two
// highest-intent CTAs are measured without making the whole bar client-side.
import { CallCTA, WhatsAppCTA } from '@/components/analytics/ContactCTA';
import { CTA_PLACEMENTS } from '@/lib/analytics/properties';

interface StickyContactBarProps {
  theme: LandingThemeTokens;
  telHref: string;
  whatsappHref: string;
}

export default function StickyContactBar({ theme, telHref, whatsappHref }: StickyContactBarProps) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 grid h-16 grid-cols-2"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <CallCTA
        href={telHref}
        placement={CTA_PLACEMENTS.landingStickyBar}
        className={`flex items-center justify-center gap-2 text-base font-bold ${theme.ctaCall}`}
      >
        <Phone className="h-5 w-5" />
        Call Now
      </CallCTA>
      <WhatsAppCTA
        href={whatsappHref}
        placement={CTA_PLACEMENTS.landingStickyBar}
        className={`flex items-center justify-center gap-2 text-base font-bold ${theme.ctaWhatsApp}`}
      >
        <MessageCircle className="h-5 w-5" />
        WhatsApp
      </WhatsAppCTA>
    </div>
  );
}
