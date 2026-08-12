"use client";

import { useState, useEffect, useCallback } from 'react';
import { SiteConfig, DEFAULT_SITE_CONFIG } from '@/lib/supabase/types';

interface UseSiteConfigReturn {
  config: SiteConfig;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /**
   * Adopt a known-fresh config without a network round-trip, updating both the
   * module-level cache and this hook's state. Used after a save, where the
   * server already handed back the row it just wrote.
   */
  applyConfig: (next: SiteConfig) => void;
}

// Cache the config to avoid refetching on every component mount
let cachedConfig: SiteConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useSiteConfig(): UseSiteConfigReturn {
  const [config, setConfig] = useState<SiteConfig>(cachedConfig || DEFAULT_SITE_CONFIG);
  const [isLoading, setIsLoading] = useState(!cachedConfig);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    // Check if cache is still valid
    const now = Date.now();
    if (cachedConfig && (now - cacheTimestamp) < CACHE_DURATION) {
      setConfig(cachedConfig);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/site-config');

      if (!response.ok) {
        throw new Error('Failed to fetch site configuration');
      }

      const data: SiteConfig = await response.json();

      // Update cache
      cachedConfig = data;
      cacheTimestamp = now;

      setConfig(data);
    } catch (err) {
      console.error('Error fetching site config:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Fall back to default config
      setConfig(DEFAULT_SITE_CONFIG);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applyConfig = useCallback((next: SiteConfig) => {
    cachedConfig = next;
    cacheTimestamp = Date.now();
    setConfig(next);
    setError(null);
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    isLoading,
    error,
    refetch: fetchConfig,
    applyConfig,
  };
}

// Hook for admin panel to update config
interface UseAdminSiteConfigReturn extends UseSiteConfigReturn {
  updateConfig: (updates: Partial<SiteConfig>) => Promise<boolean>;
  isSaving: boolean;
  initializeConfig: () => Promise<boolean>;
}

export function useAdminSiteConfig(): UseAdminSiteConfigReturn {
  const { config, isLoading, error, refetch, applyConfig } = useSiteConfig();
  const [isSaving, setIsSaving] = useState(false);

  const updateConfig = useCallback(async (updates: Partial<SiteConfig>): Promise<boolean> => {
    try {
      setIsSaving(true);

      const response = await fetch('/api/admin/site-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update configuration');
      }

      // Adopt the config the server just wrote and read back, rather than
      // invalidating and refetching. GET is edge-cached (see
      // Cache-Control in src/app/api/admin/site-config/route.ts), so a refetch
      // here could be served a pre-save copy and make the form appear to
      // revert. This also drops a redundant round-trip and closes the
      // read-after-write race that existed even before that header.
      const updated: SiteConfig = await response.json();
      applyConfig(updated);

      return true;
    } catch (err) {
      console.error('Error updating site config:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [applyConfig]);

  const initializeConfig = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/site-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initialize configuration');
      }

      // Same reasoning as updateConfig above — PUT returns the config it just
      // seeded, so adopt it directly instead of refetching through the
      // edge-cached GET.
      const data = await response.json();
      if (data?.config) {
        applyConfig(data.config as SiteConfig);
      } else {
        // Already initialized: PUT returns only a message, so fall back to a
        // read.
        cachedConfig = null;
        cacheTimestamp = 0;
        await refetch();
      }

      return true;
    } catch (err) {
      console.error('Error initializing site config:', err);
      return false;
    }
  }, [refetch, applyConfig]);

  return {
    config,
    isLoading,
    error,
    refetch,
    applyConfig,
    updateConfig,
    isSaving,
    initializeConfig,
  };
}
