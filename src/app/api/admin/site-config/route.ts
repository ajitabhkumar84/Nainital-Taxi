import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { SiteConfig, DEFAULT_SITE_CONFIG } from '@/lib/supabase/types';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'nainital2024';

function isAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('x-admin-auth');
  return authHeader === ADMIN_PASSWORD;
}

// GET - Fetch site configuration
export async function GET() {
  try {
    // Fetch all site config keys from admin_settings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: settings, error } = await (supabase.from('admin_settings') as any)
      .select('key, value')
      .in('key', ['site_config_header', 'site_config_footer', 'site_config_contact']);

    if (error) {
      console.error('Error fetching site config:', error);
      // Return default config if error
      return NextResponse.json(DEFAULT_SITE_CONFIG);
    }

    // Build config from settings or use defaults
    const settingsArray = settings as { key: string; value: unknown }[] | null;
    const configMap = new Map(settingsArray?.map(s => [s.key, s.value]) || []);

    const siteConfig: SiteConfig = {
      header: (configMap.get('site_config_header') as SiteConfig['header']) || DEFAULT_SITE_CONFIG.header,
      footer: (configMap.get('site_config_footer') as SiteConfig['footer']) || DEFAULT_SITE_CONFIG.footer,
      contact: (configMap.get('site_config_contact') as SiteConfig['contact']) || DEFAULT_SITE_CONFIG.contact,
    };

    return NextResponse.json(siteConfig);
  } catch (error) {
    console.error('Error in GET /api/admin/site-config:', error);
    return NextResponse.json(DEFAULT_SITE_CONFIG);
  }
}

// POST - Update site configuration (requires auth)
export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { header, footer, contact } = body as Partial<SiteConfig>;

    const updates: { key: string; value: any; description: string }[] = [];

    if (header) {
      updates.push({
        key: 'site_config_header',
        value: header,
        description: 'Header configuration (nav links, logo, CTAs)',
      });
    }

    if (footer) {
      updates.push({
        key: 'site_config_footer',
        value: footer,
        description: 'Footer configuration (links, social, copyright)',
      });
    }

    if (contact) {
      updates.push({
        key: 'site_config_contact',
        value: contact,
        description: 'Contact information (phone, email, address)',
      });
    }

    // Upsert each config section
    for (const update of updates) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('admin_settings') as any)
        .upsert(
          {
            key: update.key,
            value: update.value,
            description: update.description,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );

      if (error) {
        console.error(`Error updating ${update.key}:`, error);
        return NextResponse.json(
          { error: `Failed to update ${update.key}` },
          { status: 500 }
        );
      }
    }

    // Fetch and return updated config
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: settings } = await (supabase.from('admin_settings') as any)
      .select('key, value')
      .in('key', ['site_config_header', 'site_config_footer', 'site_config_contact']);

    const settingsArray = settings as { key: string; value: unknown }[] | null;
    const configMap = new Map(settingsArray?.map(s => [s.key, s.value]) || []);

    const updatedConfig: SiteConfig = {
      header: (configMap.get('site_config_header') as SiteConfig['header']) || DEFAULT_SITE_CONFIG.header,
      footer: (configMap.get('site_config_footer') as SiteConfig['footer']) || DEFAULT_SITE_CONFIG.footer,
      contact: (configMap.get('site_config_contact') as SiteConfig['contact']) || DEFAULT_SITE_CONFIG.contact,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error('Error in POST /api/admin/site-config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Initialize default config if not exists
export async function PUT(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Check if config exists
    const { data: existing } = await supabase
      .from('admin_settings')
      .select('key')
      .eq('key', 'site_config_header')
      .single();

    if (existing) {
      return NextResponse.json({ message: 'Config already initialized' });
    }

    // Initialize with defaults
    const defaults = [
      {
        key: 'site_config_header',
        value: DEFAULT_SITE_CONFIG.header,
        description: 'Header configuration (nav links, logo, CTAs)',
      },
      {
        key: 'site_config_footer',
        value: DEFAULT_SITE_CONFIG.footer,
        description: 'Footer configuration (links, social, copyright)',
      },
      {
        key: 'site_config_contact',
        value: DEFAULT_SITE_CONFIG.contact,
        description: 'Contact information (phone, email, address)',
      },
    ];

    for (const config of defaults) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('admin_settings') as any).upsert(config, { onConflict: 'key' });
    }

    return NextResponse.json({
      message: 'Config initialized successfully',
      config: DEFAULT_SITE_CONFIG
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/site-config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
