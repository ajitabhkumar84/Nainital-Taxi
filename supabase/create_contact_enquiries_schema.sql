-- ============================================
-- Contact Enquiries - Durable lead capture
-- ============================================
-- Backs up every /api/contact submission (contact page + mobile quick-enquiry
-- modal) independent of whether the notification email succeeds — see
-- src/app/api/contact/route.ts. Admin-only: written via the service-role
-- client, no public policies, so RLS default-denies the anon/authenticated
-- roles entirely (same pattern as admin_audit_log.sql).

CREATE TABLE IF NOT EXISTS contact_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  subject TEXT,               -- not populated by either form yet; reserved for future use
  message TEXT,

  -- Trip details — only ContactForm (the full /contact page form) collects these;
  -- NULL for mobile quick-enquiry submissions.
  pickup TEXT,
  drop_location TEXT,         -- "drop" is a reserved-ish word in some tooling; avoid it
  travel_date TEXT,
  travel_time TEXT,
  passengers TEXT,
  vehicle TEXT,

  source TEXT NOT NULL DEFAULT 'contact_page',  -- 'contact_page' | 'mobile_quick_enquiry'

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_enquiries_created_at ON contact_enquiries(created_at DESC);

COMMENT ON TABLE contact_enquiries IS 'Durable backup of contact-form/quick-enquiry submissions, written independently of email delivery. Admin-only via service-role client.';

ALTER TABLE contact_enquiries ENABLE ROW LEVEL SECURITY;
-- No policies defined: default-deny for anon/authenticated roles. The API route
-- writes via getAdminSupabaseClient() (service-role key), which bypasses RLS,
-- and so does the admin dashboard read.
