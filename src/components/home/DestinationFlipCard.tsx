'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, Button } from '@/components/ui';
import { IndianRupee } from 'lucide-react';

interface DestinationFlipCardProps {
  slug: string;
  name: string;
  emoji: string;
  hero_image_url?: string | null;
  description: string;
  distance_from_nainital: number;
  gradient: string;
  minPrice?: number | null;
}

export default function DestinationFlipCard({
  slug,
  name,
  emoji,
  hero_image_url,
  description,
  distance_from_nainital,
  gradient,
  minPrice,
}: DestinationFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Check if user prefers reduced motion
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mobile: IntersectionObserver for scroll-triggered flip
  useEffect(() => {
    if (typeof window === 'undefined' || !hero_image_url || prefersReducedMotion) {
      // If no image or reduced motion, show image directly (no flip)
      if (prefersReducedMotion && hero_image_url) {
        setIsFlipped(true);
      }
      return;
    }

    const isMobile = window.innerWidth < 768;
    if (!isMobile || !cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setIsFlipped(true);
          } else if (entry.intersectionRatio < 0.2) {
            setIsFlipped(false);
          }
        });
      },
      {
        threshold: [0.2, 0.5],
      }
    );

    observer.observe(cardRef.current);

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [hero_image_url, prefersReducedMotion]);

  // Desktop: Hover triggers flip
  const handleMouseEnter = () => {
    if (hero_image_url && window.innerWidth >= 768 && !prefersReducedMotion) {
      setIsFlipped(true);
    }
  };

  const handleMouseLeave = () => {
    if (hero_image_url && window.innerWidth >= 768 && !prefersReducedMotion) {
      setIsFlipped(false);
    }
  };

  // If no image, render simple card without flip
  if (!hero_image_url) {
    return (
      <Link href={`/destinations/${slug}`}>
        <Card className="overflow-hidden group cursor-pointer hover:shadow-retro-lg transition-shadow">
          <div className={`h-48 bg-gradient-to-br ${gradient} flex items-center justify-center text-6xl group-hover:scale-110 transition-transform`}>
            {emoji}
          </div>
          <CardContent className="pt-6">
            <h3 className="font-display text-2xl mb-2">{name}</h3>
            <p className="font-body text-ink/70 mb-4">{description}</p>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-ink/60">{distance_from_nainital} km from Nainital</span>
                {minPrice && (
                  <div className="flex items-center gap-1 text-whatsapp font-body font-bold text-sm">
                    <IndianRupee className="w-4 h-4" />
                    <span>From ₹{minPrice.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm">
                Explore →
              </Button>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/destinations/${slug}`}>
      <div
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="perspective-1000"
      >
        <Card className="overflow-hidden cursor-pointer hover:shadow-retro-lg transition-shadow h-full">
          <div
            className="relative h-48 preserve-3d transition-transform duration-600"
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              willChange: 'transform',
            }}
          >
            {/* Front Face - Emoji */}
            <div
              className={`absolute inset-0 backface-hidden bg-gradient-to-br ${gradient} flex items-center justify-center text-6xl`}
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              {emoji}
            </div>

            {/* Back Face - Image */}
            <div
              className="absolute inset-0 backface-hidden"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <img
                src={hero_image_url}
                alt={name}
                loading="lazy"
                onLoad={() => setIsImageLoaded(true)}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  isImageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ aspectRatio: '16/9' }}
              />
              {!isImageLoaded && (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center text-6xl`}>
                  {emoji}
                </div>
              )}
            </div>
          </div>

          <CardContent className="pt-6">
            <h3 className="font-display text-2xl mb-2">{name}</h3>
            <p className="font-body text-ink/70 mb-4 line-clamp-2">{description}</p>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-ink/60">{distance_from_nainital} km from Nainital</span>
                {minPrice && (
                  <div className="flex items-center gap-1 text-whatsapp font-body font-bold text-sm">
                    <IndianRupee className="w-4 h-4" />
                    <span>From ₹{minPrice.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm">
                Explore →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .duration-600 {
          transition-duration: 600ms;
        }
      `}</style>
    </Link>
  );
}
