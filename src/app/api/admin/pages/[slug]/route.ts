import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getAdminSupabaseClient } from '@/lib/supabase/admin';
import { revalidateContent } from '@/lib/revalidateContent';
import { CACHE_TAGS } from '@/lib/cacheTags';
import { DEFAULT_PAGE_CONTENT, PageContent } from '@/lib/supabase/types';

// Maps a page_slug to the public route to revalidate after a save.
// Extend this as more pages get their own page_content row.
const PUBLIC_PATH_BY_SLUG: Record<string, string> = {
  home: '/',
  destinations: '/destinations',
};

// GET - Fetch a page's CMS content (auto-creates with defaults if missing)
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('page_content') as any)
      .select('*')
      .eq('page_slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          ...DEFAULT_PAGE_CONTENT,
          page_slug: slug,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      console.error('Error fetching page content:', error);
      return NextResponse.json({ error: 'Failed to fetch page content' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/admin/pages/[slug]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Upsert a page's CMS content
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const adminSupabase = getAdminSupabaseClient();
    const body = await request.json();

    const updateData: Partial<PageContent> & { page_slug: string } = {
      page_slug: slug,
      seo_title: body.seo_title,
      seo_description: body.seo_description,
      hero_image_url: body.hero_image_url || null,
      hero_title: body.hero_title || null,
      hero_subtitle: body.hero_subtitle || null,
      sections: body.sections,
      is_published: body.is_published ?? true,
      updated_at: new Date().toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminSupabase.from('page_content') as any)
      .upsert(updateData, { onConflict: 'page_slug' })
      .select()
      .single();

    if (error) {
      console.error('Error saving page content:', error);
      return NextResponse.json(
        { error: 'Failed to save page content', details: error.message },
        { status: 500 }
      );
    }

    const publicPath = PUBLIC_PATH_BY_SLUG[slug];
    if (publicPath) {
      revalidatePath(publicPath);
    }
    // getPageContent() is cached across requests, so revalidating the path
    // alone would re-render the page against the pre-save row.
    revalidateContent(CACHE_TAGS.pageContent);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/admin/pages/[slug]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
