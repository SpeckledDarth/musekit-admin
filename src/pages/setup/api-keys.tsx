import React, { useEffect, useState } from "react";
import Head from "next/head";
import { SetupLayout } from "@/layout/SetupLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";

interface ApiKey {
  id: string;
  label: string;
  value: string;
  group: string;
  required: boolean;
  source?: string;
}

const keyGroups = [
  { id: "supabase", label: "Supabase", required: true },
  { id: "stripe", label: "Stripe", required: true },
  { id: "resend", label: "Resend (Email)", required: true },
  { id: "ai", label: "AI Providers", required: false },
  { id: "analytics", label: "Analytics", required: false },
  { id: "custom", label: "Custom", required: false },
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

  useEffect(() => {
    async function fetchKeys() {
      try {
        const res = await fetch("/api/admin/setup/api-keys");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setKeys(data.keys || []);
      } catch (error) {
        console.error("Error fetching API keys:", error);
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
      await fetch("/api/admin/setup/api-keys", {
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
      await fetch("/api/admin/setup/api-keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: keyId }),
      });
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
    } catch (error) {
      console.error("Error deleting key:", error);
    }
  };

  const configuredRequired = keys.filter(
    (k) => k.required && k.value
  ).length;
  const totalRequired = keys.filter((k) => k.required).length;
  const totalConfigured = keys.filter((k) => k.value).length;

  if (loading) {
    return (
      <SetupLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </SetupLayout>
    );
  }

  return (
    <>
      <Head>
        <title>API Keys - Setup - MuseKit Admin</title>
      </Head>
      <SetupLayout>
        <div className="space-y-6 max-w-3xl">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Key className="h-6 w-6" /> API Keys & Integrations
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage API keys and integration credentials.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                  Required Keys Configured
                </p>
              </CardContent>
            </Card>
          </div>

          {keyGroups.map((group) => {
            const groupKeys = keys.filter((k) => k.group === group.id);
            if (groupKeys.length === 0) return null;

            const expanded = expandedGroups.has(group.id);
            const allConfigured = groupKeys.every((k) => k.value);
            const someConfigured = groupKeys.some((k) => k.value);

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
                      ({groupKeys.filter((k) => k.value).length}/
                      {groupKeys.length})
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
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </SetupLayout>
    </>
  );
}
