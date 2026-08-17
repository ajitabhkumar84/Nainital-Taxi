import { revalidateTag } from 'next/cache';
import type { CacheTag } from '@/lib/cacheTags';

/**
 * Busts one or more content cache tags after an admin write.
 *
 * WHY THIS IS SEPARATE FROM revalidatePath()
 * ------------------------------------------
 * They clear different caches and neither implies the other:
 *
 *   revalidatePath('/rates')  → clears the *route* render for /rates
 *   revalidateTag('routes')   → clears the *data* returned by the cached
 *                               getRoutesWithCategories() query
 *
 * Before the caching work in src/lib/cacheTags.ts, the admin routes only called
 * revalidatePath. That was sufficient when every query ran live per request.
 * Now that reads are wrapped in unstable_cache, a revalidatePath alone would
 * re-render the page and then re-read the *same stale cache entry* — the admin
 * would save, see nothing change, and reasonably conclude the save failed.
 *
 * So the rule is: every admin write calls BOTH. revalidatePath for the pages,
 * revalidateContent for the data behind them.
 *
 * Wrapped in try/catch for the same reason as revalidateRoutePages(): a
 * revalidation failure must never surface as a failed write when the row was
 * actually committed. Losing freshness for one TTL window is recoverable;
 * telling the admin their save failed when it succeeded makes them save again
 * and doubt the panel.
 */
export function revalidateContent(...tags: CacheTag[]): void {
  for (const tag of tags) {
    try {
      revalidateTag(tag);
    } catch (error) {
      console.error(
        `Revalidation failed for tag "${tag}" (DB write succeeded):`,
        error
      );
    }
  }
}
