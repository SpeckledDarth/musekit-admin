import React from "react";
import Head from "next/head";
import { SetupLayout } from "@/layout/SetupLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/hooks/useSettings";
import { Megaphone } from "lucide-react";

const platforms = [
  { key: "twitter", label: "Twitter / X" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
];

export default function PassivePostSetup() {
  const { getSetting, updateSetting, saveSettings, loading, saving } =
    useSettings("passivepost");

  if (loading) {
    return (
      <SetupLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-60" />
        </div>
      </SetupLayout>
    );
  }

  return (
    <>
      <Head>
        <title>PassivePost - Setup - MuseKit Admin</title>
      </Head>
      <SetupLayout>
        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Megaphone className="h-6 w-6" /> PassivePost Settings
              </h1>
              <p className="text-muted-foreground text-sm">
                Configure social posting defaults.
              </p>
            </div>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Social Platforms</CardTitle>
              <CardDescription>
                Enable platforms for automated posting.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {platforms.map((platform) => (
                <label
                  key={platform.key}
                  className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={
                      getSetting(`platform.${platform.key}`, "false") ===
                      "true"
                    }
                    onChange={(e) =>
                      updateSetting(
                        `platform.${platform.key}`,
                        e.target.checked ? "true" : "false"
                      )
                    }
                    className="rounded"
                  />
                  <span className="text-sm font-medium">
                    {platform.label}
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Default Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Default Posting Schedule
                </label>
                <Select
                  value={getSetting("schedule", "daily")}
                  onChange={(e) => updateSetting("schedule", e.target.value)}
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="manual">Manual Only</option>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">
                  Default Hashtags
                </label>
                <Input
                  value={getSetting("defaultHashtags")}
                  onChange={(e) =>
                    updateSetting("defaultHashtags", e.target.value)
                  }
                  placeholder="#musekit #saas"
                />
              </div>
              <label className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={
                    getSetting("autoPost", "false") === "true"
                  }
                  onChange={(e) =>
                    updateSetting(
                      "autoPost",
                      e.target.checked ? "true" : "false"
                    )
                  }
                  className="rounded"
                />
                <div>
                  <span className="text-sm font-medium">
                    Auto-Post Enabled
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Automatically post content on schedule
                  </p>
                </div>
              </label>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="p-6 text-center">
              <Badge variant="secondary" className="mb-2">
                Placeholder
              </Badge>
              <p className="text-sm text-muted-foreground">
                Full PassivePost configuration will be available in the PassivePost module.
              </p>
            </CardContent>
          </Card>
        </div>
      </SetupLayout>
    </>
  );
}
