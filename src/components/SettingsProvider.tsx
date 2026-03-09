"use client";

import React, { createContext, useState, useEffect, useCallback } from "react";
import { getSupabaseClient } from "../lib/supabase";

export interface AppSettingsContextType {
  settings: Record<string, string>;
  loading: boolean;
  getSetting: (key: string, defaultValue?: string) => string;
  getSettingsByPrefix: (prefix: string) => Record<string, string>;
  refetch: () => Promise<void>;
}

export const AppSettingsContext = createContext<AppSettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from("settings").select("key, value");
      if (error) {
        console.error("SettingsProvider: Failed to fetch settings:", error.message);
        return;
      }
      const mapped: Record<string, string> = {};
      for (const row of data || []) {
        mapped[row.key] = row.value;
      }
      setSettings(mapped);
    } catch (err) {
      console.error("SettingsProvider: Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getSetting = useCallback(
    (key: string, defaultValue = "") => {
      return settings[key] ?? defaultValue;
    },
    [settings]
  );

  const getSettingsByPrefix = useCallback(
    (prefix: string) => {
      const result: Record<string, string> = {};
      for (const [key, value] of Object.entries(settings)) {
        if (key.startsWith(prefix)) {
          result[key] = value;
        }
      }
      return result;
    },
    [settings]
  );

  return (
    <AppSettingsContext.Provider
      value={{ settings, loading, getSetting, getSettingsByPrefix, refetch: fetchSettings }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
}
