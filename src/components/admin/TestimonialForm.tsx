"use client";

import React, { useState } from "react";
import { Save, X, Star, User } from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";
import { Review } from "@/lib/supabase/types";

interface TestimonialFormProps {
  initialData?: (Review & { guest_photo_url?: string | null }) | null;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
}

export default function TestimonialForm({ initialData, onSubmit, isSubmitting, onCancel }: TestimonialFormProps) {
  const [customerName, setCustomerName] = useState(initialData?.customer_name || "");
  const [customerLocation, setCustomerLocation] = useState(initialData?.customer_location || "");
  const [reviewText, setReviewText] = useState(initialData?.review_text || "");
  const [rating, setRating] = useState(initialData?.rating || 5);
  const [guestPhotoUrl, setGuestPhotoUrl] = useState(initialData?.photos?.[0] || "");
  const [isFeatured, setIsFeatured] = useState(initialData?.is_featured ?? true);
  const [isApproved, setIsApproved] = useState(initialData?.is_approved ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      customer_name: customerName,
      customer_location: customerLocation || null,
      review_text: reviewText,
      rating,
      guest_photo_url: guestPhotoUrl || null,
      is_featured: isFeatured,
      is_approved: isApproved,
    };

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display text-ink">
          {initialData ? "Edit Testimonial" : "Add Testimonial"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-lg hover:bg-coral/10 transition-colors"
        >
          <X className="w-5 h-5 text-coral" />
        </button>
      </div>

      {/* Guest Details */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 shadow-retro">
        <h3 className="text-lg font-display text-ink mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Guest Details
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-body text-ink mb-2">
              Guest Name <span className="text-coral">*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g., Sneha Kapoor"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-body text-ink mb-2">City</label>
            <input
              type="text"
              value={customerLocation}
              onChange={(e) => setCustomerLocation(e.target.value)}
              placeholder="e.g., Delhi"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>

          <div>
            <label className="block text-sm font-body text-ink mb-2">Guest Photo (optional)</label>
            <ImageUploader
              value={guestPhotoUrl}
              onChange={setGuestPhotoUrl}
              folder="testimonials"
              label="Upload Guest Photo"
            />
          </div>
        </div>
      </div>

      {/* Review */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 shadow-retro">
        <h3 className="text-lg font-display text-ink mb-4 flex items-center gap-2">
          <Star className="w-5 h-5" />
          Review
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-body text-ink mb-2">
              Star Rating <span className="text-coral">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="p-1"
                >
                  <Star
                    className={
                      value <= rating
                        ? "w-7 h-7 fill-sunshine text-sunshine"
                        : "w-7 h-7 text-ink/20"
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-body text-ink mb-2">
              Quote <span className="text-coral">*</span>
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What the guest said about their trip"
              rows={5}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
              required
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 shadow-retro">
        <h3 className="text-lg font-display text-ink mb-4">Status</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-5 h-5 border-3 border-ink rounded accent-teal"
            />
            <span className="font-body text-ink">Featured (shown on homepage)</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isApproved}
              onChange={(e) => setIsApproved(e.target.checked)}
              className="w-5 h-5 border-3 border-ink rounded accent-teal"
            />
            <span className="font-body text-ink">Approved</span>
          </label>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t-3 border-ink">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-3 rounded-xl border-3 border-ink font-display bg-white hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 rounded-xl border-3 border-ink font-display bg-sunshine text-ink shadow-retro hover:shadow-retro-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {isSubmitting ? "Saving..." : "Save Testimonial"}
        </button>
      </div>
    </form>
  );
}
