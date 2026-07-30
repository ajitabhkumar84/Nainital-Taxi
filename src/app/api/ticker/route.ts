import { NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/supabase/admin';

const DAILY_COUNT = 8;
const MAX_STAGGER_MS = 6 * 60 * 60 * 1000; // 6 hours

// GET: Return today's rotating batch of ticker bookings for the homepage
// corner-popup display. Uses a persisted round-robin cursor (last_shown_at)
// rather than date math — see supabase/create_ticker_bookings_schema.sql
// and the plan for why (self-healing on pool size changes, no seam
// collisions, always shows least-recently-shown rows first).
export async function GET() {
  try {
    const supabase = getAdminSupabaseClient();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Step 1: idempotent check — if today's batch was already rotated
    // (by an earlier request), return it as-is instead of re-rolling.
    const { data: todaysBatch, error: todaysBatchError } = await supabase
      .from('ticker_bookings')
      .select('*')
      .eq('is_active', true)
      .gte('last_shown_at', startOfDay.toISOString())
      .order('last_shown_at', { ascending: true })
      .limit(DAILY_COUNT);

    if (todaysBatchError) {
      console.error('Error checking today\'s ticker batch:', todaysBatchError);
      return NextResponse.json({ error: todaysBatchError.message }, { status: 500 });
    }

    if (todaysBatch && todaysBatch.length > 0) {
      return NextResponse.json({ data: todaysBatch });
    }

    // Step 2: no batch rotated yet today — pick the least-recently-shown
    // active rows (strict FIFO, NULLs/never-shown first).
    const { data: nextBatch, error: nextBatchError } = await supabase
      .from('ticker_bookings')
      .select('*')
      .eq('is_active', true)
      .order('last_shown_at', { ascending: true, nullsFirst: true })
      .order('created_at', { ascending: true })
      .limit(DAILY_COUNT);

    if (nextBatchError) {
      console.error('Error selecting next ticker batch:', nextBatchError);
      return NextResponse.json({ error: nextBatchError.message }, { status: 500 });
    }

    if (!nextBatch || nextBatch.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Step 3: stamp the batch with a one-time randomized stagger so each
    // item's "shown X ago" reflects real elapsed time, not a synthetic value.
    const now = Date.now();
    const stamped = nextBatch.map((row) => ({
      ...row,
      last_shown_at: new Date(now - Math.random() * MAX_STAGGER_MS).toISOString(),
    }));

    const { error: updateError } = await supabase.from('ticker_bookings').upsert(
      stamped.map((row) => ({ id: row.id, last_shown_at: row.last_shown_at }))
    );

    if (updateError) {
      console.error('Error stamping ticker batch:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ data: stamped });
  } catch (error) {
    console.error('Error in ticker GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
