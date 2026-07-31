import Link from 'next/link';
import type { LandingThemeTokens } from './themes';
import type { Package } from '@/lib/supabase/types';

interface FeaturedPackagesProps {
  theme: LandingThemeTokens;
  packages: Package[];
  minPrices: Record<string, number>;
}

export default function FeaturedPackages({ theme, packages, minPrices }: FeaturedPackagesProps) {
  if (packages.length === 0) return null;

  return (
    <section id="tours" className="px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="font-display text-2xl sm:text-3xl text-ink">Most-Booked Tours This Season</h2>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {packages.map((pkg, i) => (
            <Link
              key={pkg.id}
              href={`/tour/${pkg.slug}`}
              className={`group overflow-hidden rounded-2xl bg-white shadow-retro transition hover:-translate-y-1 ${theme.cardAccent} ${
                i === 0 ? 'sm:col-span-3 sm:flex sm:flex-row-reverse sm:items-stretch' : ''
              }`}
            >
              <div className={`relative aspect-[16/10] w-full overflow-hidden bg-slate-100 ${i === 0 ? 'sm:w-1/2' : ''}`}>
                {pkg.image_url && (
                  // Plain <img>, not next/image: package images are remote
                  // Unsplash URLs and next.config.mjs has no remotePatterns
                  // configured (matches src/components/home/PackageCard.tsx).
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pkg.image_url}
                    alt={pkg.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                )}
                {i === 0 && (
                  <span className="absolute left-3 top-3 rounded-full bg-coral px-3 py-1 text-xs font-bold text-white">
                    Flagship Tour
                  </span>
                )}
              </div>
              <div className={`p-4 ${i === 0 ? 'sm:flex sm:w-1/2 sm:flex-col sm:justify-center sm:p-8' : ''}`}>
                <p className={`font-display text-lg text-ink ${i === 0 ? 'sm:text-2xl' : ''}`}>{pkg.title}</p>
                {pkg.duration && <p className="mt-1 text-sm text-slate-500">{pkg.duration}</p>}
                {minPrices[pkg.id] != null && (
                  <p className={`mt-2 text-lg font-extrabold ${theme.priceAccent}`}>
                    From ₹{minPrices[pkg.id].toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
