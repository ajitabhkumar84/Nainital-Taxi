import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getAdminSupabaseClient } from '@/lib/supabase/admin';
import { MultiDayRentalPage, DEFAULT_MULTI_DAY_RENTAL_PAGE } from '@/lib/supabase/types';
import { slugify, validatePageSlug } from '@/lib/slug';
import { revalidateContent } from '@/lib/revalidateContent';
import { CACHE_TAGS } from '@/lib/cacheTags';

const FIXED_ID = '00000000-0000-0000-0000-000000000001';

// Purges the cached public route(s) so edits/publish-toggles/slug changes
// show up immediately, now that the public page no longer fetches with
// `cache: 'no-store'`. `oldSlug`/`newSlug` may be the same value — always
// revalidating the legacy `/multi-day-rental` path covers its redirect
// logic too.
function revalidateMultiDayRentalPaths(oldSlug: string | null, newSlug: string | null) {
  revalidatePath('/multi-day-rental');
  if (oldSlug && oldSlug !== 'multi-day-rental') revalidatePath(`/${oldSlug}`);
  if (newSlug && newSlug !== 'multi-day-rental' && newSlug !== oldSlug) revalidatePath(`/${newSlug}`);
  // The homepage's "Multi-Day Rentals" card now reads homepage_card_image_url
  // from this same row, so it needs to pick up edits too.
  revalidatePath('/');
  revalidateContent(CACHE_TAGS.multiDayRental);
}

// GET - Fetch multi-day rental page configuration
export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('multi_day_rental_page') as any)
      .select('*')
      .eq('id', FIXED_ID)
      .single();

    if (error) {
      // If no row exists, return default config
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          ...DEFAULT_MULTI_DAY_RENTAL_PAGE,
          id: FIXED_ID,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      console.error('Error fetching multi-day rental page:', error);
      return NextResponse.json(
        { error: 'Failed to fetch page configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/admin/multi-day-rental:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Update multi-day rental page configuration (requires auth)
export async function POST(request: NextRequest) {
  try {
    const adminSupabase = getAdminSupabaseClient();
    const body = await request.json();

    // Normalize + validate page_slug if the client sent one. Client-side
    // validation in the form is best-effort UX only — this is the
    // authoritative check.
    let normalizedSlug: string | undefined;
    if (typeof body.page_slug === 'string') {
      normalizedSlug = slugify(body.page_slug);
      const validationError = validatePageSlug(normalizedSlug);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
    }

    // Capture the pre-write slug so we know what old path to revalidate if
    // it's about to change.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (adminSupabase
      .from('multi_day_rental_page') as any)
      .select('page_slug')
      .eq('id', FIXED_ID)
      .single();
    const oldSlug: string | null = existing?.page_slug ?? null;

    // Prepare update data
    const updateData: Partial<MultiDayRentalPage> = {
      id: FIXED_ID,
      ...body,
      ...(normalizedSlug !== undefined ? { page_slug: normalizedSlug } : {}),
      updated_at: new Date().toISOString(),
    };

    // Remove created_at if it exists in the update
    delete (updateData as any).created_at;

    // Upsert the configuration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminSupabase
      .from('multi_day_rental_page') as any)
      .upsert(updateData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'That page URL is already in use. Choose a different one.' },
          { status: 409 }
        );
      }
      console.error('Error updating multi-day rental page:', error);
      return NextResponse.json(
        { error: 'Failed to update page configuration', details: error.message },
        { status: 500 }
      );
    }

    revalidateMultiDayRentalPaths(oldSlug, data?.page_slug ?? null);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/admin/multi-day-rental:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Initialize with default configuration (requires auth)
export async function PUT() {
  try {
    const adminSupabase = getAdminSupabaseClient();
    // Check if config already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (adminSupabase
      .from('multi_day_rental_page') as any)
      .select('id')
      .eq('id', FIXED_ID)
      .single();

    if (existing) {
      return NextResponse.json({
        message: 'Configuration already initialized',
        data: existing
      });
    }

    // Initialize with defaults
    const defaultConfig = {
      id: FIXED_ID,
      ...DEFAULT_MULTI_DAY_RENTAL_PAGE,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminSupabase
      .from('multi_day_rental_page') as any)
      .insert(defaultConfig)
      .select()
      .single();

    if (error) {
      console.error('Error initializing multi-day rental page:', error);
      return NextResponse.json(
        { error: 'Failed to initialize configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Configuration initialized successfully',
      data,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/multi-day-rental:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Toggle published status (requires auth)
export async function PATCH(request: NextRequest) {
  try {
    const adminSupabase = getAdminSupabaseClient();
    const { is_published } = await request.json();

    if (typeof is_published !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid is_published value' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminSupabase
      .from('multi_day_rental_page') as any)
      .update({
        is_published,
        updated_at: new Date().toISOString(),
      })
      .eq('id', FIXED_ID)
      .select()
      .single();

    if (error) {
      console.error('Error toggling published status:', error);
      return NextResponse.json(
        { error: 'Failed to update published status' },
        { status: 500 }
      );
    }

    revalidateMultiDayRentalPaths(data?.page_slug ?? null, data?.page_slug ?? null);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/admin/multi-day-rental:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
