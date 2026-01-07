"use client";

import { useState, useEffect, useCallback } from 'react';
import { SiteConfig, DEFAULT_SITE_CONFIG } from '@/lib/supabase/types';

interface UseSiteConfigReturn {
  config: SiteConfig;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
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

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    isLoading,
    error,
    refetch: fetchConfig,
  };
}

// Hook for admin panel to update config
interface UseAdminSiteConfigReturn extends UseSiteConfigReturn {
  updateConfig: (updates: Partial<SiteConfig>) => Promise<boolean>;
  isSaving: boolean;
  initializeConfig: () => Promise<boolean>;
}

export function useAdminSiteConfig(): UseAdminSiteConfigReturn {
  const { config, isLoading, error, refetch } = useSiteConfig();
  const [isSaving, setIsSaving] = useState(false);

  const updateConfig = useCallback(async (updates: Partial<SiteConfig>): Promise<boolean> => {
    const adminPassword = localStorage.getItem('admin_password') ||
                          process.env.NEXT_PUBLIC_ADMIN_PASSWORD ||
                          'nainital2024';

    try {
      setIsSaving(true);

      const response = await fetch('/api/admin/site-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-auth': adminPassword,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update configuration');
      }

      // Invalidate cache
      cachedConfig = null;
      cacheTimestamp = 0;

      // Refetch to get updated config
      await refetch();

      return true;
    } catch (err) {
      console.error('Error updating site config:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [refetch]);

  const initializeConfig = useCallback(async (): Promise<boolean> => {
    const adminPassword = localStorage.getItem('admin_password') ||
                          process.env.NEXT_PUBLIC_ADMIN_PASSWORD ||
                          'nainital2024';

    try {
      const response = await fetch('/api/admin/site-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-auth': adminPassword,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initialize configuration');
      }

      // Invalidate cache and refetch
      cachedConfig = null;
      cacheTimestamp = 0;
      await refetch();

      return true;
    } catch (err) {
      console.error('Error initializing site config:', err);
      return false;
    }
  }, [refetch]);

  return {
    config,
    isLoading,
    error,
    refetch,
    updateConfig,
    isSaving,
    initializeConfig,
  };
}
