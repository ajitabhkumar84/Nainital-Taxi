"use client";

import React, { useState, useEffect } from "react";
import {
  Save,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Globe,
  Menu,
  LayoutGrid,
  Phone,
  Mail,
  MapPin,
  Loader2,
  Eye,
  EyeOff,
  BarChart3,
  Code,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminSiteConfig } from "@/hooks/useSiteConfig";
import { NavLink, SocialLink, CTAButton, FooterLinkSection, DEFAULT_SITE_CONFIG } from "@/lib/supabase/types";

export default function SiteConfigPage() {
  const { config, isLoading, updateConfig, isSaving, initializeConfig } = useAdminSiteConfig();
  const [activeTab, setActiveTab] = useState<"header" | "footer" | "contact" | "tracking">("header");
  const [localConfig, setLocalConfig] = useState(config);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleSave = async () => {
    const success = await updateConfig(localConfig);
    if (success) {
      setHasChanges(false);
    }
  };

  const handleInitialize = async () => {
    if (confirm("This will reset all site configuration to defaults. Continue?")) {
      await initializeConfig();
    }
  };

  // Header nav link handlers
  const updateNavLink = (index: number, field: keyof NavLink, value: any) => {
    const newLinks = [...localConfig.header.navLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setLocalConfig({
      ...localConfig,
      header: { ...localConfig.header, navLinks: newLinks },
    });
    setHasChanges(true);
  };

  const addNavLink = () => {
    const newLink: NavLink = {
      id: `nav-${Date.now()}`,
      href: "/",
      label: "New Link",
      isActive: true,
      displayOrder: localConfig.header.navLinks.length,
    };
    setLocalConfig({
      ...localConfig,
      header: { ...localConfig.header, navLinks: [...localConfig.header.navLinks, newLink] },
    });
    setHasChanges(true);
  };

  const removeNavLink = (index: number) => {
    const newLinks = localConfig.header.navLinks.filter((_, i) => i !== index);
    setLocalConfig({
      ...localConfig,
      header: { ...localConfig.header, navLinks: newLinks },
    });
    setHasChanges(true);
  };

  const moveNavLink = (index: number, direction: "up" | "down") => {
    const newLinks = [...localConfig.header.navLinks];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newLinks.length) return;
    [newLinks[index], newLinks[newIndex]] = [newLinks[newIndex], newLinks[index]];
    newLinks.forEach((link, i) => (link.displayOrder = i));
    setLocalConfig({
      ...localConfig,
      header: { ...localConfig.header, navLinks: newLinks },
    });
    setHasChanges(true);
  };

  // Footer social link handlers
  const updateSocialLink = (index: number, field: keyof SocialLink, value: any) => {
    const newLinks = [...localConfig.footer.socialLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setLocalConfig({
      ...localConfig,
      footer: { ...localConfig.footer, socialLinks: newLinks },
    });
    setHasChanges(true);
  };

  const addSocialLink = () => {
    const newLink: SocialLink = {
      id: `social-${Date.now()}`,
      platform: "whatsapp",
      url: "",
      isActive: true,
      displayOrder: localConfig.footer.socialLinks.length,
    };
    setLocalConfig({
      ...localConfig,
      footer: { ...localConfig.footer, socialLinks: [...localConfig.footer.socialLinks, newLink] },
    });
    setHasChanges(true);
  };

  const removeSocialLink = (index: number) => {
    const newLinks = localConfig.footer.socialLinks.filter((_, i) => i !== index);
    setLocalConfig({
      ...localConfig,
      footer: { ...localConfig.footer, socialLinks: newLinks },
    });
    setHasChanges(true);
  };

  // Footer link section handlers
  const addFooterLinkSection = () => {
    const newSection: FooterLinkSection = {
      id: `section-${Date.now()}`,
      title: "New Section",
      links: [],
      displayOrder: localConfig.footer.linkSections.length,
      isActive: true,
    };
    setLocalConfig({
      ...localConfig,
      footer: { ...localConfig.footer, linkSections: [...localConfig.footer.linkSections, newSection] },
    });
    setHasChanges(true);
  };

  const updateFooterLinkSection = (sectionIndex: number, field: keyof FooterLinkSection, value: any) => {
    const newSections = [...localConfig.footer.linkSections];
    newSections[sectionIndex] = { ...newSections[sectionIndex], [field]: value };
    setLocalConfig({
      ...localConfig,
      footer: { ...localConfig.footer, linkSections: newSections },
    });
    setHasChanges(true);
  };

  const removeFooterLinkSection = (sectionIndex: number) => {
    const newSections = localConfig.footer.linkSections.filter((_, i) => i !== sectionIndex);
    setLocalConfig({
      ...localConfig,
      footer: { ...localConfig.footer, linkSections: newSections },
    });
    setHasChanges(true);
  };

  const addFooterLink = (sectionIndex: number) => {
    const newSections = [...localConfig.footer.linkSections];
    const newLink: NavLink = {
      id: `link-${Date.now()}`,
      href: "/",
      label: "New Link",
      isActive: true,
      displayOrder: newSections[sectionIndex].links.length,
    };
    newSections[sectionIndex] = {
      ...newSections[sectionIndex],
      links: [...newSections[sectionIndex].links, newLink],
    };
    setLocalConfig({
      ...localConfig,
      footer: { ...localConfig.footer, linkSections: newSections },
    });
    setHasChanges(true);
  };

  const updateFooterLink = (sectionIndex: number, linkIndex: number, field: keyof NavLink, value: any) => {
    const newSections = [...localConfig.footer.linkSections];
    const newLinks = [...newSections[sectionIndex].links];
    newLinks[linkIndex] = { ...newLinks[linkIndex], [field]: value };
    newSections[sectionIndex] = { ...newSections[sectionIndex], links: newLinks };
    setLocalConfig({
      ...localConfig,
      footer: { ...localConfig.footer, linkSections: newSections },
    });
    setHasChanges(true);
  };

  const removeFooterLink = (sectionIndex: number, linkIndex: number) => {
    const newSections = [...localConfig.footer.linkSections];
    newSections[sectionIndex] = {
      ...newSections[sectionIndex],
      links: newSections[sectionIndex].links.filter((_, i) => i !== linkIndex),
    };
    setLocalConfig({
      ...localConfig,
      footer: { ...localConfig.footer, linkSections: newSections },
    });
    setHasChanges(true);
  };

  const moveFooterLinkSection = (index: number, direction: "up" | "down") => {
    const newSections = [...localConfig.footer.linkSections];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newSections.length) return;
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    newSections.forEach((section, i) => (section.displayOrder = i));
    setLocalConfig({
      ...localConfig,
      footer: { ...localConfig.footer, linkSections: newSections },
    });
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-teal animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display text-ink">Site Configuration</h1>
          <p className="text-ink/60 font-body">Customize header, footer, and contact information</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleInitialize}
            className="px-4 py-2 bg-white text-ink font-body rounded-xl border-3 border-ink hover:bg-sunrise/30 transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-retro-sm transition-all",
              hasChanges ? "bg-teal text-white" : "bg-ink/10 text-ink/50"
            )}
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b-3 border-ink pb-2">
        {(["header", "footer", "contact", "tracking"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-t-xl font-body font-semibold transition-colors capitalize",
              activeTab === tab
                ? "bg-sunshine border-3 border-b-0 border-ink"
                : "text-ink/60 hover:text-ink"
            )}
          >
            {tab === "header" && <Menu className="w-4 h-4 inline mr-2" />}
            {tab === "footer" && <LayoutGrid className="w-4 h-4 inline mr-2" />}
            {tab === "contact" && <Phone className="w-4 h-4 inline mr-2" />}
            {tab === "tracking" && <BarChart3 className="w-4 h-4 inline mr-2" />}
            {tab}
          </button>
        ))}
      </div>

      {/* Header Tab */}
      {activeTab === "header" && (
        <div className="space-y-6">
          {/* Logo Settings */}
          <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4">
            <h2 className="font-display text-lg text-ink border-b-2 border-ink/10 pb-2">Logo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-body text-sm text-ink/70 mb-1">Logo Text</label>
                <input
                  type="text"
                  value={localConfig.header.logoText}
                  onChange={(e) => {
                    setLocalConfig({
                      ...localConfig,
                      header: { ...localConfig.header, logoText: e.target.value },
                    });
                    setHasChanges(true);
                  }}
                  className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
                />
              </div>
              <div>
                <label className="block font-body text-sm text-ink/70 mb-1">Logo Emoji</label>
                <input
                  type="text"
                  value={localConfig.header.logoEmoji}
                  onChange={(e) => {
                    setLocalConfig({
                      ...localConfig,
                      header: { ...localConfig.header, logoEmoji: e.target.value },
                    });
                    setHasChanges(true);
                  }}
                  className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
                />
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-ink/10 pb-2">
              <h2 className="font-display text-lg text-ink">Navigation Links</h2>
              <button
                onClick={addNavLink}
                className="inline-flex items-center gap-1 px-3 py-1 bg-sunrise hover:bg-sunshine rounded-lg text-sm font-body transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Link
              </button>
            </div>

            <div className="space-y-3">
              {localConfig.header.navLinks.map((link, index) => (
                <div
                  key={link.id}
                  className="flex items-center gap-3 p-3 bg-sunrise/30 rounded-xl"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveNavLink(index, "up")}
                      disabled={index === 0}
                      className="p-1 hover:bg-white rounded disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveNavLink(index, "down")}
                      disabled={index === localConfig.header.navLinks.length - 1}
                      className="p-1 hover:bg-white rounded disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => updateNavLink(index, "label", e.target.value)}
                    placeholder="Label"
                    className="flex-1 px-3 py-2 border-2 border-ink/30 rounded-lg font-body text-sm focus:outline-none focus:border-ink"
                  />

                  <input
                    type="text"
                    value={link.href}
                    onChange={(e) => updateNavLink(index, "href", e.target.value)}
                    placeholder="/path"
                    className="flex-1 px-3 py-2 border-2 border-ink/30 rounded-lg font-body text-sm focus:outline-none focus:border-ink"
                  />

                  <button
                    onClick={() => updateNavLink(index, "isActive", !link.isActive)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      link.isActive ? "bg-teal/20 text-teal" : "bg-ink/10 text-ink/40"
                    )}
                    title={link.isActive ? "Active" : "Inactive"}
                  >
                    {link.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => removeNavLink(index)}
                    className="p-2 hover:bg-coral/20 text-coral rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4">
            <h2 className="font-display text-lg text-ink border-b-2 border-ink/10 pb-2">CTA Buttons</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary CTA */}
              <div className="space-y-3">
                <h3 className="font-body font-semibold text-ink">Primary Button</h3>
                <input
                  type="text"
                  value={localConfig.header.ctaPrimary.text}
                  onChange={(e) => {
                    setLocalConfig({
                      ...localConfig,
                      header: {
                        ...localConfig.header,
                        ctaPrimary: { ...localConfig.header.ctaPrimary, text: e.target.value },
                      },
                    });
                    setHasChanges(true);
                  }}
                  placeholder="Button text"
                  className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body text-sm"
                />
                <input
                  type="text"
                  value={localConfig.header.ctaPrimary.href}
                  onChange={(e) => {
                    setLocalConfig({
                      ...localConfig,
                      header: {
                        ...localConfig.header,
                        ctaPrimary: { ...localConfig.header.ctaPrimary, href: e.target.value },
                      },
                    });
                    setHasChanges(true);
                  }}
                  placeholder="Link"
                  className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body text-sm"
                />
              </div>

              {/* Secondary CTA */}
              <div className="space-y-3">
                <h3 className="font-body font-semibold text-ink">Secondary Button</h3>
                <input
                  type="text"
                  value={localConfig.header.ctaSecondary.text}
                  onChange={(e) => {
                    setLocalConfig({
                      ...localConfig,
                      header: {
                        ...localConfig.header,
                        ctaSecondary: { ...localConfig.header.ctaSecondary, text: e.target.value },
                      },
                    });
                    setHasChanges(true);
                  }}
                  placeholder="Button text"
                  className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body text-sm"
                />
                <input
                  type="text"
                  value={localConfig.header.ctaSecondary.href}
                  onChange={(e) => {
                    setLocalConfig({
                      ...localConfig,
                      header: {
                        ...localConfig.header,
                        ctaSecondary: { ...localConfig.header.ctaSecondary, href: e.target.value },
                      },
                    });
                    setHasChanges(true);
                  }}
                  placeholder="Link (e.g., tel:+91...)"
                  className="w-full px-3 py-2 border-2 border-ink/30 rounded-lg font-body text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Tab */}
      {activeTab === "footer" && (
        <div className="space-y-6">
          {/* Footer Text */}
          <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4">
            <h2 className="font-display text-lg text-ink border-b-2 border-ink/10 pb-2">Footer Content</h2>

            <div>
              <label className="block font-body text-sm text-ink/70 mb-1">Tagline</label>
              <input
                type="text"
                value={localConfig.footer.tagline}
                onChange={(e) => {
                  setLocalConfig({
                    ...localConfig,
                    footer: { ...localConfig.footer, tagline: e.target.value },
                  });
                  setHasChanges(true);
                }}
                className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
              />
            </div>

            <div>
              <label className="block font-body text-sm text-ink/70 mb-1">Description</label>
              <textarea
                value={localConfig.footer.description}
                onChange={(e) => {
                  setLocalConfig({
                    ...localConfig,
                    footer: { ...localConfig.footer, description: e.target.value },
                  });
                  setHasChanges(true);
                }}
                rows={2}
                className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine resize-none"
              />
            </div>

            <div>
              <label className="block font-body text-sm text-ink/70 mb-1">Copyright Text</label>
              <input
                type="text"
                value={localConfig.footer.copyright}
                onChange={(e) => {
                  setLocalConfig({
                    ...localConfig,
                    footer: { ...localConfig.footer, copyright: e.target.value },
                  });
                  setHasChanges(true);
                }}
                className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
              />
            </div>
          </div>

          {/* Footer Link Sections (4 columns max) */}
          <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-ink/10 pb-2">
              <div>
                <h2 className="font-display text-lg text-ink">Footer Link Sections</h2>
                <p className="text-xs text-ink/60 mt-1">Organize links into columns (4 columns maximum)</p>
              </div>
              <button
                onClick={addFooterLinkSection}
                disabled={localConfig.footer.linkSections.length >= 4}
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-body transition-colors",
                  localConfig.footer.linkSections.length >= 4
                    ? "bg-ink/10 text-ink/40 cursor-not-allowed"
                    : "bg-sunrise hover:bg-sunshine"
                )}
              >
                <Plus className="w-4 h-4" />
                Add Section
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {localConfig.footer.linkSections.map((section, sectionIndex) => (
                <div key={section.id} className="border-2 border-ink/20 rounded-xl p-4 space-y-3">
                  {/* Section Header */}
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveFooterLinkSection(sectionIndex, "up")}
                        disabled={sectionIndex === 0}
                        className="p-1 hover:bg-sunrise/30 rounded disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveFooterLinkSection(sectionIndex, "down")}
                        disabled={sectionIndex === localConfig.footer.linkSections.length - 1}
                        className="p-1 hover:bg-sunrise/30 rounded disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateFooterLinkSection(sectionIndex, "title", e.target.value)}
                      placeholder="Section Title"
                      className="flex-1 px-3 py-2 border-2 border-ink/30 rounded-lg font-body font-semibold text-sm"
                    />

                    <button
                      onClick={() => updateFooterLinkSection(sectionIndex, "isActive", !section.isActive)}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        section.isActive ? "bg-teal/20 text-teal" : "bg-ink/10 text-ink/40"
                      )}
                    >
                      {section.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => removeFooterLinkSection(sectionIndex)}
                      className="p-2 hover:bg-coral/20 text-coral rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Links in Section */}
                  <div className="space-y-2 pl-7">
                    {section.links.map((link, linkIndex) => (
                      <div key={link.id} className="flex items-center gap-2 p-2 bg-sunrise/20 rounded-lg">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => updateFooterLink(sectionIndex, linkIndex, "label", e.target.value)}
                          placeholder="Label"
                          className="flex-1 px-2 py-1 border border-ink/20 rounded font-body text-xs"
                        />
                        <input
                          type="text"
                          value={link.href}
                          onChange={(e) => updateFooterLink(sectionIndex, linkIndex, "href", e.target.value)}
                          placeholder="/path"
                          className="flex-1 px-2 py-1 border border-ink/20 rounded font-body text-xs"
                        />
                        <button
                          onClick={() => updateFooterLink(sectionIndex, linkIndex, "isActive", !link.isActive)}
                          className={cn(
                            "p-1 rounded transition-colors",
                            link.isActive ? "bg-teal/20 text-teal" : "bg-ink/10 text-ink/40"
                          )}
                        >
                          {link.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => removeFooterLink(sectionIndex, linkIndex)}
                          className="p-1 hover:bg-coral/20 text-coral rounded transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() => addFooterLink(sectionIndex)}
                      className="w-full py-1 text-xs font-body text-ink/60 hover:text-ink border border-dashed border-ink/30 hover:border-ink/60 rounded-lg transition-colors"
                    >
                      + Add Link
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-ink/10 pb-2">
              <h2 className="font-display text-lg text-ink">Social Links</h2>
              <button
                onClick={addSocialLink}
                className="inline-flex items-center gap-1 px-3 py-1 bg-sunrise hover:bg-sunshine rounded-lg text-sm font-body transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Link
              </button>
            </div>

            <div className="space-y-3">
              {localConfig.footer.socialLinks.map((link, index) => (
                <div
                  key={link.id}
                  className="flex items-center gap-3 p-3 bg-sunrise/30 rounded-xl"
                >
                  <select
                    value={link.platform}
                    onChange={(e) => updateSocialLink(index, "platform", e.target.value)}
                    className="px-3 py-2 border-2 border-ink/30 rounded-lg font-body text-sm"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="twitter">Twitter</option>
                    <option value="youtube">YouTube</option>
                    <option value="linkedin">LinkedIn</option>
                  </select>

                  <input
                    type="text"
                    value={link.url}
                    onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                    placeholder="URL"
                    className="flex-1 px-3 py-2 border-2 border-ink/30 rounded-lg font-body text-sm"
                  />

                  <button
                    onClick={() => updateSocialLink(index, "isActive", !link.isActive)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      link.isActive ? "bg-teal/20 text-teal" : "bg-ink/10 text-ink/40"
                    )}
                  >
                    {link.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => removeSocialLink(index)}
                    className="p-2 hover:bg-coral/20 text-coral rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contact Tab */}
      {activeTab === "contact" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4">
            <h2 className="font-display text-lg text-ink border-b-2 border-ink/10 pb-2">Contact Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-body text-sm text-ink/70 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone Number
                </label>
                <input
                  type="text"
                  value={localConfig.contact.phone}
                  onChange={(e) => {
                    setLocalConfig({
                      ...localConfig,
                      contact: { ...localConfig.contact, phone: e.target.value },
                    });
                    setHasChanges(true);
                  }}
                  placeholder="+91..."
                  className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
                />
              </div>

              <div>
                <label className="block font-body text-sm text-ink/70 mb-1">
                  WhatsApp Number
                </label>
                <input
                  type="text"
                  value={localConfig.contact.whatsapp}
                  onChange={(e) => {
                    setLocalConfig({
                      ...localConfig,
                      contact: { ...localConfig.contact, whatsapp: e.target.value },
                    });
                    setHasChanges(true);
                  }}
                  placeholder="+91..."
                  className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
                />
              </div>

              <div>
                <label className="block font-body text-sm text-ink/70 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={localConfig.contact.email}
                  onChange={(e) => {
                    setLocalConfig({
                      ...localConfig,
                      contact: { ...localConfig.contact, email: e.target.value },
                    });
                    setHasChanges(true);
                  }}
                  placeholder="info@..."
                  className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
                />
              </div>

              <div>
                <label className="block font-body text-sm text-ink/70 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Address
                </label>
                <input
                  type="text"
                  value={localConfig.contact.address}
                  onChange={(e) => {
                    setLocalConfig({
                      ...localConfig,
                      contact: { ...localConfig.contact, address: e.target.value },
                    });
                    setHasChanges(true);
                  }}
                  placeholder="City, State, Country"
                  className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Tab */}
      {activeTab === "tracking" && (
        <div className="space-y-6">
          {/* Enable/Disable Tracking */}
          <div className="bg-white rounded-xl border-3 border-ink p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg text-ink">Analytics & Tracking</h2>
                <p className="text-sm text-ink/60 font-body mt-1">
                  Add tracking codes for Google Tag Manager, Analytics, Facebook Pixel, and custom scripts
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="font-body text-sm text-ink/70">
                  {localConfig.tracking.isEnabled ? "Enabled" : "Disabled"}
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={localConfig.tracking.isEnabled}
                    onChange={(e) => {
                      setLocalConfig({
                        ...localConfig,
                        tracking: { ...localConfig.tracking, isEnabled: e.target.checked },
                      });
                      setHasChanges(true);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-ink/20 rounded-full peer-checked:bg-teal transition-colors peer-focus:ring-2 peer-focus:ring-sunshine"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                </div>
              </label>
            </div>
          </div>

          {/* Tracking IDs */}
          <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4">
            <h2 className="font-display text-lg text-ink border-b-2 border-ink/10 pb-2">Tracking IDs</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-body text-sm text-ink/70 mb-1">
                  <Code className="w-4 h-4 inline mr-1" />
                  Google Tag Manager ID
                </label>
                <input
                  type="text"
                  value={localConfig.tracking.googleTagManagerId || ""}
                  onChange={(e) => {
                    setLocalConfig({
                      ...localConfig,
                      tracking: { ...localConfig.tracking, googleTagManagerId: e.target.value },
                    });
                    setHasChanges(true);
                  }}
                  placeholder="GTM-XXXXXXX"
                  className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sunshine"
                />
                <p className="text-xs text-ink/50 mt-1 font-body">
                  Format: GTM-XXXXXXX
                </p>
              </div>

              <div>
                <label className="block font-body text-sm text-ink/70 mb-1">
                  <BarChart3 className="w-4 h-4 inline mr-1" />
                  Google Analytics ID
                </label>
                <input
                  type="text"
                  value={localConfig.tracking.googleAnalyticsId || ""}
                  onChange={(e) => {
                    setLocalConfig({
                      ...localConfig,
                      tracking: { ...localConfig.tracking, googleAnalyticsId: e.target.value },
                    });
                    setHasChanges(true);
                  }}
                  placeholder="G-XXXXXXXXXX or UA-XXXXXXXXX-X"
                  className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sunshine"
                />
                <p className="text-xs text-ink/50 mt-1 font-body">
                  Format: G-XXXXXXXXXX (GA4) or UA-XXXXXXXXX-X (Universal)
                </p>
              </div>

              <div>
                <label className="block font-body text-sm text-ink/70 mb-1">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Facebook Pixel ID
                </label>
                <input
                  type="text"
                  value={localConfig.tracking.facebookPixelId || ""}
                  onChange={(e) => {
                    setLocalConfig({
                      ...localConfig,
                      tracking: { ...localConfig.tracking, facebookPixelId: e.target.value },
                    });
                    setHasChanges(true);
                  }}
                  placeholder="XXXXXXXXXXXXXXX"
                  className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sunshine"
                />
                <p className="text-xs text-ink/50 mt-1 font-body">
                  15-16 digit number
                </p>
              </div>
            </div>
          </div>

          {/* Custom Scripts */}
          <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4">
            <div>
              <h2 className="font-display text-lg text-ink border-b-2 border-ink/10 pb-2">Custom Scripts</h2>
              <p className="text-xs text-ink/50 mt-2 font-body">
                Add custom tracking scripts, analytics code, or other third-party integrations
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-body text-sm text-ink/70 mb-2">
                  <Code className="w-4 h-4 inline mr-1" />
                  Custom Head Scripts
                  <span className="text-xs text-ink/50 ml-2">(Injected in {"<head>"} tag)</span>
                </label>
                <textarea
                  value={localConfig.tracking.customHeadScripts || ""}
                  onChange={(e) => {
                    setLocalConfig({
                      ...localConfig,
                      tracking: { ...localConfig.tracking, customHeadScripts: e.target.value },
                    });
                    setHasChanges(true);
                  }}
                  placeholder={'<script>\n  // Your custom head scripts here\n</script>'}
                  rows={8}
                  className="w-full px-4 py-3 border-3 border-ink rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sunshine resize-y"
                />
                <p className="text-xs text-ink/50 mt-1 font-body">
                  Include complete script tags. These will be added to the {"<head>"} section.
                </p>
              </div>

              <div>
                <label className="block font-body text-sm text-ink/70 mb-2">
                  <Code className="w-4 h-4 inline mr-1" />
                  Custom Body Scripts
                  <span className="text-xs text-ink/50 ml-2">(Injected at end of {"<body>"} tag)</span>
                </label>
                <textarea
                  value={localConfig.tracking.customBodyScripts || ""}
                  onChange={(e) => {
                    setLocalConfig({
                      ...localConfig,
                      tracking: { ...localConfig.tracking, customBodyScripts: e.target.value },
                    });
                    setHasChanges(true);
                  }}
                  placeholder={'<script>\n  // Your custom body scripts here\n</script>'}
                  rows={8}
                  className="w-full px-4 py-3 border-3 border-ink rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sunshine resize-y"
                />
                <p className="text-xs text-ink/50 mt-1 font-body">
                  Include complete script tags. These will be added before the closing {"</body>"} tag.
                </p>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          {localConfig.tracking.isEnabled && (
            <div className="bg-sunshine/20 border-2 border-sunshine rounded-xl p-4">
              <p className="font-body text-sm text-ink">
                <strong>Note:</strong> Tracking scripts will only load when tracking is enabled. Test your
                implementation to ensure all scripts are working correctly. Make sure you comply with privacy
                regulations (GDPR, CCPA) when using tracking tools.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Save Reminder */}
      {hasChanges && (
        <div className="fixed bottom-4 right-4 bg-sunshine border-3 border-ink rounded-xl p-4 shadow-retro flex items-center gap-3">
          <span className="font-body text-ink">You have unsaved changes</span>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-teal text-white font-body font-semibold rounded-lg"
          >
            {isSaving ? "Saving..." : "Save Now"}
          </button>
        </div>
      )}
    </div>
  );
}
