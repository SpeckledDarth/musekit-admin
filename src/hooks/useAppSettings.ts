"use client";

import { useContext } from "react";
import { AppSettingsContext } from "../components/SettingsProvider";

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    return {
      settings: {},
      loading: false,
      getSetting: (_key: string, defaultValue = "") => defaultValue,
      getSettingsByPrefix: (_prefix: string) => ({} as Record<string, string>),
      refetch: async () => {},
    };
  }
  return context;
}
