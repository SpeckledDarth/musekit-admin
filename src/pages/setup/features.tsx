import React from "react";
import Head from "next/head";
import { SetupLayout } from "@/layout/SetupLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettings";
import { Puzzle, Shield, Bell } from "lucide-react";

const authProviders = [
  { key: "google", label: "Google" },
  { key: "github", label: "GitHub" },
  { key: "apple", label: "Apple" },
  { key: "twitter", label: "Twitter / X" },
  { key: "magicLink", label: "Magic Link" },
  { key: "sso", label: "SSO / SAML" },
];

const webhookEvents = [
  "user.created",
  "user.updated",
  "user.deleted",
  "subscription.created",
  "subscription.updated",
  "subscription.canceled",
  "payment.succeeded",
  "payment.failed",
];

export default function FeaturesSetup() {
  const { getSetting, updateSetting, saveSettings, loading, saving } =
    useSettings("features");

  if (loading) {
    return (
      <SetupLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </SetupLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Features & Integrations - Setup - MuseKit Admin</title>
      </Head>
      <SetupLayout>
        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Puzzle className="h-6 w-6" /> Features & Integrations
              </h1>
              <p className="text-muted-foreground text-sm">
                Configure authentication, AI, and webhook settings.
              </p>
            </div>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Auth Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {authProviders.map((provider) => (
                  <label
                    key={provider.key}
                    className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={
                        getSetting(`auth.${provider.key}`, "false") === "true"
                      }
                      onChange={(e) =>
                        updateSetting(
                          `auth.${provider.key}`,
                          e.target.checked ? "true" : "false"
                        )
                      }
                      className="rounded"
                    />
                    <span className="text-sm font-medium">
                      {provider.label}
                    </span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Features</CardTitle>
            </CardHeader>
            <CardContent>
              <label className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={getSetting("aiEnabled", "false") === "true"}
                  onChange={(e) =>
                    updateSetting(
                      "aiEnabled",
                      e.target.checked ? "true" : "false"
                    )
                  }
                  className="rounded"
                />
                <div>
                  <span className="text-sm font-medium">Enable AI Features</span>
                  <p className="text-xs text-muted-foreground">
                    Enable AI-powered features across the platform
                  </p>
                </div>
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" /> Webhooks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Webhook URL</label>
                <Input
                  value={getSetting("webhookUrl")}
                  onChange={(e) =>
                    updateSetting("webhookUrl", e.target.value)
                  }
                  placeholder="https://your-api.com/webhooks"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Webhook Secret</label>
                <Input
                  value={getSetting("webhookSecret")}
                  onChange={(e) =>
                    updateSetting("webhookSecret", e.target.value)
                  }
                  placeholder="whsec_..."
                  type="password"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Event Subscriptions
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {webhookEvents.map((event) => (
                    <label
                      key={event}
                      className="flex items-center gap-2 p-2 rounded border text-sm cursor-pointer hover:bg-muted/50"
                    >
                      <input
                        type="checkbox"
                        checked={
                          getSetting(`webhook.${event}`, "true") === "true"
                        }
                        onChange={(e) =>
                          updateSetting(
                            `webhook.${event}`,
                            e.target.checked ? "true" : "false"
                          )
                        }
                        className="rounded"
                      />
                      {event}
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" /> Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={getSetting("rateLimiting", "true") === "true"}
                  onChange={(e) =>
                    updateSetting(
                      "rateLimiting",
                      e.target.checked ? "true" : "false"
                    )
                  }
                  className="rounded"
                />
                <span className="text-sm font-medium">Rate Limiting</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={getSetting("ipBlocking", "false") === "true"}
                  onChange={(e) =>
                    updateSetting(
                      "ipBlocking",
                      e.target.checked ? "true" : "false"
                    )
                  }
                  className="rounded"
                />
                <span className="text-sm font-medium">IP Blocking</span>
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={getSetting("gdprEnabled", "false") === "true"}
                  onChange={(e) =>
                    updateSetting(
                      "gdprEnabled",
                      e.target.checked ? "true" : "false"
                    )
                  }
                  className="rounded"
                />
                <div>
                  <span className="text-sm font-medium">GDPR Compliance</span>
                  <p className="text-xs text-muted-foreground">
                    Enable cookie consent and data export features
                  </p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={getSetting("ccpaEnabled", "false") === "true"}
                  onChange={(e) =>
                    updateSetting(
                      "ccpaEnabled",
                      e.target.checked ? "true" : "false"
                    )
                  }
                  className="rounded"
                />
                <div>
                  <span className="text-sm font-medium">CCPA Compliance</span>
                  <p className="text-xs text-muted-foreground">
                    Enable &quot;Do Not Sell My Data&quot; features
                  </p>
                </div>
              </label>
            </CardContent>
          </Card>
        </div>
      </SetupLayout>
    </>
  );
}
