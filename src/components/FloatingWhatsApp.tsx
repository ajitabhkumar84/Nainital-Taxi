"use client";

import React, { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";

export default function FloatingWhatsApp() {
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
    const message = encodeURIComponent(
      "Hi! I'm interested in booking a taxi in Nainital. Can you help me?"
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {/* Tooltip */}
      {showTooltip && (
        <div className="hidden md:block bg-white border-3 border-ink rounded-lg shadow-retro px-4 py-3 animate-bounce">
          <div className="flex items-center gap-2">
            <p className="font-body font-bold text-ink">Need help? Chat with us!</p>
            <button
              onClick={() => setShowTooltip(false)}
              className="text-ink/60 hover:text-ink"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
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
