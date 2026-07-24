"use client";

import React, { useState, useEffect } from "react";
import { Building2, Save, Loader2, Plus, Trash2, MoveUp, MoveDown } from "lucide-react";
import { Button } from "@/components/ui";
import { B2BPageConfig, DEFAULT_B2B_CONFIG } from "@/lib/supabase/types";

export default function B2BConfigPage() {
  const [config, setConfig] = useState<B2BPageConfig>(DEFAULT_B2B_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/settings?key=b2b_page_config');
      const data = await response.json();

      if (data.success && data.data) {
        setConfig({ ...DEFAULT_B2B_CONFIG, ...data.data });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'b2b_page_config',
          value: config,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'B2B page configuration saved successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save configuration' });
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ type: 'error', text: 'Error saving configuration' });
    } finally {
      setSaving(false);
    }
  };

  const addPricingTier = () => {
    setConfig({
      ...config,
      pricing_tiers: [
        ...config.pricing_tiers,
        {
          name: "New Tier",
          monthly_volume: "0-0 trips",
          discount: "0% off retail",
          payment_terms: "To be decided",
          is_featured: false,
          order: config.pricing_tiers.length + 1,
        },
      ],
    });
  };

  const removePricingTier = (index: number) => {
    setConfig({
      ...config,
      pricing_tiers: config.pricing_tiers.filter((_, i) => i !== index),
    });
  };

  const addBenefit = () => {
    setConfig({
      ...config,
      benefits: [
        ...config.benefits,
        {
          title: "New Benefit",
          description: "Description here",
          icon: "✓",
          order: config.benefits.length + 1,
        },
      ],
    });
  };

  const removeBenefit = (index: number) => {
    setConfig({
      ...config,
      benefits: config.benefits.filter((_, i) => i !== index),
    });
  };

  const addFleetItem = () => {
    setConfig({
      ...config,
      fleet_items: [
        ...config.fleet_items,
        {
          vehicle_name: "New Vehicle",
          capacity: "4 Seater",
          model_year: "2023",
          ac_status: "AC",
          order: config.fleet_items.length + 1,
        },
      ],
    });
  };

  const removeFleetItem = (index: number) => {
    setConfig({
      ...config,
      fleet_items: config.fleet_items.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sunrise/20 to-lake/20 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl border-3 border-ink shadow-retro-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-8 h-8 text-teal" />
                <h1 className="text-4xl font-display text-ink">B2B Page Configuration</h1>
              </div>
              <p className="text-ink/70 font-body">
                Customize your B2B tour operator landing page content
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving} variant="primary" size="lg">
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          {message && (
            <div
              className={`mt-6 p-4 rounded-lg border-2 ${
                message.type === 'success'
                  ? 'bg-teal/10 border-teal text-teal'
                  : 'bg-coral/10 border-coral text-coral'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-2xl border-3 border-ink shadow-retro-lg p-8 mb-8">
          <h2 className="text-2xl font-display text-ink mb-6">Hero Section</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-body font-bold text-ink mb-2">Title</label>
              <input
                type="text"
                value={config.hero_title}
                onChange={(e) => setConfig({ ...config, hero_title: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body"
              />
            </div>
            <div>
              <label className="block text-sm font-body font-bold text-ink mb-2">Subtitle</label>
              <input
                type="text"
                value={config.hero_subtitle}
                onChange={(e) => setConfig({ ...config, hero_subtitle: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body"
              />
            </div>
            <div>
              <label className="block text-sm font-body font-bold text-ink mb-2">Description</label>
              <textarea
                rows={3}
                value={config.hero_description}
                onChange={(e) => setConfig({ ...config, hero_description: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-body font-bold text-ink mb-2">Primary CTA Text</label>
                <input
                  type="text"
                  value={config.hero_cta_text}
                  onChange={(e) => setConfig({ ...config, hero_cta_text: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-body font-bold text-ink mb-2">Secondary CTA Text</label>
                <input
                  type="text"
                  value={config.hero_cta_secondary_text}
                  onChange={(e) => setConfig({ ...config, hero_cta_secondary_text: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div className="bg-white rounded-2xl border-3 border-ink shadow-retro-lg p-8 mb-8">
          <h2 className="text-2xl font-display text-ink mb-6">Company Information</h2>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-body font-bold text-ink mb-2">GST Number</label>
                <input
                  type="text"
                  value={config.gst_number}
                  onChange={(e) => setConfig({ ...config, gst_number: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-body font-bold text-ink mb-2">Total Vehicles</label>
                <input
                  type="number"
                  value={config.total_vehicles}
                  onChange={(e) => setConfig({ ...config, total_vehicles: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-body font-bold text-ink mb-2">Company Address</label>
              <input
                type="text"
                value={config.company_address}
                onChange={(e) => setConfig({ ...config, company_address: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body"
              />
            </div>
            <div>
              <label className="block text-sm font-body font-bold text-ink mb-2">Service Area Description</label>
              <textarea
                rows={2}
                value={config.service_area_description}
                onChange={(e) => setConfig({ ...config, service_area_description: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body"
              />
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="bg-white rounded-2xl border-3 border-ink shadow-retro-lg p-8 mb-8">
          <h2 className="text-2xl font-display text-ink mb-6">Trust Indicators</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-body font-bold text-ink mb-2">Years Experience</label>
              <input
                type="text"
                value={config.years_experience}
                onChange={(e) => setConfig({ ...config, years_experience: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body"
                placeholder="15+"
              />
            </div>
            <div>
              <label className="block text-sm font-body font-bold text-ink mb-2">Satisfied Operators</label>
              <input
                type="text"
                value={config.satisfied_operators}
                onChange={(e) => setConfig({ ...config, satisfied_operators: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body"
                placeholder="50+"
              />
            </div>
            <div>
              <label className="block text-sm font-body font-bold text-ink mb-2">Monthly Trips</label>
              <input
                type="text"
                value={config.monthly_trips}
                onChange={(e) => setConfig({ ...config, monthly_trips: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body"
                placeholder="200+"
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-2xl border-3 border-ink shadow-retro-lg p-8 mb-8">
          <h2 className="text-2xl font-display text-ink mb-6">Contact Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-body font-bold text-ink mb-2">Contact Person</label>
              <input
                type="text"
                value={config.contact_person_name}
                onChange={(e) => setConfig({ ...config, contact_person_name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body"
              />
            </div>
            <div>
              <label className="block text-sm font-body font-bold text-ink mb-2">Designation</label>
              <input
                type="text"
                value={config.contact_person_designation}
                onChange={(e) => setConfig({ ...config, contact_person_designation: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body"
              />
            </div>
            <div>
              <label className="block text-sm font-body font-bold text-ink mb-2">Email</label>
              <input
                type="email"
                value={config.contact_email}
                onChange={(e) => setConfig({ ...config, contact_email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body"
              />
            </div>
            <div>
              <label className="block text-sm font-body font-bold text-ink mb-2">Phone</label>
              <input
                type="tel"
                value={config.contact_phone}
                onChange={(e) => setConfig({ ...config, contact_phone: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body"
              />
            </div>
            <div>
              <label className="block text-sm font-body font-bold text-ink mb-2">WhatsApp</label>
              <input
                type="tel"
                value={config.contact_whatsapp}
                onChange={(e) => setConfig({ ...config, contact_whatsapp: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body"
              />
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="bg-white rounded-2xl border-3 border-ink shadow-retro-lg p-8 mb-8">
          <h2 className="text-2xl font-display text-ink mb-6">SEO Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-body font-bold text-ink mb-2">Meta Title</label>
              <input
                type="text"
                value={config.meta_title}
                onChange={(e) => setConfig({ ...config, meta_title: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body"
              />
            </div>
            <div>
              <label className="block text-sm font-body font-bold text-ink mb-2">Meta Description</label>
              <textarea
                rows={2}
                value={config.meta_description}
                onChange={(e) => setConfig({ ...config, meta_description: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body"
              />
            </div>
          </div>
        </div>

        {/* Note about other sections */}
        <div className="bg-sunshine/20 rounded-2xl border-2 border-sunshine p-6 text-center">
          <p className="text-ink/70 font-body">
            💡 <strong>Benefits, Pricing Tiers, and Fleet Items</strong> management coming soon with full UI controls.
            <br />For now, these can be edited via direct JSON in admin settings.
          </p>
        </div>
      </div>
    </div>
  );
}
