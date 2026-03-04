import React from "react";
import Head from "next/head";
import { SetupLayout } from "@/layout/SetupLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettings";
import { ShieldCheck, Key, Lock } from "lucide-react";

const identityProviders = [
  { key: "okta", label: "Okta" },
  { key: "azure", label: "Azure AD" },
  { key: "google-workspace", label: "Google Workspace" },
];

export default function SecuritySetup() {
  const { getSetting, updateSetting, saveSettings, loading, saving } =
    useSettings("security");

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
        <title>Security - Setup - MuseKit Admin</title>
      </Head>
      <SetupLayout>
        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShieldCheck className="h-6 w-6" /> Security & Compliance
              </h1>
              <p className="text-muted-foreground text-sm">
                Configure SSO, MFA, and password policies.
              </p>
            </div>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-5 w-5" /> SSO / SAML
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={getSetting("ssoEnabled", "false") === "true"}
                  onChange={(e) =>
                    updateSetting(
                      "ssoEnabled",
                      e.target.checked ? "true" : "false"
                    )
                  }
                  className="rounded"
                />
                <span className="text-sm font-medium">Enable SSO</span>
              </label>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Identity Providers
                </label>
                <div className="space-y-2">
                  {identityProviders.map((provider) => (
                    <div
                      key={provider.key}
                      className="flex items-center gap-3 p-3 rounded-md border"
                    >
                      <input
                        type="checkbox"
                        checked={
                          getSetting(`sso.${provider.key}`, "false") === "true"
                        }
                        onChange={(e) =>
                          updateSetting(
                            `sso.${provider.key}`,
                            e.target.checked ? "true" : "false"
                          )
                        }
                        className="rounded"
                      />
                      <span className="text-sm font-medium flex-1">
                        {provider.label}
                      </span>
                      <Input
                        value={getSetting(`sso.${provider.key}.entityId`)}
                        onChange={(e) =>
                          updateSetting(
                            `sso.${provider.key}.entityId`,
                            e.target.value
                          )
                        }
                        placeholder="Entity ID / Issuer URL"
                        className="w-64"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Multi-Factor Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={getSetting("mfaEnabled", "false") === "true"}
                  onChange={(e) =>
                    updateSetting(
                      "mfaEnabled",
                      e.target.checked ? "true" : "false"
                    )
                  }
                  className="rounded"
                />
                <div>
                  <span className="text-sm font-medium">Enable MFA</span>
                  <p className="text-xs text-muted-foreground">
                    Require multi-factor authentication for all users
                  </p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={getSetting("mfaAdminOnly", "true") === "true"}
                  onChange={(e) =>
                    updateSetting(
                      "mfaAdminOnly",
                      e.target.checked ? "true" : "false"
                    )
                  }
                  className="rounded"
                />
                <div>
                  <span className="text-sm font-medium">
                    Admin-Only MFA
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Only require MFA for admin users
                  </p>
                </div>
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-5 w-5" /> Password Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    Minimum Length
                  </label>
                  <Input
                    type="number"
                    value={getSetting("passwordMinLength", "8")}
                    onChange={(e) =>
                      updateSetting("passwordMinLength", e.target.value)
                    }
                    min={6}
                    max={32}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Password Expiry (days)
                  </label>
                  <Input
                    type="number"
                    value={getSetting("passwordExpiry", "0")}
                    onChange={(e) =>
                      updateSetting("passwordExpiry", e.target.value)
                    }
                    min={0}
                    placeholder="0 = never"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={
                      getSetting("passwordRequireUppercase", "true") === "true"
                    }
                    onChange={(e) =>
                      updateSetting(
                        "passwordRequireUppercase",
                        e.target.checked ? "true" : "false"
                      )
                    }
                    className="rounded"
                  />
                  Require uppercase letter
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={
                      getSetting("passwordRequireNumber", "true") === "true"
                    }
                    onChange={(e) =>
                      updateSetting(
                        "passwordRequireNumber",
                        e.target.checked ? "true" : "false"
                      )
                    }
                    className="rounded"
                  />
                  Require number
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={
                      getSetting("passwordRequireSpecial", "false") === "true"
                    }
                    onChange={(e) =>
                      updateSetting(
                        "passwordRequireSpecial",
                        e.target.checked ? "true" : "false"
                      )
                    }
                    className="rounded"
                  />
                  Require special character
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      </SetupLayout>
    </>
  );
}
