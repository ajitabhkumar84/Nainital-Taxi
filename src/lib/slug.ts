export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MIN_LEN = 2;
const MAX_LEN = 80;

// Segment names that already resolve to real routes/files at the app root —
// picking one of these as a custom page_slug would either be unreachable (a
// static folder always wins over a dynamic segment) or collide with a
// Next.js special file. "multi-day-rental" is deliberately NOT in this
// list: it's this page's own default slug and must remain choosable.
export const RESERVED_PAGE_SLUGS: readonly string[] = [
  'admin', 'api', 'b2b', 'booking', 'booking-simple', 'cancellation-policy',
  'contact', 'destinations', 'fleet', 'lp', 'packages', 'privacy', 'quote',
  'rates', 'temples', 'terms', 'tour', 'favicon.ico', 'robots.txt',
  'sitemap.xml', '_next',
];

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isValidSlugFormat(slug: string): boolean {
  return slug.length >= MIN_LEN && slug.length <= MAX_LEN && SLUG_REGEX.test(slug);
}

// Returns a user-facing error string, or null if the slug is acceptable.
// The admin form runs this for instant feedback; the admin API route runs
// it again as the authoritative check.
export function validatePageSlug(rawSlug: string): string | null {
  const slug = slugify(rawSlug);
  if (!slug) return 'Slug cannot be empty.';
  if (!isValidSlugFormat(slug)) {
    return 'Use lowercase letters, numbers, and hyphens only (e.g. "uttarakhand-tours").';
  }
  if (RESERVED_PAGE_SLUGS.includes(slug)) {
    return `"${slug}" is reserved and can't be used as a page URL.`;
  }
  return null;
}
