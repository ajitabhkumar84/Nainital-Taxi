"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Save, Loader2, Eye, EyeOff, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import {
  DEFAULT_CONTACT_PAGE_CONTENT,
  type ContactCardKey,
  type ContactPageContent,
} from "@/lib/supabase/types";

// Must match the icon maps in src/components/contact/ContactInfo.tsx and
// src/app/contact/page.tsx — an icon name not listed there silently falls back.
const ICON_OPTIONS = ["clock", "calendar", "award", "shield", "heart", "star"];

const CARD_FIELDS: { key: ContactCardKey; label: string; valueNote: string }[] = [
  { key: "whatsapp", label: "WhatsApp card", valueNote: "Shows the WhatsApp number from Site Config" },
  { key: "phone", label: "Call Us card", valueNote: "Shows the phone number from Site Config" },
  { key: "email", label: "Email card", valueNote: "Shows the email address from Site Config" },
  { key: "address", label: "Office Address card", valueNote: "Shows the address from Site Config" },
];

const inputClass =
  "w-full px-4 py-2 border-2 border-ink/20 rounded-lg focus:border-teal focus:outline-none font-body";
const smallInputClass =
  "w-full px-3 py-2 border border-ink/20 rounded focus:border-teal focus:outline-none text-sm font-body";

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4 shadow-retro">
      <h2 className="font-display text-xl text-ink border-b-2 border-ink/10 pb-2">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-body text-sm text-ink/70 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-ink/50 font-body mt-1">{hint}</p>}
    </div>
  );
}

export default function ContactPageForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [data, setData] = useState<ContactPageContent | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/admin/contact-page");
        if (!response.ok) throw new Error("Failed to load contact page content");
        const content: ContactPageContent = await response.json();
        setData({
          ...content,
          hero_badges: content.hero_badges || [],
          hours_items: content.hours_items || [],
          faqs: content.faqs || [],
          trust_badges: content.trust_badges || [],
          contact_cards: {
            ...DEFAULT_CONTACT_PAGE_CONTENT.contact_cards,
            ...(content.contact_cards || {}),
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load contact page content");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = <K extends keyof ContactPageContent>(key: K, value: ContactPageContent[K]) => {
    setData((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const setCard = (key: ContactCardKey, field: "title" | "description" | "footnote", value: string) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            contact_cards: {
              ...prev.contact_cards,
              [key]: { ...prev.contact_cards[key], [field]: value },
            },
          }
        : prev
    );
  };

  // Generic list helpers, shared by hero badges / hours / FAQs / trust badges.
  const updateItem = <T,>(list: T[], index: number, patch: Partial<T>): T[] =>
    list.map((item, i) => (i === index ? { ...item, ...patch } : item));

  const moveItem = <T,>(list: T[], index: number, direction: -1 | 1): T[] => {
    const target = index + direction;
    if (target < 0 || target >= list.length) return list;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch("/api/admin/contact-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save contact page content");
      }

      const content: ContactPageContent = await response.json();
      setData({
        ...content,
        hero_badges: content.hero_badges || [],
        hours_items: content.hours_items || [],
        faqs: content.faqs || [],
        trust_badges: content.trust_badges || [],
        contact_cards: {
          ...DEFAULT_CONTACT_PAGE_CONTENT.contact_cards,
          ...(content.contact_cards || {}),
        },
      });
      setSuccess("Contact page saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save contact page content");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-coral/10 border-3 border-coral rounded-xl p-4 text-coral font-body">
        {error || "Contact page content is unavailable."}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display text-ink">Contact Us Page</h1>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => set("is_published", !data.is_published)}
            className={`inline-flex items-center gap-2 px-4 py-2 font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-retro-sm transition-all ${
              data.is_published ? "bg-teal/20 text-teal" : "bg-gray-100 text-gray-600"
            }`}
          >
            {data.is_published ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            {data.is_published ? "Published" : "Unpublished"}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2 bg-sunshine text-ink font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-retro-sm transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-coral/10 border-3 border-coral rounded-xl p-4 text-coral font-body">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-teal/10 border-3 border-teal rounded-xl p-4 text-teal font-body">
          {success}
        </div>
      )}

      {/* SEO */}
      <Panel title="SEO Settings">
        <Field label="SEO Title">
          <input
            type="text"
            value={data.seo_title}
            onChange={(e) => set("seo_title", e.target.value)}
            className={inputClass}
            placeholder="Contact Us - Nainital Taxi Services"
          />
        </Field>
        <Field label="SEO Description">
          <textarea
            value={data.seo_description}
            onChange={(e) => set("seo_description", e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="Get in touch with Nainital Taxi for bookings, inquiries and quotes..."
          />
        </Field>
      </Panel>

      {/* Hero */}
      <Panel title="Hero Section">
        <Field label="Hero Title">
          <input
            type="text"
            value={data.hero_title}
            onChange={(e) => set("hero_title", e.target.value)}
            className={inputClass}
            placeholder="Get in Touch"
          />
        </Field>
        <Field label="Hero Subtitle">
          <textarea
            value={data.hero_subtitle}
            onChange={(e) => set("hero_subtitle", e.target.value)}
            rows={2}
            className={inputClass}
          />
        </Field>

        <div className="space-y-2">
          <p className="font-body text-sm text-ink/70">Hero Badges</p>
          {data.hero_badges.map((badge, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={badge.label}
                onChange={(e) =>
                  set("hero_badges", updateItem(data.hero_badges, index, { label: e.target.value }))
                }
                className={smallInputClass}
                placeholder="e.g., Experienced Drivers"
              />
              <button
                type="button"
                onClick={() => set("hero_badges", moveItem(data.hero_badges, index, -1))}
                disabled={index === 0}
                aria-label="Move badge up"
                className="p-2 text-ink/60 hover:text-ink disabled:opacity-30"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => set("hero_badges", moveItem(data.hero_badges, index, 1))}
                disabled={index === data.hero_badges.length - 1}
                aria-label="Move badge down"
                className="p-2 text-ink/60 hover:text-ink disabled:opacity-30"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  set("hero_badges", data.hero_badges.filter((_, i) => i !== index))
                }
                aria-label="Remove badge"
                className="p-2 text-coral hover:bg-coral/10 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => set("hero_badges", [...data.hero_badges, { label: "" }])}
            className="inline-flex items-center gap-1 text-sm font-body text-teal hover:underline"
          >
            <Plus className="w-4 h-4" /> Add badge
          </button>
        </div>
      </Panel>

      {/* Enquiry form */}
      <Panel title="Enquiry Form">
        <Field label="Form Heading">
          <input
            type="text"
            value={data.form_title}
            onChange={(e) => set("form_title", e.target.value)}
            className={inputClass}
            placeholder="Request a Free Quote"
          />
        </Field>
        <Field label="Form Description">
          <textarea
            value={data.form_description}
            onChange={(e) => set("form_description", e.target.value)}
            rows={2}
            className={inputClass}
          />
        </Field>
        <Field
          label="Send enquiries to (email)"
          hint="Every submitted enquiry is emailed here. Leave blank to fall back to the ADMIN_EMAIL environment variable. Note: delivery also requires the sending domain to be verified in Resend."
        >
          <input
            type="email"
            value={data.enquiry_recipient_email || ""}
            onChange={(e) => set("enquiry_recipient_email", e.target.value || null)}
            className={inputClass}
            placeholder="taxinainital@gmail.com"
          />
        </Field>
      </Panel>

      {/* Contact cards */}
      <Panel title="Contact Information Cards">
        <p className="text-xs text-ink/50 font-body -mt-2">
          The phone number, WhatsApp number, email and address themselves are edited once in{" "}
          <Link href="/admin/site-config" className="text-teal hover:underline">
            Site Config
          </Link>{" "}
          so they stay identical across the header, footer and this page. Only the labels around
          them are set here.
        </p>
        <Field label="Section Heading">
          <input
            type="text"
            value={data.info_heading}
            onChange={(e) => set("info_heading", e.target.value)}
            className={inputClass}
            placeholder="Contact Information"
          />
        </Field>
        <Field label="Section Subheading">
          <input
            type="text"
            value={data.info_subheading}
            onChange={(e) => set("info_subheading", e.target.value)}
            className={inputClass}
          />
        </Field>

        {CARD_FIELDS.map(({ key, label, valueNote }) => (
          <div key={key} className="p-4 border-2 border-ink/10 rounded-lg space-y-3">
            <p className="text-sm font-body font-semibold text-ink/70">{label}</p>
            <p className="text-xs text-ink/50 font-body">{valueNote}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-body text-xs text-ink/70 mb-1">Title</label>
                <input
                  type="text"
                  value={data.contact_cards[key]?.title || ""}
                  onChange={(e) => setCard(key, "title", e.target.value)}
                  className={smallInputClass}
                />
              </div>
              <div>
                <label className="block font-body text-xs text-ink/70 mb-1">Description</label>
                <input
                  type="text"
                  value={data.contact_cards[key]?.description || ""}
                  onChange={(e) => setCard(key, "description", e.target.value)}
                  className={smallInputClass}
                />
              </div>
              <div>
                <label className="block font-body text-xs text-ink/70 mb-1">
                  Footnote (optional)
                </label>
                <input
                  type="text"
                  value={data.contact_cards[key]?.footnote || ""}
                  onChange={(e) => setCard(key, "footnote", e.target.value)}
                  className={smallInputClass}
                />
              </div>
            </div>
          </div>
        ))}
      </Panel>

      {/* Map */}
      <Panel title="Google Map">
        <Field label="Map Heading">
          <input
            type="text"
            value={data.map_heading}
            onChange={(e) => set("map_heading", e.target.value)}
            className={inputClass}
            placeholder="Find Us on Map"
          />
        </Field>
        <Field
          label="Google Business listing name"
          hint="Type your business exactly as it appears on Google Maps. This is what the embedded map searches for, and where the 'Open in Google Maps' button points."
        >
          <input
            type="text"
            value={data.google_business_name}
            onChange={(e) => set("google_business_name", e.target.value)}
            className={inputClass}
            placeholder="e.g., Nainital Taxi Services, Mallital"
          />
        </Field>
        <Field
          label="Custom embed URL (optional)"
          hint={
            "Only needed if the listing name doesn't pin the exact spot. In Google Maps: find your business → Share → Embed a map → Copy HTML, then paste only the URL inside src=\"…\" here. Leaving this blank uses the listing name above."
          }
        >
          <input
            type="url"
            value={data.map_embed_url || ""}
            onChange={(e) => set("map_embed_url", e.target.value || null)}
            className={inputClass}
            placeholder="https://www.google.com/maps/embed?pb=..."
          />
        </Field>
        <Field label="Map Button Label">
          <input
            type="text"
            value={data.map_button_label}
            onChange={(e) => set("map_button_label", e.target.value)}
            className={inputClass}
            placeholder="Open in Google Maps"
          />
        </Field>
      </Panel>

      {/* Operating hours */}
      <Panel title="Operating Hours">
        <Field label="Heading">
          <input
            type="text"
            value={data.hours_heading}
            onChange={(e) => set("hours_heading", e.target.value)}
            className={inputClass}
            placeholder="Operating Hours"
          />
        </Field>
        {data.hours_items.map((item, index) => (
          <div key={index} className="p-4 border-2 border-ink/10 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
              <div>
                <label className="block font-body text-xs text-ink/70 mb-1">Icon</label>
                <select
                  value={item.icon_name}
                  onChange={(e) =>
                    set("hours_items", updateItem(data.hours_items, index, { icon_name: e.target.value }))
                  }
                  className={smallInputClass}
                >
                  {ICON_OPTIONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-body text-xs text-ink/70 mb-1">Bold text</label>
                <input
                  type="text"
                  value={item.strong}
                  onChange={(e) =>
                    set("hours_items", updateItem(data.hours_items, index, { strong: e.target.value }))
                  }
                  className={smallInputClass}
                  placeholder="24/7"
                />
              </div>
              <div>
                <label className="block font-body text-xs text-ink/70 mb-1">Rest of text</label>
                <input
                  type="text"
                  value={item.rest}
                  onChange={(e) =>
                    set("hours_items", updateItem(data.hours_items, index, { rest: e.target.value }))
                  }
                  className={smallInputClass}
                  placeholder="Available"
                />
              </div>
              <button
                type="button"
                onClick={() => set("hours_items", data.hours_items.filter((_, i) => i !== index))}
                aria-label="Remove item"
                className="p-2 text-coral hover:bg-coral/10 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            set("hours_items", [...data.hours_items, { icon_name: "clock", strong: "", rest: "" }])
          }
          className="inline-flex items-center gap-1 text-sm font-body text-teal hover:underline"
        >
          <Plus className="w-4 h-4" /> Add item
        </button>
      </Panel>

      {/* FAQs */}
      <Panel title="Frequently Asked Questions">
        <Field label="FAQ Heading">
          <input
            type="text"
            value={data.faq_heading}
            onChange={(e) => set("faq_heading", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="FAQ Subheading">
          <input
            type="text"
            value={data.faq_subheading}
            onChange={(e) => set("faq_subheading", e.target.value)}
            className={inputClass}
          />
        </Field>

        {data.faqs.map((faq, index) => (
          <div key={index} className="p-4 border-2 border-ink/10 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-body font-semibold text-ink/70">Question {index + 1}</p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => set("faqs", moveItem(data.faqs, index, -1))}
                  disabled={index === 0}
                  aria-label="Move question up"
                  className="p-2 text-ink/60 hover:text-ink disabled:opacity-30"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => set("faqs", moveItem(data.faqs, index, 1))}
                  disabled={index === data.faqs.length - 1}
                  aria-label="Move question down"
                  className="p-2 text-ink/60 hover:text-ink disabled:opacity-30"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => set("faqs", data.faqs.filter((_, i) => i !== index))}
                  aria-label="Remove question"
                  className="p-2 text-coral hover:bg-coral/10 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <input
              type="text"
              value={faq.question}
              onChange={(e) => set("faqs", updateItem(data.faqs, index, { question: e.target.value }))}
              className={smallInputClass}
              placeholder="Question"
            />
            <textarea
              value={faq.answer}
              onChange={(e) => set("faqs", updateItem(data.faqs, index, { answer: e.target.value }))}
              rows={3}
              className={smallInputClass}
              placeholder="Answer"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => set("faqs", [...data.faqs, { question: "", answer: "" }])}
          className="inline-flex items-center gap-1 text-sm font-body text-teal hover:underline"
        >
          <Plus className="w-4 h-4" /> Add question
        </button>

        <div className="pt-2 space-y-4 border-t-2 border-ink/10">
          <Field label="&quot;Still have questions?&quot; Heading">
            <input
              type="text"
              value={data.faq_cta_heading}
              onChange={(e) => set("faq_cta_heading", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="&quot;Still have questions?&quot; Description">
            <textarea
              value={data.faq_cta_description}
              onChange={(e) => set("faq_cta_description", e.target.value)}
              rows={2}
              className={inputClass}
            />
          </Field>
        </div>
      </Panel>

      {/* Bottom CTA */}
      <Panel title="Bottom CTA Section">
        <Field label="CTA Heading">
          <input
            type="text"
            value={data.cta_heading}
            onChange={(e) => set("cta_heading", e.target.value)}
            className={inputClass}
            placeholder="Ready to Book Your Journey?"
          />
        </Field>
        <Field label="CTA Subheading">
          <textarea
            value={data.cta_subheading}
            onChange={(e) => set("cta_subheading", e.target.value)}
            rows={2}
            className={inputClass}
          />
        </Field>

        <div className="space-y-2">
          <p className="font-body text-sm text-ink/70">Trust Badges</p>
          {data.trust_badges.map((badge, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                value={badge.icon_name}
                onChange={(e) =>
                  set("trust_badges", updateItem(data.trust_badges, index, { icon_name: e.target.value }))
                }
                className={`${smallInputClass} max-w-[140px]`}
              >
                {ICON_OPTIONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={badge.label}
                onChange={(e) =>
                  set("trust_badges", updateItem(data.trust_badges, index, { label: e.target.value }))
                }
                className={smallInputClass}
                placeholder="e.g., Verified Drivers"
              />
              <button
                type="button"
                onClick={() => set("trust_badges", data.trust_badges.filter((_, i) => i !== index))}
                aria-label="Remove trust badge"
                className="p-2 text-coral hover:bg-coral/10 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              set("trust_badges", [...data.trust_badges, { icon_name: "shield", label: "" }])
            }
            className="inline-flex items-center gap-1 text-sm font-body text-teal hover:underline"
          >
            <Plus className="w-4 h-4" /> Add trust badge
          </button>
        </div>
      </Panel>

      <div className="flex justify-end sticky bottom-4">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-8 py-3 bg-sunshine text-ink font-body font-bold rounded-xl border-3 border-ink shadow-retro hover:shadow-retro-lg transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>
    </form>
  );
}
