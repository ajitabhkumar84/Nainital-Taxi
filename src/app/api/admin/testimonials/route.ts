import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSupabaseClient } from '@/lib/supabase/admin';

// GET: Fetch all testimonials (reviews) or a single one by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const supabase = getAdminSupabaseClient();

    if (id) {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching testimonial:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching testimonials:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in testimonials GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new testimonial (admin-curated guest review)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customer_name,
      customer_location,
      review_text,
      rating,
      guest_photo_url,
      is_featured,
      is_approved,
    } = body;

    if (!customer_name || !review_text || !rating) {
      return NextResponse.json(
        { error: 'customer_name, review_text and rating are required' },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabaseClient();

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        customer_name,
        customer_location: customer_location || null,
        review_text,
        rating,
        photos: guest_photo_url ? [guest_photo_url] : null,
        // Admin-entered testimonials are treated as verified by default.
        is_verified: true,
        is_featured: is_featured ?? true,
        is_approved: is_approved ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating testimonial:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath('/');
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in testimonials POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update an existing testimonial. `updates.is_approved` is a pure
// moderation flag here — it must never be used to mean "deleted".
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const supabase = getAdminSupabaseClient();

    const patch: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() };
    if ('guest_photo_url' in patch) {
      const guestPhotoUrl = patch.guest_photo_url as string | null;
      delete patch.guest_photo_url;
      patch.photos = guestPhotoUrl ? [guestPhotoUrl] : null;
    }

    const { data, error } = await supabase
      .from('reviews')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating testimonial:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath('/');
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in testimonials PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Permanently remove a testimonial. Rejecting a review without
// deleting it should go through PATCH { is_approved: false } instead.
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const supabase = getAdminSupabaseClient();

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting testimonial:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in testimonials DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
