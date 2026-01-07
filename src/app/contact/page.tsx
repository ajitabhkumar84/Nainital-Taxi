import { Header, Footer, Button } from '@/components/ui';
import { ContactHero, ContactForm, ContactInfo, ContactFAQ } from '@/components/contact';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import { ArrowRight, Shield, Award, Heart } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Contact Us - Nainital Taxi Services',
  description:
    'Get in touch with Nainital Taxi for bookings, inquiries, and quotes. Available 24/7 via phone, WhatsApp, or email. Book your reliable taxi service in Nainital today.',
  keywords:
    'contact Nainital taxi, book taxi Nainital, Kathgodam taxi contact, Uttarakhand taxi booking, taxi inquiry, 24/7 taxi service',
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <FloatingWhatsApp />

      <main className="mt-20">
        {/* Hero Section */}
        <ContactHero
          title="Get in Touch"
          subtitle="Book your taxi or request a quote - we're here to help 24/7"
        />

        {/* Contact Form Section */}
        <ContactForm
          formTitle="Request a Free Quote"
          formDescription="Fill out the form below and we'll get back to you within minutes"
        />

        {/* Contact Information & Map */}
        <ContactInfo
          whatsappNumber="918445206116"
          phoneNumber="+918445206116"
          email="taxinainital@gmail.com"
          address="Nainital, Uttarakhand, India"
          mapUrl="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3468.123456789!2d79.516!3d29.266!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjnCsDE1JzU3LjYiTiA3OcKwMzAnNTcuNiJF!5e0!3m2!1sen!2sin!4v1234567890"
        />

        {/* FAQs Section */}
        <ContactFAQ />

        {/* Bottom CTA Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-ink via-ink/95 to-ink text-white relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-32 h-32 bg-sunshine rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-48 h-48 bg-teal rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-display text-white mb-4">
              Ready to Book Your Journey?
            </h2>
            <p className="text-xl text-white/80 font-body mb-8">
              Experience safe, comfortable, and reliable taxi services in Nainital
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/fleet">
                <Button variant="primary" size="lg">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  View Our Fleet
                </Button>
              </Link>
              <Link href="/">
                <Button variant="secondary" size="lg">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Back to Home
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-white/70">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-sunshine/20 rounded-full flex items-center justify-center mr-2 border-2 border-sunshine">
                  <Shield className="w-4 h-4 text-sunshine" />
                </div>
                <span className="font-body">Verified Drivers</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-teal/20 rounded-full flex items-center justify-center mr-2 border-2 border-teal">
                  <Heart className="w-4 h-4 text-teal" />
                </div>
                <span className="font-body">Zero Alcohol Policy</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-coral/20 rounded-full flex items-center justify-center mr-2 border-2 border-coral">
                  <Award className="w-4 h-4 text-coral" />
                </div>
                <span className="font-body">10,000+ Safe Trips</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
