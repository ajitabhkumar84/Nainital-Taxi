import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google';
import { TrackingConfig } from '@/lib/supabase/types';
import { extractScriptTags } from '@/lib/trackingScripts';

interface TrackingProps {
  tracking: TrackingConfig;
  nonce?: string;
}

function CustomScripts({ html, nonce }: { html?: string; nonce?: string }) {
  if (!html?.trim()) return null;

  return (
    <>
      {extractScriptTags(html).map((script, i) =>
        script.src ? (
          // eslint-disable-next-line @next/next/no-sync-scripts
          <script key={i} nonce={nonce} src={script.src} {...script.attrs} />
        ) : (
          <script
            key={i}
            nonce={nonce}
            {...script.attrs}
            dangerouslySetInnerHTML={{ __html: script.content }}
          />
        )
      )}
    </>
  );
}

// Google's own <GoogleTagManager>/<GoogleAnalytics> components (@next/third-parties)
// must be rendered as top-level siblings of <body> — not nested inside <head> or
// <body> — per Next.js's own docs (their internal next/script wiring expects this
// exact position). TrackingGtm/TrackingGa below exist to be dropped in at those
// two specific spots in src/app/layout.tsx.

// Sibling of <body>, placed immediately before it.
export function TrackingGtm({ tracking, nonce }: TrackingProps) {
  if (!tracking.isEnabled || !tracking.googleTagManagerId) return null;
  return <GoogleTagManager gtmId={tracking.googleTagManagerId} nonce={nonce} />;
}

// Sibling of <body>, placed immediately after it.
export function TrackingGa({ tracking, nonce }: TrackingProps) {
  if (!tracking.isEnabled || !tracking.googleAnalyticsId) return null;
  return <GoogleAnalytics gaId={tracking.googleAnalyticsId} nonce={nonce} />;
}

// Rendered inside <head>. There's no official Next.js component for Facebook
// Pixel, so it's hand-rolled. Per Meta's own install docs, the pixel's
// <noscript> beacon fallback belongs directly next to its init script, so
// it's rendered here too rather than at the end of <body>.
export function TrackingHeadScripts({ tracking, nonce }: TrackingProps) {
  if (!tracking.isEnabled) return null;

  return (
    <>
      {tracking.facebookPixelId && (
        <>
          <script
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${tracking.facebookPixelId}');
fbq('track', 'PageView');`,
            }}
          />
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height={1}
              width={1}
              style={{ display: 'none' }}
              alt=""
              src={`https://www.facebook.com/tr?id=${tracking.facebookPixelId}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      )}
      <CustomScripts html={tracking.customHeadScripts} nonce={nonce} />
    </>
  );
}

// Rendered as the first child of <body>. GTM's <noscript><iframe> fallback
// isn't added automatically by @next/third-parties' <GoogleTagManager>, and
// Google's install docs require it immediately after the opening <body> tag.
export function TrackingBodyStart({ tracking }: TrackingProps) {
  if (!tracking.isEnabled || !tracking.googleTagManagerId) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${tracking.googleTagManagerId}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        title="gtm-noscript"
      />
    </noscript>
  );
}

// Rendered as the last child of <body>, just before it closes.
export function TrackingBodyEnd({ tracking, nonce }: TrackingProps) {
  if (!tracking.isEnabled || !tracking.customBodyScripts?.trim()) return null;

  return <CustomScripts html={tracking.customBodyScripts} nonce={nonce} />;
}
