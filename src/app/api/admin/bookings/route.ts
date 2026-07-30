import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSupabaseClient } from '@/lib/supabase/admin';

// Whitelist: only columns the admin UI legitimately writes via PATCH.
// Verified against actual PATCH calls in
// src/app/admin/bookings/BookingsListClient.tsx (status, payment_status,
// payment_received_at, payment_verified_at, advance_received,
// advance_received_at) plus the rest of the "admin operational" columns on
// bookings. Deliberately EXCLUDES customer-entered PII
// (customer_name/phone/email/whatsapp), pricing/package/vehicle selection,
// and system fields (id/created_at/user_id) — none of those are ever sent
// by the current admin UI and none should be admin-PATCH-able.
const bookingUpdateSchema = z
  .object({
    status: z.enum([
      'pending',
      'payment_pending',
      'confirmed',
      'in_progress',
      'completed',
      'cancelled',
      'refunded',
    ]),
    payment_status: z.enum(['pending', 'received', 'verified', 'refunded']),
    payment_method: z.string().max(100).nullable(),
    payment_screenshot_url: z.string().url().max(2048).nullable(),
    upi_transaction_id: z.string().max(100).nullable(),
    payment_received_at: z.string().datetime().nullable(),
    payment_verified_at: z.string().datetime().nullable(),

    advance_received: z.boolean(),
    advance_received_at: z.string().datetime().nullable(),

    assigned_driver_name: z.string().max(200).nullable(),
    assigned_driver_phone: z.string().max(20).nullable(),
    driver_assigned_at: z.string().datetime().nullable(),

    trip_started_at: z.string().datetime().nullable(),
    trip_completed_at: z.string().datetime().nullable(),
    actual_distance: z.number().int().nonnegative().nullable(),

    cancelled_at: z.string().datetime().nullable(),
    cancellation_reason: z.string().max(1000).nullable(),
    cancelled_by: z.string().max(100).nullable(),
    refund_amount: z.number().int().nonnegative().nullable(),
    refunded_at: z.string().datetime().nullable(),

    admin_notes: z.string().max(5000).nullable(),
    internal_tags: z.array(z.string().max(50)).max(20).nullable(),
  })
  .strict() // reject unknown keys outright, don't silently drop them
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'updates must contain at least one recognized, admin-editable field',
  });

const patchBodySchema = z.object({
  bookingId: z.string().uuid(),
  updates: bookingUpdateSchema,
});

// No per-admin identity exists yet (single shared ADMIN_PASSWORD — see
// src/lib/auth/adminAuth.ts, whose session payload is just { iat }). This
// label is intentionally generic rather than a fabricated username; see
// supabase/add_admin_audit_log.sql for why.
const ACTOR_LABEL = 'admin';

export async function PATCH(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = patchBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { bookingId, updates } = parsed.data;
  const supabase = getAdminSupabaseClient();

  try {
    const { data: before, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !before) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const { data: after, error: updateError } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const changedFields = Object.keys(updates);
    const beforeSnapshot: Record<string, unknown> = {};
    const afterSnapshot: Record<string, unknown> = {};
    for (const key of changedFields) {
      beforeSnapshot[key] = (before as Record<string, unknown>)[key];
      afterSnapshot[key] = (after as Record<string, unknown>)[key];
    }

    const { error: auditError } = await supabase.from('admin_audit_log').insert({
      entity_type: 'booking',
      entity_id: bookingId,
      action: 'update',
      actor: ACTOR_LABEL,
      before: beforeSnapshot,
      after: afterSnapshot,
      changed_fields: changedFields,
    });

    if (auditError) {
      // Don't fail the request over audit logging, but make the gap loud —
      // a silent audit failure defeats the point of this milestone.
      console.error('Failed to write admin_audit_log row for booking', bookingId, auditError);
    }

    return NextResponse.json({ data: after });
  } catch (error) {
    console.error('Error in bookings PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
