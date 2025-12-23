import { Suspense } from 'react';
import FleetContent from './FleetContent';

export const metadata = {
  title: 'Our Fleet - Nainital Fun Taxi | Premium Vehicles for Your Journey',
  description: 'Choose from our handpicked fleet of well-maintained sedans, SUVs, and luxury vehicles. All cars come with AC, music system, and experienced drivers for your Nainital adventure.',
  openGraph: {
    title: 'Our Fleet - Nainital Fun Taxi',
    description: 'Premium vehicles for your hill station journey',
    type: 'website',
  },
};

export default function FleetPage() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<FleetPageSkeleton />}>
        <FleetContent />
      </Suspense>
    </div>
  );
}

function FleetPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="h-12 bg-sunrise/30 rounded-lg w-64 mx-auto mb-4 animate-pulse" />
      <div className="h-6 bg-sunrise/30 rounded w-96 mx-auto mb-12 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-96 bg-sunrise/30 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
