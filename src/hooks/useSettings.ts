"use client";

import { useState, useEffect, useCallback } from "react";

export function useSettings(prefix: string) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/setup/settings");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const mapped: Record<string, string> = {};
        for (const s of data.settings || []) {
          if (s.key.startsWith(prefix)) {
            mapped[s.key] = s.value;
          }
        }
        setSettings(mapped);
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [prefix]);

  const getSetting = useCallback(
    (key: string, defaultValue = "") => {
      return settings[`${prefix}.${key}`] ?? defaultValue;
    },
    [settings, prefix]
  );

  const updateSetting = useCallback(
    (key: string, value: string) => {
      setSettings((prev) => ({ ...prev, [`${prefix}.${key}`]: value }));
    },
    [prefix]
  );

  const saveSettings = useCallback(async () => {
    setSaving(true);
    try {
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
      }));
      const res = await fetch("/api/admin/setup/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: settingsArray }),
      });
      if (!res.ok) {
        throw new Error(`Failed to save settings: ${res.status}`);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [settings]);

  return { settings, loading, saving, getSetting, updateSetting, saveSettings };
}
