import React, { useState, useCallback } from "react";
import Head from "next/head";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useSettings } from "@/hooks/useSettings";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Paintbrush, Eye, Info } from "lucide-react";

const heroStyles = [
  "full-width",
  "split",
  "video",
  "pattern",
  "floating-mockup",
  "photo-collage",
];

const footerLayouts = ["4-column", "minimal", "centered"];

export default function BrandingPage() {
  const { getSetting, updateSetting: rawUpdateSetting, saveSettings, loading, saving } =
    useSettings("branding");
  const [isDirty, setIsDirty] = useState(false);

  useUnsavedChanges(isDirty);

  const updateSetting = useCallback(
    (key: string, value: string) => {
      rawUpdateSetting(key, value);
      setIsDirty(true);
    },
    [rawUpdateSetting]
  );

  const handleSave = useCallback(async () => {
    try {
      await saveSettings();
      setIsDirty(false);
      toast.success("Branding settings saved");
    } catch (error) {
      toast.error("Failed to save branding settings");
    }
  }, [saveSettings]);

  if (loading) {
    return (
      <>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Branding - Setup - MuseKit Admin</title>
      </Head>
      
        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Paintbrush className="h-6 w-6" /> Branding
              </h1>
              <p className="text-muted-foreground text-sm">
                Configure your brand identity and visual appearance.
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">App Name</label>
                <Input
                  value={getSetting("appName", "MuseKit")}
                  onChange={(e) => updateSetting("appName", e.target.value)}
                  placeholder="Your app name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={getSetting("description")}
                  onChange={(e) => updateSetting("description", e.target.value)}
                  placeholder="Short app description"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Logo URL</label>
                <ImageUpload
                  value={getSetting("logoUrl")}
                  onChange={(url) => updateSetting("logoUrl", url)}
                  folder="branding"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Favicon</label>
                <ImageUpload
                  value={getSetting("faviconUrl")}
                  onChange={(url) => updateSetting("faviconUrl", url)}
                  folder="branding"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={getSetting("primaryColor", "#3b82f6")}
                    onChange={(e) =>
                      updateSetting("primaryColor", e.target.value)
                    }
                    className="h-10 w-16 rounded border cursor-pointer"
                  />
                  <Input
                    value={getSetting("primaryColor", "#3b82f6")}
                    onChange={(e) =>
                      updateSetting("primaryColor", e.target.value)
                    }
                    className="w-32"
                  />
                  <div
                    className="h-10 flex-1 rounded-md border flex items-center justify-center text-sm text-white font-medium"
                    style={{
                      backgroundColor: getSetting("primaryColor", "#3b82f6"),
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" /> Live Preview
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Hero Style</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {heroStyles.map((style) => (
                    <button
                      key={style}
                      onClick={() => updateSetting("heroStyle", style)}
                      className={`p-3 rounded-md border text-sm capitalize transition-colors ${
                        getSetting("heroStyle", "full-width") === style
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted"
                      }`}
                    >
                      {style.replace("-", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Header</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Background Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={getSetting("headerBgColor", "#ffffff")}
                      onChange={(e) =>
                        updateSetting("headerBgColor", e.target.value)
                      }
                      className="h-9 w-12 rounded border cursor-pointer"
                    />
                    <Input
                      value={getSetting("headerBgColor", "#ffffff")}
                      onChange={(e) =>
                        updateSetting("headerBgColor", e.target.value)
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Text Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={getSetting("headerTextColor", "#000000")}
                      onChange={(e) =>
                        updateSetting("headerTextColor", e.target.value)
                      }
                      className="h-9 w-12 rounded border cursor-pointer"
                    />
                    <Input
                      value={getSetting("headerTextColor", "#000000")}
                      onChange={(e) =>
                        updateSetting("headerTextColor", e.target.value)
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">
                  Opacity ({getSetting("headerOpacity", "100")}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={getSetting("headerOpacity", "100")}
                  onChange={(e) =>
                    updateSetting("headerOpacity", e.target.value)
                  }
                  className="w-full mt-1"
                />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={getSetting("headerSticky", "true") === "true"}
                    onChange={(e) =>
                      updateSetting(
                        "headerSticky",
                        e.target.checked ? "true" : "false"
                      )
                    }
                    className="rounded"
                  />
                  Sticky Header
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={getSetting("headerTransparent") === "true"}
                    onChange={(e) =>
                      updateSetting(
                        "headerTransparent",
                        e.target.checked ? "true" : "false"
                      )
                    }
                    className="rounded"
                  />
                  Transparent Mode
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={getSetting("headerBorder", "true") === "true"}
                    onChange={(e) =>
                      updateSetting(
                        "headerBorder",
                        e.target.checked ? "true" : "false"
                      )
                    }
                    className="rounded"
                  />
                  Show Border
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Footer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Background Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={getSetting("footerBgColor", "#1f2937")}
                      onChange={(e) =>
                        updateSetting("footerBgColor", e.target.value)
                      }
                      className="h-9 w-12 rounded border cursor-pointer"
                    />
                    <Input
                      value={getSetting("footerBgColor", "#1f2937")}
                      onChange={(e) =>
                        updateSetting("footerBgColor", e.target.value)
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Text Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={getSetting("footerTextColor", "#f9fafb")}
                      onChange={(e) =>
                        updateSetting("footerTextColor", e.target.value)
                      }
                      className="h-9 w-12 rounded border cursor-pointer"
                    />
                    <Input
                      value={getSetting("footerTextColor", "#f9fafb")}
                      onChange={(e) =>
                        updateSetting("footerTextColor", e.target.value)
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">
                  Background Image URL
                </label>
                <Input
                  value={getSetting("footerBgImage")}
                  onChange={(e) =>
                    updateSetting("footerBgImage", e.target.value)
                  }
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Layout Mode</label>
                <Select
                  value={getSetting("footerLayout", "4-column")}
                  onChange={(e) =>
                    updateSetting("footerLayout", e.target.value)
                  }
                >
                  {footerLayouts.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Post Watermark</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={getSetting("watermarkEnabled", "true") === "true"}
                  onChange={(e) =>
                    updateSetting(
                      "watermarkEnabled",
                      e.target.checked ? "true" : "false"
                    )
                  }
                  className="rounded"
                />
                Enable Watermark
              </label>
              <div>
                <label className="text-sm font-medium">Watermark Text</label>
                <Input
                  value={getSetting("watermarkText", "Posted via PassivePost")}
                  onChange={(e) =>
                    updateSetting("watermarkText", e.target.value)
                  }
                  placeholder="Posted via PassivePost"
                  disabled={getSetting("watermarkEnabled", "true") !== "true"}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Preview</label>
                <div className="rounded-lg border bg-white p-4 max-w-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Your Brand</p>
                      <p className="text-xs text-gray-500">Just now</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    This is an example social media post to show how the watermark will appear at the bottom of your posts.
                  </p>
                  <div className="h-32 rounded-md bg-gray-100 mb-3" />
                  {getSetting("watermarkEnabled", "true") === "true" && (
                    <p className="text-xs text-gray-400 border-t pt-2">
                      {getSetting("watermarkText", "Posted via PassivePost")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                <p className="text-xs">
                  Higher-tier plans can disable watermarks.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      
    </>
  );
}
