'use client';

import { Phone, Mail, MapPin, MessageCircle, Clock, Calendar, Award, Shield, Heart, Star } from 'lucide-react';
import type { ContactCardKey, ContactCardLabels, ContactHourItem } from '@/lib/supabase/types';

// Icon vocabulary offered by the operating-hours editor in
// src/components/admin/ContactPageForm.tsx — keep the two in sync.
const HOUR_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  clock: Clock,
  calendar: Calendar,
  award: Award,
  shield: Shield,
  heart: Heart,
  star: Star,
};

const DEFAULT_CARDS: Record<ContactCardKey, ContactCardLabels> = {
  whatsapp: { title: 'WhatsApp', description: 'Chat with us instantly', footnote: 'Click to start chat' },
  phone: { title: 'Call Us', description: 'Available 24/7 for bookings', footnote: 'Tap to call now' },
  email: { title: 'Email', description: 'Send us a message', footnote: 'Click to compose email' },
  address: { title: 'Office Address', description: 'Visit us for in-person bookings', footnote: '' },
};

interface ContactInfoProps {
  heading?: string;
  subheading?: string;
  whatsappNumber?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  cards?: Partial<Record<ContactCardKey, ContactCardLabels>>;
  mapHeading?: string;
  /** Built by buildMapEmbedUrl() in src/lib/contactPage.ts. null = hide the map. */
  mapUrl?: string | null;
  mapLinkUrl?: string;
  mapButtonLabel?: string;
  hoursHeading?: string;
  hoursItems?: ContactHourItem[];
}

export default function ContactInfo({
  heading = 'Contact Information',
  subheading = "Reach out to us anytime - we're always here to assist you",
  whatsappNumber = '918445206116',
  phoneNumber = '+918445206116',
  email = 'taxinainital@gmail.com',
  address = 'Nainital, Uttarakhand, India',
  cards,
  mapHeading = 'Find Us on Map',
  mapUrl = null,
  mapLinkUrl,
  mapButtonLabel = 'Open in Google Maps',
  hoursHeading = 'Operating Hours',
  hoursItems = [
    { icon_name: 'clock', strong: '24/7', rest: 'Available' },
    { icon_name: 'calendar', strong: '365 Days', rest: 'a Year' },
    { icon_name: 'award', strong: 'Instant', rest: 'Booking' },
  ],
}: ContactInfoProps) {
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hi, I would like to inquire about your taxi services.')}`;
  const card = (key: ContactCardKey): ContactCardLabels => ({
    ...DEFAULT_CARDS[key],
    ...(cards?.[key] || {}),
  });
  const mapsLink =
    mapLinkUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-sunrise to-lake">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display text-ink mb-3">
            {heading}
          </h2>
          <p className="text-lg font-body text-ink/70">{subheading}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Cards */}
          <div className="space-y-4">
            {/* WhatsApp Card */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white rounded-2xl shadow-retro p-6 hover:shadow-retro-lg hover:-translate-y-1 transition-all border-3 border-ink group"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-whatsapp rounded-full flex items-center justify-center group-hover:scale-110 transition-transform border-3 border-ink">
                    <MessageCircle className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-xl font-display text-ink mb-1">{card('whatsapp').title}</h3>
                  <p className="font-body text-ink/70 mb-2">{card('whatsapp').description}</p>
                  <p className="text-2xl font-display text-whatsapp">{phoneNumber}</p>
                  {card('whatsapp').footnote && (
                    <p className="text-sm font-body text-ink/60 mt-2">{card('whatsapp').footnote}</p>
                  )}
                </div>
                <svg className="w-6 h-6 text-ink/40 group-hover:text-whatsapp transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>

            {/* Phone Card */}
            <a
              href={`tel:${phoneNumber}`}
              className="block bg-white rounded-2xl shadow-retro p-6 hover:shadow-retro-lg hover:-translate-y-1 transition-all border-3 border-ink group"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-teal rounded-full flex items-center justify-center group-hover:scale-110 transition-transform border-3 border-ink">
                    <Phone className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-xl font-display text-ink mb-1">{card('phone').title}</h3>
                  <p className="font-body text-ink/70 mb-2">{card('phone').description}</p>
                  <p className="text-2xl font-display text-teal">{phoneNumber}</p>
                  {card('phone').footnote && (
                    <p className="text-sm font-body text-ink/60 mt-2">{card('phone').footnote}</p>
                  )}
                </div>
                <svg className="w-6 h-6 text-ink/40 group-hover:text-teal transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>

            {/* Email Card */}
            <a
              href={`mailto:${email}`}
              className="block bg-white rounded-2xl shadow-retro p-6 hover:shadow-retro-lg hover:-translate-y-1 transition-all border-3 border-ink group"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-coral rounded-full flex items-center justify-center group-hover:scale-110 transition-transform border-3 border-ink">
                    <Mail className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-xl font-display text-ink mb-1">{card('email').title}</h3>
                  <p className="font-body text-ink/70 mb-2">{card('email').description}</p>
                  <p className="text-lg font-display text-coral break-all">{email}</p>
                  {card('email').footnote && (
                    <p className="text-sm font-body text-ink/60 mt-2">{card('email').footnote}</p>
                  )}
                </div>
                <svg className="w-6 h-6 text-ink/40 group-hover:text-coral transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>

            {/* Address Card */}
            <div className="bg-white rounded-2xl shadow-retro p-6 border-3 border-ink">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-sunshine/30 rounded-full flex items-center justify-center border-3 border-ink">
                    <MapPin className="w-7 h-7 text-ink" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-xl font-display text-ink mb-1">{card('address').title}</h3>
                  <p className="font-body text-ink/70 mb-2">{card('address').description}</p>
                  <p className="font-body text-ink leading-relaxed">{address}</p>
                  {card('address').footnote && (
                    <p className="text-sm font-body text-ink/60 mt-2">{card('address').footnote}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Google Map */}
          <div className="bg-white rounded-2xl shadow-retro overflow-hidden border-3 border-ink">
            <div className="p-4 bg-gradient-to-r from-sunshine to-teal">
              <h3 className="text-xl font-display text-ink flex items-center">
                <MapPin className="w-6 h-6 mr-2" />
                {mapHeading}
              </h3>
            </div>
            {mapUrl && (
              <div className="relative h-96">
                <iframe
                  src={mapUrl}
                  title={mapHeading}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            )}
            <div className="p-4 bg-sunrise border-t-3 border-ink">
              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full bg-teal text-white px-6 py-3 rounded-xl font-display font-bold border-3 border-ink shadow-retro hover:shadow-retro-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                {mapButtonLabel}
              </a>
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        {hoursItems.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-ink via-ink/95 to-ink rounded-2xl p-8 text-center border-3 border-ink shadow-retro-lg">
            <h3 className="text-2xl font-display text-sunshine mb-6">{hoursHeading}</h3>
            <div className="flex flex-wrap justify-center gap-8 text-white">
              {hoursItems.map((item, index) => {
                const Icon = HOUR_ICONS[item.icon_name] || Clock;
                // Cycles the three accent colours so any number of items keeps
                // the original teal / sunshine / coral rhythm.
                const accent = ['teal', 'sunshine', 'coral'][index % 3];
                return (
                  <div key={index} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 border-2 ${
                        accent === 'teal'
                          ? 'bg-teal/20 border-teal'
                          : accent === 'sunshine'
                          ? 'bg-sunshine/20 border-sunshine'
                          : 'bg-coral/20 border-coral'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          accent === 'teal'
                            ? 'text-teal'
                            : accent === 'sunshine'
                            ? 'text-sunshine'
                            : 'text-coral'
                        }`}
                      />
                    </div>
                    <span className="text-lg font-body">
                      <strong className="font-display">{item.strong}</strong>
                      {item.rest ? ` ${item.rest}` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
