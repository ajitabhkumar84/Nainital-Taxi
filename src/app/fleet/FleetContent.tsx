'use client';

import { useEffect, useState, useMemo, memo, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { getVehicles, getPackagePrices, getSeasonForDate, getPackages } from '@/lib/supabase/queries_enhanced';
import type { Vehicle, Season } from '@/lib/supabase/types';
import { Car, Users, Music, Wind, Baby, Luggage, ArrowRight, Shield, UserCheck, Heart, Award } from 'lucide-react';
import Link from 'next/link';

// Vehicle type display mapping
const VEHICLE_TYPE_INFO = {
  sedan: {
    displayName: 'Sedan',
    subtitle: 'Dzire/Amaze/Xcent',
    defaultCapacity: 4,
    icon: '🚗',
  },
  suv_normal: {
    displayName: 'SUV Normal',
    subtitle: 'Ertiga/Triber/Xylo',
    defaultCapacity: 7,
    icon: '🚙',
  },
  suv_deluxe: {
    displayName: 'SUV Deluxe',
    subtitle: 'Innova/Marazzo',
    defaultCapacity: 7,
    icon: '🚐',
  },
  suv_luxury: {
    displayName: 'SUV Luxury',
    subtitle: 'Innova Crysta',
    defaultCapacity: 7,
    icon: '✨',
  },
} as const;

interface PricingData {
  offSeasonPrice: number | null;
  seasonPrice: number | null;
  currentSeasonName: string;
}

interface SeasonData {
  offSeason: Season | null;
  peakSeason: Season | null;
}

export default function FleetContent() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showSeasonPricing, setShowSeasonPricing] = useState(false);
  const [pricingData, setPricingData] = useState<Record<string, PricingData>>({});
  const [currentSeason, setCurrentSeason] = useState<{ id: string; name: string; description: string | null } | null>(null);
  const [seasonData, setSeasonData] = useState<SeasonData>({ offSeason: null, peakSeason: null });

  useEffect(() => {
    loadFleetData();
  }, []);

  const loadFleetData = useCallback(async () => {
    try {
      setLoading(true);

      const { supabase } = await import('@/lib/supabase/client');
      const today = new Date().toISOString().split('T')[0];

      // Parallel fetch: vehicles, season, seasons, and packages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [vehiclesData, currentSeasonData, seasonsResult, packagesData] = await Promise.all([
        getVehicles(),
        getSeasonForDate(today),
        (supabase.from('seasons') as any).select('*').eq('is_active', true).order('name', { ascending: false }),
        getPackages('tour'),
      ]);

      const activeVehicles = vehiclesData.filter((v) => v.is_active);
      setVehicles(activeVehicles);
      setCurrentSeason(currentSeasonData);

      const seasons = seasonsResult.data as Season[] | null;
      let offSeasonObj: Season | null = null;
      let peakSeasonObj: Season | null = null;

      if (seasons && seasons.length >= 1) {
        peakSeasonObj = seasons.find((s) => s.name === 'Season') || null;
        offSeasonObj = seasons.find((s) => s.name === 'Off-Season') || null;
        setSeasonData({
          peakSeason: peakSeasonObj,
          offSeason: offSeasonObj,
        });
      }

      const referencePackage = packagesData.find(p => p.is_popular) || packagesData[0];

      if (!referencePackage) {
        setLoading(false);
        return;
      }

      // Use actual season start dates from database instead of hardcoded dates
      const offSeasonDate = offSeasonObj?.start_date || today;
      const peakSeasonDate = peakSeasonObj?.start_date || today;

      // Fetch pricing for all vehicle types in parallel
      const pricingPromises = Object.keys(VEHICLE_TYPE_INFO).map(async (vehicleType) => {
        try {
          const [offSeasonPriceData, peakSeasonPriceData] = await Promise.all([
            getPackagePrices(referencePackage.id, offSeasonDate),
            getPackagePrices(referencePackage.id, peakSeasonDate),
          ]);

          const offSeasonPrice = offSeasonPriceData.find(p => p.vehicle_type === vehicleType)?.price || null;
          const seasonPrice = peakSeasonPriceData.find(p => p.vehicle_type === vehicleType)?.price || null;

          return {
            vehicleType,
            pricing: {
              offSeasonPrice,
              seasonPrice,
              currentSeasonName: currentSeasonData?.name || 'Off-Season',
            },
          };
        } catch {
          return {
            vehicleType,
            pricing: {
              offSeasonPrice: null,
              seasonPrice: null,
              currentSeasonName: 'Off-Season',
            },
          };
        }
      });

      const pricingResults = await Promise.all(pricingPromises);
      const pricingMap = pricingResults.reduce((acc, { vehicleType, pricing }) => {
        acc[vehicleType] = pricing;
        return acc;
      }, {} as Record<string, PricingData>);

      setPricingData(pricingMap);
    } catch (error) {
      console.error('Error loading fleet data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const vehicleTypes = useMemo(() => ['all', ...Object.keys(VEHICLE_TYPE_INFO)], []);

  const filteredVehicles = useMemo(() => {
    return selectedType === 'all'
      ? vehicles
      : vehicles.filter(v => v.vehicle_type === selectedType);
  }, [vehicles, selectedType]);

  // Group vehicles by type for display - memoized
  const vehiclesByType = useMemo(() => {
    return Object.keys(VEHICLE_TYPE_INFO).reduce((acc, type) => {
      acc[type] = vehicles.filter(v => v.vehicle_type === type);
      return acc;
    }, {} as Record<string, Vehicle[]>);
  }, [vehicles]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="h-12 bg-sunrise/30 rounded-lg w-64 mx-auto mb-4 animate-pulse" />
          <div className="h-6 bg-sunrise/30 rounded w-96 mx-auto animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[500px] bg-sunrise/30 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* 1. Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display text-ink mb-4">
          Premium Taxi Rental in Nainital
        </h1>
        <p className="text-lg md:text-xl text-ink/70 max-w-2xl mx-auto mb-6">
          Book comfortable, well-maintained vehicles with verified, professional drivers
          <br />
          for your safe and memorable Nainital tour
        </p>
        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm">
          <div className="flex items-center gap-2 bg-teal/10 px-4 py-2 rounded-full">
            <Shield className="w-4 h-4 text-teal" />
            <span className="text-ink/80">Verified Drivers</span>
          </div>
          <div className="flex items-center gap-2 bg-coral/10 px-4 py-2 rounded-full">
            <UserCheck className="w-4 h-4 text-coral" />
            <span className="text-ink/80">Zero Alcohol Policy</span>
          </div>
          <div className="flex items-center gap-2 bg-sunshine/30 px-4 py-2 rounded-full">
            <Award className="w-4 h-4 text-ink" />
            <span className="text-ink/80">10,000+ Safe Trips</span>
          </div>
        </div>
      </div>

      {/* 2. Safety Promise Section - MOVED UP */}
      <div className="max-w-5xl mx-auto mb-12 bg-gradient-to-br from-ink to-ink/95 rounded-2xl p-8 shadow-retro border-3 border-ink">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-4">
            <Shield className="w-5 h-5 text-sunshine" />
            <span className="text-white/90 text-sm font-medium">Our Safety Promise</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-display text-white mb-2">
            Your Safety Matters More Than Cheap Fares
          </h2>
          <p className="text-white/60 max-w-xl mx-auto">
            We invest in quality because your family deserves the best
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-xl p-5 text-center hover:bg-white/10 transition-colors">
            <Shield className="w-10 h-10 text-teal mx-auto mb-3" />
            <h3 className="font-display text-white mb-1">Zero Alcohol</h3>
            <p className="text-white/60 text-sm">Strict sobriety policy with no exceptions</p>
          </div>
          <div className="bg-white/5 rounded-xl p-5 text-center hover:bg-white/10 transition-colors">
            <UserCheck className="w-10 h-10 text-coral mx-auto mb-3" />
            <h3 className="font-display text-white mb-1">Verified Drivers</h3>
            <p className="text-white/60 text-sm">Background-checked & professionally trained</p>
          </div>
          <div className="bg-white/5 rounded-xl p-5 text-center hover:bg-white/10 transition-colors">
            <Heart className="w-10 h-10 text-sunshine mx-auto mb-3" />
            <h3 className="font-display text-white mb-1">Family-First Care</h3>
            <p className="text-white/60 text-sm">Drivers who treat you like family</p>
          </div>
          <div className="bg-white/5 rounded-xl p-5 text-center hover:bg-white/10 transition-colors">
            <Car className="w-10 h-10 text-lake mx-auto mb-3" />
            <h3 className="font-display text-white mb-1">Spotless Cars</h3>
            <p className="text-white/60 text-sm">Daily sanitized & well-maintained</p>
          </div>
        </div>
      </div>

      {/* 3. Rates Section - Season Toggle + Filters + Vehicle Cards */}
      <section className="mb-16">
        <h2 className="text-3xl md:text-4xl font-display text-ink mb-8 text-center">
          Our Rates & Fleet
        </h2>

        {/* Season Toggle with Date Ranges */}
        <div className="flex flex-col items-center mb-8 gap-4">
          <div className="bg-white/80 backdrop-blur border-3 border-ink rounded-xl p-2 inline-flex shadow-retro">
            <button
              onClick={() => setShowSeasonPricing(false)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                !showSeasonPricing
                  ? 'bg-sunshine text-ink shadow-retro'
                  : 'text-ink/60 hover:text-ink'
              }`}
            >
              Off-Season Rates
            </button>
            <button
              onClick={() => setShowSeasonPricing(true)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                showSeasonPricing
                  ? 'bg-sunshine text-ink shadow-retro'
                  : 'text-ink/60 hover:text-ink'
              }`}
            >
              Peak Season Rates
            </button>
          </div>

          {/* Season Date Ranges */}
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            {seasonData.offSeason && (
              <div className="bg-white/60 backdrop-blur border-2 border-ink/20 rounded-lg px-4 py-2">
                <span className="font-semibold text-ink">Off-Season:</span>{' '}
                <span className="text-ink/70">
                  {new Date(seasonData.offSeason.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(seasonData.offSeason.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            )}
            {seasonData.peakSeason && (
              <div className="bg-white/60 backdrop-blur border-2 border-ink/20 rounded-lg px-4 py-2">
                <span className="font-semibold text-ink">Peak Season:</span>{' '}
                <span className="text-ink/70">
                  {new Date(seasonData.peakSeason.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(seasonData.peakSeason.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Current Season Indicator */}
        {currentSeason && (
          <div className="text-center mb-8">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Currently: {currentSeason.name}
            </Badge>
          </div>
        )}

        {/* Vehicle Type Filter */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {vehicleTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-6 py-3 rounded-xl font-semibold border-3 transition-all ${
                selectedType === type
                  ? 'bg-sunshine border-ink text-ink shadow-retro'
                  : 'bg-white border-ink/20 text-ink/60 hover:border-ink/40 hover:text-ink'
              }`}
            >
              {type === 'all' ? '🚙 All Vehicles' : VEHICLE_TYPE_INFO[type as keyof typeof VEHICLE_TYPE_INFO].icon + ' ' + VEHICLE_TYPE_INFO[type as keyof typeof VEHICLE_TYPE_INFO].displayName}
            </button>
          ))}
        </div>

        {/* Vehicle Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {Object.entries(VEHICLE_TYPE_INFO).map(([vehicleType, typeInfo]) => {
            const typeVehicles = vehiclesByType[vehicleType] || [];
            const pricing = pricingData[vehicleType];

            if (selectedType !== 'all' && selectedType !== vehicleType) return null;

            return (
              <div key={vehicleType} className="flex flex-col">
                {typeVehicles.length > 0 ? (
                  <VehicleCard
                    vehicle={typeVehicles[0]}
                    pricing={pricing}
                    showSeasonPricing={showSeasonPricing}
                    vehicleType={vehicleType}
                    typeInfo={typeInfo}
                  />
                ) : (
                  <div className="text-center py-12 bg-white/50 backdrop-blur border-3 border-ink rounded-xl">
                    <p className="text-ink/40">No vehicles available</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. SEO Content Section - MOVED DOWN */}
      <div className="max-w-4xl mx-auto mb-12 bg-white/80 backdrop-blur border-3 border-ink rounded-2xl p-8 shadow-retro">
        <h2 className="text-2xl md:text-3xl font-display text-ink mb-4">
          Why Book a Taxi for Your Complete Nainital Tour?
        </h2>
        <div className="space-y-4 text-ink/80 leading-relaxed">
          <p>
            Planning a trip to the beautiful hill station of Nainital? <strong>Nainital taxi rental</strong> services
            offer the perfect solution for exploring this scenic destination at your own pace. Unlike crowded buses or
            expensive individual cab rides, booking a <strong>taxi rental in Nainital</strong> for your complete tour
            ensures comfort, convenience, and value for money.
          </p>
          <p>
            Our <strong>Nainital taxi rental</strong> service provides well-maintained vehicles ranging from comfortable
            sedans to spacious SUVs, perfect for families and groups. With experienced local drivers who know every
            scenic route and hidden gem, your <strong>taxi rental in Nainital</strong> becomes more than just
            transportation—it&apos;s your gateway to an unforgettable hill station experience.
          </p>
          <p>
            Whether you&apos;re visiting Naini Lake, Naina Devi Temple, Snow View Point, or exploring nearby destinations
            like Bhimtal and Naukuchiatal, our <strong>Nainital taxi rental</strong> packages cover all major attractions.
            Enjoy hassle-free pickups from Kathgodam Railway Station or Pantnagar Airport, and travel in comfort with
            AC vehicles, music systems, and child seats available on request.
          </p>
        </div>
      </div>

      {/* 5. FAQs Section */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-display text-ink mb-8 text-center">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {/* FAQ 1 */}
          <details className="bg-white/80 backdrop-blur border-3 border-ink rounded-xl p-6 shadow-retro group">
            <summary className="font-bold text-lg cursor-pointer text-ink flex justify-between items-center">
              What types of vehicles are available for taxi rental in Nainital?
              <span className="text-2xl group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-4 text-ink/70 leading-relaxed">
              We offer a diverse range of vehicles for Nainital taxi rental including comfortable sedans (Dzire, Amaze),
              spacious SUVs (Ertiga, Innova), and luxury vehicles (Innova Crysta). All vehicles are well-maintained,
              air-conditioned, and come with experienced local drivers who know the best routes in Nainital.
            </p>
          </details>

          {/* FAQ 2 */}
          <details className="bg-white/80 backdrop-blur border-3 border-ink rounded-xl p-6 shadow-retro group">
            <summary className="font-bold text-lg cursor-pointer text-ink flex justify-between items-center">
              How much does a taxi rental in Nainital cost?
              <span className="text-2xl group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-4 text-ink/70 leading-relaxed">
              Our Nainital taxi rental prices vary based on vehicle type and season. Sedans start from ₹2,000,
              SUVs from ₹2,500, and luxury vehicles from ₹4,500 for a full day tour. We have special off-season rates
              and peak season rates. Use our season toggle above to see current pricing for your travel dates.
            </p>
          </details>

          {/* FAQ 3 */}
          <details className="bg-white/80 backdrop-blur border-3 border-ink rounded-xl p-6 shadow-retro group">
            <summary className="font-bold text-lg cursor-pointer text-ink flex justify-between items-center">
              Can I book a taxi for multiple days in Nainital?
              <span className="text-2xl group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-4 text-ink/70 leading-relaxed">
              Yes! We offer multi-day taxi rental packages for extended Nainital tours. Whether you want to explore
              Nainital and nearby destinations like Bhimtal, Naukuchiatal, or Ranikhet over 2-3 days, we can customize
              a package for you. Contact us via WhatsApp or phone for personalized multi-day itineraries and special rates.
            </p>
          </details>

          {/* FAQ 4 */}
          <details className="bg-white/80 backdrop-blur border-3 border-ink rounded-xl p-6 shadow-retro group">
            <summary className="font-bold text-lg cursor-pointer text-ink flex justify-between items-center">
              Do you provide pickup from Kathgodam Railway Station or Pantnagar Airport?
              <span className="text-2xl group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-4 text-ink/70 leading-relaxed">
              Absolutely! We provide comfortable pickup and drop services from Kathgodam Railway Station (35 km) and
              Pantnagar Airport (70 km) to Nainital and surrounding areas. Our drivers track your train/flight arrival
              and ensure timely pickup. Advance booking is recommended, especially during peak season.
            </p>
          </details>

          {/* FAQ 5 */}
          <details className="bg-white/80 backdrop-blur border-3 border-ink rounded-xl p-6 shadow-retro group">
            <summary className="font-bold text-lg cursor-pointer text-ink flex justify-between items-center">
              Are child seats available in your taxi rental vehicles?
              <span className="text-2xl group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-4 text-ink/70 leading-relaxed">
              Yes, child seats are available on request for families traveling with young children. Please mention
              your requirement while booking so we can ensure the child seat is installed in your vehicle. Safety
              is our priority, and we want to make your Nainital family trip comfortable and secure.
            </p>
          </details>

          {/* FAQ 6 */}
          <details className="bg-white/80 backdrop-blur border-3 border-ink rounded-xl p-6 shadow-retro group">
            <summary className="font-bold text-lg cursor-pointer text-ink flex justify-between items-center">
              What is the difference between peak season and off-season rates?
              <span className="text-2xl group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-4 text-ink/70 leading-relaxed">
              Peak season in Nainital (typically April-June and October-November) sees higher demand due to pleasant
              weather and holidays, resulting in increased rates. Off-season offers better prices and less crowded
              attractions. Check the season dates displayed above to plan your trip and get the best taxi rental rates
              for your Nainital visit.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}

interface VehicleCardProps {
  vehicle: Vehicle;
  pricing: PricingData | undefined;
  showSeasonPricing: boolean;
  vehicleType: string;
  typeInfo: typeof VEHICLE_TYPE_INFO[keyof typeof VEHICLE_TYPE_INFO];
}

// Memoized VehicleCard component
const VehicleCard = memo(function VehicleCard({ vehicle, pricing, showSeasonPricing, vehicleType, typeInfo }: VehicleCardProps) {
  const isAvailable = vehicle.status === 'available';
  const currentPrice = showSeasonPricing ? pricing?.seasonPrice : pricing?.offSeasonPrice;

  return (
    <Card className="overflow-hidden hover:rotate-1 transition-transform duration-300 group h-full flex flex-col">
      <CardHeader className="p-0 relative">
        {/* Vehicle Image */}
        <div className="aspect-[4/3] relative bg-gradient-to-br from-sunrise to-lake">
          {vehicle.featured_image_url ? (
            <Image
              src={vehicle.featured_image_url}
              alt={vehicle.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className="object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-8xl">{typeInfo.icon}</span>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <Badge variant={isAvailable ? 'available' : 'secondary'}>
              {isAvailable ? '✓ Available' : vehicle.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 flex-grow">
        {/* Vehicle Type Name */}
        <h3 className="text-2xl font-display text-ink mb-1">
          {typeInfo.icon} {typeInfo.displayName}
        </h3>
        <p className="text-sm text-ink/60 mb-4">{typeInfo.subtitle}</p>

        {/* Tagline/Personality */}
        {vehicle.tagline && (
          <p className="text-sm italic text-ink/70 mb-4 border-l-3 border-sunshine pl-3">
            &quot;{vehicle.tagline}&quot;
          </p>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-teal" />
            <span>{vehicle.capacity || typeInfo.defaultCapacity} seater</span>
          </div>

          {vehicle.luggage_capacity && (
            <div className="flex items-center gap-2 text-sm">
              <Luggage className="h-4 w-4 text-teal" />
              <span>{vehicle.luggage_capacity} bags</span>
            </div>
          )}

          {vehicle.has_ac && (
            <div className="flex items-center gap-2 text-sm">
              <Wind className="h-4 w-4 text-teal" />
              <span>AC</span>
            </div>
          )}

          {vehicle.has_music_system && (
            <div className="flex items-center gap-2 text-sm">
              <Music className="h-4 w-4 text-teal" />
              <span>Music</span>
            </div>
          )}

          {vehicle.has_child_seat && (
            <div className="flex items-center gap-2 text-sm">
              <Baby className="h-4 w-4 text-teal" />
              <span>Child Seat</span>
            </div>
          )}
        </div>

        {/* Pricing */}
        {currentPrice && (
          <div className="bg-gradient-to-r from-sunrise/50 to-lake/50 rounded-lg p-3 mb-4">
            <p className="text-xs text-ink/60 mb-1">Starting from</p>
            <p className="text-2xl font-bold text-teal">₹{currentPrice.toLocaleString()}</p>
            <p className="text-xs text-ink/50">per trip</p>
          </div>
        )}

        {/* Stats */}
        {vehicle.total_trips > 0 && (
          <div className="flex items-center gap-4 text-xs text-ink/50 border-t border-ink/10 pt-3">
            <span>🎯 {vehicle.total_trips} trips</span>
            {vehicle.total_kilometers > 0 && (
              <span>📍 {vehicle.total_kilometers.toLocaleString()} km</span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-6 pt-0 mt-auto">
        <Link href={`/booking?vehicle=${vehicleType}`} className="w-full">
          <Button className="w-full group" disabled={!isAvailable}>
            {isAvailable ? (
              <>
                Book Now
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            ) : (
              'Currently Unavailable'
            )}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
});
