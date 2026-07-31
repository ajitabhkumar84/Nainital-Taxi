'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Phone, MessageCircle, Send, X } from 'lucide-react';
import QuickEnquiryForm from './QuickEnquiryForm';

export default function MobileEnquiryBar() {
  const [isVisible, setIsVisible] = useState(false);
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const pathname = usePathname();
  const isEnquiryActive = pathname === '/contact';

  // Show bar after scrolling past hero
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 600) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCallClick = () => {
    window.location.href = 'tel:+918445206116';
  };

  const handleWhatsAppClick = () => {
    const phoneNumber = '918445206116';
    const message = encodeURIComponent(
      "Hi! I'm interested in booking a taxi in Nainital. Can you help me?"
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const handleEnquiryClick = () => {
    setShowEnquiryForm(true);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Fixed Bottom Bar - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t-3 border-ink shadow-retro-lg">
        <div className="flex items-center justify-around p-3">
          {/* Call Button */}
          <button
            onClick={handleCallClick}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl hover:bg-teal/10 transition-colors min-w-[44px] min-h-[44px]"
            aria-label="Call us"
          >
            <Phone className="w-6 h-6 text-teal" />
            <span className="text-xs font-body font-bold text-ink">Call</span>
          </button>

          {/* WhatsApp Button */}
          <button
            onClick={handleWhatsAppClick}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl hover:bg-whatsapp/10 transition-colors min-w-[44px] min-h-[44px]"
            aria-label="Chat on WhatsApp"
          >
            <MessageCircle className="w-6 h-6 text-whatsapp" />
            <span className="text-xs font-body font-bold text-ink">WhatsApp</span>
          </button>

          {/* Enquiry Button */}
          <button
            onClick={handleEnquiryClick}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors min-w-[44px] min-h-[44px] ${
              isEnquiryActive ? 'bg-sunshine/30' : 'hover:bg-sunshine/20'
            }`}
            aria-label="Send enquiry"
            aria-current={isEnquiryActive ? 'page' : undefined}
          >
            <Send className={`w-6 h-6 ${isEnquiryActive ? 'text-ink' : 'text-ink/70'}`} strokeWidth={isEnquiryActive ? 2.5 : 2} />
            <span className={`text-xs font-body ${isEnquiryActive ? 'font-extrabold text-ink' : 'font-bold text-ink/70'}`}>Enquiry</span>
          </button>
        </div>
      </div>

      {/* Slide-up Enquiry Form Modal */}
      {showEnquiryForm && (
        <div
          className="fixed inset-0 z-50 bg-ink/50 md:hidden"
          onClick={() => setShowEnquiryForm(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {/* Close Button */}
              <button
                onClick={() => setShowEnquiryForm(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white rounded-full border-3 border-ink shadow-retro flex items-center justify-center hover:bg-coral/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-ink" />
              </button>

              {/* Form Content */}
              <div className="p-4">
                <QuickEnquiryForm onClose={() => setShowEnquiryForm(false)} />
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
