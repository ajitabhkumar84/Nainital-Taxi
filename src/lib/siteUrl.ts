// Single source of truth for the production origin. Canonical tags, the sitemap,
// robots.txt and the schema.org @id must all agree — four independent hardcoded
// copies is how this drifted onto a misspelled .com domain in the first place.
//
// Deliberately a constant, not process.env.NEXT_PUBLIC_SITE_URL: that var is set
// to http://localhost:3000 in .env.local, so reading it here would emit localhost
// canonicals and a localhost sitemap from any local production build.
//
// No trailing slash — metadataBase joins paths onto this, and a trailing slash
// would produce "//path".
export const SITE_URL = 'https://nainitaltaxi.in';
