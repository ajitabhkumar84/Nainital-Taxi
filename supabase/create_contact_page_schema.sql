-- ============================================
-- Contact Us Page - Database Schema
-- ============================================
-- Singleton config table backing every editable element of /contact, managed
-- from /admin/pages/contact. Same fixed-UUID singleton pattern as
-- trust_section / tour_trust_section (see create_tour_trust_section_schema.sql),
-- with the next id in the sequence.
--
-- Deliberately NOT stored in page_content: that table's shape is SEO + hero +
-- {key, heading, subheading} sections, which can't express contact cards, the
-- map, operating hours or the FAQ list.
--
-- Phone / WhatsApp / email / address are NOT duplicated here — those stay in
-- admin_settings.site_config_contact (edited at /admin/site-config) so the
-- number shown on /contact can never drift from the header and footer. Only
-- the *labels* around them live in contact_cards below.

CREATE TABLE IF NOT EXISTS contact_page_content (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000004',

  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',

  -- Hero
  hero_title TEXT NOT NULL DEFAULT '',
  hero_subtitle TEXT NOT NULL DEFAULT '',
  hero_badges JSONB NOT NULL DEFAULT '[]',        -- [{ label }]

  -- Enquiry form
  form_title TEXT NOT NULL DEFAULT '',
  form_description TEXT NOT NULL DEFAULT '',
  -- Where submitted enquiries are emailed. NULL/'' falls back to the
  -- ADMIN_EMAIL env var (see src/lib/notifications.ts).
  enquiry_recipient_email TEXT,

  -- Contact information block
  info_heading TEXT NOT NULL DEFAULT '',
  info_subheading TEXT NOT NULL DEFAULT '',
  -- { whatsapp: {title, description}, phone: {...}, email: {...}, address: {...} }
  -- Labels only — the actual phone/email/address values come from site config.
  contact_cards JSONB NOT NULL DEFAULT '{}',

  -- Map. google_business_name is the Google Business Profile listing name; it
  -- drives both the embedded map and the "Open in Google Maps" link. Filling
  -- map_embed_url overrides the generated embed with an exact pin (Google Maps
  -- -> Share -> Embed a map -> copy the iframe src).
  map_heading TEXT NOT NULL DEFAULT '',
  google_business_name TEXT NOT NULL DEFAULT '',
  map_embed_url TEXT,
  map_button_label TEXT NOT NULL DEFAULT '',

  -- Operating hours
  hours_heading TEXT NOT NULL DEFAULT '',
  hours_items JSONB NOT NULL DEFAULT '[]',        -- [{ icon_name, strong, rest }]

  -- FAQs
  faq_heading TEXT NOT NULL DEFAULT '',
  faq_subheading TEXT NOT NULL DEFAULT '',
  faqs JSONB NOT NULL DEFAULT '[]',               -- [{ question, answer }]
  faq_cta_heading TEXT NOT NULL DEFAULT '',
  faq_cta_description TEXT NOT NULL DEFAULT '',

  -- Bottom CTA
  cta_heading TEXT NOT NULL DEFAULT '',
  cta_subheading TEXT NOT NULL DEFAULT '',
  trust_badges JSONB NOT NULL DEFAULT '[]',       -- [{ icon_name, label }]

  is_published BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT contact_page_content_singleton CHECK (id = '00000000-0000-0000-0000-000000000004')
);

COMMENT ON TABLE contact_page_content IS 'Singleton CMS content for the /contact page (hero, form copy, contact card labels, map, operating hours, FAQs, CTA).';

CREATE OR REPLACE FUNCTION update_contact_page_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_contact_page_content_updated_at ON contact_page_content;
CREATE TRIGGER trigger_update_contact_page_content_updated_at
  BEFORE UPDATE ON contact_page_content
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_page_content_updated_at();

-- Read by the public /contact page via the anon-key client, so it needs a
-- public SELECT policy. Writes go through the service-role admin client only.
ALTER TABLE contact_page_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read" ON contact_page_content;
CREATE POLICY "Public read" ON contact_page_content FOR SELECT USING (is_published = true);

-- Seed with the copy that was hardcoded in src/app/contact/page.tsx and the
-- src/components/contact/* components, so applying this migration is a visual
-- no-op until someone edits it in /admin/pages/contact.
--
-- enquiry_recipient_email is seeded to the business Gmail so contact-form
-- enquiries land there without an env-var change or redeploy.
INSERT INTO contact_page_content (
  id,
  seo_title, seo_description,
  hero_title, hero_subtitle, hero_badges,
  form_title, form_description, enquiry_recipient_email,
  info_heading, info_subheading, contact_cards,
  map_heading, google_business_name, map_embed_url, map_button_label,
  hours_heading, hours_items,
  faq_heading, faq_subheading, faqs, faq_cta_heading, faq_cta_description,
  cta_heading, cta_subheading, trust_badges,
  is_published
)
VALUES (
  '00000000-0000-0000-0000-000000000004',

  'Contact Us - Nainital Taxi Services',
  'Get in touch with Nainital Taxi for bookings, inquiries, and quotes. Available 24/7 via phone, WhatsApp, or email. Book your reliable taxi service in Nainital today.',

  'Get in Touch',
  'Book your reliable ride across the region. Request a quote below for our best rates.',
  '[
    {"label": "Experienced Drivers"},
    {"label": "Transparent Pricing"},
    {"label": "Free Quote"}
  ]'::jsonb,

  'Request a Free Quote',
  'Fill out the form below and our team will get back to you shortly to confirm your booking.',
  'taxinainital@gmail.com',

  'Contact Information',
  'Reach out to us anytime - we''re always here to assist you',
  '{
    "whatsapp": {"title": "WhatsApp", "description": "Chat with us instantly", "footnote": "Click to start chat"},
    "phone":    {"title": "Call Us", "description": "Available 24/7 for bookings", "footnote": "Tap to call now"},
    "email":    {"title": "Email", "description": "Send us a message", "footnote": "Click to compose email"},
    "address":  {"title": "Office Address", "description": "Visit us for in-person bookings", "footnote": ""}
  }'::jsonb,

  'Find Us on Map',
  'Nainital Taxi',
  NULL,
  'Open in Google Maps',

  'Operating Hours',
  '[
    {"icon_name": "clock", "strong": "24/7", "rest": "Available"},
    {"icon_name": "calendar", "strong": "365 Days", "rest": "a Year"},
    {"icon_name": "award", "strong": "Instant", "rest": "Booking"}
  ]'::jsonb,

  'Frequently Asked Questions',
  'Everything you need to know about booking with Nainital Taxi',
  '[
    {"question": "How can I book a taxi with Nainital Taxi?", "answer": "You can book a taxi by filling out our online form above, calling us directly, or sending us a message on WhatsApp. We respond instantly to all booking requests."},
    {"question": "What are your operating hours?", "answer": "We operate 24/7, 365 days a year. You can book a taxi or contact us anytime, day or night, including weekends and holidays."},
    {"question": "Do you charge for cancellations?", "answer": "We understand that plans change. Free cancellation is available up to 2 hours before your scheduled pickup time. Cancellations within 2 hours may incur a minimal charge."},
    {"question": "What payment methods do you accept?", "answer": "We accept multiple payment methods including cash, UPI (Google Pay, PhonePe, Paytm), credit/debit cards, and bank transfers. Payment can be made before or after your journey."},
    {"question": "Are your drivers experienced and verified?", "answer": "Yes, all our drivers are highly experienced, licensed, and background-verified. They have extensive knowledge of the Nainital region and prioritize your safety and comfort. We maintain a strict zero-alcohol policy."},
    {"question": "Do you provide airport and railway station pickup services?", "answer": "Absolutely! We provide reliable pickup and drop services from Pantnagar Airport, Kathgodam Railway Station, and all major locations in Uttarakhand."},
    {"question": "Can I request a specific vehicle type?", "answer": "Yes, we have a diverse fleet including Sedans, SUVs, Innova Crysta, and Tempo Travellers. You can specify your preferred vehicle type when booking, and we''ll do our best to accommodate your request."},
    {"question": "What if I have extra luggage or special requirements?", "answer": "Please inform us about extra luggage, child seats, wheelchair accessibility, or any special requirements when booking. We''ll ensure your vehicle is equipped accordingly at no extra charge."},
    {"question": "How do you calculate the taxi fare?", "answer": "Our fares are transparent and competitive, based on distance, vehicle type, and route. You''ll receive a clear quote before booking with no hidden charges. Check our rates page for detailed pricing."},
    {"question": "Do you offer multi-day tour packages?", "answer": "Yes, we offer customized multi-day tour packages covering popular destinations like Nainital, Kainchi Dham, Ranikhet, Almora, Jim Corbett, and more. Contact us to plan your perfect Kumaon Hills tour."}
  ]'::jsonb,
  'Still Have Questions?',
  'Our team is here to help! Contact us anytime for personalized assistance.',

  'Ready to Book Your Journey?',
  'Experience safe, comfortable, and reliable taxi services in Nainital',
  '[
    {"icon_name": "shield", "label": "Verified Drivers"},
    {"icon_name": "heart", "label": "Zero Alcohol Policy"},
    {"icon_name": "award", "label": "10,000+ Safe Trips"}
  ]'::jsonb,

  true
)
ON CONFLICT (id) DO NOTHING;
