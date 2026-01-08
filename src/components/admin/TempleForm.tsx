"use client";

import React, { useState } from "react";
import {
  Save,
  MapPin,
  Church,
  FileText,
  DollarSign,
  Image,
  Clock,
  Navigation,
  Calendar,
  Lightbulb,
  Star,
  MessageSquare,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
} from "lucide-react";
import { Temple, TemplePricing, VehicleType, TempleTimings, HowToReach, SeasonalEvent, CustomSection, TempleFAQ, TaxiCta } from "@/lib/supabase/types";

interface TempleFormProps {
  initialData?: (Temple & { pricing?: TemplePricing[]; faqs?: TempleFAQ[] }) | null;
  onSubmit: (data: Partial<Temple & { pricing: Partial<TemplePricing>[]; faqs: Partial<TempleFAQ>[] }>) => Promise<void>;
  isSubmitting: boolean;
  categories: Array<{ id: string; category_name: string }>;
}

const VEHICLE_TYPES: VehicleType[] = ["sedan", "suv_normal", "suv_deluxe", "suv_luxury"];
const SEASON_NAMES = ["Off-Season", "Season"] as const;

const DISTRICTS = [
  "Nainital",
  "Almora",
  "Champawat",
  "Bageshwar",
  "Pithoragarh",
  "Udham Singh Nagar",
];

const TEMPLE_TYPES = [
  "Shiva",
  "Shakti",
  "Ashram",
  "Heritage",
  "Local",
  "Pilgrimage",
];

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function TempleForm({ initialData, onSubmit, isSubmitting, categories }: TempleFormProps) {
  // Basic Information
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || "");
  const [district, setDistrict] = useState(initialData?.district || DISTRICTS[0]);
  const [templeType, setTempleType] = useState(initialData?.temple_type || TEMPLE_TYPES[0]);
  const [categoryId, setCategoryId] = useState(initialData?.category_id || "");

  // Location
  const [locationAddress, setLocationAddress] = useState(initialData?.location_address || "");
  const [nearestCity, setNearestCity] = useState(initialData?.nearest_city || "");
  const [altitude, setAltitude] = useState(initialData?.altitude?.toString() || "");
  const [latitude, setLatitude] = useState(initialData?.latitude?.toString() || "");
  const [longitude, setLongitude] = useState(initialData?.longitude?.toString() || "");
  const [googleMapsEmbedUrl, setGoogleMapsEmbedUrl] = useState(initialData?.google_maps_embed_url || "");
  const [distanceFromNainital, setDistanceFromNainital] = useState(initialData?.distance_from_nainital?.toString() || "");
  const [distanceFromKathgodam, setDistanceFromKathgodam] = useState(initialData?.distance_from_kathgodam?.toString() || "");

  // SEO
  const [pageTitle, setPageTitle] = useState(initialData?.page_title || "");
  const [metaDescription, setMetaDescription] = useState(initialData?.meta_description || "");
  const [keywords, setKeywords] = useState((initialData?.keywords || []).join(", "));

  // Media
  const [featuredImageUrl, setFeaturedImageUrl] = useState(initialData?.featured_image_url || "");
  const [heroImages, setHeroImages] = useState((initialData?.hero_images || []).join("\n"));
  const [videoEmbedUrl, setVideoEmbedUrl] = useState(initialData?.video_embed_url || "");
  const [galleryImages, setGalleryImages] = useState((initialData?.gallery_images || []).join("\n"));

  // Content
  const [introText, setIntroText] = useState(initialData?.intro_text || "");
  const [history, setHistory] = useState(initialData?.history || "");
  const [significance, setSignificance] = useState(initialData?.significance || "");
  const [highlights, setHighlights] = useState((initialData?.highlights || []).join("\n"));

  // Temple Details
  const [timings, setTimings] = useState<TempleTimings>(
    initialData?.timings || {
      openTime: "",
      closeTime: "",
      poojaTimings: [],
      closedDays: [],
      specialNote: "",
    }
  );

  const [howToReach, setHowToReach] = useState<HowToReach>(
    initialData?.how_to_reach || {
      fromNainital: "",
      fromKathgodam: "",
      fromPantnagar: "",
      fromDelhi: "",
      nearestRailway: "",
      nearestAirport: "",
    }
  );

  // Visiting Information
  const [bestTimeToVisit, setBestTimeToVisit] = useState(initialData?.best_time_to_visit || "");
  const [seasonalEvents, setSeasonalEvents] = useState<SeasonalEvent[]>(initialData?.seasonal_events || []);
  const [pilgrimageTips, setPilgrimageTips] = useState((initialData?.pilgrimage_tips || []).join("\n"));
  const [accommodationInfo, setAccommodationInfo] = useState(initialData?.accommodation_info || "");
  const [entryFee, setEntryFee] = useState(initialData?.entry_fee || "");

  // Custom Sections
  const [customSections, setCustomSections] = useState<CustomSection[]>(initialData?.custom_sections || []);

  // Taxi CTA
  const [taxiCta, setTaxiCta] = useState<TaxiCta>(
    initialData?.taxi_cta || {
      heading: "",
      subheading: "",
      primaryRouteId: "",
    }
  );

  // Status
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(initialData?.is_featured ?? false);
  const [showOnHomepage, setShowOnHomepage] = useState(initialData?.show_on_homepage ?? false);
  const [popularity, setPopularity] = useState(initialData?.popularity?.toString() || "50");
  const [displayOrder, setDisplayOrder] = useState(initialData?.display_order?.toString() || "0");

  // Pricing
  const initializePricing = (): Partial<TemplePricing>[] => {
    if (initialData?.pricing && initialData.pricing.length > 0) {
      return initialData.pricing;
    }
    const defaultPricing: Partial<TemplePricing>[] = [];
    VEHICLE_TYPES.forEach((vehicleType) => {
      SEASON_NAMES.forEach((seasonName) => {
        defaultPricing.push({
          vehicle_type: vehicleType,
          season_name: seasonName,
          price: 0,
          round_trip_price: 0,
          waiting_charges: "",
        });
      });
    });
    return defaultPricing;
  };

  const [pricing, setPricing] = useState<Partial<TemplePricing>[]>(initializePricing());

  // FAQs
  const [faqs, setFaqs] = useState<Partial<TempleFAQ>[]>(
    initialData?.faqs || []
  );

  const handleNameChange = (value: string) => {
    setName(value);
    if (!initialData) {
      setSlug(generateSlug(value));
    }
  };

  const handlePriceChange = (vehicleType: VehicleType, seasonName: string, field: 'price' | 'round_trip_price', value: string) => {
    setPricing((prev) =>
      prev.map((p) =>
        p.vehicle_type === vehicleType && p.season_name === seasonName
          ? { ...p, [field]: parseInt(value) || 0 }
          : p
      )
    );
  };

  const handleWaitingChargesChange = (vehicleType: VehicleType, seasonName: string, value: string) => {
    setPricing((prev) =>
      prev.map((p) =>
        p.vehicle_type === vehicleType && p.season_name === seasonName
          ? { ...p, waiting_charges: value }
          : p
      )
    );
  };

  // Seasonal Events handlers
  const addSeasonalEvent = () => {
    setSeasonalEvents([...seasonalEvents, { eventName: "", timing: "", description: "" }]);
  };

  const removeSeasonalEvent = (index: number) => {
    setSeasonalEvents(seasonalEvents.filter((_, i) => i !== index));
  };

  const updateSeasonalEvent = (index: number, field: keyof SeasonalEvent, value: string) => {
    setSeasonalEvents(
      seasonalEvents.map((event, i) =>
        i === index ? { ...event, [field]: value } : event
      )
    );
  };

  // Custom Sections handlers
  const addCustomSection = () => {
    setCustomSections([...customSections, { title: "", content: "", imageUrl: "" }]);
  };

  const removeCustomSection = (index: number) => {
    setCustomSections(customSections.filter((_, i) => i !== index));
  };

  const updateCustomSection = (index: number, field: keyof CustomSection, value: string) => {
    setCustomSections(
      customSections.map((section, i) =>
        i === index ? { ...section, [field]: value } : section
      )
    );
  };

  const moveCustomSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...customSections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setCustomSections(newSections);
  };

  // FAQs handlers
  const addFaq = () => {
    setFaqs([...faqs, { question: "", answer: "", is_active: true, display_order: faqs.length }]);
  };

  const removeFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    setFaqs(
      faqs.map((faq, i) =>
        i === index ? { ...faq, [field]: value } : faq
      )
    );
  };

  const moveFaq = (index: number, direction: 'up' | 'down') => {
    const newFaqs = [...faqs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFaqs.length) return;
    [newFaqs[index], newFaqs[targetIndex]] = [newFaqs[targetIndex], newFaqs[index]];
    setFaqs(newFaqs.map((faq, i) => ({ ...faq, display_order: i })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !district || !templeType) {
      alert("Name, district, and temple type are required");
      return;
    }

    await onSubmit({
      name,
      slug,
      subtitle: subtitle || null,
      district,
      temple_type: templeType,
      category_id: categoryId || null,
      location_address: locationAddress || null,
      nearest_city: nearestCity || null,
      altitude: altitude ? Number(altitude) : null,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      google_maps_embed_url: googleMapsEmbedUrl || null,
      distance_from_nainital: distanceFromNainital ? Number(distanceFromNainital) : null,
      distance_from_kathgodam: distanceFromKathgodam ? Number(distanceFromKathgodam) : null,
      page_title: pageTitle || null,
      meta_description: metaDescription || null,
      keywords: keywords ? keywords.split(",").map((k) => k.trim()) : null,
      featured_image_url: featuredImageUrl || null,
      hero_images: heroImages ? heroImages.split("\n").filter((url) => url.trim()) : null,
      video_embed_url: videoEmbedUrl || null,
      gallery_images: galleryImages ? galleryImages.split("\n").filter((url) => url.trim()) : null,
      intro_text: introText || null,
      history: history || null,
      significance: significance || null,
      highlights: highlights ? highlights.split("\n").filter((h) => h.trim()) : null,
      timings: timings.openTime || timings.closeTime ? timings : null,
      how_to_reach: howToReach.fromNainital || howToReach.fromKathgodam ? howToReach : null,
      best_time_to_visit: bestTimeToVisit || null,
      seasonal_events: seasonalEvents.length > 0 ? seasonalEvents : null,
      pilgrimage_tips: pilgrimageTips ? pilgrimageTips.split("\n").filter((t) => t.trim()) : null,
      accommodation_info: accommodationInfo || null,
      entry_fee: entryFee || null,
      custom_sections: customSections.length > 0 ? customSections : null,
      taxi_cta: taxiCta.heading || taxiCta.subheading ? taxiCta : null,
      is_active: isActive,
      is_featured: isFeatured,
      show_on_homepage: showOnHomepage,
      popularity: Number(popularity),
      display_order: Number(displayOrder),
      pricing: pricing.filter((p) => p.price && p.price > 0),
      faqs: faqs.filter((f) => f.question && f.answer),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4 flex items-center gap-2">
          <Church className="w-6 h-6 text-coral" />
          Basic Information
        </h2>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                Temple Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                Slug (URL)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                placeholder="auto-generated"
              />
            </div>
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Subtitle / Tagline
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
              placeholder="e.g., Ancient Shiva Temple in the Himalayas"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                District *
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                required
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                Temple Type *
              </label>
              <select
                value={templeType}
                onChange={(e) => setTempleType(e.target.value)}
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                required
              >
                {TEMPLE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                Category (Optional)
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
              >
                <option value="">No Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Location Details */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-lake" />
          Location Details
        </h2>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                Address
              </label>
              <input
                type="text"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                placeholder="Village, Tehsil, District"
              />
            </div>

            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                Nearest City
              </label>
              <input
                type="text"
                value={nearestCity}
                onChange={(e) => setNearestCity(e.target.value)}
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                Altitude (meters)
              </label>
              <input
                type="number"
                value={altitude}
                onChange={(e) => setAltitude(e.target.value)}
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                placeholder="1938"
              />
            </div>

            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                Distance from Nainital (km)
              </label>
              <input
                type="number"
                value={distanceFromNainital}
                onChange={(e) => setDistanceFromNainital(e.target.value)}
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                Distance from Kathgodam (km)
              </label>
              <input
                type="number"
                value={distanceFromKathgodam}
                onChange={(e) => setDistanceFromKathgodam(e.target.value)}
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                Latitude
              </label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                placeholder="29.3803"
              />
            </div>

            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                Longitude
              </label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                placeholder="79.4636"
              />
            </div>
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Google Maps Embed URL
            </label>
            <input
              type="text"
              value={googleMapsEmbedUrl}
              onChange={(e) => setGoogleMapsEmbedUrl(e.target.value)}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
              placeholder="https://www.google.com/maps/embed?pb=..."
            />
          </div>
        </div>
      </div>

      {/* Media Section */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4 flex items-center gap-2">
          <Image className="w-6 h-6 text-sunshine" />
          Media
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Featured Image URL
            </label>
            <input
              type="text"
              value={featuredImageUrl}
              onChange={(e) => setFeaturedImageUrl(e.target.value)}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
              placeholder="https://example.com/temple.jpg"
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Hero Slider Images (one URL per line)
            </label>
            <textarea
              value={heroImages}
              onChange={(e) => setHeroImages(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
              placeholder="https://example.com/hero1.jpg&#10;https://example.com/hero2.jpg"
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Video Embed URL (YouTube/Vimeo)
            </label>
            <input
              type="text"
              value={videoEmbedUrl}
              onChange={(e) => setVideoEmbedUrl(e.target.value)}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
              placeholder="https://www.youtube.com/embed/..."
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Gallery Images (one URL per line)
            </label>
            <textarea
              value={galleryImages}
              onChange={(e) => setGalleryImages(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6 text-coral" />
          Content
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Introduction Text
            </label>
            <textarea
              value={introText}
              onChange={(e) => setIntroText(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
              placeholder="Brief introduction about the temple..."
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              History
            </label>
            <textarea
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
              placeholder="Historical background and stories..."
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Significance
            </label>
            <textarea
              value={significance}
              onChange={(e) => setSignificance(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
              placeholder="Spiritual and cultural significance..."
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Highlights (one per line)
            </label>
            <textarea
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
              placeholder="Ancient Shiva temple&#10;Panoramic Himalayan views&#10;Peaceful meditation spot"
            />
          </div>
        </div>
      </div>

      {/* Temple Timings */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4 flex items-center gap-2">
          <Clock className="w-6 h-6 text-lake" />
          Temple Timings
        </h2>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                Opening Time
              </label>
              <input
                type="text"
                value={timings.openTime}
                onChange={(e) => setTimings({ ...timings, openTime: e.target.value })}
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                placeholder="05:00 AM"
              />
            </div>

            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                Closing Time
              </label>
              <input
                type="text"
                value={timings.closeTime}
                onChange={(e) => setTimings({ ...timings, closeTime: e.target.value })}
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                placeholder="09:00 PM"
              />
            </div>
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Pooja Timings (one per line)
            </label>
            <textarea
              value={(timings.poojaTimings || []).join("\n")}
              onChange={(e) =>
                setTimings({
                  ...timings,
                  poojaTimings: e.target.value.split("\n").filter((t) => t.trim()),
                })
              }
              rows={3}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
              placeholder="Morning Aarti: 06:00 AM&#10;Evening Aarti: 07:00 PM"
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Closed Days (one per line)
            </label>
            <textarea
              value={(timings.closedDays || []).join("\n")}
              onChange={(e) =>
                setTimings({
                  ...timings,
                  closedDays: e.target.value.split("\n").filter((d) => d.trim()),
                })
              }
              rows={2}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
              placeholder="None&#10;or Monday"
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Special Note
            </label>
            <input
              type="text"
              value={timings.specialNote}
              onChange={(e) => setTimings({ ...timings, specialNote: e.target.value })}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
              placeholder="Temple closes during heavy snowfall"
            />
          </div>
        </div>
      </div>

      {/* How to Reach */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4 flex items-center gap-2">
          <Navigation className="w-6 h-6 text-coral" />
          How to Reach
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              From Nainital
            </label>
            <textarea
              value={howToReach.fromNainital}
              onChange={(e) => setHowToReach({ ...howToReach, fromNainital: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
              placeholder="Detailed directions from Nainital..."
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              From Kathgodam
            </label>
            <textarea
              value={howToReach.fromKathgodam}
              onChange={(e) => setHowToReach({ ...howToReach, fromKathgodam: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                From Pantnagar
              </label>
              <textarea
                value={howToReach.fromPantnagar}
                onChange={(e) => setHowToReach({ ...howToReach, fromPantnagar: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                From Delhi
              </label>
              <textarea
                value={howToReach.fromDelhi}
                onChange={(e) => setHowToReach({ ...howToReach, fromDelhi: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                Nearest Railway Station
              </label>
              <input
                type="text"
                value={howToReach.nearestRailway}
                onChange={(e) => setHowToReach({ ...howToReach, nearestRailway: e.target.value })}
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                placeholder="Kathgodam Railway Station (35 km)"
              />
            </div>

            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                Nearest Airport
              </label>
              <input
                type="text"
                value={howToReach.nearestAirport}
                onChange={(e) => setHowToReach({ ...howToReach, nearestAirport: e.target.value })}
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                placeholder="Pantnagar Airport (70 km)"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Visiting Information */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-sunshine" />
          Visiting Information
        </h2>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                Best Time to Visit
              </label>
              <input
                type="text"
                value={bestTimeToVisit}
                onChange={(e) => setBestTimeToVisit(e.target.value)}
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                placeholder="April to June, September to November"
              />
            </div>

            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                Entry Fee
              </label>
              <input
                type="text"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                placeholder="Free / Rs. 20"
              />
            </div>
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Pilgrimage Tips (one per line)
            </label>
            <textarea
              value={pilgrimageTips}
              onChange={(e) => setPilgrimageTips(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
              placeholder="Wear modest clothing&#10;Remove shoes before entering&#10;Photography may be restricted"
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Accommodation Information
            </label>
            <textarea
              value={accommodationInfo}
              onChange={(e) => setAccommodationInfo(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
              placeholder="Dharamshala available, hotels in nearby town..."
            />
          </div>
        </div>
      </div>

      {/* Seasonal Events */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-ink flex items-center gap-2">
            <Star className="w-6 h-6 text-sunshine" />
            Seasonal Events & Festivals
          </h2>
          <button
            type="button"
            onClick={addSeasonalEvent}
            className="px-4 py-2 bg-sunshine text-ink rounded-xl border-3 border-ink shadow-retro-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>

        {seasonalEvents.length === 0 ? (
          <p className="text-ink/40 font-body text-center py-8">
            No seasonal events added yet
          </p>
        ) : (
          <div className="space-y-4">
            {seasonalEvents.map((event, index) => (
              <div
                key={index}
                className="p-4 border-2 border-ink/20 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-ink">Event {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeSeasonalEvent(index)}
                    className="text-coral hover:text-coral/80"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-body text-sm text-ink/60 mb-1">
                      Event Name
                    </label>
                    <input
                      type="text"
                      value={event.eventName}
                      onChange={(e) =>
                        updateSeasonalEvent(index, "eventName", e.target.value)
                      }
                      className="w-full px-3 py-2 border-2 border-ink rounded-lg font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                      placeholder="Maha Shivaratri"
                    />
                  </div>

                  <div>
                    <label className="block font-body text-sm text-ink/60 mb-1">
                      Timing
                    </label>
                    <input
                      type="text"
                      value={event.timing}
                      onChange={(e) =>
                        updateSeasonalEvent(index, "timing", e.target.value)
                      }
                      className="w-full px-3 py-2 border-2 border-ink rounded-lg font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                      placeholder="February/March"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-body text-sm text-ink/60 mb-1">
                    Description
                  </label>
                  <textarea
                    value={event.description}
                    onChange={(e) =>
                      updateSeasonalEvent(index, "description", e.target.value)
                    }
                    rows={2}
                    className="w-full px-3 py-2 border-2 border-ink rounded-lg font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                    placeholder="Details about the event..."
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Sections */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-ink flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-coral" />
            Custom Content Sections
          </h2>
          <button
            type="button"
            onClick={addCustomSection}
            className="px-4 py-2 bg-sunshine text-ink rounded-xl border-3 border-ink shadow-retro-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Section
          </button>
        </div>

        {customSections.length === 0 ? (
          <p className="text-ink/40 font-body text-center py-8">
            No custom sections added yet
          </p>
        ) : (
          <div className="space-y-4">
            {customSections.map((section, index) => (
              <div
                key={index}
                className="p-4 border-2 border-ink/20 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-ink">
                    Section {index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveCustomSection(index, "up")}
                      disabled={index === 0}
                      className="text-ink/40 hover:text-ink disabled:opacity-20"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCustomSection(index, "down")}
                      disabled={index === customSections.length - 1}
                      className="text-ink/40 hover:text-ink disabled:opacity-20"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCustomSection(index)}
                      className="text-coral hover:text-coral/80"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-body text-sm text-ink/60 mb-1">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) =>
                      updateCustomSection(index, "title", e.target.value)
                    }
                    className="w-full px-3 py-2 border-2 border-ink rounded-lg font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                    placeholder="Meditation and Yoga"
                  />
                </div>

                <div>
                  <label className="block font-body text-sm text-ink/60 mb-1">
                    Content
                  </label>
                  <textarea
                    value={section.content}
                    onChange={(e) =>
                      updateCustomSection(index, "content", e.target.value)
                    }
                    rows={4}
                    className="w-full px-3 py-2 border-2 border-ink rounded-lg font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                    placeholder="Detailed content for this section..."
                  />
                </div>

                <div>
                  <label className="block font-body text-sm text-ink/60 mb-1">
                    Image URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={section.imageUrl}
                    onChange={(e) =>
                      updateCustomSection(index, "imageUrl", e.target.value)
                    }
                    className="w-full px-3 py-2 border-2 border-ink rounded-lg font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                    placeholder="https://example.com/section-image.jpg"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pricing Table */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-lake" />
          Taxi Pricing from Nainital
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-3 border-ink rounded-xl overflow-hidden">
            <thead className="bg-sunshine/20">
              <tr className="border-b-3 border-ink">
                <th className="px-4 py-3 text-left font-display text-ink border-r-3 border-ink">
                  Vehicle Type
                </th>
                <th className="px-4 py-3 text-left font-display text-ink border-r-3 border-ink">
                  Season
                </th>
                <th className="px-4 py-3 text-left font-display text-ink border-r-3 border-ink">
                  One-way Price
                </th>
                <th className="px-4 py-3 text-left font-display text-ink border-r-3 border-ink">
                  Round Trip
                </th>
                <th className="px-4 py-3 text-left font-display text-ink">
                  Waiting Charges
                </th>
              </tr>
            </thead>
            <tbody>
              {VEHICLE_TYPES.map((vehicleType) =>
                SEASON_NAMES.map((seasonName) => {
                  const priceEntry = pricing.find(
                    (p) =>
                      p.vehicle_type === vehicleType &&
                      p.season_name === seasonName
                  );
                  return (
                    <tr
                      key={`${vehicleType}-${seasonName}`}
                      className="border-b-2 border-ink/10 hover:bg-sunshine/5"
                    >
                      <td className="px-4 py-3 font-body text-ink border-r-2 border-ink/10">
                        {vehicleType}
                      </td>
                      <td className="px-4 py-3 font-body text-ink/70 border-r-2 border-ink/10">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            seasonName === "Season"
                              ? "bg-coral/20 text-coral"
                              : "bg-lake/20 text-lake"
                          }`}
                        >
                          {seasonName}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-r-2 border-ink/10">
                        <input
                          type="number"
                          value={priceEntry?.price || ""}
                          onChange={(e) =>
                            handlePriceChange(vehicleType, seasonName, 'price', e.target.value)
                          }
                          className="w-24 px-2 py-1 border-2 border-ink rounded font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-3 border-r-2 border-ink/10">
                        <input
                          type="number"
                          value={priceEntry?.round_trip_price || ""}
                          onChange={(e) =>
                            handlePriceChange(vehicleType, seasonName, 'round_trip_price', e.target.value)
                          }
                          className="w-24 px-2 py-1 border-2 border-ink rounded font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={priceEntry?.waiting_charges || ""}
                          onChange={(e) =>
                            handleWaitingChargesChange(vehicleType, seasonName, e.target.value)
                          }
                          className="w-full px-2 py-1 border-2 border-ink rounded font-body focus:ring-2 focus:ring-sunshine focus:outline-none text-sm"
                          placeholder="Rs 100/hour"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-ink flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-lake" />
            Frequently Asked Questions
          </h2>
          <button
            type="button"
            onClick={addFaq}
            className="px-4 py-2 bg-sunshine text-ink rounded-xl border-3 border-ink shadow-retro-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add FAQ
          </button>
        </div>

        {faqs.length === 0 ? (
          <p className="text-ink/40 font-body text-center py-8">
            No FAQs added yet
          </p>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="p-4 border-2 border-ink/20 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-ink">FAQ {index + 1}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveFaq(index, "up")}
                      disabled={index === 0}
                      className="text-ink/40 hover:text-ink disabled:opacity-20"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveFaq(index, "down")}
                      disabled={index === faqs.length - 1}
                      className="text-ink/40 hover:text-ink disabled:opacity-20"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFaq(index)}
                      className="text-coral hover:text-coral/80"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-body text-sm text-ink/60 mb-1">
                    Question
                  </label>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => updateFaq(index, "question", e.target.value)}
                    className="w-full px-3 py-2 border-2 border-ink rounded-lg font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                    placeholder="What are the temple timings?"
                  />
                </div>

                <div>
                  <label className="block font-body text-sm text-ink/60 mb-1">
                    Answer
                  </label>
                  <textarea
                    value={faq.answer}
                    onChange={(e) => updateFaq(index, "answer", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border-2 border-ink rounded-lg font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                    placeholder="The temple is open from 5:00 AM to 9:00 PM..."
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEO Section */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6 text-sunshine" />
          SEO Settings
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Page Title
            </label>
            <input
              type="text"
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
              placeholder="Temple Name | Sacred Temple in Kumaon"
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Meta Description
            </label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
              placeholder="Visit the ancient temple in Kumaon. Book taxi services from Nainital..."
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Keywords (comma separated)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
              placeholder="temple, spiritual, kumaon, nainital"
            />
          </div>
        </div>
      </div>

      {/* Status & Display Settings */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4">
          Status & Display Settings
        </h2>

        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 rounded border-3 border-ink"
              />
              <label htmlFor="isActive" className="font-body text-ink">
                Active
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-5 h-5 rounded border-3 border-ink"
              />
              <label htmlFor="isFeatured" className="font-body text-ink">
                Featured
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showOnHomepage"
                checked={showOnHomepage}
                onChange={(e) => setShowOnHomepage(e.target.checked)}
                className="w-5 h-5 rounded border-3 border-ink"
              />
              <label htmlFor="showOnHomepage" className="font-body text-ink">
                Show on Homepage
              </label>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                Popularity (1-100)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={popularity}
                onChange={(e) => setPopularity(e.target.value)}
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                Display Order
              </label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="sticky bottom-6 z-10">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-8 py-4 bg-whatsapp text-white rounded-xl border-3 border-ink shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 font-display text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-6 h-6" />
          {isSubmitting ? "Saving..." : initialData ? "Update Temple" : "Create Temple"}
        </button>
      </div>
    </form>
  );
}
