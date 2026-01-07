"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Phone, Menu, X, MessageCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "./Button";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { HeaderConfig, DEFAULT_SITE_CONFIG } from "@/lib/supabase/types";

interface HeaderProps {
  config?: HeaderConfig;
}

const ctaIcons = {
  phone: Phone,
  whatsapp: MessageCircle,
  arrow: ArrowRight,
  none: null,
};

export default function Header({ config: propConfig }: HeaderProps) {
  const { config: siteConfig, isLoading } = useSiteConfig();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Use prop config if provided, otherwise use fetched config, fallback to default
  const headerConfig = propConfig || siteConfig?.header || DEFAULT_SITE_CONFIG.header;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Filter and sort active nav links
  const activeNavLinks = headerConfig.navLinks
    .filter(link => link.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  // Get CTA button icons
  const PrimaryIcon = headerConfig.ctaPrimary.icon
    ? ctaIcons[headerConfig.ctaPrimary.icon]
    : null;
  const SecondaryIcon = headerConfig.ctaSecondary.icon
    ? ctaIcons[headerConfig.ctaSecondary.icon]
    : null;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/80 backdrop-blur-lg shadow-retro-sm border-b-3 border-ink"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-3xl font-display text-ink">
              {headerConfig.logoEmoji}{" "}
              <span className="text-sunshine">{headerConfig.logoText.split(" ")[0]}</span>{" "}
              {headerConfig.logoText.split(" ").slice(1).join(" ")}
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {activeNavLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className="text-ink font-body font-semibold hover:text-teal transition-colors"
                target={link.openInNewTab ? "_blank" : undefined}
                rel={link.openInNewTab ? "noopener noreferrer" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Secondary CTA (usually Call/Phone) */}
            {headerConfig.ctaSecondary.isActive && (
              <a href={headerConfig.ctaSecondary.href}>
                <Button variant={headerConfig.ctaSecondary.variant} size="sm">
                  {SecondaryIcon && <SecondaryIcon className="w-4 h-4 mr-2" />}
                  {headerConfig.ctaSecondary.text}
                </Button>
              </a>
            )}

            {/* Primary CTA (usually Book Now) */}
            {headerConfig.ctaPrimary.isActive && (
              <Link href={headerConfig.ctaPrimary.href}>
                <Button variant={headerConfig.ctaPrimary.variant} size="sm">
                  {PrimaryIcon && <PrimaryIcon className="w-4 h-4 mr-2" />}
                  {headerConfig.ctaPrimary.text}
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-ink"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t-3 border-ink pt-4">
            <nav className="flex flex-col space-y-4">
              {activeNavLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-ink font-body font-semibold hover:text-teal transition-colors"
                  target={link.openInNewTab ? "_blank" : undefined}
                  rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col space-y-2 pt-4">
                {headerConfig.ctaSecondary.isActive && (
                  <a href={headerConfig.ctaSecondary.href}>
                    <Button variant={headerConfig.ctaSecondary.variant} size="md" className="w-full">
                      {SecondaryIcon && <SecondaryIcon className="w-4 h-4 mr-2" />}
                      {headerConfig.ctaSecondary.text}
                    </Button>
                  </a>
                )}
                {headerConfig.ctaPrimary.isActive && (
                  <Link href={headerConfig.ctaPrimary.href}>
                    <Button variant={headerConfig.ctaPrimary.variant} size="md" className="w-full">
                      {PrimaryIcon && <PrimaryIcon className="w-4 h-4 mr-2" />}
                      {headerConfig.ctaPrimary.text}
                    </Button>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
