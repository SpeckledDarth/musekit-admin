import React from "react";
import Head from "next/head";
import { SetupLayout } from "@/layout/SetupLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettings";
import { Share2 } from "lucide-react";

const socialPlatforms = [
  { key: "twitter", label: "Twitter / X", placeholder: "https://x.com/..." },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/..." },
  { key: "github", label: "GitHub", placeholder: "https://github.com/..." },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@..." },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
  { key: "discord", label: "Discord", placeholder: "https://discord.gg/..." },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@..." },
];

export default function SocialLinksSetup() {
  const { getSetting, updateSetting, saveSettings, loading, saving } =
    useSettings("social");

  if (loading) {
    return (
      <SetupLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-80" />
        </div>
      </SetupLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Social Links - Setup - MuseKit Admin</title>
      </Head>
      <SetupLayout>
        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Share2 className="h-6 w-6" /> Social Links
              </h1>
              <p className="text-muted-foreground text-sm">
                Add your social media profile URLs.
              </p>
            </div>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <Card>
            <CardContent className="p-6 space-y-4">
              {socialPlatforms.map((platform) => (
                <div key={platform.key}>
                  <label className="text-sm font-medium">{platform.label}</label>
                  <Input
                    value={getSetting(platform.key)}
                    onChange={(e) =>
                      updateSetting(platform.key, e.target.value)
                    }
                    placeholder={platform.placeholder}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </SetupLayout>
    </>
  );
}
