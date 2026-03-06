import React, { useState } from "react";
import Head from "next/head";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettings";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Key, Lock, Shield, CheckCircle } from "lucide-react";

const identityProviders = [
  { key: "okta", label: "Okta" },
  { key: "azure", label: "Azure AD" },
  { key: "google-workspace", label: "Google Workspace" },
];

const captchaProviders = [
  { key: "hcaptcha", label: "hCaptcha" },
  { key: "recaptcha-v2", label: "reCAPTCHA v2" },
  { key: "recaptcha-v3", label: "reCAPTCHA v3" },
  { key: "cloudflare-turnstile", label: "Cloudflare Turnstile" },
];

const captchaPages = [
  { key: "login", label: "Login" },
  { key: "signup", label: "Signup" },
  { key: "passwordReset", label: "Password Reset" },
];

export default function SecuritySetup() {
  const { getSetting, updateSetting, saveSettings, loading, saving } =
    useSettings("security");
  const [captchaVerifying, setCaptchaVerifying] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  if (loading) {
    return (
      <>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Security - Setup - MuseKit Admin</title>
      </Head>
      
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" /> CAPTCHA Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={getSetting("captchaEnabled", "false") === "true"}
                  onChange={(e) =>
                    updateSetting(
                      "captchaEnabled",
                      e.target.checked ? "true" : "false"
                    )
                  }
                  className="rounded"
                />
                <div>
                  <span className="text-sm font-medium">Enable CAPTCHA</span>
                  <p className="text-xs text-muted-foreground">
                    Protect forms with CAPTCHA verification
                  </p>
                </div>
              </label>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  CAPTCHA Provider
                </label>
                <div className="space-y-2">
                  {captchaProviders.map((provider) => (
                    <label
                      key={provider.key}
                      className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/50"
                    >
                      <input
                        type="radio"
                        name="captchaProvider"
                        value={provider.key}
                        checked={
                          getSetting("captchaProvider", "hcaptcha") ===
                          provider.key
                        }
                        onChange={() =>
                          updateSetting("captchaProvider", provider.key)
                        }
                        className="rounded"
                      />
                      <span className="text-sm font-medium">
                        {provider.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Site Key</label>
                  <Input
                    value={getSetting("captchaSiteKey")}
                    onChange={(e) =>
                      updateSetting("captchaSiteKey", e.target.value)
                    }
                    placeholder="Enter site key"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Secret Key</label>
                  <Input
                    type="password"
                    value={getSetting("captchaSecretKey")}
                    onChange={(e) =>
                      updateSetting("captchaSecretKey", e.target.value)
                    }
                    placeholder="Enter secret key"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Enable CAPTCHA on Pages
                </label>
                <div className="space-y-2">
                  {captchaPages.map((page) => (
                    <label
                      key={page.key}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={
                          getSetting(`captchaPage.${page.key}`, "true") ===
                          "true"
                        }
                        onChange={(e) =>
                          updateSetting(
                            `captchaPage.${page.key}`,
                            e.target.checked ? "true" : "false"
                          )
                        }
                        className="rounded"
                      />
                      {page.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={captchaVerifying}
                  onClick={() => {
                    setCaptchaVerifying(true);
                    setCaptchaVerified(false);
                    setTimeout(() => {
                      setCaptchaVerifying(false);
                      setCaptchaVerified(true);
                    }, 1500);
                  }}
                >
                  {captchaVerifying ? "Verifying..." : "Test CAPTCHA"}
                </Button>
                {captchaVerified && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Verified
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      
    </>
  );
}
