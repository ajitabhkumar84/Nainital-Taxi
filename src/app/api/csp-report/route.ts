import { NextRequest, NextResponse } from 'next/server';

// Browsers POST here whenever the CSP set in src/lib/security/csp.ts blocks
// something (report-uri directive). Without this, a newly-pasted tracking
// script that calls a domain outside the allowlist just fails silently in
// visitors' browsers — this surfaces exactly which directive/host to add.
// Unauthenticated by design (see the public-route bucket in src/middleware.ts)
// since the browser sending the report has no admin session.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const report = body?.['csp-report'] ?? body;

    if (report) {
      console.error('[CSP violation]', {
        blockedUri: report['blocked-uri'],
        violatedDirective: report['violated-directive'] ?? report['effective-directive'],
        documentUri: report['document-uri'],
        sourceFile: report['source-file'],
        lineNumber: report['line-number'],
      });
    }
  } catch (error) {
    console.error('Error parsing CSP report:', error);
  }

  return new NextResponse(null, { status: 204 });
}
