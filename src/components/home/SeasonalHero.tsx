'use client';

import { useMemo } from 'react';
import { Shield, UserCheck, Award } from 'lucide-react';
import { Button } from '@/components/ui';
import AnimatedCounter from './AnimatedCounter';

interface SeasonConfig {
  backgroundImage: string;
  title: string;
  subtitle: string;
}

export default function SeasonalHero() {
  const seasonConfig = useMemo<SeasonConfig>(() => {
    const month = new Date().getMonth(); // 0-11

    // Winter: November (10) - February (1)
    if (month === 10 || month === 11 || month === 0 || month === 1) {
      return {
        backgroundImage: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?q=80&w=2076&auto=format&fit=crop',
        title: 'Escape to Snow-Kissed Hills',
        subtitle: 'Experience the magic of winter in the mountains',
      };
    }

    // Spring: March (2) - April (3)
    if (month === 2 || month === 3) {
      return {
        backgroundImage: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=2070&auto=format&fit=crop',
        title: 'Blooming Mountain Paradise',
        subtitle: 'Witness nature\'s colorful awakening',
      };
    }

    // Summer: May (4) - July (6)
    if (month === 4 || month === 5 || month === 6) {
      return {
        backgroundImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop',
        title: 'Your Perfect Summer Getaway',
        subtitle: 'Beat the heat in cool mountain air',
      };
    }

    // Monsoon: August (7) - October (9)
    return {
      backgroundImage: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=2070&auto=format&fit=crop',
      title: 'Magical Monsoon Mountains',
      subtitle: 'Embrace the beauty of misty peaks',
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 pt-24 overflow-hidden">
      {/* Background Image - Seasonal */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${seasonConfig.backgroundImage}')`,
        }}
      >
        {/* Dark Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/50 to-ink/70"></div>

        {/* Secondary Gradient for Depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal/30 via-transparent to-sunshine/20"></div>
      </div>

      {/* Decorative Floating Elements with Retro Pop Style */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-32 left-10 w-24 h-24 bg-sunshine/30 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute top-48 right-20 w-32 h-32 bg-coral/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-40 left-1/4 w-28 h-28 bg-teal/25 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Hero Content with Glassmorphism */}
      <div className="container mx-auto text-center relative z-10">
        <div className="max-w-5xl mx-auto bg-white/10 backdrop-blur-md border-3 border-white/30 rounded-3xl p-8 md:p-12 shadow-retro-lg">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display text-white mb-6 drop-shadow-lg">
            <span className="text-sunshine drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">{seasonConfig.title}</span> 🏔️
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl font-body text-white/95 mb-8 md:mb-12 max-w-3xl mx-auto drop-shadow-md leading-relaxed">
            {seasonConfig.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="primary" size="lg">
              Book Your Ride Now
            </Button>
            <Button variant="secondary" size="lg">
              Explore Packages
            </Button>
          </div>

          {/* Trust Badge Bar with Animated Counter */}
          <div className="mt-8 pt-6 border-t border-white/20">
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-white/90 text-sm md:text-base">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-sunshine" />
                <span className="font-body">Verified Drivers</span>
              </div>
              <div className="hidden sm:block w-1 h-1 bg-white/40 rounded-full"></div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-sunshine" />
                <span className="font-body">Zero Alcohol Policy</span>
              </div>
              <div className="hidden sm:block w-1 h-1 bg-white/40 rounded-full"></div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-sunshine" />
                <span className="font-body">
                  <AnimatedCounter end={10000} suffix="+" duration={2000} /> Safe Trips
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wavy SVG Divider at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full h-20 md:h-32">
          <path
            fill="#FFF8E7"
            fillOpacity="1"
            d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
          ></path>
        </svg>
      </div>
    </section>
  );
}
