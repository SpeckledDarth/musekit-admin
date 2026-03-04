import React from "react";
import Head from "next/head";
import { SetupLayout } from "@/layout/SetupLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettings";
import { Bot, MessageCircle } from "lucide-react";

export default function AISetup() {
  const { getSetting, updateSetting, saveSettings, loading, saving } =
    useSettings("ai");

  if (loading) {
    return (
      <SetupLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-60" />
          ))}
        </div>
      </SetupLayout>
    );
  }

  return (
    <>
      <Head>
        <title>AI / Support - Setup - MuseKit Admin</title>
      </Head>
      <SetupLayout>
        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bot className="h-6 w-6" /> AI / Support
              </h1>
              <p className="text-muted-foreground text-sm">
                Configure AI provider and help widget settings.
              </p>
            </div>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Provider</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Provider</label>
                <Select
                  value={getSetting("provider", "xai")}
                  onChange={(e) => updateSetting("provider", e.target.value)}
                >
                  <option value="xai">xAI (Grok)</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Model</label>
                <Input
                  value={getSetting("model", "grok-2")}
                  onChange={(e) => updateSetting("model", e.target.value)}
                  placeholder="e.g., grok-2, gpt-4, claude-3"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    Temperature ({getSetting("temperature", "0.7")})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={getSetting("temperature", "0.7")}
                    onChange={(e) =>
                      updateSetting("temperature", e.target.value)
                    }
                    className="w-full mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Tokens</label>
                  <Input
                    type="number"
                    value={getSetting("maxTokens", "4096")}
                    onChange={(e) =>
                      updateSetting("maxTokens", e.target.value)
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">System Prompt</label>
                <Textarea
                  value={getSetting("systemPrompt")}
                  onChange={(e) =>
                    updateSetting("systemPrompt", e.target.value)
                  }
                  rows={4}
                  placeholder="You are a helpful assistant..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5" /> Help Widget
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={getSetting("widgetEnabled", "true") === "true"}
                  onChange={(e) =>
                    updateSetting(
                      "widgetEnabled",
                      e.target.checked ? "true" : "false"
                    )
                  }
                  className="rounded"
                />
                <span className="text-sm font-medium">
                  Enable Help Widget
                </span>
              </label>
              <div>
                <label className="text-sm font-medium">
                  Widget System Prompt
                </label>
                <Textarea
                  value={getSetting("widgetPrompt")}
                  onChange={(e) =>
                    updateSetting("widgetPrompt", e.target.value)
                  }
                  rows={3}
                  placeholder="Help widget AI system prompt..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Fallback Email
                </label>
                <Input
                  value={getSetting("fallbackEmail")}
                  onChange={(e) =>
                    updateSetting("fallbackEmail", e.target.value)
                  }
                  placeholder="support@example.com"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </SetupLayout>
    </>
  );
}
