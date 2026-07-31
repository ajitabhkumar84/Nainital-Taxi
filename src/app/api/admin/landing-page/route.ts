import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAdminSupabaseClient } from '@/lib/supabase/admin';
import { LandingPageConfig, DEFAULT_LANDING_PAGE_CONFIG } from '@/lib/supabase/types';

const SETTINGS_KEY = 'landing_page_config';

function mergeConfig(saved: unknown): LandingPageConfig {
  if (!saved || typeof saved !== 'object') return DEFAULT_LANDING_PAGE_CONFIG;
  const s = saved as Partial<LandingPageConfig>;
  return {
    ...DEFAULT_LANDING_PAGE_CONFIG,
    ...s,
    hero: { ...DEFAULT_LANDING_PAGE_CONFIG.hero, ...s.hero },
    pricingLines: s.pricingLines?.length ? s.pricingLines : DEFAULT_LANDING_PAGE_CONFIG.pricingLines,
    featuredPackageSlugs: s.featuredPackageSlugs?.length
      ? s.featuredPackageSlugs
      : DEFAULT_LANDING_PAGE_CONFIG.featuredPackageSlugs,
  };
}

// GET - Fetch PPC landing page configuration (admin form only; the public
// landing page reads admin_settings directly server-side).
export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('admin_settings') as any)
      .select('value')
      .eq('key', SETTINGS_KEY)
      .single();

    if (error) {
      return NextResponse.json(DEFAULT_LANDING_PAGE_CONFIG);
    }

    return NextResponse.json(mergeConfig(data?.value));
  } catch (error) {
    console.error('Error in GET /api/admin/landing-page:', error);
    return NextResponse.json(DEFAULT_LANDING_PAGE_CONFIG);
  }
}

// POST - Update PPC landing page configuration
export async function POST(request: NextRequest) {
  try {
    const adminSupabase = getAdminSupabaseClient();
    const body = await request.json();
    const config = mergeConfig(body);
    config.updatedAt = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (adminSupabase.from('admin_settings') as any).upsert(
      {
        key: SETTINGS_KEY,
        value: config,
        description: 'PPC landing page configuration (theme, pricing lines, hero copy, WhatsApp template)',
        updated_at: config.updatedAt,
      },
      { onConflict: 'key' }
    );

    if (error) {
      console.error('Error updating landing_page_config:', error);
      return NextResponse.json({ error: 'Failed to update landing page configuration' }, { status: 500 });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error in POST /api/admin/landing-page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
