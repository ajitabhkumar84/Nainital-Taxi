import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getAdminSupabaseClient } from '@/lib/supabase/admin';
import { CONTACT_PAGE_ID } from '@/lib/contactPage';
import { revalidateContent } from '@/lib/revalidateContent';
import { CACHE_TAGS } from '@/lib/cacheTags';
import {
  DEFAULT_CONTACT_PAGE_CONTENT,
  type ContactPageContent,
} from '@/lib/supabase/types';

// PostgREST's code for "table not in the schema cache" — i.e. the migration in
// supabase/create_contact_page_schema.sql hasn't been applied to this project
// yet. Worth its own message: the generic 500 sends you hunting through logs
// for what is really a one-command setup step.
const TABLE_MISSING = 'PGRST205';
const MIGRATION_HINT =
  'The contact_page_content table does not exist yet. Run ' +
  'supabase/create_contact_page_schema.sql in the Supabase SQL editor, then reload this page.';

// GET - Fetch the contact page singleton (returns defaults if the row is missing)
export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('contact_page_content') as any)
      .select('*')
      .eq('id', CONTACT_PAGE_ID)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          ...DEFAULT_CONTACT_PAGE_CONTENT,
          id: CONTACT_PAGE_ID,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      if (error.code === TABLE_MISSING) {
        return NextResponse.json({ error: MIGRATION_HINT }, { status: 503 });
      }

      console.error('Error fetching contact page content:', error);
      return NextResponse.json({ error: 'Failed to fetch contact page content' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/admin/contact-page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Upsert the contact page singleton
export async function POST(request: NextRequest) {
  try {
    const adminSupabase = getAdminSupabaseClient();
    const body = (await request.json()) as Partial<ContactPageContent>;

    // A malformed recipient here would silently break enquiry delivery, so
    // reject it at the boundary rather than at send time. Blank is allowed and
    // means "fall back to the ADMIN_EMAIL env var".
    const recipient = body.enquiry_recipient_email?.trim() || '';
    if (recipient && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      return NextResponse.json(
        { error: 'Enquiry recipient must be a valid email address' },
        { status: 400 }
      );
    }

    const updateData = {
      id: CONTACT_PAGE_ID,

      seo_title: body.seo_title ?? '',
      seo_description: body.seo_description ?? '',

      hero_title: body.hero_title ?? '',
      hero_subtitle: body.hero_subtitle ?? '',
      hero_badges: body.hero_badges ?? [],

      form_title: body.form_title ?? '',
      form_description: body.form_description ?? '',
      enquiry_recipient_email: recipient || null,

      info_heading: body.info_heading ?? '',
      info_subheading: body.info_subheading ?? '',
      contact_cards: body.contact_cards ?? {},

      map_heading: body.map_heading ?? '',
      google_business_name: body.google_business_name ?? '',
      map_embed_url: body.map_embed_url?.trim() || null,
      map_button_label: body.map_button_label ?? '',

      hours_heading: body.hours_heading ?? '',
      hours_items: body.hours_items ?? [],

      faq_heading: body.faq_heading ?? '',
      faq_subheading: body.faq_subheading ?? '',
      faqs: body.faqs ?? [],
      faq_cta_heading: body.faq_cta_heading ?? '',
      faq_cta_description: body.faq_cta_description ?? '',

      cta_heading: body.cta_heading ?? '',
      cta_subheading: body.cta_subheading ?? '',
      trust_badges: body.trust_badges ?? [],

      is_published: body.is_published ?? true,
      updated_at: new Date().toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminSupabase.from('contact_page_content') as any)
      .upsert(updateData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      if (error.code === TABLE_MISSING) {
        return NextResponse.json({ error: MIGRATION_HINT }, { status: 503 });
      }

      console.error('Error saving contact page content:', error);
      return NextResponse.json(
        { error: 'Failed to save contact page content', details: error.message },
        { status: 500 }
      );
    }

    revalidatePath('/contact');
    revalidateContent(CACHE_TAGS.contactPage);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/admin/contact-page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
