"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar } from "./ui/avatar";
import { ImageUpload } from "./ui/ImageUpload";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { useAdmin } from "@/hooks/useAdmin";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Camera, Save, Loader2, Mail, Lock, Trash2, AlertTriangle } from "lucide-react";

interface UserProfileSettingsProps {
  onDeleteAccount?: () => void;
  onAvatarUpload?: (url: string) => void;
}

function UserProfileSettings({ onDeleteAccount, onAvatarUpload }: UserProfileSettingsProps) {
  const { user, loading } = useAdmin();

  const [fullName, setFullName] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [savingProfile, setSavingProfile] = React.useState(false);

  const [showEmailForm, setShowEmailForm] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState("");
  const [confirmEmail, setConfirmEmail] = React.useState("");
  const [savingEmail, setSavingEmail] = React.useState(false);

  const [showPasswordForm, setShowPasswordForm] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [savingPassword, setSavingPassword] = React.useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const [initialName, setInitialName] = React.useState("");
  const [initialAvatar, setInitialAvatar] = React.useState("");

  const isDirty = fullName !== initialName || avatarUrl !== initialAvatar;
  useUnsavedChanges(isDirty);

  React.useEffect(() => {
    if (user) {
      const name = user.full_name || "";
      const avatar = user.avatar_url || "";
      setFullName(name);
      setAvatarUrl(avatar);
      setInitialName(name);
      setInitialAvatar(avatar);
    }
  }, [user]);

  const handleAvatarChange = React.useCallback((url: string) => {
    setAvatarUrl(url);
    if (onAvatarUpload && url) {
      onAvatarUpload(url);
    }
  }, [onAvatarUpload]);

  const handleSaveProfile = React.useCallback(async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, avatar_url: avatarUrl || null })
        .eq("id", user.id);

      if (error) throw error;

      setInitialName(fullName);
      setInitialAvatar(avatarUrl);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  }, [user, fullName, avatarUrl]);

  const handleChangeEmail = React.useCallback(async () => {
    if (!newEmail || newEmail !== confirmEmail) {
      toast.error("Emails do not match");
      return;
    }
    setSavingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success("Verification email sent to your new address. Please check your inbox.");
      setShowEmailForm(false);
      setNewEmail("");
      setConfirmEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update email");
    } finally {
      setSavingEmail(false);
    }
  }, [newEmail, confirmEmail]);

  const handleChangePassword = React.useCallback(async () => {
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully");
      setShowPasswordForm(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  }, [newPassword, confirmPassword]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Please sign in to manage your account settings.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Avatar</CardTitle>
          <CardDescription>Your profile photo visible to others</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <div className="relative group">
              <Avatar
                src={avatarUrl || null}
                fallback={fullName || user.email || "?"}
                size="lg"
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <ImageUpload
                value={avatarUrl}
                onChange={handleAvatarChange}
                folder="avatars"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Display Name</CardTitle>
          <CardDescription>Your name as shown across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="max-w-sm"
            />
            <Button
              onClick={handleSaveProfile}
              disabled={!isDirty || savingProfile}
            >
              {savingProfile ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Address
          </CardTitle>
          <CardDescription>Manage your account email</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Input
                value={user.email}
                disabled
                className="max-w-sm bg-muted"
              />
              <Button
                variant="outline"
                onClick={() => setShowEmailForm(!showEmailForm)}
              >
                Change Email
              </Button>
            </div>
            {showEmailForm && (
              <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="New email address"
                  className="max-w-sm"
                />
                <Input
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder="Confirm new email"
                  className="max-w-sm"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleChangeEmail}
                    disabled={savingEmail || !newEmail || !confirmEmail}
                    size="sm"
                  >
                    {savingEmail && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Send Verification
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowEmailForm(false);
                      setNewEmail("");
                      setConfirmEmail("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          {!showPasswordForm ? (
            <Button
              variant="outline"
              onClick={() => setShowPasswordForm(true)}
            >
              Change Password
            </Button>
          ) : (
            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min. 8 characters)"
                className="max-w-sm"
              />
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="max-w-sm"
              />
              {newPassword.length > 0 && newPassword.length < 8 && (
                <p className="text-xs text-destructive">Password must be at least 8 characters</p>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={handleChangePassword}
                  disabled={savingPassword || newPassword.length < 8 || !confirmPassword}
                  size="sm"
                >
                  {savingPassword && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Update Password
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible account actions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Once you delete your account, there is no going back. All your data will be permanently removed.
          </p>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteConfirm}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDeleteAccount?.();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed."
        confirmText="Delete My Account"
        destructive
      />
    </div>
  );
}

export { UserProfileSettings };
export type { UserProfileSettingsProps };
