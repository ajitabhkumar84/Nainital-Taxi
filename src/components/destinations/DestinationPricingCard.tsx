'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, Button } from '@/components/ui';
import { Car, CheckCircle2 } from 'lucide-react';
import { useBookingStore, VehicleType } from '@/store/bookingStore';

interface VehicleInfo {
  name: string;
  capacity: string;
  model: string;
}

interface DestinationPricingCardProps {
  vehicleType: string;
  vehicle: VehicleInfo;
  seasonPrice: number;
  offSeasonPrice: number;
  seasonDates: string[];
  offSeasonDates: string[];
  destinationSlug: string;
  destinationName: string;
  packageId: string;
  packageTitle: string;
}

export default function DestinationPricingCard({
  vehicleType,
  vehicle,
  seasonPrice,
  offSeasonPrice,
  seasonDates,
  offSeasonDates,
  destinationSlug,
  destinationName,
  packageId,
  packageTitle,
}: DestinationPricingCardProps) {
  const router = useRouter();
  const bookingStore = useBookingStore();

  const handleBookNow = (priceType: 'season' | 'offSeason') => {
    const price = priceType === 'season' ? seasonPrice : offSeasonPrice;
    const seasonName = priceType === 'season' ? 'Season' : 'Off-Season';

    // Set route context
    bookingStore.setRouteContext({
      destinationSlug,
      destinationName,
      prefilledPickup: 'Kathgodam Railway Station',
      prefilledDropoff: destinationName,
    });

    // Set booking type
    bookingStore.setBookingType('transfer');

    // Set package
    bookingStore.setPackage(packageId, packageTitle);

    // Set vehicle type
    bookingStore.setVehicleType(vehicleType as VehicleType);

    // Set price (use empty string for seasonId if not available)
    bookingStore.setCalculatedPrice(price, '', seasonName);

    // Skip to step 2 (trip details)
    bookingStore.setCurrentStep(2);

    // Navigate to booking page
    router.push('/booking');
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-teal/10 to-teal/5 p-6">
        <Car className="w-12 h-12 text-teal mb-3" />
        <h3 className="font-display text-2xl text-ink mb-1">{vehicle?.name || vehicleType}</h3>
        <p className="text-sm text-ink/60 mb-2">{vehicle?.capacity}</p>
        <p className="text-xs text-ink/50">{vehicle?.model}</p>
      </div>

      <CardContent className="pt-6 space-y-4">
        {/* Off-Season Price */}
        <div className="border-2 border-ink/20 rounded-lg p-3 bg-white">
          <div className="text-xs font-body text-ink/60 mb-1">Off-Season</div>
          <div className="text-2xl font-display text-teal">₹{offSeasonPrice.toLocaleString()}</div>
          <div className="text-xs text-ink/50 mt-1">
            {offSeasonDates.length > 0 ? offSeasonDates[0] : 'Regular pricing'}
          </div>
          <Button
            onClick={() => handleBookNow('offSeason')}
            variant="primary"
            size="sm"
            className="w-full mt-3"
          >
            Book Now
          </Button>
        </div>

        {/* Season Price */}
        <div className="border-2 border-sunshine rounded-lg p-3 bg-sunshine/10">
          <div className="text-xs font-body text-ink/60 mb-1">Peak Season</div>
          <div className="text-2xl font-display text-ink">₹{seasonPrice.toLocaleString()}</div>
          <div className="text-xs text-ink/50 mt-1">
            {seasonDates.length > 0 ? seasonDates.join(', ') : 'Peak pricing'}
          </div>
          <Button
            onClick={() => handleBookNow('season')}
            variant="secondary"
            size="sm"
            className="w-full mt-3"
          >
            Book Now
          </Button>
        </div>

        {/* Features */}
        <div className="space-y-2 pt-2 border-t border-ink/10">
          <div className="flex items-center text-sm text-ink/70">
            <CheckCircle2 className="w-4 h-4 text-teal mr-2 flex-shrink-0" />
            <span className="font-body">Experienced driver</span>
          </div>
          <div className="flex items-center text-sm text-ink/70">
            <CheckCircle2 className="w-4 h-4 text-teal mr-2 flex-shrink-0" />
            <span className="font-body">Fuel & tolls included</span>
          </div>
          <div className="flex items-center text-sm text-ink/70">
            <CheckCircle2 className="w-4 h-4 text-teal mr-2 flex-shrink-0" />
            <span className="font-body">AC & music system</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
