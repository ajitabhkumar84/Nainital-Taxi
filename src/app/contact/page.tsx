import type { Metadata } from 'next';
import { Header, Footer, Button } from '@/components/ui';
import { ContactHero, ContactForm, ContactInfo, ContactFAQ } from '@/components/contact';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import { Shield, Award, Heart, Star, Clock } from 'lucide-react';
import Link from 'next/link';
import { getContactPageContent, buildMapEmbedUrl, buildMapLinkUrl } from '@/lib/contactPage';
import { getSiteContactConfig } from '@/lib/siteContact';

// Icon vocabulary offered by the trust-badge editor in
// src/components/admin/ContactPageForm.tsx — keep the two in sync.
const TRUST_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: Shield,
  heart: Heart,
  award: Award,
  star: Star,
  clock: Clock,
};

const TRUST_ACCENTS = ['sunshine', 'teal', 'coral'] as const;

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContactPageContent();
  return {
    title: content.seo_title || 'Contact Us - Nainital Taxi Services',
    description:
      content.seo_description ||
      'Get in touch with Nainital Taxi for bookings, inquiries, and quotes. Available 24/7 via phone, WhatsApp, or email.',
    keywords:
      'contact Nainital taxi, book taxi Nainital, Kathgodam taxi contact, Uttarakhand taxi booking, taxi inquiry, 24/7 taxi service',
  };
}

export default async function ContactPage() {
  // Page copy is admin-editable at /admin/pages/contact; the phone/WhatsApp/
  // email/address values come from site config so they can't drift from the
  // header and footer.
  const [content, siteContact] = await Promise.all([
    getContactPageContent(),
    getSiteContactConfig(),
  ]);

  // wa.me rejects '+' and spaces — it wants bare digits.
  const whatsappDigits = siteContact.whatsapp.replace(/\D/g, '');
  const mapUrl = buildMapEmbedUrl(
    content.google_business_name,
    content.map_embed_url,
    siteContact.address
  );
  const mapLinkUrl = buildMapLinkUrl(content.google_business_name, siteContact.address);

  return (
    <>
      <Header />
      <FloatingWhatsApp />

      <main className="mt-20">
        {/* Hero Section */}
        <ContactHero
          title={content.hero_title}
          subtitle={content.hero_subtitle}
          badges={content.hero_badges}
        />

        {/* Contact Form Section */}
        <ContactForm
          formTitle={content.form_title}
          formDescription={content.form_description}
          whatsappNumber={whatsappDigits}
        />

        {/* Contact Information & Map */}
        <ContactInfo
          heading={content.info_heading}
          subheading={content.info_subheading}
          whatsappNumber={whatsappDigits}
          phoneNumber={siteContact.phone}
          email={siteContact.email}
          address={siteContact.address}
          cards={content.contact_cards}
          mapHeading={content.map_heading}
          mapUrl={mapUrl}
          mapLinkUrl={mapLinkUrl}
          mapButtonLabel={content.map_button_label}
          hoursHeading={content.hours_heading}
          hoursItems={content.hours_items}
        />

        {/* FAQs Section */}
        <ContactFAQ
          heading={content.faq_heading}
          subheading={content.faq_subheading}
          faqs={content.faqs}
          ctaHeading={content.faq_cta_heading}
          ctaDescription={content.faq_cta_description}
          whatsappNumber={whatsappDigits}
          phoneNumber={siteContact.phone}
        />

        {/* Bottom CTA Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-ink via-ink/95 to-ink text-white relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-32 h-32 bg-sunshine rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-48 h-48 bg-teal rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-display text-white mb-4">
              {content.cta_heading}
            </h2>
            <p className="text-xl text-white/80 font-body mb-8">{content.cta_subheading}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/fleet">
                <Button variant="primary" size="lg">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  View Our Fleet
                </Button>
              </Link>
              <Link href="/">
                <Button variant="secondary" size="lg">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Back to Home
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            {content.trust_badges.length > 0 && (
              <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-white/70">
                {content.trust_badges.map((badge, index) => {
                  const Icon = TRUST_ICONS[badge.icon_name] || Shield;
                  const accent = TRUST_ACCENTS[index % TRUST_ACCENTS.length];
                  return (
                    <div key={index} className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 border-2 ${
                          accent === 'sunshine'
                            ? 'bg-sunshine/20 border-sunshine'
                            : accent === 'teal'
                            ? 'bg-teal/20 border-teal'
                            : 'bg-coral/20 border-coral'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            accent === 'sunshine'
                              ? 'text-sunshine'
                              : accent === 'teal'
                              ? 'text-teal'
                              : 'text-coral'
                          }`}
                        />
                      </div>
                      <span className="font-body">{badge.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
