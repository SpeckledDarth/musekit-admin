import React, { useEffect, useState, useMemo } from "react";
import Head from "next/head";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Key,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Check,
  X,
  AlertCircle,
  Search,
  Plus,
} from "lucide-react";

interface ApiKey {
  id: string;
  label: string;
  value: string;
  group: string;
  required: boolean;
  source?: string;
}

interface PlatformDef {
  id: string;
  label: string;
  group: string;
  required: boolean;
}

interface KeyGroup {
  id: string;
  label: string;
  required: boolean;
}

const keyGroups: KeyGroup[] = [
  { id: "core", label: "Core", required: true },
  { id: "email", label: "Email", required: false },
  { id: "oauth", label: "OAuth", required: false },
  { id: "social", label: "Social Media", required: false },
  { id: "ai", label: "AI", required: false },
  { id: "analytics", label: "Analytics", required: false },
  { id: "infrastructure", label: "Infrastructure", required: false },
  { id: "automation", label: "Automation", required: false },
  { id: "security", label: "Security", required: false },
  { id: "cdn", label: "CDN", required: false },
  { id: "storage", label: "Storage", required: false },
  { id: "custom", label: "Custom", required: false },
];

const platformDefs: PlatformDef[] = [
  { id: "supabase_url", label: "Supabase URL", group: "core", required: true },
  { id: "supabase_anon_key", label: "Supabase Anon Key", group: "core", required: true },
  { id: "supabase_service_role", label: "Supabase Service Role Key", group: "core", required: true },
  { id: "stripe_secret", label: "Stripe Secret Key", group: "core", required: true },
  { id: "stripe_publishable", label: "Stripe Publishable Key", group: "core", required: true },

  { id: "resend_api_key", label: "Resend API Key", group: "email", required: false },
  { id: "sendgrid_api_key", label: "SendGrid API Key", group: "email", required: false },
  { id: "mailgun_api_key", label: "Mailgun API Key", group: "email", required: false },

  { id: "google_client_id", label: "Google Client ID", group: "oauth", required: false },
  { id: "google_client_secret", label: "Google Client Secret", group: "oauth", required: false },
  { id: "github_client_id", label: "GitHub Client ID", group: "oauth", required: false },
  { id: "github_client_secret", label: "GitHub Client Secret", group: "oauth", required: false },
  { id: "apple_client_id", label: "Apple Client ID", group: "oauth", required: false },
  { id: "apple_client_secret", label: "Apple Client Secret", group: "oauth", required: false },
  { id: "twitter_oauth_client_id", label: "Twitter Client ID", group: "oauth", required: false },
  { id: "twitter_oauth_client_secret", label: "Twitter Client Secret", group: "oauth", required: false },

  { id: "twitter_api_key", label: "Twitter/X API Key", group: "social", required: false },
  { id: "twitter_api_secret", label: "Twitter/X API Secret", group: "social", required: false },
  { id: "facebook_app_id", label: "Facebook App ID", group: "social", required: false },
  { id: "facebook_app_secret", label: "Facebook App Secret", group: "social", required: false },
  { id: "linkedin_client_id", label: "LinkedIn Client ID", group: "social", required: false },
  { id: "linkedin_client_secret", label: "LinkedIn Client Secret", group: "social", required: false },
  { id: "instagram_client_id", label: "Instagram Client ID", group: "social", required: false },
  { id: "instagram_client_secret", label: "Instagram Client Secret", group: "social", required: false },

  { id: "xai_api_key", label: "xAI API Key", group: "ai", required: false },
  { id: "openai_api_key", label: "OpenAI API Key", group: "ai", required: false },
  { id: "anthropic_api_key", label: "Anthropic API Key", group: "ai", required: false },
  { id: "google_ai_api_key", label: "Google AI API Key", group: "ai", required: false },

  { id: "google_analytics_id", label: "Google Analytics ID", group: "analytics", required: false },
  { id: "plausible_domain", label: "Plausible Domain", group: "analytics", required: false },
  { id: "mixpanel_token", label: "Mixpanel Token", group: "analytics", required: false },

  { id: "sentry_dsn", label: "Sentry DSN", group: "infrastructure", required: false },
  { id: "upstash_redis_url", label: "Upstash Redis URL", group: "infrastructure", required: false },
  { id: "upstash_redis_token", label: "Upstash Redis Token", group: "infrastructure", required: false },
  { id: "vercel_token", label: "Vercel Token", group: "infrastructure", required: false },

  { id: "zapier_webhook_url", label: "Zapier Webhook URL", group: "automation", required: false },
  { id: "make_webhook_url", label: "Make Webhook URL", group: "automation", required: false },

  { id: "hcaptcha_site_key", label: "hCaptcha Site Key", group: "security", required: false },
  { id: "hcaptcha_secret", label: "hCaptcha Secret Key", group: "security", required: false },
  { id: "recaptcha_site_key", label: "reCAPTCHA Site Key", group: "security", required: false },
  { id: "recaptcha_secret", label: "reCAPTCHA Secret Key", group: "security", required: false },
  { id: "turnstile_site_key", label: "Cloudflare Turnstile Site Key", group: "security", required: false },
  { id: "turnstile_secret", label: "Cloudflare Turnstile Secret Key", group: "security", required: false },

  { id: "cloudflare_api_token", label: "Cloudflare API Token", group: "cdn", required: false },
  { id: "bunny_cdn_api_key", label: "BunnyCDN API Key", group: "cdn", required: false },
  { id: "fastly_api_token", label: "Fastly API Token", group: "cdn", required: false },

  { id: "aws_s3_access_key", label: "AWS S3 Access Key", group: "storage", required: false },
  { id: "aws_s3_secret_key", label: "AWS S3 Secret Key", group: "storage", required: false },
  { id: "aws_s3_bucket", label: "AWS S3 Bucket", group: "storage", required: false },
  { id: "aws_s3_region", label: "AWS S3 Region", group: "storage", required: false },
  { id: "cloudflare_r2_access_key", label: "Cloudflare R2 Access Key", group: "storage", required: false },
  { id: "cloudflare_r2_secret_key", label: "Cloudflare R2 Secret Key", group: "storage", required: false },
];

function validateKey(label: string, value: string): string | null {
  if (!value) return null;
  const lower = label.toLowerCase();
  if (lower.includes("stripe") && lower.includes("secret")) {
    if (!value.startsWith("sk_")) return "Stripe secret keys must start with sk_";
  }
  if (lower.includes("supabase") && lower.includes("url")) {
    if (!value.includes("supabase")) return "Doesn't look like a Supabase URL";
  }
  return null;
}

export default function ApiKeysSetup() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [customKeyLabel, setCustomKeyLabel] = useState("");
  const [addingCustom, setAddingCustom] = useState(false);

  useEffect(() => {
    async function fetchKeys() {
      try {
        const res = await fetch("/admin/api/admin/setup/api-keys");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const fetchedKeys: ApiKey[] = data.keys || [];

        const mergedKeys: ApiKey[] = platformDefs.map((def) => {
          const existing = fetchedKeys.find((k) => k.id === def.id);
          return {
            id: def.id,
            label: def.label,
            value: existing?.value || "",
            group: def.group,
            required: def.required,
            source: existing?.source,
          };
        });

        const customKeys = fetchedKeys.filter(
          (k) => !platformDefs.find((d) => d.id === k.id)
        );
        customKeys.forEach((k) => {
          mergedKeys.push({ ...k, group: k.group || "custom", required: false });
        });

        setKeys(mergedKeys);
      } catch (error) {
        console.error("Error fetching API keys:", error);
        setKeys(
          platformDefs.map((def) => ({
            id: def.id,
            label: def.label,
            value: "",
            group: def.group,
            required: def.required,
          }))
        );
      } finally {
        setLoading(false);
      }
    }
    fetchKeys();
  }, []);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const toggleReveal = (keyId: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(keyId)) next.delete(keyId);
      else next.add(keyId);
      return next;
    });
  };

  const startEdit = (key: ApiKey) => {
    setEditingKey(key.id);
    setEditValue(key.value);
  };

  const saveEdit = async (keyId: string) => {
    try {
      await fetch("/admin/api/admin/setup/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: keyId, value: editValue }),
      });
      setKeys((prev) =>
        prev.map((k) => (k.id === keyId ? { ...k, value: editValue } : k))
      );
      setEditingKey(null);
    } catch (error) {
      console.error("Error saving key:", error);
    }
  };

  const deleteKey = async (keyId: string) => {
    try {
      await fetch("/admin/api/admin/setup/api-keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: keyId }),
      });
      const isPlatformKey = platformDefs.find((d) => d.id === keyId);
      if (isPlatformKey) {
        setKeys((prev) =>
          prev.map((k) => (k.id === keyId ? { ...k, value: "" } : k))
        );
      } else {
        setKeys((prev) => prev.filter((k) => k.id !== keyId));
      }
    } catch (error) {
      console.error("Error deleting key:", error);
    }
  };

  const addCustomKey = () => {
    if (!customKeyLabel.trim()) return;
    const id = `custom_${Date.now()}`;
    setKeys((prev) => [
      ...prev,
      {
        id,
        label: customKeyLabel.trim(),
        value: "",
        group: "custom",
        required: false,
      },
    ]);
    setCustomKeyLabel("");
    setAddingCustom(false);
    setExpandedGroups((prev) => new Set(prev).add("custom"));
    setEditingKey(id);
    setEditValue("");
  };

  const filteredGroups = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return keyGroups;

    return keyGroups.filter((group) => {
      if (group.label.toLowerCase().includes(query)) return true;
      const groupKeys = keys.filter((k) => k.group === group.id);
      return groupKeys.some((k) => k.label.toLowerCase().includes(query));
    });
  }, [searchQuery, keys]);

  const getFilteredKeys = (groupId: string) => {
    const groupKeys = keys.filter((k) => k.group === groupId);
    const query = searchQuery.toLowerCase().trim();
    if (!query) return groupKeys;
    return groupKeys.filter(
      (k) =>
        k.label.toLowerCase().includes(query) ||
        keyGroups.find((g) => g.id === groupId)?.label.toLowerCase().includes(query)
    );
  };

  const configuredRequired = keys.filter((k) => k.required && k.value).length;
  const totalRequired = keys.filter((k) => k.required).length;
  const totalConfigured = keys.filter((k) => k.value).length;

  if (loading) {
    return (
      <>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>API Keys - Setup - MuseKit Admin</title>
      </Head>
      
        <div className="space-y-6 max-w-3xl">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Key className="h-6 w-6" /> API Keys & Integrations
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage API keys and integration credentials across {platformDefs.length}+ platforms.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{totalConfigured}</p>
                <p className="text-xs text-muted-foreground">
                  Total Keys Configured
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">
                  {configuredRequired}/{totalRequired}
                </p>
                <p className="text-xs text-muted-foreground">
                  Required Keys
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{keyGroups.length}</p>
                <p className="text-xs text-muted-foreground">
                  Categories
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search keys and categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {filteredGroups.map((group) => {
            const groupKeys = getFilteredKeys(group.id);
            if (groupKeys.length === 0 && group.id !== "custom") return null;

            const allGroupKeys = keys.filter((k) => k.group === group.id);
            const expanded = expandedGroups.has(group.id);
            const allConfigured = allGroupKeys.length > 0 && allGroupKeys.every((k) => k.value);
            const someConfigured = allGroupKeys.some((k) => k.value);

            return (
              <Card key={group.id}>
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        allConfigured
                          ? "bg-green-500"
                          : someConfigured
                            ? "bg-yellow-500"
                            : "bg-gray-300"
                      }`}
                    />
                    <span className="font-medium">{group.label}</span>
                    {group.required ? (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Optional
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      ({allGroupKeys.filter((k) => k.value).length}/
                      {allGroupKeys.length})
                    </span>
                  </div>
                  {expanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {expanded && (
                  <CardContent className="pt-0 space-y-3">
                    {groupKeys.map((key) => {
                      const validationError = validateKey(key.label, key.value);
                      const isEditing = editingKey === key.id;
                      const isRevealed = revealedKeys.has(key.id);

                      return (
                        <div
                          key={key.id}
                          className="flex items-center gap-3 p-3 rounded-md border"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {key.label}
                              </span>
                              {key.source && (
                                <Badge variant="outline" className="text-xs">
                                  {key.source}
                                </Badge>
                              )}
                            </div>
                            {isEditing ? (
                              <div className="flex items-center gap-2 mt-1">
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="text-sm"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => saveEdit(key.id)}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => setEditingKey(null)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground font-mono mt-1">
                                {key.value
                                  ? isRevealed
                                    ? key.value
                                    : `${key.value.slice(0, 8)}${"*".repeat(20)}`
                                  : "Not configured"}
                              </p>
                            )}
                            {validationError && (
                              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                                <AlertCircle className="h-3 w-3" />
                                {validationError}
                              </p>
                            )}
                          </div>
                          {!isEditing && (
                            <div className="flex items-center gap-1">
                              {key.value && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => toggleReveal(key.id)}
                                >
                                  {isRevealed ? (
                                    <EyeOff className="h-3 w-3" />
                                  ) : (
                                    <Eye className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => startEdit(key)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              {!key.required && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => deleteKey(key.id)}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {group.id === "custom" && (
                      <div className="pt-2">
                        {addingCustom ? (
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Key label (e.g., My Service API Key)"
                              value={customKeyLabel}
                              onChange={(e) => setCustomKeyLabel(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") addCustomKey();
                              }}
                              className="text-sm"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={addCustomKey}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setAddingCustom(false);
                                setCustomKeyLabel("");
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAddingCustom(true);
                              setExpandedGroups((prev) =>
                                new Set(prev).add("custom")
                              );
                            }}
                            className="w-full"
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Custom Key
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      
    </>
  );
}
