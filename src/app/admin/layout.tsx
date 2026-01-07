"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  IndianRupee,
  Sun,
  Settings,
  LogOut,
  Menu,
  X,
  RefreshCw,
  Package,
  MapPin,
  Globe,
  Car,
  Route as RouteIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: "/admin/destinations", label: "Destinations", icon: <MapPin className="w-5 h-5" /> },
  { href: "/admin/packages", label: "Packages", icon: <Package className="w-5 h-5" /> },
  { href: "/admin/routes", label: "Transfer Routes", icon: <RouteIcon className="w-5 h-5" /> },
  { href: "/admin/fleet", label: "Fleet", icon: <Car className="w-5 h-5" /> },
  { href: "/admin/availability", label: "Availability", icon: <Calendar className="w-5 h-5" /> },
  { href: "/admin/bookings", label: "Bookings", icon: <BookOpen className="w-5 h-5" /> },
  { href: "/admin/pricing", label: "Pricing", icon: <IndianRupee className="w-5 h-5" /> },
  { href: "/admin/seasons", label: "Seasons", icon: <Sun className="w-5 h-5" /> },
  { href: "/admin/site-config", label: "Site Config", icon: <Globe className="w-5 h-5" /> },
  { href: "/admin/settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
];

function PasswordGate({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Call server-side authentication API
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onAuthenticated();
      } else {
        setError(data.error || 'Incorrect password. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sunrise via-white to-lake flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border-3 border-ink shadow-retro p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🔐</div>
          <h1 className="text-2xl font-display text-ink">Admin Panel</h1>
          <p className="text-ink/60 font-body mt-2">Enter password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
              autoFocus
            />
          </div>

          {error && (
            <div className="text-coral text-sm font-body text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading || !password}
            className={cn(
              "w-full py-3 px-4 rounded-xl font-display text-lg border-3 border-ink transition-all",
              "bg-sunshine text-ink shadow-retro hover:shadow-retro-sm hover:translate-x-[2px] hover:translate-y-[2px]",
              (isLoading || !password) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? "Verifying..." : "Enter Admin Panel"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-teal font-body hover:underline">
            ← Back to Website
          </Link>
        </div>
      </div>
    </div>
  );
}

function AdminSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
      });
      window.location.href = '/admin';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/admin';
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-white border-r-3 border-ink z-50 transition-transform duration-300",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b-3 border-ink">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center space-x-2">
              <span className="text-2xl">🚕</span>
              <span className="font-display text-lg text-ink">Admin Panel</span>
            </Link>
            <button onClick={onClose} className="lg:hidden p-1">
              <X className="w-5 h-5 text-ink" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl font-body transition-all",
                pathname === item.href
                  ? "bg-sunshine border-3 border-ink shadow-retro-sm text-ink font-semibold"
                  : "text-ink/70 hover:bg-sunrise/50 hover:text-ink"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t-3 border-ink">
          <Link
            href="/"
            className="flex items-center space-x-3 px-4 py-3 rounded-xl font-body text-ink/70 hover:bg-lake/20 transition-all mb-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>View Website</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 rounded-xl font-body text-coral hover:bg-coral/10 transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Check authentication status with server
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/auth/verify');
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
      } catch (error) {
        console.error('Auth verification error:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sunrise via-white to-lake flex items-center justify-center">
        <div className="text-2xl font-display text-ink animate-pulse">Loading...</div>
      </div>
    );
  }

  // Password gate
  if (!isAuthenticated) {
    return <PasswordGate onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  // Authenticated layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-sunrise/30 via-white to-lake/30">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b-3 border-ink px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-sunrise/50 transition-colors"
            >
              <Menu className="w-6 h-6 text-ink" />
            </button>

            <div className="flex items-center space-x-4">
              <span className="text-sm font-body text-ink/60">
                Welcome, Admin
              </span>
              <div className="w-8 h-8 rounded-full bg-sunshine border-2 border-ink flex items-center justify-center">
                <span className="text-sm font-display">🧑‍💼</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
