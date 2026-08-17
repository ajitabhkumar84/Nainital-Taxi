import { ImageResponse } from 'next/og';

/**
 * Site-wide social preview card, 1200x630.
 *
 * Applies to every route that doesn't set its own openGraph.images — Next
 * wires up og:image, og:image:width/height and og:image:type from this file
 * automatically, with an absolute URL, which is what WhatsApp and Facebook
 * require. Before this existed, shared links rendered as a bare grey text row,
 * and almost every link to this site is shared in a WhatsApp chat.
 *
 * Generated rather than a static JPEG on purpose:
 *  - No new dependency and no binary asset to keep in sync with the brand.
 *  - Output is a flat-colour PNG in the 20-40KB range, comfortably under the
 *    ~300KB ceiling above which WhatsApp silently drops the preview. A
 *    photographic card at this size would be several times larger.
 *  - Typographic cards stay legible at the ~200px-wide thumbnail WhatsApp
 *    actually renders, where a wide landscape photo turns to mush.
 *
 * Colours are the literal palette values from tailwind.config.ts (sunshine
 * #1D4ED8, ink #0F172A) — Tailwind classes aren't available in this renderer,
 * so they cannot be referenced by name here. If the brand palette changes,
 * this file needs updating by hand.
 */

export const runtime = 'edge';
export const alt = 'Nainital Taxi — premium taxi and tour services in Nainital';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0F172A',
          padding: '72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              backgroundColor: '#1D4ED8',
              color: '#FFFFFF',
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 2,
              padding: '10px 22px',
              borderRadius: 8,
            }}
          >
            NAINITAL TAXI
          </div>

          <div
            style={{
              display: 'flex',
              color: '#FFFFFF',
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.1,
              marginTop: 44,
              maxWidth: 920,
            }}
          >
            Premium taxi &amp; tour services in Nainital
          </div>

          <div
            style={{
              display: 'flex',
              color: '#CBD5E1',
              fontSize: 34,
              marginTop: 28,
              maxWidth: 900,
            }}
          >
            Kathgodam · Delhi · Pantnagar transfers, and tours across Kumaon
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            color: '#94A3B8',
            fontSize: 28,
          }}
        >
          <div style={{ display: 'flex', color: '#FFFFFF', fontWeight: 600 }}>
            nainitaltaxi.in
          </div>
          <div style={{ display: 'flex' }}>·</div>
          <div style={{ display: 'flex' }}>Fixed fares · 24/7 · Verified drivers</div>
        </div>
      </div>
    ),
    size
  );
}
