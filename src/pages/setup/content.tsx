import React, { useState, useEffect } from "react";
import Head from "next/head";
import { SetupLayout } from "@/layout/SetupLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettings";
import {
  FileText,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  GripVertical,
} from "lucide-react";

const sectionTypes = [
  { id: "hero", label: "Hero" },
  { id: "logo-marquee", label: "Logo Marquee" },
  { id: "counters", label: "Counters" },
  { id: "features", label: "Features" },
  { id: "testimonials", label: "Testimonials" },
  { id: "process-steps", label: "Process Steps" },
  { id: "faq", label: "FAQ" },
  { id: "founder-letter", label: "Founder Letter" },
  { id: "comparison-bars", label: "Comparison Bars" },
  { id: "screenshot-showcase", label: "Screenshot Showcase" },
  { id: "bottom-cta", label: "Bottom CTA" },
  { id: "image-collage", label: "Image Collage" },
  { id: "image-text", label: "Image + Text" },
  { id: "feature-sub-pages", label: "Feature Sub-Pages" },
];

interface Section {
  id: string;
  label: string;
  enabled: boolean;
  bgColor: string;
}

export default function ContentPage() {
  const { getSetting, updateSetting, saveSettings, loading, saving } =
    useSettings("content");
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    if (!loading) {
      const saved = getSetting("sections");
      if (saved) {
        try {
          setSections(JSON.parse(saved));
          return;
        } catch {}
      }
      setSections(
        sectionTypes.map((s) => ({
          ...s,
          enabled: true,
          bgColor: "#ffffff",
        }))
      );
    }
  }, [loading, getSetting]);

  const moveSection = (index: number, direction: "up" | "down") => {
    const newSections = [...sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    [newSections[index], newSections[targetIndex]] = [
      newSections[targetIndex],
      newSections[index],
    ];
    setSections(newSections);
  };

  const toggleSection = (index: number) => {
    const newSections = [...sections];
    newSections[index] = {
      ...newSections[index],
      enabled: !newSections[index].enabled,
    };
    setSections(newSections);
  };

  const updateBgColor = (index: number, color: string) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], bgColor: color };
    setSections(newSections);
  };

  const handleSave = async () => {
    updateSetting("sections", JSON.stringify(sections));
    await saveSettings();
  };

  if (loading) {
    return (
      <SetupLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </SetupLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Content - Setup - MuseKit Admin</title>
      </Head>
      <SetupLayout>
        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6" /> Content Sections
              </h1>
              <p className="text-muted-foreground text-sm">
                Configure homepage sections and their ordering.
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                {sections.map((section, index) => (
                  <div
                    key={section.id}
                    className={`flex items-center gap-3 p-3 rounded-md border transition-colors ${
                      section.enabled ? "bg-card" : "bg-muted/50 opacity-60"
                    }`}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm font-medium">
                        {section.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={section.bgColor}
                        onChange={(e) => updateBgColor(index, e.target.value)}
                        className="h-7 w-10 rounded border cursor-pointer"
                        title="Background color"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveSection(index, "up")}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveSection(index, "down")}
                        disabled={index === sections.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={section.enabled ? "ghost" : "outline"}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toggleSection(index)}
                      >
                        {section.enabled ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </SetupLayout>
    </>
  );
}
