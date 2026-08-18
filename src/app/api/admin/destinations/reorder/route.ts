import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSupabaseClient } from '@/lib/supabase/admin';
import { revalidateContent } from '@/lib/revalidateContent';
import { CACHE_TAGS } from '@/lib/cacheTags';

interface OrderUpdate {
  id: string;
  display_order: number;
}

// POST - Bulk update display_order for destinations (admin drag-and-drop reorder)
export async function POST(request: NextRequest) {
  try {
    const adminSupabase = getAdminSupabaseClient();
    const body = await request.json();
    const { updates } = body as { updates: OrderUpdate[] };

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'Updates array is required' }, { status: 400 });
    }

    const updatedAt = new Date().toISOString();

    const results = await Promise.all(
      updates.map(({ id, display_order }) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (adminSupabase.from('destinations') as any)
          .update({ display_order, updated_at: updatedAt })
          .eq('id', id)
      )
    );

    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      console.error('Errors reordering destinations:', errors);
      return NextResponse.json(
        { error: 'Some updates failed', details: errors.map((e) => e.error) },
        { status: 500 }
      );
    }

    // Kept inline (not shared with the PATCH route's revalidateDestinations())
    // deliberately — importing a function across two route.ts files in the App
    // Router risks bundler issues at build time, so each route stays self-contained.
    revalidatePath('/destinations', 'layout');
    revalidatePath('/');
    revalidateContent(CACHE_TAGS.destinations);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/admin/destinations/reorder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
