import { unstable_cache } from 'next/cache';
import { parse } from 'node-html-parser';
import { supabase } from '@/lib/supabase';
import { DEFAULT_SITE_CONFIG, TrackingConfig } from '@/lib/supabase/types';

// Shared between here and src/app/api/admin/site-config/route.ts, which calls
// revalidateTag(TRACKING_CONFIG_CACHE_TAG) on save so an admin edit takes
// effect on the live site within seconds instead of waiting out the TTL below.
export const TRACKING_CONFIG_CACHE_TAG = 'site-tracking-config';

async function fetchTrackingConfig(): Promise<TrackingConfig> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('admin_settings') as any)
      .select('value')
      .eq('key', 'site_config_tracking')
      .single();

    if (error || !data) {
      return DEFAULT_SITE_CONFIG.tracking;
    }

    return (data.value as TrackingConfig) ?? DEFAULT_SITE_CONFIG.tracking;
  } catch (error) {
    console.error('Error fetching tracking config:', error);
    return DEFAULT_SITE_CONFIG.tracking;
  }
}

// src/app/layout.tsx wraps every page, so an uncached call here would hit
// Supabase on every single page view. 300s is just a safety-net TTL — the
// admin save path busts this via revalidateTag well before that.
const getCachedTrackingConfig = unstable_cache(
  fetchTrackingConfig,
  ['site-tracking-config'],
  { tags: [TRACKING_CONFIG_CACHE_TAG], revalidate: 300 }
);

export async function getTrackingConfig(): Promise<TrackingConfig> {
  return getCachedTrackingConfig();
}

export interface ParsedScriptTag {
  src?: string;
  attrs: Record<string, string>;
  content: string;
}

// Extracts each complete <script> tag from an admin-pasted snippet (the
// Tracking tab's "Custom Head/Body Scripts" fields explicitly ask for
// "complete script tags") so each can be re-rendered as its own React
// <script> element with our nonce attached. Uses a real HTML parser rather
// than regex — a hand-rolled regex breaks on realistic paste content like a
// `</script>` substring inside a JS string literal or escaped quotes in an
// attribute, which would silently drop or mangle the tag.
export function extractScriptTags(html: string): ParsedScriptTag[] {
  if (!html?.trim()) return [];

  let root;
  try {
    root = parse(html);
  } catch (error) {
    console.error('Error parsing custom tracking script snippet:', error);
    return [];
  }

  return root.querySelectorAll('script').map((node) => {
    const attrs: Record<string, string> = {};
    for (const [name, value] of Object.entries(node.attributes)) {
      if (name.toLowerCase() === 'nonce') continue; // ours always wins
      attrs[name] = value;
    }

    return {
      src: node.getAttribute('src'),
      attrs,
      content: node.innerHTML,
    };
  });
}
