"use client";

import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";
import { cn } from "@/lib/utils";
import { GalleryImage } from "@/lib/supabase/types";

interface PackageGalleryProps {
  images?: string[] | GalleryImage[];
  title?: string;
}

export default function PackageGallery({ images, title = "Photo Gallery" }: PackageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  // Normalize images to GalleryImage format
  const normalizedImages: GalleryImage[] = images.map((img, idx) => {
    if (typeof img === 'string') {
      return { url: img, name: `Image ${idx + 1}` };
    }
    return img;
  });

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? normalizedImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === normalizedImages.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") goToPrevious();
    if (e.key === "ArrowRight") goToNext();
  };

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white to-sunrise/10">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-display text-ink mb-3 flex items-center justify-center gap-3">
            <Images className="w-8 h-8 text-lake" />
            {title}
          </h2>
        </div>

        {/* Gallery Grid - Fixed 800x600px images */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {normalizedImages.map((image, index) => (
            <div
              key={index}
              className="group cursor-pointer"
              onClick={() => openLightbox(index)}
            >
              <div className="relative rounded-2xl border-3 border-ink overflow-hidden shadow-retro-sm hover:shadow-retro transition-all bg-white">
                <div className="relative w-full" style={{ height: '450px' }}>
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-3 shadow-lg">
                      <Images className="w-6 h-6 text-ink" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Image Name */}
              <div className="mt-3 text-center">
                <p className="font-body text-ink/80 text-sm md:text-base">
                  {image.name}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox */}
        {lightboxOpen && (
          <div
            className="fixed inset-0 z-50 bg-ink/95 flex items-center justify-center"
            onClick={closeLightbox}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors z-10"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Navigation Buttons */}
            {normalizedImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors z-10"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors z-10"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            {/* Image */}
            <div
              className="max-w-5xl max-h-[80vh] px-4 flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={normalizedImages[currentIndex].url}
                alt={normalizedImages[currentIndex].name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
              {/* Image name in lightbox */}
              <div className="mt-4 px-4 py-2 bg-white/10 rounded-lg">
                <p className="text-white font-body text-lg text-center">
                  {normalizedImages[currentIndex].name}
                </p>
              </div>
            </div>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 rounded-full text-white font-body">
              {currentIndex + 1} / {normalizedImages.length}
            </div>

            {/* Thumbnails */}
            {normalizedImages.length > 1 && normalizedImages.length <= 10 && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 flex-wrap justify-center max-w-3xl">
                {normalizedImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(index);
                    }}
                    className={cn(
                      "w-12 h-12 rounded-lg overflow-hidden border-2 transition-all",
                      currentIndex === index
                        ? "border-white scale-110"
                        : "border-white/30 opacity-60 hover:opacity-100"
                    )}
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
