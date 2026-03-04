import React, { useState } from "react";
import Head from "next/head";
import { SetupLayout } from "@/layout/SetupLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettings } from "@/hooks/useSettings";
import { File, Plus, Trash2 } from "lucide-react";

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
}

export default function PagesSetup() {
  const { getSetting, updateSetting, saveSettings, loading, saving } =
    useSettings("pages");
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);

  React.useEffect(() => {
    if (!loading) {
      const saved = getSetting("customPages");
      if (saved) {
        try {
          setCustomPages(JSON.parse(saved));
        } catch {}
      }
    }
  }, [loading, getSetting]);

  const addCustomPage = () => {
    setCustomPages([
      ...customPages,
      {
        id: Date.now().toString(),
        title: "",
        slug: "",
        content: "",
      },
    ]);
  };

  const updateCustomPage = (
    id: string,
    field: keyof CustomPage,
    value: string
  ) => {
    setCustomPages((pages) =>
      pages.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const removeCustomPage = (id: string) => {
    setCustomPages((pages) => pages.filter((p) => p.id !== id));
  };

  const handleSave = async () => {
    updateSetting("customPages", JSON.stringify(customPages));
    await saveSettings();
  };

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
        <title>Pages - Setup - MuseKit Admin</title>
      </Head>
      <SetupLayout>
        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <File className="h-6 w-6" /> Pages
              </h1>
              <p className="text-muted-foreground text-sm">
                Configure page content and settings.
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <Tabs defaultValue="about">
            <TabsList>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="legal">Legal</TabsTrigger>
              <TabsTrigger value="custom">Custom Pages</TabsTrigger>
            </TabsList>

            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About Page</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={getSetting("aboutTitle", "About Us")}
                      onChange={(e) =>
                        updateSetting("aboutTitle", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Content</label>
                    <Textarea
                      value={getSetting("aboutContent")}
                      onChange={(e) =>
                        updateSetting("aboutContent", e.target.value)
                      }
                      rows={8}
                      placeholder="About page content (supports markdown)..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Page</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Contact Email</label>
                    <Input
                      value={getSetting("contactEmail")}
                      onChange={(e) =>
                        updateSetting("contactEmail", e.target.value)
                      }
                      placeholder="support@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Contact Form Enabled
                    </label>
                    <label className="flex items-center gap-2 mt-1">
                      <input
                        type="checkbox"
                        checked={
                          getSetting("contactFormEnabled", "true") === "true"
                        }
                        onChange={(e) =>
                          updateSetting(
                            "contactFormEnabled",
                            e.target.checked ? "true" : "false"
                          )
                        }
                        className="rounded"
                      />
                      <span className="text-sm">Show contact form</span>
                    </label>
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Additional Info
                    </label>
                    <Textarea
                      value={getSetting("contactInfo")}
                      onChange={(e) =>
                        updateSetting("contactInfo", e.target.value)
                      }
                      rows={4}
                      placeholder="Address, phone, office hours..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="legal">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Legal Pages</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Terms of Service URL</label>
                    <Input
                      value={getSetting("termsUrl")}
                      onChange={(e) =>
                        updateSetting("termsUrl", e.target.value)
                      }
                      placeholder="/terms or external URL"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Privacy Policy URL</label>
                    <Input
                      value={getSetting("privacyUrl")}
                      onChange={(e) =>
                        updateSetting("privacyUrl", e.target.value)
                      }
                      placeholder="/privacy or external URL"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Cookie Policy URL</label>
                    <Input
                      value={getSetting("cookieUrl")}
                      onChange={(e) =>
                        updateSetting("cookieUrl", e.target.value)
                      }
                      placeholder="/cookies or external URL"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="custom">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Custom Pages</CardTitle>
                    <Button variant="outline" size="sm" onClick={addCustomPage}>
                      <Plus className="h-4 w-4 mr-1" /> Add Page
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {customPages.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">
                      No custom pages yet. Click &quot;Add Page&quot; to create one.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {customPages.map((page) => (
                        <div key={page.id} className="p-4 border rounded-md space-y-3">
                          <div className="flex items-center gap-2">
                            <Input
                              value={page.title}
                              onChange={(e) =>
                                updateCustomPage(page.id, "title", e.target.value)
                              }
                              placeholder="Page Title"
                              className="flex-1"
                            />
                            <Input
                              value={page.slug}
                              onChange={(e) =>
                                updateCustomPage(page.id, "slug", e.target.value)
                              }
                              placeholder="/slug"
                              className="w-32"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeCustomPage(page.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <Textarea
                            value={page.content}
                            onChange={(e) =>
                              updateCustomPage(page.id, "content", e.target.value)
                            }
                            rows={4}
                            placeholder="Page content..."
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SetupLayout>
    </>
  );
}
