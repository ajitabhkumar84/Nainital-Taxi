'use client';

import { MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import {
  generateAvailabilityInquiryWhatsAppLink,
  type AvailabilityInquiryRoute,
} from '@/lib/messageGenerators';
import { DEFAULT_BLOCKED_MESSAGE } from '@/lib/availabilityMessages';

export interface BlockedDateNoticeProps extends AvailabilityInquiryRoute {
  /** ISO date string (YYYY-MM-DD) the user picked, if any. */
  date: string | null;
  /** Admin's per-date public_message / blackout show_message override, if
   *  any — falls back to the standard copy when omitted. */
  message?: string;
  className?: string;
}

/**
 * Shared "this date is admin-blocked" card, shown in place of the vehicle
 * list / price / Book Now controls across the booking flow (BookingWidget,
 * Step1PackageSelection, Step2TripDetails) whenever getAvailabilityForDate()/
 * isBookingAllowed() report status 'blocked'.
 */
export default function BlockedDateNotice({
  date,
  tripLabel,
  pickupLocation,
  dropoffLocation,
  message,
  className,
}: BlockedDateNoticeProps) {
  const { config: siteConfig } = useSiteConfig();
  const telHref = `tel:${siteConfig.contact.phone.replace(/\s/g, '')}`;
  const whatsappHref = generateAvailabilityInquiryWhatsAppLink(
    siteConfig.contact.whatsapp,
    { tripLabel, pickupLocation, dropoffLocation },
    date
  );

  return (
    <div
      role="alert"
      className={`p-6 rounded-2xl border-4 border-gray-400 bg-gray-50 ${className ?? ''}`}
    >
      <p className="font-bold text-[#2D3436] text-lg mb-1">
        🚫 Online booking unavailable for this date
      </p>
      <p className="text-gray-700">{message || DEFAULT_BLOCKED_MESSAGE}</p>
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-4">
        <a href={telHref} className="w-full sm:w-auto">
          <Button variant="outline" size="md" className="w-full">
            <Phone className="w-4 h-4 mr-2" />
            Call Us
          </Button>
        </a>
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
          <Button variant="whatsapp" size="md" className="w-full">
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp Us
          </Button>
        </a>
      </div>
    </div>
  );
}
