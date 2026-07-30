-- Milestone 2: generic before/after audit trail for admin-initiated writes.
--
-- Why a new table instead of extending booking_status_history:
--   booking_status_history is narrowly scoped to STATUS transitions
--   (from_status/to_status) and is fed automatically by the
--   log_booking_status_change() trigger on every bookings UPDATE. Its
--   changed_by column is a hard FK to profiles(id), which this app cannot
--   populate — there are no per-admin accounts (single shared
--   ADMIN_PASSWORD, see src/lib/auth/adminAuth.ts). Repurposing that FK
--   would touch a table an existing trigger depends on. admin_audit_log is
--   intentionally decoupled: no FK to profiles, a free-text actor label
--   (honest about the current single-shared-admin auth model), and a
--   generic JSONB before/after diff covering ANY bookings column the admin
--   PATCH endpoint touches. booking_status_history and its trigger are
--   left completely untouched.

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,           -- e.g. 'booking'
  entity_id UUID NOT NULL,             -- e.g. bookings.id
  action TEXT NOT NULL DEFAULT 'update',
  actor TEXT NOT NULL DEFAULT 'admin', -- free-text; no per-admin identity exists (single shared password)
  before JSONB,                        -- pre-update values of the fields that changed
  after JSONB,                         -- post-update values of the fields that changed
  changed_fields TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_entity ON admin_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);

COMMENT ON TABLE admin_audit_log IS
  'Generic before/after audit trail for admin-initiated writes (starting with bookings PATCH). actor is a free-text label, not a profiles FK, because the admin auth model is a single shared password with no per-admin identity.';

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
-- No policies defined: default-deny for anon/authenticated roles, matching
-- every other admin-only table in this schema. The admin API route writes
-- via getAdminSupabaseClient() (service-role key), which bypasses RLS
-- entirely, same as every other admin write path in this app.
