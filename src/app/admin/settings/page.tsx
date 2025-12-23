"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Save,
  Phone,
  Mail,
  MessageCircle,
  IndianRupee,
  Car,
  Shield,
  RefreshCw,
  Check,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface AdminSettings {
  fleet_size: number;
  upi_id: string;
  whatsapp_number: string;
  business_phone: string;
  business_email: string;
  business_name: string;
  booking_advance_days: number;
  min_booking_hours: number;
}

const DEFAULT_SETTINGS: AdminSettings = {
  fleet_size: 10,
  upi_id: "gokumaon@upi",
  whatsapp_number: "8445206116",
  business_phone: "8445206116",
  business_email: "taxinainital@gmail.com",
  business_name: "Nainital Fun Taxi",
  booking_advance_days: 90,
  min_booking_hours: 4,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Password change
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("key, value");

      if (error) throw error;

      const settingsMap: Record<string, unknown> = {};
      ((data as Array<{ key: string; value: unknown }>) || []).forEach((item) => {
        settingsMap[item.key] = item.value;
      });

      setSettings({
        fleet_size: (settingsMap.fleet_size as number) || DEFAULT_SETTINGS.fleet_size,
        upi_id: (settingsMap.upi_id as string) || DEFAULT_SETTINGS.upi_id,
        whatsapp_number: (settingsMap.whatsapp_number as string) || DEFAULT_SETTINGS.whatsapp_number,
        business_phone: (settingsMap.business_phone as string) || DEFAULT_SETTINGS.business_phone,
        business_email: (settingsMap.business_email as string) || DEFAULT_SETTINGS.business_email,
        business_name: (settingsMap.business_name as string) || DEFAULT_SETTINGS.business_name,
        booking_advance_days: (settingsMap.booking_advance_days as number) || DEFAULT_SETTINGS.booking_advance_days,
        min_booking_hours: (settingsMap.min_booking_hours as number) || DEFAULT_SETTINGS.min_booking_hours,
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (key: keyof AdminSettings, value: string | number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setSaved(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Upsert each setting
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        description: getSettingDescription(key),
      }));

      for (const setting of settingsArray) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from("admin_settings") as any)
          .upsert(setting, { onConflict: "key" });

        if (error) throw error;
      }

      setSaved(true);
      setHasChanges(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getSettingDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      fleet_size: "Total number of vehicles in the fleet",
      upi_id: "UPI ID for receiving payments",
      whatsapp_number: "WhatsApp Business number",
      business_phone: "Main business phone number",
      business_email: "Business email for inquiries",
      business_name: "Business name for branding",
      booking_advance_days: "How many days in advance bookings can be made",
      min_booking_hours: "Minimum hours before pickup for new bookings",
    };
    return descriptions[key] || "";
  };

  const handlePasswordChange = () => {
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    // In production, this would update the password securely
    // For now, we'll just show a success message
    alert(
      "Password change would be implemented with proper authentication. " +
        "For now, update NEXT_PUBLIC_ADMIN_PASSWORD in your .env file."
    );
    setShowPasswordSection(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xl font-display text-ink animate-pulse">
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-ink">Settings</h1>
          <p className="text-ink/60 font-body mt-1">
            Configure your business settings and preferences
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving || !hasChanges}
          className={cn(
            "flex items-center gap-2 px-6 py-3 border-3 border-ink rounded-xl font-display shadow-retro-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all",
            hasChanges
              ? "bg-sunshine text-ink"
              : saved
              ? "bg-whatsapp text-white"
              : "bg-ink/10 text-ink/40 cursor-not-allowed"
          )}
        >
          {saving ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="w-5 h-5" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Settings
            </>
          )}
        </button>
      </div>

      {/* Business Information */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4">Business Information</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Business Name
            </label>
            <input
              type="text"
              value={settings.business_name}
              onChange={(e) => handleChange("business_name", e.target.value)}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>
          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4" />
                Fleet Size (Total Cars)
              </div>
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={settings.fleet_size}
              onChange={(e) => handleChange("fleet_size", parseInt(e.target.value) || 1)}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4">Contact Information</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Business Phone
              </div>
            </label>
            <input
              type="tel"
              value={settings.business_phone}
              onChange={(e) => handleChange("business_phone", e.target.value)}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>
          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                WhatsApp Number
              </div>
            </label>
            <input
              type="tel"
              value={settings.whatsapp_number}
              onChange={(e) => handleChange("whatsapp_number", e.target.value)}
              placeholder="Without country code"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block font-body text-sm text-ink/60 mb-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Business Email
              </div>
            </label>
            <input
              type="email"
              value={settings.business_email}
              onChange={(e) => handleChange("business_email", e.target.value)}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>
        </div>
      </div>

      {/* Payment Settings */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4">Payment Settings</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block font-body text-sm text-ink/60 mb-2">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4" />
                UPI ID
              </div>
            </label>
            <input
              type="text"
              value={settings.upi_id}
              onChange={(e) => handleChange("upi_id", e.target.value)}
              placeholder="yourname@upi"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
            <p className="text-sm text-ink/50 font-body mt-2">
              This UPI ID will be shown to customers for payment
            </p>
          </div>
        </div>
      </div>

      {/* Booking Settings */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4">Booking Settings</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Advance Booking Days
            </label>
            <input
              type="number"
              min="7"
              max="365"
              value={settings.booking_advance_days}
              onChange={(e) =>
                handleChange("booking_advance_days", parseInt(e.target.value) || 90)
              }
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
            <p className="text-sm text-ink/50 font-body mt-2">
              How many days in advance can customers book
            </p>
          </div>
          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Minimum Hours Before Pickup
            </label>
            <input
              type="number"
              min="1"
              max="48"
              value={settings.min_booking_hours}
              onChange={(e) =>
                handleChange("min_booking_hours", parseInt(e.target.value) || 4)
              }
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
            <p className="text-sm text-ink/50 font-body mt-2">
              Minimum hours required between booking and pickup
            </p>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-ink">Security</h2>
          <button
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="flex items-center gap-2 px-4 py-2 bg-ink/10 rounded-xl font-body text-sm hover:bg-ink/20 transition-colors"
          >
            <Shield className="w-4 h-4" />
            Change Password
          </button>
        </div>

        {showPasswordSection && (
          <div className="border-t-2 border-ink/10 pt-4 mt-4">
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block font-body text-sm text-ink/60 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
                />
              </div>
              <div>
                <label className="block font-body text-sm text-ink/60 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
                />
              </div>
              <div>
                <label className="block font-body text-sm text-ink/60 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
                />
              </div>
              {passwordError && (
                <p className="text-coral font-body text-sm">{passwordError}</p>
              )}
              <button
                onClick={handlePasswordChange}
                className="flex items-center gap-2 px-4 py-2 bg-coral text-white border-3 border-ink rounded-xl font-body font-semibold shadow-retro-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <Shield className="w-4 h-4" />
                Update Password
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Current Settings Summary */}
      <div className="bg-gradient-to-r from-lake/30 to-teal/30 rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4">Current Configuration</h2>
        <div className="grid md:grid-cols-3 gap-4 text-sm font-body">
          <div className="bg-white/50 rounded-xl p-3">
            <div className="text-ink/60">Fleet Size</div>
            <div className="font-semibold text-ink">{settings.fleet_size} cars</div>
          </div>
          <div className="bg-white/50 rounded-xl p-3">
            <div className="text-ink/60">UPI ID</div>
            <div className="font-semibold text-ink">{settings.upi_id}</div>
          </div>
          <div className="bg-white/50 rounded-xl p-3">
            <div className="text-ink/60">WhatsApp</div>
            <div className="font-semibold text-ink">{settings.whatsapp_number}</div>
          </div>
          <div className="bg-white/50 rounded-xl p-3">
            <div className="text-ink/60">Phone</div>
            <div className="font-semibold text-ink">{settings.business_phone}</div>
          </div>
          <div className="bg-white/50 rounded-xl p-3">
            <div className="text-ink/60">Email</div>
            <div className="font-semibold text-ink truncate">{settings.business_email}</div>
          </div>
          <div className="bg-white/50 rounded-xl p-3">
            <div className="text-ink/60">Advance Booking</div>
            <div className="font-semibold text-ink">{settings.booking_advance_days} days</div>
          </div>
        </div>
      </div>
    </div>
  );
}
