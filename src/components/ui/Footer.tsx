"use client";

import Link from "next/link";
import { Shield, Phone, MessageCircle, Instagram, Facebook, Twitter, Youtube, Linkedin } from "lucide-react";
import Button from "./Button";
import { FooterConfig, ContactConfig, DEFAULT_SITE_CONFIG } from "@/lib/supabase/types";

interface FooterProps {
  config?: FooterConfig;
  contact?: ContactConfig;
}

const socialIcons = {
  whatsapp: MessageCircle,
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
};

const taglineIcons = {
  shield: Shield,
};

export default function Footer({
  config = DEFAULT_SITE_CONFIG.footer,
  contact = DEFAULT_SITE_CONFIG.contact
}: FooterProps) {
  const TaglineIcon = taglineIcons[config.taglineIcon as keyof typeof taglineIcons] || Shield;

  // Filter active items and sort by displayOrder
  const activeLinks = config.linkSections
    .filter(section => section.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const activeSocialLinks = config.socialLinks
    .filter(link => link.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const activeCtaButtons = config.ctaButtons.filter(btn => btn.isActive);

  return (
    <footer className="bg-ink text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <TaglineIcon className="w-6 h-6 text-teal" />
              <p className="font-display text-xl text-white">{config.tagline}</p>
            </div>
            <p className="font-body text-white/70 mb-6 text-sm leading-relaxed">
              {config.description}
            </p>

            {/* Social Links */}
            {activeSocialLinks.length > 0 && (
              <div className="flex items-center gap-3">
                {activeSocialLinks.map((social) => {
                  const Icon = socialIcons[social.platform];
                  return (
                    <a
                      key={social.id}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-teal/20 transition-colors"
                      aria-label={social.platform}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Link Sections */}
          {activeLinks.map((section) => (
            <div key={section.id}>
              <h3 className="font-display text-lg text-sunshine mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links
                  .filter(link => link.isActive)
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((link) => (
                    <li key={link.id}>
                      <Link
                        href={link.href}
                        className="font-body text-white/70 hover:text-teal transition-colors text-sm"
                        target={link.openInNewTab ? "_blank" : undefined}
                        rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}

          {/* Contact Section */}
          <div>
            <h3 className="font-display text-lg text-sunshine mb-4">Contact Us</h3>
            <div className="space-y-3 mb-6">
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-2 text-white/70 hover:text-teal transition-colors text-sm font-body"
              >
                <Phone className="w-4 h-4" />
                {contact.phone}
              </a>
              <a
                href={`https://wa.me/${contact.whatsapp.replace(/\+/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/70 hover:text-teal transition-colors text-sm font-body"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="text-white/70 hover:text-teal transition-colors text-sm font-body block"
                >
                  {contact.email}
                </a>
              )}
              {contact.address && (
                <p className="text-white/70 text-sm font-body">{contact.address}</p>
              )}
            </div>

            {/* CTA Buttons */}
            {activeCtaButtons.length > 0 && (
              <div className="flex flex-col gap-2">
                {activeCtaButtons.map((btn) => (
                  <a key={btn.id} href={btn.href}>
                    <Button variant={btn.variant} size="sm" className="w-full">
                      {btn.icon === 'phone' && <Phone className="w-4 h-4 mr-2" />}
                      {btn.icon === 'whatsapp' && <MessageCircle className="w-4 h-4 mr-2" />}
                      {btn.text}
                    </Button>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-body text-white/60 text-sm text-center md:text-left">
              {config.copyright}
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy" className="font-body text-white/60 hover:text-teal transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="font-body text-white/60 hover:text-teal transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
