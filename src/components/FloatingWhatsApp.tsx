"use client";

import React, { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";

interface FloatingWhatsAppProps {
  /** Contextual message based on current page */
  contextMessage?: string;
  /** Route name for pre-filled message (e.g., "Kathgodam to Nainital") */
  routeName?: string;
  /** Package/tour name for pre-filled message */
  packageName?: string;
  /** Destination name for pre-filled message */
  destinationName?: string;
}

export default function FloatingWhatsApp({
  contextMessage,
  routeName,
  packageName,
  destinationName,
}: FloatingWhatsAppProps = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  // Show button after scrolling down a bit
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hide tooltip after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleWhatsAppClick = () => {
    const phoneNumber = "918445206116";

    // Generate contextual message
    let message = "Hi! ";

    if (contextMessage) {
      message += contextMessage;
    } else if (routeName) {
      message += `I want to book a taxi from ${routeName}. Can you provide details?`;
    } else if (packageName) {
      message += `I'm interested in the ${packageName} tour package. Can you help me?`;
    } else if (destinationName) {
      message += `I want to visit ${destinationName}. Can you help me plan my trip?`;
    } else {
      message += "I'm interested in booking a taxi in Nainital. Can you help me?";
    }

    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (!isVisible) return null;

  return (
    <div className="hidden md:flex fixed bottom-6 right-6 z-50 items-center gap-3">
      {/* Tooltip */}
      {showTooltip && (
        <div className="hidden md:block bg-white border-3 border-ink rounded-lg shadow-retro px-4 py-3 animate-bounce">
          <div className="flex items-center gap-2">
            <p className="font-body font-bold text-ink">Chat with us!</p>
            <button
              onClick={() => setShowTooltip(false)}
              className="text-ink/60 hover:text-ink"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-ink/60 mt-1">Quick replies available</p>
        </div>
      )}

      {/* WhatsApp Button */}
      <button
        onClick={handleWhatsAppClick}
        className="bg-whatsapp hover:bg-whatsapp/90 text-white p-4 rounded-full border-3 border-ink shadow-retro hover:shadow-retro-lg transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-retro-pressed group"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );
}
