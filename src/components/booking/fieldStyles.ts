/**
 * Field label styling for the booking wizard.
 *
 * This deliberately does NOT use the shared `<Label>` from components/ui.
 * That primitive is `text-xs uppercase tracking-wide` (12px), and the booking
 * flow's labels have always been `text-sm` (14px). Swapping to it during the
 * one-viewport redesign would look like "adopting the design system" while
 * actually shrinking type to buy vertical space — the one thing that redesign
 * is not allowed to do. So: same 14px as before, only the weight normalised
 * from `font-bold` to `font-semibold` and the bottom margin trimmed from
 * `mb-2`/`mb-3` to `mb-1.5`.
 *
 * If the booking flow ever genuinely moves to the compact uppercase label,
 * that is a design decision to take on its own, not a side effect of a layout
 * pass.
 */
export const FIELD_LABEL = 'block text-sm font-semibold text-ink mb-1.5';

/** Optional helper text under a field. Matches the existing `text-xs` hints. */
export const FIELD_HINT = 'text-xs text-slate-500 mt-1';
