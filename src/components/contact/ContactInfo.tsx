'use client';

import { Phone, Mail, MapPin, MessageCircle, Clock, Calendar, Award } from 'lucide-react';

interface ContactInfoProps {
  whatsappNumber?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  mapUrl?: string;
}

export default function ContactInfo({
  whatsappNumber = '918445206116',
  phoneNumber = '+918445206116',
  email = 'taxinainital@gmail.com',
  address = 'Nainital, Uttarakhand, India',
  mapUrl = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3468.123456789!2d79.516!3d29.266!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjnCsDE1JzU3LjYiTiA3OcKwMzAnNTcuNiJF!5e0!3m2!1sen!2sin!4v1234567890'
}: ContactInfoProps) {
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hi, I would like to inquire about your taxi services.')}`;

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-sunrise to-lake">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display text-ink mb-3">
            Contact Information
          </h2>
          <p className="text-lg font-body text-ink/70">
            Reach out to us anytime - we&apos;re always here to assist you
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Cards */}
          <div className="space-y-4">
            {/* WhatsApp Card */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white rounded-2xl shadow-retro p-6 hover:shadow-retro-lg hover:-translate-y-1 transition-all border-3 border-ink group"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-whatsapp rounded-full flex items-center justify-center group-hover:scale-110 transition-transform border-3 border-ink">
                    <MessageCircle className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-xl font-display text-ink mb-1">WhatsApp</h3>
                  <p className="font-body text-ink/70 mb-2">Chat with us instantly</p>
                  <p className="text-2xl font-display text-whatsapp">{phoneNumber}</p>
                  <p className="text-sm font-body text-ink/60 mt-2">Click to start chat</p>
                </div>
                <svg className="w-6 h-6 text-ink/40 group-hover:text-whatsapp transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>

            {/* Phone Card */}
            <a
              href={`tel:${phoneNumber}`}
              className="block bg-white rounded-2xl shadow-retro p-6 hover:shadow-retro-lg hover:-translate-y-1 transition-all border-3 border-ink group"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-teal rounded-full flex items-center justify-center group-hover:scale-110 transition-transform border-3 border-ink">
                    <Phone className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-xl font-display text-ink mb-1">Call Us</h3>
                  <p className="font-body text-ink/70 mb-2">Available 24/7 for bookings</p>
                  <p className="text-2xl font-display text-teal">{phoneNumber}</p>
                  <p className="text-sm font-body text-ink/60 mt-2">Tap to call now</p>
                </div>
                <svg className="w-6 h-6 text-ink/40 group-hover:text-teal transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>

            {/* Email Card */}
            <a
              href={`mailto:${email}`}
              className="block bg-white rounded-2xl shadow-retro p-6 hover:shadow-retro-lg hover:-translate-y-1 transition-all border-3 border-ink group"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-coral rounded-full flex items-center justify-center group-hover:scale-110 transition-transform border-3 border-ink">
                    <Mail className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-xl font-display text-ink mb-1">Email</h3>
                  <p className="font-body text-ink/70 mb-2">Send us a message</p>
                  <p className="text-lg font-display text-coral break-all">{email}</p>
                  <p className="text-sm font-body text-ink/60 mt-2">Click to compose email</p>
                </div>
                <svg className="w-6 h-6 text-ink/40 group-hover:text-coral transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>

            {/* Address Card */}
            <div className="bg-white rounded-2xl shadow-retro p-6 border-3 border-ink">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-sunshine/30 rounded-full flex items-center justify-center border-3 border-ink">
                    <MapPin className="w-7 h-7 text-ink" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-xl font-display text-ink mb-1">Office Address</h3>
                  <p className="font-body text-ink/70 mb-2">Visit us for in-person bookings</p>
                  <p className="font-body text-ink leading-relaxed">{address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Google Map */}
          <div className="bg-white rounded-2xl shadow-retro overflow-hidden border-3 border-ink">
            <div className="p-4 bg-gradient-to-r from-sunshine to-teal">
              <h3 className="text-xl font-display text-ink flex items-center">
                <MapPin className="w-6 h-6 mr-2" />
                Find Us on Map
              </h3>
            </div>
            <div className="relative h-96">
              <iframe
                src={mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 w-full h-full"
              />
            </div>
            <div className="p-4 bg-sunrise border-t-3 border-ink">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full bg-teal text-white px-6 py-3 rounded-xl font-display font-bold border-3 border-ink shadow-retro hover:shadow-retro-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="mt-8 bg-gradient-to-r from-ink via-ink/95 to-ink rounded-2xl p-8 text-center border-3 border-ink shadow-retro-lg">
          <h3 className="text-2xl font-display text-sunshine mb-6">Operating Hours</h3>
          <div className="flex flex-wrap justify-center gap-8 text-white">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-teal/20 rounded-full flex items-center justify-center mr-3 border-2 border-teal">
                <Clock className="w-5 h-5 text-teal" />
              </div>
              <span className="text-lg font-body"><strong className="font-display">24/7</strong> Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-sunshine/20 rounded-full flex items-center justify-center mr-3 border-2 border-sunshine">
                <Calendar className="w-5 h-5 text-sunshine" />
              </div>
              <span className="text-lg font-body"><strong className="font-display">365 Days</strong> a Year</span>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-coral/20 rounded-full flex items-center justify-center mr-3 border-2 border-coral">
                <Award className="w-5 h-5 text-coral" />
              </div>
              <span className="text-lg font-body"><strong className="font-display">Instant</strong> Booking</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
