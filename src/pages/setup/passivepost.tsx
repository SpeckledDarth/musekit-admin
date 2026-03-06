import React, { useState } from "react";
import Head from "next/head";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSettings } from "@/hooks/useSettings";
import {
  Megaphone,
  Share2,
  Calendar,
  FileText,
  Bot,
  BarChart3,
  Save,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const platformDefs = [
  { key: "twitter", label: "Twitter / X", charLimit: 280 },
  { key: "facebook", label: "Facebook", charLimit: 63206 },
  { key: "linkedin", label: "LinkedIn", charLimit: 3000 },
  { key: "instagram", label: "Instagram", charLimit: 2200 },
];

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const templateDefs = [
  { key: "promotional", name: "Promotional", description: "Drive sales and conversions with product highlights and offers." },
  { key: "educational", name: "Educational", description: "Share knowledge, tips, and how-to content to build authority." },
  { key: "engaging", name: "Engaging", description: "Questions, polls, and interactive content to boost engagement." },
  { key: "seasonal", name: "Seasonal", description: "Holiday and seasonal themed content for timely relevance." },
  { key: "curated", name: "Curated", description: "Share industry news, articles, and third-party content." },
  { key: "custom", name: "Custom", description: "Your own custom template format for unique content needs." },
];

const engagementData = [
  { type: "Promotional", rate: 3.2 },
  { type: "Educational", rate: 4.8 },
  { type: "Engaging", rate: 6.1 },
  { type: "Seasonal", rate: 3.9 },
  { type: "Curated", rate: 2.7 },
  { type: "Custom", rate: 4.1 },
];

export default function PassivePostSetup() {
  const { getSetting, updateSetting, saveSettings, loading, saving } =
    useSettings("passivepost");
  const [activeTab, setActiveTab] = useState("platforms");

  if (loading) {
    return (
      <>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-60" />
        </div>
      </>
    );
  }

  const handleSave = async () => {
    try {
      await saveSettings();
    } catch {
      console.error("Failed to save settings");
    }
  };

  return (
    <>
      <Head>
        <title>PassivePost - Setup - MuseKit Admin</title>
      </Head>
      
        <div className="space-y-6 max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Megaphone className="h-6 w-6" /> PassivePost Settings
              </h1>
              <p className="text-muted-foreground text-sm">
                Configure social posting automation across all platforms.
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <Tabs defaultValue="platforms" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start flex-wrap">
              <TabsTrigger value="platforms">
                <Share2 className="h-4 w-4 mr-1" /> Platforms
              </TabsTrigger>
              <TabsTrigger value="scheduling">
                <Calendar className="h-4 w-4 mr-1" /> Scheduling
              </TabsTrigger>
              <TabsTrigger value="templates">
                <FileText className="h-4 w-4 mr-1" /> Templates
              </TabsTrigger>
              <TabsTrigger value="ai-prompts">
                <Bot className="h-4 w-4 mr-1" /> AI Prompts
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-1" /> Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="platforms">
              <div className="space-y-4">
                {platformDefs.map((platform) => {
                  const enabled = getSetting(`platform.${platform.key}`, "false") === "true";
                  const connected = getSetting(`platform.${platform.key}.connected`, "false") === "true";
                  const postMode = getSetting(`platform.${platform.key}.postMode`, "manual");
                  const mediaUpload = getSetting(`platform.${platform.key}.mediaUpload`, "false") === "true";

                  return (
                    <Card key={platform.key}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-lg">{platform.label}</CardTitle>
                            <Badge variant={connected ? "success" : "secondary"}>
                              {connected ? "Connected" : "Not Connected"}
                            </Badge>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-sm font-medium">Enable</span>
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={(e) =>
                                updateSetting(`platform.${platform.key}`, e.target.checked ? "true" : "false")
                              }
                              className="rounded"
                            />
                          </label>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm font-medium">Posting Preference</label>
                            <Select
                              value={postMode}
                              onChange={(e) =>
                                updateSetting(`platform.${platform.key}.postMode`, e.target.value)
                              }
                            >
                              <option value="auto">Automatic</option>
                              <option value="manual">Manual</option>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Character Limit</label>
                            <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50 text-sm text-muted-foreground">
                              {platform.charLimit.toLocaleString()} characters
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Media Upload</label>
                            <label className="flex items-center gap-2 h-10 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={mediaUpload}
                                onChange={(e) =>
                                  updateSetting(`platform.${platform.key}.mediaUpload`, e.target.checked ? "true" : "false")
                                }
                                className="rounded"
                              />
                              <span className="text-sm">Enable media attachments</span>
                            </label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="scheduling">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Posting Frequency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={getSetting("schedule.frequency", "daily")}
                      onChange={(e) => updateSetting("schedule.frequency", e.target.value)}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="custom">Custom</option>
                    </Select>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Active Days</CardTitle>
                    <CardDescription>Select which days to post content.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {days.map((day) => {
                        const active = getSetting(`schedule.day.${day.toLowerCase()}`, "true") === "true";
                        return (
                          <label
                            key={day}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md border cursor-pointer transition-colors ${active ? "bg-primary/10 border-primary" : "hover:bg-muted/50"}`}
                          >
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={(e) =>
                                updateSetting(`schedule.day.${day.toLowerCase()}`, e.target.checked ? "true" : "false")
                              }
                              className="rounded"
                            />
                            <span className="text-sm font-medium">{day}</span>
                          </label>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Time Windows</CardTitle>
                    <CardDescription>Choose when posts should be published.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { key: "morning", label: "Morning (6:00 - 12:00)" },
                      { key: "afternoon", label: "Afternoon (12:00 - 18:00)" },
                      { key: "evening", label: "Evening (18:00 - 24:00)" },
                    ].map((window) => {
                      const active = getSetting(`schedule.time.${window.key}`, "true") === "true";
                      return (
                        <label
                          key={window.key}
                          className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={(e) =>
                              updateSetting(`schedule.time.${window.key}`, e.target.checked ? "true" : "false")
                            }
                            className="rounded"
                          />
                          <span className="text-sm font-medium">{window.label}</span>
                        </label>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Content Mix</CardTitle>
                    <CardDescription>Adjust the percentage distribution of content types.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { key: "promotional", label: "Promotional" },
                      { key: "educational", label: "Educational" },
                      { key: "engaging", label: "Engaging" },
                    ].map((mix) => {
                      const value = getSetting(`schedule.mix.${mix.key}`, "33");
                      return (
                        <div key={mix.key} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">{mix.label}</label>
                            <span className="text-sm text-muted-foreground">{value}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={value}
                            onChange={(e) => updateSetting(`schedule.mix.${mix.key}`, e.target.value)}
                            className="w-full"
                          />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="templates">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templateDefs.map((template) => (
                    <Card key={template.key}>
                      <CardHeader>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Template Content</label>
                          <Textarea
                            value={getSetting(`template.${template.key}.content`, "")}
                            onChange={(e) =>
                              updateSetting(`template.${template.key}.content`, e.target.value)
                            }
                            placeholder={`Enter ${template.name.toLowerCase()} template...`}
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Example Preview</label>
                          <div className="p-3 rounded-md bg-muted/50 text-sm text-muted-foreground italic">
                            {getSetting(`template.${template.key}.content`, "") || `No ${template.name.toLowerCase()} template configured yet.`}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Media Settings</CardTitle>
                    <CardDescription>Configure default media generation options.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <label className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={getSetting("template.media.imageGen", "false") === "true"}
                        onChange={(e) =>
                          updateSetting("template.media.imageGen", e.target.checked ? "true" : "false")
                        }
                        className="rounded"
                      />
                      <div>
                        <span className="text-sm font-medium">AI Image Generation</span>
                        <p className="text-xs text-muted-foreground">
                          Automatically generate images for posts using AI
                        </p>
                      </div>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Default Width (px)</label>
                        <Input
                          type="number"
                          value={getSetting("template.media.width", "1200")}
                          onChange={(e) => updateSetting("template.media.width", e.target.value)}
                          placeholder="1200"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Default Height (px)</label>
                        <Input
                          type="number"
                          value={getSetting("template.media.height", "630")}
                          onChange={(e) => updateSetting("template.media.height", e.target.value)}
                          placeholder="630"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ai-prompts">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">AI Model</CardTitle>
                    <CardDescription>Select the AI model for content generation.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={getSetting("ai.model", "grok-2")}
                      onChange={(e) => updateSetting("ai.model", e.target.value)}
                    >
                      <option value="grok-2">Grok-2 (xAI)</option>
                      <option value="gpt-4">GPT-4 (OpenAI)</option>
                      <option value="claude-3">Claude 3 (Anthropic)</option>
                    </Select>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tone & Voice</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Tone</label>
                      <Select
                        value={getSetting("ai.tone", "professional")}
                        onChange={(e) => updateSetting("ai.tone", e.target.value)}
                      >
                        <option value="professional">Professional</option>
                        <option value="casual">Casual</option>
                        <option value="friendly">Friendly</option>
                        <option value="authoritative">Authoritative</option>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Brand Voice Guidelines</label>
                      <Textarea
                        value={getSetting("ai.brandVoice", "")}
                        onChange={(e) => updateSetting("ai.brandVoice", e.target.value)}
                        placeholder="Describe your brand's voice and personality for AI-generated content..."
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Content Guardrails</CardTitle>
                    <CardDescription>Define boundaries for AI-generated content.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Content Rules</label>
                      <Textarea
                        value={getSetting("ai.guardrails", "")}
                        onChange={(e) => updateSetting("ai.guardrails", e.target.value)}
                        placeholder="e.g., Never mention competitors by name. Always include a call-to-action..."
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Negative Keywords</label>
                      <Input
                        value={getSetting("ai.negativeKeywords", "")}
                        onChange={(e) => updateSetting("ai.negativeKeywords", e.target.value)}
                        placeholder="cheap, free, guarantee (comma-separated)"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Words or phrases the AI should never use in generated content.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs font-medium text-muted-foreground">Total Posts</p>
                      <p className="text-2xl font-bold mt-1">127</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs font-medium text-muted-foreground">Avg Engagement</p>
                      <p className="text-2xl font-bold mt-1">4.1%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs font-medium text-muted-foreground">Best Performing Type</p>
                      <p className="text-2xl font-bold mt-1">Engaging</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Engagement Rate by Content Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={engagementData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="type" fontSize={12} />
                          <YAxis fontSize={12} unit="%" />
                          <Tooltip formatter={(value: number) => [`${value}%`, "Engagement Rate"]} />
                          <Bar dataKey="rate" fill="hsl(221.2, 83.2%, 53.3%)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      
    </>
  );
}
