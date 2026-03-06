"use client";

import React, { useState, useMemo } from "react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/hooks/useSettings";
import { Palette, Copy, Sun, Moon } from "lucide-react";

const COLOR_VARS = [
  { key: "background", label: "Background", default: "#ffffff" },
  { key: "foreground", label: "Foreground", default: "#0a0a0a" },
  { key: "primary", label: "Primary", default: "#171717" },
  { key: "secondary", label: "Secondary", default: "#f5f5f5" },
  { key: "muted", label: "Muted", default: "#f5f5f5" },
  { key: "accent", label: "Accent", default: "#f5f5f5" },
  { key: "destructive", label: "Destructive", default: "#ef4444" },
  { key: "card", label: "Card", default: "#ffffff" },
  { key: "popover", label: "Popover", default: "#ffffff" },
  { key: "border", label: "Border", default: "#e5e5e5" },
  { key: "input", label: "Input", default: "#e5e5e5" },
  { key: "ring", label: "Ring", default: "#171717" },
];

const TYPOGRAPHY_VARS = [
  { key: "font-size-sm", label: "Font Size SM", default: "0.875rem", type: "text" },
  { key: "font-size-base", label: "Font Size Base", default: "1rem", type: "text" },
  { key: "font-size-lg", label: "Font Size LG", default: "1.125rem", type: "text" },
  { key: "font-size-xl", label: "Font Size XL", default: "1.25rem", type: "text" },
  { key: "font-weight-normal", label: "Font Weight Normal", default: "400", type: "text" },
  { key: "font-weight-medium", label: "Font Weight Medium", default: "500", type: "text" },
  { key: "font-weight-bold", label: "Font Weight Bold", default: "700", type: "text" },
  { key: "font-family-sans", label: "Font Family Sans", default: "Inter, sans-serif", type: "text" },
  { key: "font-family-mono", label: "Font Family Mono", default: "monospace", type: "text" },
];

const SPACING_VARS = [
  { key: "radius-sm", label: "Radius SM", default: "0.25rem" },
  { key: "radius-md", label: "Radius MD", default: "0.5rem" },
  { key: "radius-lg", label: "Radius LG", default: "0.75rem" },
  { key: "radius-full", label: "Radius Full", default: "9999px" },
];

const SHADOW_VARS = [
  { key: "shadow-sm", label: "Shadow SM", default: "0 1px 2px rgba(0,0,0,0.05)" },
  { key: "shadow-md", label: "Shadow MD", default: "0 4px 6px rgba(0,0,0,0.1)" },
  { key: "shadow-lg", label: "Shadow LG", default: "0 10px 15px rgba(0,0,0,0.1)" },
];

const TRANSITION_VARS = [
  { key: "duration-default", label: "Duration Default", default: "150ms" },
  { key: "duration-fast", label: "Duration Fast", default: "100ms" },
  { key: "duration-slow", label: "Duration Slow", default: "300ms" },
];

export default function CssDashboardPage() {
  const { getSetting, updateSetting, saveSettings, saving, loading } = useSettings("css");
  const [darkPreview, setDarkPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [componentOverrides, setComponentOverrides] = useState("");

  const getVal = (key: string, def: string) => getSetting(key, def);
  const setVal = (key: string, value: string) => updateSetting(key, value);

  React.useEffect(() => {
    if (!loading) {
      setComponentOverrides(getSetting("component-overrides", ""));
    }
  }, [loading]);

  const generatedCSS = useMemo(() => {
    let css = ":root {\n";
    COLOR_VARS.forEach((v) => {
      css += `  --${v.key}: ${getVal(v.key, v.default)};\n`;
    });
    TYPOGRAPHY_VARS.forEach((v) => {
      css += `  --${v.key}: ${getVal(v.key, v.default)};\n`;
    });
    SPACING_VARS.forEach((v) => {
      css += `  --${v.key}: ${getVal(v.key, v.default)};\n`;
    });
    SHADOW_VARS.forEach((v) => {
      css += `  --${v.key}: ${getVal(v.key, v.default)};\n`;
    });
    TRANSITION_VARS.forEach((v) => {
      css += `  --${v.key}: ${getVal(v.key, v.default)};\n`;
    });
    css += "}\n";
    if (componentOverrides.trim()) {
      css += "\n" + componentOverrides + "\n";
    }
    return css;
  }, [getVal, componentOverrides]);

  const handleExport = () => {
    navigator.clipboard.writeText(generatedCSS).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSave = async () => {
    updateSetting("component-overrides", componentOverrides);
    await saveSettings();
  };

  const previewStyles: React.CSSProperties = {
    backgroundColor: darkPreview ? "#1a1a2e" : getVal("background", "#ffffff"),
    color: darkPreview ? "#e5e5e5" : getVal("foreground", "#0a0a0a"),
    borderRadius: getVal("radius-lg", "0.75rem"),
    padding: "1.5rem",
    fontFamily: getVal("font-family-sans", "Inter, sans-serif"),
    transition: `all ${getVal("duration-default", "150ms")} ease`,
  };

  const previewCardStyles: React.CSSProperties = {
    backgroundColor: darkPreview ? "#16213e" : getVal("card", "#ffffff"),
    border: `1px solid ${darkPreview ? "#333" : getVal("border", "#e5e5e5")}`,
    borderRadius: getVal("radius-md", "0.5rem"),
    padding: "1rem",
    boxShadow: getVal("shadow-md", "0 4px 6px rgba(0,0,0,0.1)"),
    marginBottom: "1rem",
  };

  const previewButtonStyles: React.CSSProperties = {
    backgroundColor: getVal("primary", "#171717"),
    color: "#fff",
    border: "none",
    borderRadius: getVal("radius-md", "0.5rem"),
    padding: "0.5rem 1rem",
    fontSize: getVal("font-size-sm", "0.875rem"),
    fontWeight: Number(getVal("font-weight-medium", "500")),
    cursor: "pointer",
    transition: `all ${getVal("duration-default", "150ms")} ease`,
    marginRight: "0.5rem",
  };

  const previewInputStyles: React.CSSProperties = {
    border: `1px solid ${darkPreview ? "#444" : getVal("input", "#e5e5e5")}`,
    borderRadius: getVal("radius-md", "0.5rem"),
    padding: "0.5rem 0.75rem",
    fontSize: getVal("font-size-base", "1rem"),
    backgroundColor: darkPreview ? "#1a1a2e" : getVal("background", "#ffffff"),
    color: darkPreview ? "#e5e5e5" : getVal("foreground", "#0a0a0a"),
    width: "100%",
    marginBottom: "0.75rem",
    outline: "none",
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading CSS settings...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Palette className="h-8 w-8" />
              CSS Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Customize CSS variables with live preview
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Copy className="h-4 w-4 mr-2" />
              {copied ? "Copied!" : "Export CSS"}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Tabs defaultValue="colors">
              <TabsList className="w-full flex-wrap">
                <TabsTrigger value="colors">Colors</TabsTrigger>
                <TabsTrigger value="typography">Typography</TabsTrigger>
                <TabsTrigger value="spacing">Spacing</TabsTrigger>
                <TabsTrigger value="shadows">Shadows</TabsTrigger>
                <TabsTrigger value="transitions">Transitions</TabsTrigger>
                <TabsTrigger value="overrides">Overrides</TabsTrigger>
              </TabsList>

              <TabsContent value="colors">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Colors</CardTitle>
                    <CardDescription>Customize color CSS variables</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {COLOR_VARS.map((v) => (
                        <div key={v.key} className="space-y-1">
                          <label className="text-sm font-medium">{v.label}</label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={getVal(v.key, v.default)}
                              onChange={(e) => setVal(v.key, e.target.value)}
                              className="h-10 w-12 rounded border cursor-pointer"
                            />
                            <Input
                              value={getVal(v.key, v.default)}
                              onChange={(e) => setVal(v.key, e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="typography">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Typography</CardTitle>
                    <CardDescription>Font sizes, weights, and families</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {TYPOGRAPHY_VARS.map((v) => (
                        <div key={v.key} className="space-y-1">
                          <label className="text-sm font-medium">{v.label}</label>
                          <Input
                            value={getVal(v.key, v.default)}
                            onChange={(e) => setVal(v.key, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="spacing">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Spacing</CardTitle>
                    <CardDescription>Border radius values</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {SPACING_VARS.map((v) => (
                        <div key={v.key} className="space-y-1">
                          <label className="text-sm font-medium">{v.label}</label>
                          <Input
                            value={getVal(v.key, v.default)}
                            onChange={(e) => setVal(v.key, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="shadows">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Shadows</CardTitle>
                    <CardDescription>Box shadow values</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {SHADOW_VARS.map((v) => (
                        <div key={v.key} className="space-y-1">
                          <label className="text-sm font-medium">{v.label}</label>
                          <Input
                            value={getVal(v.key, v.default)}
                            onChange={(e) => setVal(v.key, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transitions">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Transitions</CardTitle>
                    <CardDescription>Animation duration values</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {TRANSITION_VARS.map((v) => (
                        <div key={v.key} className="space-y-1">
                          <label className="text-sm font-medium">{v.label}</label>
                          <Input
                            value={getVal(v.key, v.default)}
                            onChange={(e) => setVal(v.key, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="overrides">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Component Overrides</CardTitle>
                    <CardDescription>Raw CSS for component-level overrides</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      className="w-full h-48 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder={".btn-custom {\n  background: #333;\n  color: #fff;\n}"}
                      value={componentOverrides}
                      onChange={(e) => setComponentOverrides(e.target.value)}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Live Preview</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDarkPreview(!darkPreview)}
                  >
                    {darkPreview ? (
                      <Sun className="h-4 w-4 mr-2" />
                    ) : (
                      <Moon className="h-4 w-4 mr-2" />
                    )}
                    {darkPreview ? "Light" : "Dark"}
                  </Button>
                </div>
                <CardDescription>
                  Preview how components look with current CSS variables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={previewStyles}>
                  <div style={previewCardStyles}>
                    <h3
                      style={{
                        fontSize: getVal("font-size-lg", "1.125rem"),
                        fontWeight: Number(getVal("font-weight-bold", "700")),
                        marginBottom: "0.5rem",
                      }}
                    >
                      Sample Card
                    </h3>
                    <p
                      style={{
                        fontSize: getVal("font-size-sm", "0.875rem"),
                        opacity: 0.7,
                        marginBottom: "0.75rem",
                      }}
                    >
                      This card demonstrates how your CSS variables affect component appearance.
                    </p>
                    <input
                      style={previewInputStyles}
                      placeholder="Sample input field..."
                      readOnly
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <button style={previewButtonStyles}>Primary</button>
                      <button
                        style={{
                          ...previewButtonStyles,
                          backgroundColor: getVal("secondary", "#f5f5f5"),
                          color: darkPreview ? "#e5e5e5" : getVal("foreground", "#0a0a0a"),
                        }}
                      >
                        Secondary
                      </button>
                      <button
                        style={{
                          ...previewButtonStyles,
                          backgroundColor: getVal("destructive", "#ef4444"),
                        }}
                      >
                        Destructive
                      </button>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          borderRadius: getVal("radius-full", "9999px"),
                          backgroundColor: getVal("primary", "#171717"),
                          color: "#fff",
                          padding: "0.125rem 0.625rem",
                          fontSize: getVal("font-size-sm", "0.875rem"),
                          fontWeight: Number(getVal("font-weight-medium", "500")),
                        }}
                      >
                        Badge
                      </span>
                    </div>
                  </div>

                  <div style={previewCardStyles}>
                    <h3
                      style={{
                        fontSize: getVal("font-size-base", "1rem"),
                        fontWeight: Number(getVal("font-weight-medium", "500")),
                        marginBottom: "0.5rem",
                      }}
                    >
                      Typography Preview
                    </h3>
                    <p style={{ fontSize: getVal("font-size-xl", "1.25rem"), marginBottom: "0.25rem" }}>
                      Extra Large Text
                    </p>
                    <p style={{ fontSize: getVal("font-size-lg", "1.125rem"), marginBottom: "0.25rem" }}>
                      Large Text
                    </p>
                    <p style={{ fontSize: getVal("font-size-base", "1rem"), marginBottom: "0.25rem" }}>
                      Base Text
                    </p>
                    <p style={{ fontSize: getVal("font-size-sm", "0.875rem") }}>
                      Small Text
                    </p>
                    <p
                      style={{
                        fontFamily: getVal("font-family-mono", "monospace"),
                        fontSize: getVal("font-size-sm", "0.875rem"),
                        marginTop: "0.5rem",
                        opacity: 0.7,
                      }}
                    >
                      Monospace font sample
                    </p>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "0.5rem",
                    }}
                  >
                    {["sm", "md", "lg", "full"].map((size) => (
                      <div
                        key={size}
                        style={{
                          backgroundColor: getVal("primary", "#171717"),
                          height: "3rem",
                          borderRadius: getVal(`radius-${size}`, "0.5rem"),
                        }}
                        title={`radius-${size}`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
