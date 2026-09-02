'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, MessageCircle, Pencil, Lock } from 'lucide-react';
import { Button } from '@/components/ui';
import { formatPrice } from '@/lib/pricing';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { capture } from '@/lib/analytics/capture';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import { CTA_PLACEMENTS } from '@/lib/analytics/properties';

/**
 * The booking wizard's layout primitive.
 *
 * Every step used to be one tall `space-y-8` column that stacked its editable
 * fields *and* its read-only status blocks (trip recap, availability, price)
 * into a single scroll. Two consequences: the page overflowed the viewport on
 * every step, and the price — the number the customer is actually deciding
 * about — scrolled out of view exactly when they were deciding.
 *
 * StepShell splits that into a two-column grid at `lg`: editable fields left,
 * a sticky rail right carrying the trip summary, the live price and the primary
 * action. Below `lg` the rail's contents collapse into a fixed bottom action
 * bar, so the price and the CTA stay reachable no matter how long the form is.
 *
 * Per-step differences are expressed as *data*, not as JSX overrides — see
 * RailRow/RailPrice below. That is what keeps four call sites sharing one
 * layout instead of drifting into four near-copies, which is how the old
 * duplicated step headers and nav rows happened in the first place.
 */

export interface RailRow {
  label: string;
  value: React.ReactNode;
  /** Renders a "Change" affordance. Omit for rows that aren't editable here. */
  onEdit?: () => void;
}

export interface RailPriceLine {
  label: string;
  sub?: string;
  amount: number;
  tone?: 'advance' | 'muted';
}

export interface RailPrice {
  /** "Estimated fare" / "Total trip cost" — never a bare "Total". */
  label: string;
  /**
   * null renders `placeholder`, never a fake ₹0. Step 1 genuinely has no price
   * until a date and vehicle are chosen, and showing ₹0 there reads as "free".
   */
  amount: number | null;
  loading?: boolean;
  /** Season name, the Nainital entry/parking caveat, etc. */
  note?: React.ReactNode;
  /** Step 4's advance / pay-to-driver split, under a hairline. */
  lines?: RailPriceLine[];
  placeholder?: string;
}

export interface StepShellProps {
  /** Left column — ONLY this step's editable fields. */
  children: React.ReactNode;
  rail: {
    /** `false`/`null` entries are dropped, so callers can inline conditions. */
    summary: Array<RailRow | false | null>;
    price?: RailPrice;
  };
  primary: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    loadingLabel?: string;
    tone?: 'default' | 'confirm';
  };
  secondary?: { label: string; onClick: () => void; disabled?: boolean };
  /**
   * Inline validation message. Replaces the alert() steps 2 and 3 used to fire:
   * an alert blocks the main thread, dismisses the iOS soft keyboard and can
   * scroll the document — all of which fight a layout whose whole point is that
   * nothing moves under the user.
   */
  error?: string | null;
  /**
   * 'full' opts out of the grid, the rail and the action bar entirely. Used by
   * step 4's post-submit confirmation, which is a receipt to read rather than a
   * form to complete and so has no "primary action" to keep pinned.
   */
  variant?: 'wizard' | 'full';
}

function isRow(row: RailRow | false | null): row is RailRow {
  return Boolean(row);
}

/** Shared by the rail and the mobile bar so the two can never disagree. */
function priceText(price: RailPrice | undefined): string {
  if (!price) return '';
  if (price.loading) return 'Checking…';
  if (price.amount === null) {
    return price.placeholder ?? 'Select a date and vehicle';
  }
  return formatPrice(price.amount);
}

export default function StepShell({
  children,
  rail,
  primary,
  secondary,
  error,
  variant = 'wizard',
}: StepShellProps) {
  const { config: siteConfig } = useSiteConfig();
  const formRef = useRef<HTMLDivElement>(null);

  /**
   * A `fixed bottom-0` bar and a virtual keyboard are a known-bad pair: iOS
   * Safari resizes the visual viewport but not the layout viewport, so the bar
   * rides up and covers the field being typed into. Rather than chase
   * visualViewport resize events (which behave differently on iOS and Android),
   * hide the bar outright while a field inside the form column has focus. The
   * bar exists to keep the price and CTA reachable while *reading*; while
   * *typing*, the field matters more, and blur restores it immediately.
   */
  const [fieldFocused, setFieldFocused] = useState(false);
  useEffect(() => {
    const node = formRef.current;
    if (!node) return;
    const isField = (t: EventTarget | null) =>
      t instanceof HTMLElement && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName);
    const onIn = (e: FocusEvent) => isField(e.target) && setFieldFocused(true);
    const onOut = (e: FocusEvent) => isField(e.target) && setFieldFocused(false);
    node.addEventListener('focusin', onIn);
    node.addEventListener('focusout', onOut);
    return () => {
      node.removeEventListener('focusin', onIn);
      node.removeEventListener('focusout', onOut);
    };
  }, []);

  const rows = rail.summary.filter(isRow);
  const price = rail.price;
  const primaryTone =
    primary.tone === 'confirm'
      ? 'bg-green-600 hover:bg-green-700 text-white'
      : undefined;

  const helpHref = `https://wa.me/${siteConfig.contact.whatsapp.replace(/\D/g, '')}`;
  const onHelpClick = () =>
    capture(ANALYTICS_EVENTS.contactWhatsappClicked, {
      placement: CTA_PLACEMENTS.bookingRail,
    });

  const primaryButton = (
    <Button
      onClick={primary.onClick}
      disabled={primary.disabled || primary.loading}
      size="lg"
      // Padding is trimmed but `text-lg` is kept: shrinking the label to gain
      // height is exactly the trade this redesign is not allowed to make.
      className={`py-3 ${primaryTone ?? ''}`}
    >
      {primary.loading ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          {primary.loadingLabel ?? 'Working…'}
        </>
      ) : (
        primary.label
      )}
    </Button>
  );

  if (variant === 'full') {
    return <div ref={formRef}>{children}</div>;
  }

  return (
    <>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6 lg:items-start">
        {/*
          The ref stays on the form column, never on the grid wrapper: the
          wizard auto-focuses the first input/select/textarea inside it on every
          step change, and a ref on the wrapper would let that focus land on a
          control in the rail instead of on the first real field.
        */}
        <div ref={formRef} className="min-w-0 space-y-4">
          {children}
        </div>

        {/*
          `lg:self-start` is load-bearing. Grid items default to
          `align-self: stretch`, which makes this aside as tall as the form
          column and turns `position: sticky` into a silent no-op — it looks
          correct in a screenshot and does nothing on scroll.

          `lg:top-4` (rather than the `top-20` rates/RouteBrowser.tsx uses)
          because /booking renders no site header; the root layout mounts none.
        */}
        <aside className="hidden lg:block lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-retro-lg overflow-hidden">
            {rows.length > 0 && (
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 space-y-1.5">
                {rows.map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-3">
                    <span className="text-xs text-slate-500 shrink-0 pt-0.5">{row.label}</span>
                    <span className="min-w-0 text-right">
                      <span className="block text-sm font-semibold text-ink break-words">
                        {row.value}
                      </span>
                      {row.onEdit && (
                        <button
                          type="button"
                          onClick={row.onEdit}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-sunshine hover:text-ink transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                          Change
                        </button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {price && (
              <div className="px-4 py-3 border-b border-slate-200">
                <div className="text-xs text-slate-500">{price.label}</div>
                <div
                  className={`font-semibold text-ink tabular-nums ${
                    price.amount === null && !price.loading ? 'text-sm' : 'text-2xl'
                  }`}
                >
                  {priceText(price)}
                </div>
                {price.note && (
                  <div className="text-xs text-slate-500 mt-1">{price.note}</div>
                )}
                {price.lines && price.lines.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200 space-y-1.5">
                    {price.lines.map((line) => (
                      <div key={line.label} className="flex items-baseline justify-between gap-3">
                        <span className="min-w-0">
                          <span
                            className={`block text-sm ${
                              line.tone === 'advance'
                                ? 'font-semibold text-green-700'
                                : 'text-slate-600'
                            }`}
                          >
                            {line.label}
                          </span>
                          {line.sub && (
                            <span className="block text-xs text-slate-500">{line.sub}</span>
                          )}
                        </span>
                        <span
                          className={`shrink-0 font-semibold tabular-nums ${
                            line.tone === 'advance'
                              ? 'text-xl text-green-700'
                              : 'text-base text-ink'
                          }`}
                        >
                          {formatPrice(line.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="px-4 py-3 space-y-2">
              {error && (
                <p role="alert" aria-live="assertive" className="text-sm text-coral leading-snug">
                  {error}
                </p>
              )}
              <div className="flex flex-col gap-2">
                {primaryButton}
                {secondary && (
                  <Button
                    onClick={secondary.onClick}
                    disabled={secondary.disabled}
                    variant="secondary"
                    size="md"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {secondary.label}
                  </Button>
                )}
              </div>
            </div>

            {/*
              /booking is in GlobalContactWidgets' SUPPRESSED_PREFIXES, so the
              global FloatingWhatsApp bubble no longer covers this rail. This
              line replaces it rather than dropping the affordance — and it is
              visible without the 300px of scroll the bubble used to require.
            */}
            <div className="px-4 pb-3 flex items-center justify-between gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                Secure checkout
              </span>
              <a
                href={helpHref}
                target="_blank"
                rel="noopener noreferrer"
                data-analytics-cta="whatsapp"
                onClick={onHelpClick}
                className="inline-flex items-center gap-1 font-semibold text-whatsapp hover:underline"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Need help?
              </a>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile action bar — mirrors the rail's price + actions. */}
      <div
        className={`lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-4 pt-2.5 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] ${
          fieldFocused ? 'hidden' : ''
        }`}
        style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom))' }}
      >
        {error && (
          <p role="alert" aria-live="assertive" className="text-xs text-coral mb-1.5 leading-snug">
            {error}
          </p>
        )}
        <div className="flex items-center gap-2.5">
          {price && (
            <div className="min-w-0 flex-1">
              <div className="text-xs text-slate-500 leading-tight">{price.label}</div>
              <div className="text-base font-semibold text-ink leading-tight tabular-nums truncate">
                {priceText(price)}
              </div>
            </div>
          )}
          <a
            href={helpHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ask us on WhatsApp"
            data-analytics-cta="whatsapp"
            onClick={onHelpClick}
            className="shrink-0 h-11 w-11 inline-flex items-center justify-center rounded-md border border-slate-300 bg-white text-whatsapp"
          >
            <MessageCircle className="w-5 h-5" />
          </a>
          {secondary && (
            <button
              type="button"
              onClick={secondary.onClick}
              disabled={secondary.disabled}
              aria-label={secondary.label}
              className="shrink-0 h-11 w-11 inline-flex items-center justify-center rounded-md border border-slate-300 bg-white text-ink disabled:opacity-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="shrink-0">{primaryButton}</div>
        </div>
      </div>
    </>
  );
}
