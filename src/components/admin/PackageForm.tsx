"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  X,
  Image as ImageIcon,
  MapPin,
  Clock,
  Users,
  FileText,
  Calendar,
  Hotel,
  HelpCircle,
} from "lucide-react";
import ImageUploader, { GalleryWithNamesUploader } from "@/components/admin/ImageUploader";
import {
  Package,
  PackageType,
  DayPlan,
  HotelOption,
  PackageFAQ,
  TransferParagraph,
  TourItinerary,
  TransferContent,
  VehicleType,
  GalleryImage,
  DetailedAttraction,
  DetailedInclusionExclusion,
  BookingInstructions,
} from "@/lib/supabase/types";

interface PackageFormProps {
  initialData?: Package | null;
  onSubmit: (data: Partial<Package>) => Promise<void>;
  isSubmitting: boolean;
}

const VEHICLE_TYPES: VehicleType[] = ["sedan", "suv_normal", "suv_deluxe", "suv_luxury"];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function PackageForm({ initialData, onSubmit, isSubmitting }: PackageFormProps) {
  // Basic Info
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [type, setType] = useState<PackageType>(initialData?.type || "tour");
  const [duration, setDuration] = useState(initialData?.duration || "");
  const [distance, setDistance] = useState(initialData?.distance?.toString() || "");
  const [description, setDescription] = useState(initialData?.description || "");

  // Places & Details
  const [placesCovered, setPlacesCovered] = useState<string[]>(initialData?.places_covered || []);
  const [includes, setIncludes] = useState<string[]>(initialData?.includes || []);
  const [excludes, setExcludes] = useState<string[]>(initialData?.excludes || []);
  const [suitableFor, setSuitableFor] = useState<string[]>(initialData?.suitable_for || []);

  // Passengers
  const [minPassengers, setMinPassengers] = useState(initialData?.min_passengers?.toString() || "1");
  const [maxPassengers, setMaxPassengers] = useState(initialData?.max_passengers?.toString() || "");

  // Media
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || "");
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(
    initialData?.gallery_images ||
      (initialData?.gallery_urls?.map((url, idx) => ({
        url,
        name: `Image ${idx + 1}`,
      })) ?? [])
  );

  // Status
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [isPopular, setIsPopular] = useState(initialData?.is_popular ?? false);
  const [isSeasonal, setIsSeasonal] = useState(initialData?.is_seasonal ?? false);

  // SEO
  const [metaTitle, setMetaTitle] = useState(initialData?.meta_title || "");
  const [metaDescription, setMetaDescription] = useState(initialData?.meta_description || "");

  // Tour Itinerary
  const tourItinerary = initialData?.itinerary as TourItinerary | undefined;
  const [days, setDays] = useState<DayPlan[]>(tourItinerary?.days || []);
  const [hotelOptions, setHotelOptions] = useState<HotelOption[]>(tourItinerary?.hotel_options || []);
  const [faqs, setFaqs] = useState<PackageFAQ[]>(tourItinerary?.faqs || []);

  // Transfer Content
  const transferContent = initialData?.itinerary as TransferContent | undefined;
  const [transferParagraphs, setTransferParagraphs] = useState<TransferParagraph[]>(
    transferContent?.paragraphs || [
      { title: "", content: "" },
      { title: "", content: "" },
    ]
  );
  const [transferFaqs, setTransferFaqs] = useState<PackageFAQ[]>(transferContent?.faqs || []);

  // NEW: Detailed Features (shared between tour and transfer)
  const itineraryData = (initialData?.itinerary as TourItinerary | TransferContent) || {};
  const [detailedAttractions, setDetailedAttractions] = useState<DetailedAttraction[]>(
    itineraryData.detailed_attractions || []
  );
  const [itineraryFlexibilityNote, setItineraryFlexibilityNote] = useState(
    itineraryData.itinerary_flexibility_note || ""
  );
  const [detailedIncludes, setDetailedIncludes] = useState<DetailedInclusionExclusion[]>(
    itineraryData.detailed_includes || []
  );
  const [detailedExcludes, setDetailedExcludes] = useState<DetailedInclusionExclusion[]>(
    itineraryData.detailed_excludes || []
  );
  const [bookingInstructions, setBookingInstructions] = useState<BookingInstructions>(
    itineraryData.booking_instructions || {
      steps: [
        { step_number: 1, title: "", description: "" },
        { step_number: 2, title: "", description: "" },
        { step_number: 3, title: "", description: "" },
      ],
      contact_phone: "",
      whatsapp_number: "",
      whatsapp_message: "",
      additional_notes: "",
    }
  );

  // Tag input helpers
  const [newPlace, setNewPlace] = useState("");
  const [newInclude, setNewInclude] = useState("");
  const [newExclude, setNewExclude] = useState("");
  const [newSuitable, setNewSuitable] = useState("");

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!initialData) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const itinerary =
      type === "tour"
        ? {
            days,
            hotel_options: hotelOptions,
            faqs,
            detailed_attractions: detailedAttractions.length > 0 ? detailedAttractions : undefined,
            itinerary_flexibility_note: itineraryFlexibilityNote || undefined,
            detailed_includes: detailedIncludes.length > 0 ? detailedIncludes : undefined,
            detailed_excludes: detailedExcludes.length > 0 ? detailedExcludes : undefined,
            booking_instructions:
              bookingInstructions.steps.some((s) => s.title || s.description)
                ? bookingInstructions
                : undefined,
          }
        : {
            paragraphs: transferParagraphs,
            faqs: transferFaqs,
            detailed_attractions: detailedAttractions.length > 0 ? detailedAttractions : undefined,
            itinerary_flexibility_note: itineraryFlexibilityNote || undefined,
            detailed_includes: detailedIncludes.length > 0 ? detailedIncludes : undefined,
            detailed_excludes: detailedExcludes.length > 0 ? detailedExcludes : undefined,
            booking_instructions:
              bookingInstructions.steps.some((s) => s.title || s.description)
                ? bookingInstructions
                : undefined,
          };

    await onSubmit({
      title,
      slug,
      type,
      duration: duration || null,
      distance: distance ? Number(distance) : null,
      description: description || null,
      places_covered: placesCovered.length > 0 ? placesCovered : null,
      includes: includes.length > 0 ? includes : null,
      excludes: excludes.length > 0 ? excludes : null,
      suitable_for: suitableFor.length > 0 ? suitableFor : null,
      min_passengers: Number(minPassengers) || 1,
      max_passengers: maxPassengers ? Number(maxPassengers) : null,
      image_url: imageUrl || null,
      gallery_images: galleryImages.length > 0 ? galleryImages : null,
      is_active: isActive,
      is_popular: isPopular,
      is_seasonal: isSeasonal,
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      itinerary,
    });
  };

  // Day Management
  const addDay = () => {
    setDays([
      ...days,
      {
        day_number: days.length + 1,
        title: "",
        description: "",
        highlights: [],
        meals_included: [],
        overnight_stay: "",
      },
    ]);
  };

  const updateDay = (index: number, updates: Partial<DayPlan>) => {
    setDays(days.map((d, i) => (i === index ? { ...d, ...updates } : d)));
  };

  const removeDay = (index: number) => {
    setDays(
      days
        .filter((_, i) => i !== index)
        .map((d, i) => ({ ...d, day_number: i + 1 }))
    );
  };

  const moveDay = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= days.length) return;

    const newDays = [...days];
    [newDays[index], newDays[newIndex]] = [newDays[newIndex], newDays[index]];
    setDays(newDays.map((d, i) => ({ ...d, day_number: i + 1 })));
  };

  // Hotel Option Management
  const addHotelOption = () => {
    setHotelOptions([
      ...hotelOptions,
      {
        id: Date.now().toString(),
        name: "",
        description: "",
        hotels_included: [],
        price_modifier: {
          sedan: 0,
          suv_normal: 0,
          suv_deluxe: 0,
          suv_luxury: 0,
        },
      },
    ]);
  };

  const updateHotelOption = (index: number, updates: Partial<HotelOption>) => {
    setHotelOptions(hotelOptions.map((h, i) => (i === index ? { ...h, ...updates } : h)));
  };

  const removeHotelOption = (index: number) => {
    setHotelOptions(hotelOptions.filter((_, i) => i !== index));
  };

  // FAQ Management (for tours)
  const addFaq = () => {
    setFaqs([...faqs, { question: "", answer: "" }]);
  };

  const updateFaq = (index: number, updates: Partial<PackageFAQ>) => {
    setFaqs(faqs.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const removeFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  // Transfer FAQ Management
  const addTransferFaq = () => {
    setTransferFaqs([...transferFaqs, { question: "", answer: "" }]);
  };

  const updateTransferFaq = (index: number, updates: Partial<PackageFAQ>) => {
    setTransferFaqs(transferFaqs.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const removeTransferFaq = (index: number) => {
    setTransferFaqs(transferFaqs.filter((_, i) => i !== index));
  };

  // NEW: Detailed Attraction Management
  const addAttraction = () => {
    setDetailedAttractions([
      ...detailedAttractions,
      {
        id: Date.now().toString(),
        order: detailedAttractions.length + 1,
        name: "",
        description: "",
        image_url: "",
        route_info: "",
        time_estimate: "",
        is_highlighted: false,
        badge_text: "",
      },
    ]);
  };

  const updateAttraction = (index: number, updates: Partial<DetailedAttraction>) => {
    setDetailedAttractions(detailedAttractions.map((a, i) => (i === index ? { ...a, ...updates } : a)));
  };

  const removeAttraction = (index: number) => {
    setDetailedAttractions(
      detailedAttractions.filter((_, i) => i !== index).map((a, i) => ({ ...a, order: i + 1 }))
    );
  };

  const moveAttraction = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= detailedAttractions.length) return;

    const newAttractions = [...detailedAttractions];
    [newAttractions[index], newAttractions[newIndex]] = [
      newAttractions[newIndex],
      newAttractions[index],
    ];
    setDetailedAttractions(newAttractions.map((a, i) => ({ ...a, order: i + 1 })));
  };

  // NEW: Detailed Inclusion Management
  const addDetailedInclude = () => {
    setDetailedIncludes([
      ...detailedIncludes,
      { item: "", description: "", icon: "", category: "" },
    ]);
  };

  const updateDetailedInclude = (index: number, updates: Partial<DetailedInclusionExclusion>) => {
    setDetailedIncludes(detailedIncludes.map((i, idx) => (idx === index ? { ...i, ...updates } : i)));
  };

  const removeDetailedInclude = (index: number) => {
    setDetailedIncludes(detailedIncludes.filter((_, i) => i !== index));
  };

  // NEW: Detailed Exclusion Management
  const addDetailedExclude = () => {
    setDetailedExcludes([
      ...detailedExcludes,
      { item: "", description: "", icon: "", category: "" },
    ]);
  };

  const updateDetailedExclude = (index: number, updates: Partial<DetailedInclusionExclusion>) => {
    setDetailedExcludes(detailedExcludes.map((e, idx) => (idx === index ? { ...e, ...updates } : e)));
  };

  const removeDetailedExclude = (index: number) => {
    setDetailedExcludes(detailedExcludes.filter((_, i) => i !== index));
  };

  // NEW: Booking Instructions Management
  const updateBookingStep = (
    index: number,
    updates: Partial<BookingInstructions["steps"][0]>
  ) => {
    const newSteps = bookingInstructions.steps.map((s, i) =>
      i === index ? { ...s, ...updates } : s
    );
    setBookingInstructions({ ...bookingInstructions, steps: newSteps });
  };

  const addBookingStep = () => {
    setBookingInstructions({
      ...bookingInstructions,
      steps: [
        ...bookingInstructions.steps,
        {
          step_number: bookingInstructions.steps.length + 1,
          title: "",
          description: "",
        },
      ],
    });
  };

  const removeBookingStep = (index: number) => {
    setBookingInstructions({
      ...bookingInstructions,
      steps: bookingInstructions.steps
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, step_number: i + 1 })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info Section */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Basic Information
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block font-body text-sm text-ink/60 mb-2">
              Package Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g., Nainital Darshan Package"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
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
              placeholder="nainital-darshan-package"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Package Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PackageType)}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            >
              <option value="tour">Tour Package</option>
              <option value="transfer">Transfer Route</option>
            </select>
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              <Clock className="inline w-4 h-4 mr-1" />
              Duration
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g., 2 Days 1 Night"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              <MapPin className="inline w-4 h-4 mr-1" />
              Distance (km)
            </label>
            <input
              type="number"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="e.g., 280"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-body text-sm text-ink/60 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the package..."
              rows={4}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine resize-none"
            />
          </div>
        </div>
      </div>

      {/* Places & Details Section */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Places & Details
        </h2>

        {/* Places Covered */}
        <div className="mb-4">
          <label className="block font-body text-sm text-ink/60 mb-2">
            Places Covered
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {placesCovered.map((place, i) => (
              <span
                key={i}
                className="flex items-center gap-1 px-3 py-1 bg-teal/20 border-2 border-teal rounded-full font-body text-sm"
              >
                {place}
                <button
                  type="button"
                  onClick={() => setPlacesCovered(placesCovered.filter((_, j) => j !== i))}
                  className="hover:text-coral"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPlace}
              onChange={(e) => setNewPlace(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (newPlace.trim()) {
                    setPlacesCovered([...placesCovered, newPlace.trim()]);
                    setNewPlace("");
                  }
                }
              }}
              placeholder="Add a place..."
              className="flex-1 px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
            <button
              type="button"
              onClick={() => {
                if (newPlace.trim()) {
                  setPlacesCovered([...placesCovered, newPlace.trim()]);
                  setNewPlace("");
                }
              }}
              className="px-4 py-2 bg-teal/20 border-2 border-teal rounded-xl font-body hover:bg-teal/30"
            >
              Add
            </button>
          </div>
        </div>

        {/* Includes */}
        <div className="mb-4">
          <label className="block font-body text-sm text-ink/60 mb-2">
            What&apos;s Included
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {includes.map((item, i) => (
              <span
                key={i}
                className="flex items-center gap-1 px-3 py-1 bg-whatsapp/20 border-2 border-whatsapp rounded-full font-body text-sm"
              >
                {item}
                <button
                  type="button"
                  onClick={() => setIncludes(includes.filter((_, j) => j !== i))}
                  className="hover:text-coral"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newInclude}
              onChange={(e) => setNewInclude(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (newInclude.trim()) {
                    setIncludes([...includes, newInclude.trim()]);
                    setNewInclude("");
                  }
                }
              }}
              placeholder="e.g., Driver, Fuel, Tolls..."
              className="flex-1 px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
            <button
              type="button"
              onClick={() => {
                if (newInclude.trim()) {
                  setIncludes([...includes, newInclude.trim()]);
                  setNewInclude("");
                }
              }}
              className="px-4 py-2 bg-whatsapp/20 border-2 border-whatsapp rounded-xl font-body hover:bg-whatsapp/30"
            >
              Add
            </button>
          </div>
        </div>

        {/* Excludes */}
        <div className="mb-4">
          <label className="block font-body text-sm text-ink/60 mb-2">
            What&apos;s Not Included
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {excludes.map((item, i) => (
              <span
                key={i}
                className="flex items-center gap-1 px-3 py-1 bg-coral/20 border-2 border-coral rounded-full font-body text-sm"
              >
                {item}
                <button
                  type="button"
                  onClick={() => setExcludes(excludes.filter((_, j) => j !== i))}
                  className="hover:text-coral"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newExclude}
              onChange={(e) => setNewExclude(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (newExclude.trim()) {
                    setExcludes([...excludes, newExclude.trim()]);
                    setNewExclude("");
                  }
                }
              }}
              placeholder="e.g., Meals, Entry tickets..."
              className="flex-1 px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
            <button
              type="button"
              onClick={() => {
                if (newExclude.trim()) {
                  setExcludes([...excludes, newExclude.trim()]);
                  setNewExclude("");
                }
              }}
              className="px-4 py-2 bg-coral/20 border-2 border-coral rounded-xl font-body hover:bg-coral/30"
            >
              Add
            </button>
          </div>
        </div>

        {/* Suitable For */}
        <div>
          <label className="block font-body text-sm text-ink/60 mb-2">
            Suitable For
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {suitableFor.map((item, i) => (
              <span
                key={i}
                className="flex items-center gap-1 px-3 py-1 bg-sunshine/50 border-2 border-ink rounded-full font-body text-sm"
              >
                {item}
                <button
                  type="button"
                  onClick={() => setSuitableFor(suitableFor.filter((_, j) => j !== i))}
                  className="hover:text-coral"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSuitable}
              onChange={(e) => setNewSuitable(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (newSuitable.trim()) {
                    setSuitableFor([...suitableFor, newSuitable.trim()]);
                    setNewSuitable("");
                  }
                }
              }}
              placeholder="e.g., Families, Couples, Solo..."
              className="flex-1 px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
            <button
              type="button"
              onClick={() => {
                if (newSuitable.trim()) {
                  setSuitableFor([...suitableFor, newSuitable.trim()]);
                  setNewSuitable("");
                }
              }}
              className="px-4 py-2 bg-sunshine/50 border-2 border-ink rounded-xl font-body hover:bg-sunshine/70"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Passengers Section */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Passenger Limits
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Minimum Passengers
            </label>
            <input
              type="number"
              value={minPassengers}
              onChange={(e) => setMinPassengers(e.target.value)}
              min="1"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>
          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Maximum Passengers (optional)
            </label>
            <input
              type="number"
              value={maxPassengers}
              onChange={(e) => setMaxPassengers(e.target.value)}
              placeholder="Leave empty for no limit"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>
        </div>
      </div>

      {/* Media Section */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Media
        </h2>

        {/* Featured Image Upload */}
        <div className="mb-6">
          <ImageUploader
            value={imageUrl}
            onChange={setImageUrl}
            folder="packages/featured"
            label="Featured Image (Hero)"
            recommendedSize="1920 x 1080"
            aspectRatio="16:9"
          />
        </div>

        {/* Gallery Images Upload */}
        <GalleryWithNamesUploader
          value={galleryImages}
          onChange={setGalleryImages}
          folder="packages/gallery"
          maxImages={10}
          recommendedSize="800 x 600"
          aspectRatio="4:3"
        />
      </div>

      {/* Status Section */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4">Status & Visibility</h2>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-ink accent-whatsapp"
            />
            <span className="font-body">Active (visible on website)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPopular}
              onChange={(e) => setIsPopular(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-ink accent-sunshine"
            />
            <span className="font-body">Mark as Popular</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isSeasonal}
              onChange={(e) => setIsSeasonal(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-ink accent-coral"
            />
            <span className="font-body">Seasonal Package</span>
          </label>
        </div>
      </div>

      {/* Tour-specific: Day-wise Itinerary */}
      {type === "tour" && (
        <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-ink flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Day-wise Itinerary
            </h2>
            <button
              type="button"
              onClick={addDay}
              className="flex items-center gap-2 px-3 py-2 bg-teal/20 border-2 border-teal rounded-xl font-body text-sm hover:bg-teal/30"
            >
              <Plus className="w-4 h-4" />
              Add Day
            </button>
          </div>

          {days.length === 0 ? (
            <div className="text-center py-8 text-ink/60 font-body">
              No days added yet. Click &quot;Add Day&quot; to start building the itinerary.
            </div>
          ) : (
            <div className="space-y-4">
              {days.map((day, index) => (
                <div key={index} className="border-3 border-ink/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-display text-lg text-ink">Day {day.day_number}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveDay(index, "up")}
                        disabled={index === 0}
                        className="p-1 hover:bg-sunrise/50 rounded disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDay(index, "down")}
                        disabled={index === days.length - 1}
                        className="p-1 hover:bg-sunrise/50 rounded disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeDay(index)}
                        className="p-1 hover:bg-coral/20 rounded text-coral"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <input
                      type="text"
                      value={day.title}
                      onChange={(e) => updateDay(index, { title: e.target.value })}
                      placeholder="Day title (e.g., Arrival & Nainital Sightseeing)"
                      className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
                    />
                    <div className="grid md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={day.time_start || ""}
                        onChange={(e) => updateDay(index, { time_start: e.target.value })}
                        placeholder="Start time (e.g., 06:00 AM)"
                        className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-sunshine"
                      />
                      <input
                        type="text"
                        value={day.time_end || ""}
                        onChange={(e) => updateDay(index, { time_end: e.target.value })}
                        placeholder="End time (e.g., 10:00 AM)"
                        className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-sunshine"
                      />
                    </div>
                    <textarea
                      value={day.description}
                      onChange={(e) => updateDay(index, { description: e.target.value })}
                      placeholder="Day description..."
                      rows={2}
                      className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-sunshine resize-none"
                    />
                    <div className="grid md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={day.highlights?.join(", ") || ""}
                        onChange={(e) =>
                          updateDay(index, {
                            highlights: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        placeholder="Highlights (comma-separated)"
                        className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
                      />
                      <input
                        type="text"
                        value={day.overnight_stay || ""}
                        onChange={(e) => updateDay(index, { overnight_stay: e.target.value })}
                        placeholder="Overnight stay location"
                        className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tour-specific: Hotel Options */}
      {type === "tour" && (
        <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-ink flex items-center gap-2">
              <Hotel className="w-5 h-5" />
              Hotel Options (Pricing Tiers)
            </h2>
            <button
              type="button"
              onClick={addHotelOption}
              className="flex items-center gap-2 px-3 py-2 bg-coral/20 border-2 border-coral rounded-xl font-body text-sm hover:bg-coral/30"
            >
              <Plus className="w-4 h-4" />
              Add Hotel Tier
            </button>
          </div>

          {hotelOptions.length === 0 ? (
            <div className="text-center py-8 text-ink/60 font-body">
              No hotel options added. Add tiers like &quot;Budget&quot;, &quot;Standard&quot;, &quot;Deluxe&quot;.
            </div>
          ) : (
            <div className="space-y-4">
              {hotelOptions.map((option, index) => (
                <div key={option.id} className="border-3 border-ink/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-display text-lg text-ink">
                      {option.name || `Tier ${index + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeHotelOption(index)}
                      className="p-1 hover:bg-coral/20 rounded text-coral"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid gap-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={option.name}
                        onChange={(e) => updateHotelOption(index, { name: e.target.value })}
                        placeholder="Tier name (e.g., Budget, Standard, Deluxe)"
                        className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
                      />
                      <input
                        type="text"
                        value={option.hotels_included?.join(", ") || ""}
                        onChange={(e) =>
                          updateHotelOption(index, {
                            hotels_included: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        placeholder="Hotel names (comma-separated)"
                        className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
                      />
                    </div>
                    <textarea
                      value={option.description}
                      onChange={(e) => updateHotelOption(index, { description: e.target.value })}
                      placeholder="Description of this tier..."
                      rows={2}
                      className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-sunshine resize-none"
                    />
                    <div>
                      <label className="block font-body text-sm text-ink/60 mb-2">
                        Additional Price per Vehicle Type (over base price)
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {VEHICLE_TYPES.map((vt) => (
                          <div key={vt}>
                            <label className="block font-body text-xs text-ink/50 mb-1 capitalize">
                              {vt.replace("_", " ")}
                            </label>
                            <input
                              type="number"
                              value={option.price_modifier?.[vt] || 0}
                              onChange={(e) =>
                                updateHotelOption(index, {
                                  price_modifier: {
                                    ...option.price_modifier,
                                    [vt]: Number(e.target.value) || 0,
                                  },
                                })
                              }
                              className="w-full px-2 py-1 border-2 border-ink/30 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-sunshine"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tour-specific: FAQs */}
      {type === "tour" && (
        <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-ink flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              FAQs
            </h2>
            <button
              type="button"
              onClick={addFaq}
              className="flex items-center gap-2 px-3 py-2 bg-lake/20 border-2 border-lake rounded-xl font-body text-sm hover:bg-lake/30"
            >
              <Plus className="w-4 h-4" />
              Add FAQ
            </button>
          </div>

          {faqs.length === 0 ? (
            <div className="text-center py-8 text-ink/60 font-body">
              No FAQs added yet.
            </div>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div key={index} className="border-2 border-ink/20 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 grid gap-2">
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => updateFaq(index, { question: e.target.value })}
                        placeholder="Question?"
                        className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
                      />
                      <textarea
                        value={faq.answer}
                        onChange={(e) => updateFaq(index, { answer: e.target.value })}
                        placeholder="Answer..."
                        rows={2}
                        className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-sunshine resize-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFaq(index)}
                      className="p-1 hover:bg-coral/20 rounded text-coral"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Transfer-specific: Destination Paragraphs */}
      {type === "transfer" && (
        <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
          <h2 className="font-display text-xl text-ink mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Destination Information (2 Paragraphs)
          </h2>

          <div className="space-y-4">
            {transferParagraphs.map((para, index) => (
              <div key={index} className="border-2 border-ink/20 rounded-xl p-4">
                <label className="block font-body text-sm text-ink/60 mb-2">
                  Paragraph {index + 1}
                </label>
                <input
                  type="text"
                  value={para.title}
                  onChange={(e) => {
                    const updated = [...transferParagraphs];
                    updated[index] = { ...updated[index], title: e.target.value };
                    setTransferParagraphs(updated);
                  }}
                  placeholder="Section title..."
                  className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-sunshine mb-2"
                />
                <textarea
                  value={para.content}
                  onChange={(e) => {
                    const updated = [...transferParagraphs];
                    updated[index] = { ...updated[index], content: e.target.value };
                    setTransferParagraphs(updated);
                  }}
                  placeholder="Write about the destination..."
                  rows={4}
                  className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-sunshine resize-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transfer-specific: FAQs */}
      {type === "transfer" && (
        <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-ink flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Transfer FAQs
            </h2>
            <button
              type="button"
              onClick={addTransferFaq}
              className="flex items-center gap-2 px-3 py-2 bg-lake/20 border-2 border-lake rounded-xl font-body text-sm hover:bg-lake/30"
            >
              <Plus className="w-4 h-4" />
              Add FAQ
            </button>
          </div>

          {transferFaqs.length === 0 ? (
            <div className="text-center py-8 text-ink/60 font-body">
              No FAQs added yet.
            </div>
          ) : (
            <div className="space-y-3">
              {transferFaqs.map((faq, index) => (
                <div key={index} className="border-2 border-ink/20 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 grid gap-2">
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => updateTransferFaq(index, { question: e.target.value })}
                        placeholder="Question?"
                        className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
                      />
                      <textarea
                        value={faq.answer}
                        onChange={(e) => updateTransferFaq(index, { answer: e.target.value })}
                        placeholder="Answer..."
                        rows={2}
                        className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-sunshine resize-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTransferFaq(index)}
                      className="p-1 hover:bg-coral/20 rounded text-coral"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* NEW: Detailed Attractions Section */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-ink flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Detailed Attractions/Stops (Optional)
          </h2>
          <button
            type="button"
            onClick={addAttraction}
            className="flex items-center gap-2 px-3 py-2 bg-lake/20 border-2 border-lake rounded-xl font-body text-sm hover:bg-lake/30"
          >
            <Plus className="w-4 h-4" />
            Add Attraction
          </button>
        </div>

        {detailedAttractions.length === 0 ? (
          <div className="text-center py-8 text-ink/60 font-body">
            No detailed attractions added. Add attractions with images, routes, and time estimates for a rich experience.
          </div>
        ) : (
          <div className="space-y-4">
            {detailedAttractions.map((attraction, index) => (
              <div key={attraction.id} className="border-3 border-ink/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-display text-lg text-ink">
                    Stop {attraction.order}: {attraction.name || "Untitled"}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveAttraction(index, "up")}
                      disabled={index === 0}
                      className="p-1 hover:bg-sunrise/50 rounded disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveAttraction(index, "down")}
                      disabled={index === detailedAttractions.length - 1}
                      className="p-1 hover:bg-sunrise/50 rounded disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAttraction(index)}
                      className="p-1 hover:bg-coral/20 rounded text-coral"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-3">
                  <input
                    type="text"
                    value={attraction.name}
                    onChange={(e) => updateAttraction(index, { name: e.target.value })}
                    placeholder="Attraction name (e.g., Kainchi Dham Hanuman Mandir)"
                    className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
                  />
                  <textarea
                    value={attraction.description}
                    onChange={(e) => updateAttraction(index, { description: e.target.value })}
                    placeholder="Detailed description..."
                    rows={3}
                    className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-sunshine resize-none"
                  />
                  <div className="grid md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={attraction.route_info || ""}
                      onChange={(e) => updateAttraction(index, { route_info: e.target.value })}
                      placeholder="Route (e.g., Kathgodam → Jeolikote → Getia)"
                      className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-sunshine"
                    />
                    <input
                      type="text"
                      value={attraction.time_estimate || ""}
                      onChange={(e) => updateAttraction(index, { time_estimate: e.target.value })}
                      placeholder="Time estimate (e.g., 1 Hour from Kathgodam)"
                      className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-sunshine"
                    />
                  </div>
                  <input
                    type="url"
                    value={attraction.image_url || ""}
                    onChange={(e) => updateAttraction(index, { image_url: e.target.value })}
                    placeholder="Image URL (optional)"
                    className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-sunshine"
                  />
                  <div className="grid md:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={attraction.is_highlighted || false}
                        onChange={(e) => updateAttraction(index, { is_highlighted: e.target.checked })}
                        className="w-4 h-4 rounded border-2 border-ink accent-whatsapp"
                      />
                      <span className="font-body text-sm">Highlight this attraction</span>
                    </label>
                    {attraction.is_highlighted && (
                      <input
                        type="text"
                        value={attraction.badge_text || ""}
                        onChange={(e) => updateAttraction(index, { badge_text: e.target.value })}
                        placeholder="Badge text (e.g., MOST POPULAR)"
                        className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-sunshine"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NEW: Itinerary Flexibility Note */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4">Itinerary Flexibility Note (Optional)</h2>
        <textarea
          value={itineraryFlexibilityNote}
          onChange={(e) => setItineraryFlexibilityNote(e.target.value)}
          placeholder="Add a note about itinerary flexibility (e.g., 'You can also reverse the complete itinerary and start from...')"
          rows={2}
          className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine resize-none"
        />
      </div>

      {/* NEW: Detailed Inclusions Section */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-ink">Detailed Inclusions (Optional)</h2>
          <button
            type="button"
            onClick={addDetailedInclude}
            className="flex items-center gap-2 px-3 py-2 bg-whatsapp/20 border-2 border-whatsapp rounded-xl font-body text-sm hover:bg-whatsapp/30"
          >
            <Plus className="w-4 h-4" />
            Add Inclusion
          </button>
        </div>

        {detailedIncludes.length === 0 ? (
          <div className="text-center py-8 text-ink/60 font-body">
            No detailed inclusions added. Add inclusions with descriptions for better clarity.
          </div>
        ) : (
          <div className="space-y-3">
            {detailedIncludes.map((item, index) => (
              <div key={index} className="border-2 border-ink/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 grid gap-2">
                    <input
                      type="text"
                      value={item.item}
                      onChange={(e) => updateDetailedInclude(index, { item: e.target.value })}
                      placeholder="What's included (e.g., Car Rental with Driver)"
                      className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-sunshine"
                    />
                    <div className="grid md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={item.description || ""}
                        onChange={(e) => updateDetailedInclude(index, { description: e.target.value })}
                        placeholder="Description (e.g., Well-maintained vehicle)"
                        className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body text-xs focus:outline-none focus:ring-2 focus:ring-sunshine"
                      />
                      <input
                        type="text"
                        value={item.category || ""}
                        onChange={(e) => updateDetailedInclude(index, { category: e.target.value })}
                        placeholder="Category (e.g., Transportation)"
                        className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body text-xs focus:outline-none focus:ring-2 focus:ring-sunshine"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDetailedInclude(index)}
                    className="p-1 hover:bg-coral/20 rounded text-coral mt-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NEW: Detailed Exclusions Section */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-ink">Detailed Exclusions (Optional)</h2>
          <button
            type="button"
            onClick={addDetailedExclude}
            className="flex items-center gap-2 px-3 py-2 bg-coral/20 border-2 border-coral rounded-xl font-body text-sm hover:bg-coral/30"
          >
            <Plus className="w-4 h-4" />
            Add Exclusion
          </button>
        </div>

        {detailedExcludes.length === 0 ? (
          <div className="text-center py-8 text-ink/60 font-body">
            No detailed exclusions added. Add exclusions with descriptions for transparency.
          </div>
        ) : (
          <div className="space-y-3">
            {detailedExcludes.map((item, index) => (
              <div key={index} className="border-2 border-ink/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 grid gap-2">
                    <input
                      type="text"
                      value={item.item}
                      onChange={(e) => updateDetailedExclude(index, { item: e.target.value })}
                      placeholder="What's NOT included (e.g., Food & Beverages)"
                      className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-sunshine"
                    />
                    <div className="grid md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={item.description || ""}
                        onChange={(e) => updateDetailedExclude(index, { description: e.target.value })}
                        placeholder="Description (e.g., Meals not included)"
                        className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body text-xs focus:outline-none focus:ring-2 focus:ring-sunshine"
                      />
                      <input
                        type="text"
                        value={item.category || ""}
                        onChange={(e) => updateDetailedExclude(index, { category: e.target.value })}
                        placeholder="Category (e.g., Food)"
                        className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body text-xs focus:outline-none focus:ring-2 focus:ring-sunshine"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDetailedExclude(index)}
                    className="p-1 hover:bg-coral/20 rounded text-coral mt-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NEW: Booking Instructions Section */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-ink">How to Book (Optional)</h2>
          <button
            type="button"
            onClick={addBookingStep}
            className="flex items-center gap-2 px-3 py-2 bg-sunshine/50 border-2 border-ink rounded-xl font-body text-sm hover:bg-sunshine/70"
          >
            <Plus className="w-4 h-4" />
            Add Step
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">Contact Phone</label>
              <input
                type="tel"
                value={bookingInstructions.contact_phone || ""}
                onChange={(e) =>
                  setBookingInstructions({ ...bookingInstructions, contact_phone: e.target.value })
                }
                placeholder="e.g., 7351721351"
                className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-sunshine"
              />
            </div>
            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">WhatsApp Number</label>
              <input
                type="tel"
                value={bookingInstructions.whatsapp_number || ""}
                onChange={(e) =>
                  setBookingInstructions({ ...bookingInstructions, whatsapp_number: e.target.value })
                }
                placeholder="e.g., 917351721351"
                className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-sunshine"
              />
            </div>
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">WhatsApp Message Template</label>
            <input
              type="text"
              value={bookingInstructions.whatsapp_message || ""}
              onChange={(e) =>
                setBookingInstructions({ ...bookingInstructions, whatsapp_message: e.target.value })
              }
              placeholder="e.g., Hi, I want to book [package name]"
              className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>

          <div className="space-y-3">
            {bookingInstructions.steps.map((step, index) => (
              <div key={index} className="border-2 border-ink/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-sunshine rounded-full flex items-center justify-center font-display font-bold text-ink">
                    {step.step_number}
                  </div>
                  <div className="flex-1 grid gap-2">
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => updateBookingStep(index, { title: e.target.value })}
                      placeholder="Step title (e.g., Contact Us)"
                      className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-sunshine"
                    />
                    <textarea
                      value={step.description}
                      onChange={(e) => updateBookingStep(index, { description: e.target.value })}
                      placeholder="Step description..."
                      rows={2}
                      className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body text-xs focus:outline-none focus:ring-2 focus:ring-sunshine resize-none"
                    />
                  </div>
                  {bookingInstructions.steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBookingStep(index)}
                      className="p-1 hover:bg-coral/20 rounded text-coral mt-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">Additional Notes</label>
            <textarea
              value={bookingInstructions.additional_notes || ""}
              onChange={(e) =>
                setBookingInstructions({ ...bookingInstructions, additional_notes: e.target.value })
              }
              placeholder="Any additional booking information..."
              rows={2}
              className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-sunshine resize-none"
            />
          </div>
        </div>
      </div>

      {/* SEO Section */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4">SEO Settings</h2>

        <div className="grid gap-4">
          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Meta Title
            </label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="SEO title (leave empty to use package title)"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>
          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Meta Description
            </label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="SEO description..."
              rows={2}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine resize-none"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-3 bg-whatsapp text-white border-3 border-ink rounded-xl font-body font-semibold shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {isSubmitting ? "Saving..." : initialData ? "Update Package" : "Create Package"}
        </button>
      </div>
    </form>
  );
}
