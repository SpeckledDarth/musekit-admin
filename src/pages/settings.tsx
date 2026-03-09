import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { Breadcrumb } from "@/layout/Breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Shield, Bell, Wrench, AlertTriangle, Download, Trash2 } from "lucide-react";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
];

const NOTIFICATION_TOGGLES = [
  { key: "admin.notifyNewUser", label: "New User Registration" },
  { key: "admin.notifyNewTicket", label: "New Support Ticket" },
  { key: "admin.notifySubscriptionChange", label: "Subscription Change" },
  { key: "admin.notifySystemAlerts", label: "System Alerts" },
  { key: "admin.notifyWeeklyReport", label: "Weekly Report" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [originalSettings, setOriginalSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [purgeDays, setPurgeDays] = useState("90");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  const isDirty = JSON.stringify(settings) !== JSON.stringify(originalSettings);
  useUnsavedChanges(isDirty);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      setSettings(data.settings || {});
      setOriginalSettings(data.settings || {});
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      setOriginalSettings({ ...settings });
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handlePurgeAuditLogs = () => {
    setConfirmDialog({
      open: true,
      title: "Purge Audit Logs",
      message: `This will permanently delete all audit logs older than ${purgeDays} days. This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          const res = await fetch("/api/admin/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "purge_audit_logs", olderThanDays: parseInt(purgeDays) }),
          });
          if (!res.ok) throw new Error("Failed to purge audit logs");
          const data = await res.json();
          toast.success(`Purged ${data.deletedCount ?? 0} audit log entries`);
        } catch (error) {
          toast.error("Failed to purge audit logs");
        }
      },
    });
  };

  const handleResetSettings = () => {
    setConfirmDialog({
      open: true,
      title: "Reset All Settings",
      message: "This will permanently delete all admin settings and restore defaults. This action cannot be undone.",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          const res = await fetch("/api/admin/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "reset_settings" }),
          });
          if (!res.ok) throw new Error("Failed to reset settings");
          setSettings({});
          setOriginalSettings({});
          toast.success("All settings have been reset");
        } catch (error) {
          toast.error("Failed to reset settings");
        }
      },
    });
  };

  const handleExportData = async () => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "export_data" }),
      });
      if (!res.ok) throw new Error("Failed to export data");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `musekit-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully");
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Settings - MuseKit Admin</title>
        </Head>
        <div className="space-y-6">
          <Breadcrumb />
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading settings...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Settings - MuseKit Admin</title>
      </Head>

      <div className="space-y-6">
        <Breadcrumb />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Configure admin panel settings.</p>
          </div>
          {isDirty && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>

        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Maintenance</span>
            </TabsTrigger>
            <TabsTrigger value="danger" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Danger Zone</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  General Settings
                </CardTitle>
                <CardDescription>Configure basic application settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">App Name</label>
                  <Input
                    value={settings["admin.appName"] || ""}
                    onChange={(e) => updateSetting("admin.appName", e.target.value)}
                    placeholder="MuseKit"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">App Description</label>
                  <Textarea
                    value={settings["admin.appDescription"] || ""}
                    onChange={(e) => updateSetting("admin.appDescription", e.target.value)}
                    placeholder="Your application description"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Timezone</label>
                  <Select
                    value={settings["admin.timezone"] || "UTC"}
                    onChange={(e) => updateSetting("admin.timezone", e.target.value)}
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Language</label>
                  <Select
                    value={settings["admin.language"] || "en"}
                    onChange={(e) => updateSetting("admin.language", e.target.value)}
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Support Email</label>
                  <Input
                    type="email"
                    value={settings["admin.supportEmail"] || ""}
                    onChange={(e) => updateSetting("admin.supportEmail", e.target.value)}
                    placeholder="support@example.com"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>Configure authentication and access controls.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Session Timeout (minutes)</label>
                  <Input
                    type="number"
                    value={settings["admin.sessionTimeout"] || ""}
                    onChange={(e) => updateSetting("admin.sessionTimeout", e.target.value)}
                    placeholder="30"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Login Attempts</label>
                  <Input
                    type="number"
                    value={settings["admin.maxLoginAttempts"] || ""}
                    onChange={(e) => updateSetting("admin.maxLoginAttempts", e.target.value)}
                    placeholder="5"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="require2fa"
                    checked={settings["admin.require2fa"] === "true"}
                    onChange={(e) => updateSetting("admin.require2fa", e.target.checked ? "true" : "false")}
                    className="h-4 w-4 rounded border-border"
                  />
                  <label htmlFor="require2fa" className="text-sm font-medium">
                    Require Two-Factor Authentication
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">IP Allowlist</label>
                  <Textarea
                    value={settings["admin.ipAllowlist"] || ""}
                    onChange={(e) => updateSetting("admin.ipAllowlist", e.target.value)}
                    placeholder="One IP per line"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">Leave empty to allow all IPs</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>Configure which notifications you receive.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {NOTIFICATION_TOGGLES.map((toggle) => (
                    <div key={toggle.key} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={toggle.key}
                        checked={settings[toggle.key] === "true"}
                        onChange={(e) => updateSetting(toggle.key, e.target.checked ? "true" : "false")}
                        className="h-4 w-4 rounded border-border"
                      />
                      <label htmlFor={toggle.key} className="text-sm font-medium">
                        {toggle.label}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Slack Webhook URL</label>
                  <Input
                    value={settings["admin.slackWebhookUrl"] || ""}
                    onChange={(e) => updateSetting("admin.slackWebhookUrl", e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Notification Email</label>
                  <Input
                    type="email"
                    value={settings["admin.notificationEmail"] || ""}
                    onChange={(e) => updateSetting("admin.notificationEmail", e.target.value)}
                    placeholder="notifications@example.com"
                  />
                  <p className="text-xs text-muted-foreground">Override default support email for notifications</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Maintenance Settings
                </CardTitle>
                <CardDescription>Control maintenance mode and scheduled downtime.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settings["admin.maintenanceMode"] === "true" && (
                  <div className="rounded-lg border border-warning bg-warning/5 p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                      <p className="text-sm font-medium text-warning">
                        Maintenance mode is currently ON. Users may not be able to access the application.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="maintenanceMode"
                    checked={settings["admin.maintenanceMode"] === "true"}
                    onChange={(e) => updateSetting("admin.maintenanceMode", e.target.checked ? "true" : "false")}
                    className="h-4 w-4 rounded border-border"
                  />
                  <label htmlFor="maintenanceMode" className="text-sm font-medium">
                    Enable Maintenance Mode
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Maintenance Message</label>
                  <Textarea
                    value={settings["admin.maintenanceMessage"] || ""}
                    onChange={(e) => updateSetting("admin.maintenanceMessage", e.target.value)}
                    placeholder="We are currently performing scheduled maintenance. Please check back later."
                    disabled={settings["admin.maintenanceMode"] !== "true"}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Scheduled Maintenance Date</label>
                  <Input
                    type="datetime-local"
                    value={settings["admin.scheduledMaintenance"] || ""}
                    onChange={(e) => updateSetting("admin.scheduledMaintenance", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="danger">
            <Card className="border-danger">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-danger">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>Irreversible and destructive actions. Proceed with caution.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="flex items-center justify-between rounded-lg border border-danger/50 p-4">
                  <div>
                    <h4 className="text-sm font-medium">Purge Audit Logs</h4>
                    <p className="text-xs text-muted-foreground">Permanently delete old audit log entries.</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm">Delete logs older than</span>
                      <Input
                        type="number"
                        value={purgeDays}
                        onChange={(e) => setPurgeDays(e.target.value)}
                        className="w-20"
                        min="1"
                      />
                      <span className="text-sm">days</span>
                    </div>
                  </div>
                  <Button variant="destructive" onClick={handlePurgeAuditLogs}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Purge
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-danger/50 p-4">
                  <div>
                    <h4 className="text-sm font-medium">Reset All Settings</h4>
                    <p className="text-xs text-muted-foreground">
                      Remove all admin settings and restore to defaults. This cannot be undone.
                    </p>
                  </div>
                  <Button variant="destructive" onClick={handleResetSettings}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Reset All
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-danger/50 p-4">
                  <div>
                    <h4 className="text-sm font-medium">Export All Data</h4>
                    <p className="text-xs text-muted-foreground">
                      Download all profiles, audit logs, and settings as a JSON file.
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleExportData}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        confirmText="Yes, proceed"
        destructive
      />
    </>
  );
}
