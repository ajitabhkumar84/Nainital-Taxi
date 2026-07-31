import { Phone, MessageCircle } from 'lucide-react';
import type { LandingThemeTokens } from './themes';

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
      <a
        href={telHref}
        className={`flex items-center justify-center gap-2 text-base font-bold ${theme.ctaCall}`}
      >
        <Phone className="h-5 w-5" />
        Call Now
      </a>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center justify-center gap-2 text-base font-bold ${theme.ctaWhatsApp}`}
      >
        <MessageCircle className="h-5 w-5" />
        WhatsApp
      </a>
    </div>
  );
}
