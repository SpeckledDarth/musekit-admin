"use client";

import React, { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, timeAgo } from "@/lib/utils";
import { useAdmin } from "@/hooks/useAdmin";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { toast } from "sonner";
import { Breadcrumb } from "@/layout/Breadcrumb";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Shield,
  CreditCard,
  Activity,
  UserCog,
  StickyNote,
  Clock,
  AlertTriangle,
  UserPlus,
  Trash2,
  XCircle,
  Edit2,
  Save,
  X,
  Ban,
  UserX,
} from "lucide-react";
import type {
  Profile,
  Subscription,
  AuditLog,
  TeamMember,
  AdminNote,
} from "@/types";

function computeHealthScore(
  profile: Profile | null,
  subscription: Subscription | null,
  activityCount: number
): number {
  if (!profile) return 0;

  let score = 0;

  const now = Date.now();
  if (profile.last_sign_in_at) {
    const daysSinceLogin = (now - new Date(profile.last_sign_in_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLogin <= 1) score += 30;
    else if (daysSinceLogin <= 7) score += 24;
    else if (daysSinceLogin <= 14) score += 18;
    else if (daysSinceLogin <= 30) score += 12;
    else if (daysSinceLogin <= 90) score += 6;
  }

  if (subscription) {
    if (subscription.status === "active") score += 25;
    else if (subscription.status === "trialing") score += 20;
    else if (subscription.status === "past_due") score += 10;
    else if (subscription.status === "canceled") score += 5;
  }

  if (activityCount >= 50) score += 25;
  else if (activityCount >= 20) score += 20;
  else if (activityCount >= 10) score += 15;
  else if (activityCount >= 5) score += 10;
  else if (activityCount >= 1) score += 5;

  const accountAgeDays = (now - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24);
  if (accountAgeDays >= 365) score += 10;
  else if (accountAgeDays >= 180) score += 8;
  else if (accountAgeDays >= 90) score += 6;
  else if (accountAgeDays >= 30) score += 4;
  else score += 2;

  let completeness = 0;
  if (profile.full_name) completeness += 5;
  if (profile.avatar_url) completeness += 5;
  score += completeness;

  return Math.min(100, Math.max(0, score));
}

function getHealthColor(score: number): { bg: string; text: string; label: string } {
  if (score >= 70) return { bg: "bg-success/10", text: "text-success", label: "Healthy" };
  if (score >= 40) return { bg: "bg-warning/10", text: "text-warning", label: "At Risk" };
  return { bg: "bg-danger/10", text: "text-danger", label: "Critical" };
}

interface EditForm {
  full_name: string;
  email: string;
  role: string;
  status: string;
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user: adminUser } = useAdmin();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [activity, setActivity] = useState<AuditLog[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState(false);
  const [impersonateCountdown, setImpersonateCountdown] = useState(0);
  const [pendingInvites, setPendingInvites] = useState<Array<{ id: string; email: string; role: string; created_at: string }>>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({ full_name: "", email: "", role: "", status: "" });
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useUnsavedChanges(isDirty);

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    async function fetchUserData() {
      try {
        const res = await fetch(`/api/admin/users/${id}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setProfile(data.profile);
        setSubscription(data.subscription);
        setActivity(data.activity || []);
        setTeamMembers(data.teamMembers || []);
        setPendingInvites(data.pendingInvites || []);
        setNotes(data.notes || []);
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load user data");
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [id]);

  const startEditing = useCallback(() => {
    if (!profile) return;
    setEditForm({
      full_name: profile.full_name || "",
      email: profile.email,
      role: profile.role,
      status: profile.status,
    });
    setEditing(true);
    setIsDirty(false);
  }, [profile]);

  const cancelEditing = useCallback(() => {
    setEditing(false);
    setIsDirty(false);
  }, []);

  const handleEditChange = useCallback((field: keyof EditForm, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  const handleSaveProfile = async () => {
    if (!id || !profile) return;

    if (!editForm.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      toast.error("Invalid email format");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }
      const data = await res.json();
      setProfile(data.profile);
      setEditing(false);
      setIsDirty(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "suspended" }),
      });
      if (!res.ok) throw new Error("Failed to suspend");
      const data = await res.json();
      setProfile(data.profile);
      toast.success("User suspended");
    } catch (error) {
      toast.error("Failed to suspend user");
    }
    setConfirmSuspend(false);
  };

  const handleDeleteUser = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("User deleted");
      window.location.href = "/admin/users";
    } catch (error) {
      toast.error("Failed to delete user");
    }
    setConfirmDelete(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !id || !adminUser) return;

    try {
      await fetch(`/api/admin/users/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_note",
          adminId: adminUser.id,
          note: newNote.trim(),
        }),
      });

      setNotes([
        {
          id: Date.now().toString(),
          user_id: id as string,
          admin_id: adminUser.id,
          note: newNote.trim(),
          created_at: new Date().toISOString(),
        },
        ...notes,
      ]);
      setNewNote("");
      toast.success("Note added");
    } catch (error) {
      toast.error("Failed to add note");
    }
  };

  const handleImpersonate = async () => {
    if (!id || !adminUser || impersonating) return;

    try {
      await fetch(`/api/admin/users/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "impersonate",
          adminId: adminUser.id,
          adminEmail: adminUser.email,
        }),
      });

      setImpersonating(true);
      setImpersonateCountdown(30 * 60);
      toast.success("Impersonation session started (30 min)");

      const interval = setInterval(() => {
        setImpersonateCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setImpersonating(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      toast.error("Failed to start impersonation");
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || !id) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      toast.error("Invalid email format");
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "invite_member", email: inviteEmail.trim(), role: inviteRole }),
      });
      if (!res.ok) throw new Error("Failed to invite");
      const data = await res.json();
      setPendingInvites([
        ...pendingInvites,
        { id: data.inviteId || Date.now().toString(), email: inviteEmail.trim(), role: inviteRole, created_at: new Date().toISOString() },
      ]);
      setInviteEmail("");
      setInviteRole("viewer");
      toast.success("Invitation sent");
    } catch (error) {
      toast.error("Failed to send invitation");
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    if (!id) return;
    try {
      await fetch(`/api/admin/users/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_role", memberId, role: newRole }),
      });
      setTeamMembers(teamMembers.map((m) => (m.id === memberId ? { ...m, role: newRole as TeamMember["role"] } : m)));
      toast.success("Role updated");
    } catch (error) {
      toast.error("Failed to change role");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!id) return;
    try {
      await fetch(`/api/admin/users/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove_member", memberId }),
      });
      setTeamMembers(teamMembers.filter((m) => m.id !== memberId));
      toast.success("Member removed");
    } catch (error) {
      toast.error("Failed to remove member");
    }
    setConfirmRemove(null);
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!id) return;
    try {
      await fetch(`/api/admin/users/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke_invite", inviteId }),
      });
      setPendingInvites(pendingInvites.filter((inv) => inv.id !== inviteId));
      toast.success("Invitation revoked");
    } catch (error) {
      toast.error("Failed to revoke invitation");
    }
    setConfirmRevoke(null);
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48 md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <EmptyState
        icon={UserX}
        title="User not found"
        description="The user you're looking for doesn't exist or has been deleted."
        actionLabel="Back to Users"
        onAction={() => { window.location.href = "/admin/users"; }}
      />
    );
  }

  const healthScore = computeHealthScore(profile, subscription, activity.length);
  const health = getHealthColor(healthScore);

  return (
    <>
      <Head>
        <title>{profile.full_name || profile.email} - MuseKit Admin</title>
      </Head>

      <div className="space-y-6">
        <Breadcrumb />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/users">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">
              {profile.full_name || profile.email}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <Button variant="outline" size="sm" onClick={startEditing}>
                <Edit2 className="h-4 w-4 mr-1" /> Edit
              </Button>
            )}
            {profile.status !== "suspended" && (
              <Button variant="outline" size="sm" onClick={() => setConfirmSuspend(true)}>
                <Ban className="h-4 w-4 mr-1" /> Suspend
              </Button>
            )}
            <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="p-6 text-center">
              <Avatar
                src={profile.avatar_url}
                fallback={profile.full_name || profile.email}
                size="lg"
                className="mx-auto mb-4"
              />

              {editing ? (
                <div className="space-y-3 text-left">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                    <Input
                      value={editForm.full_name}
                      onChange={(e) => handleEditChange("full_name", e.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Email</label>
                    <Input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => handleEditChange("email", e.target.value)}
                      placeholder="Email"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Role</label>
                    <Select
                      value={editForm.role}
                      onChange={(e) => handleEditChange("role", e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <Select
                      value={editForm.status}
                      onChange={(e) => handleEditChange("status", e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                      <option value="pending">Pending</option>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1" onClick={handleSaveProfile} disabled={saving}>
                      <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={cancelEditing} disabled={saving}>
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold">
                    {profile.full_name || "No Name"}
                  </h2>
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                    <Mail className="h-3 w-3" /> {profile.email}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <Badge variant="outline">
                      <Shield className="h-3 w-3 mr-1" />
                      {profile.role}
                    </Badge>
                    <Badge
                      variant={
                        profile.status === "active" ? "success" :
                        profile.status === "suspended" ? "destructive" : "secondary"
                      }
                    >
                      {profile.status}
                    </Badge>
                  </div>
                </>
              )}

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-medium">Health Score</span>
                  <Badge className={`${health.bg} ${health.text} border-transparent`}>
                    {healthScore} — {health.label}
                  </Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      healthScore >= 70 ? "bg-success" : healthScore >= 40 ? "bg-warning" : "bg-danger"
                    }`}
                    style={{ width: `${healthScore}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center justify-center gap-1">
                  <Calendar className="h-3 w-3" /> Joined{" "}
                  {formatDate(profile.created_at)}
                </p>
                {profile.last_sign_in_at && (
                  <p className="flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" /> Last seen{" "}
                    {timeAgo(profile.last_sign_in_at)}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t">
                {impersonating ? (
                  <div className="space-y-2">
                    <Badge
                      variant="warning"
                      className="w-full justify-center py-1.5"
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Impersonating - {formatCountdown(impersonateCountdown)}
                    </Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => setImpersonating(false)}
                    >
                      End Session
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleImpersonate}
                  >
                    <UserCog className="h-4 w-4 mr-1" /> Impersonate User
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-2">
            <Tabs defaultValue="subscription">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="subscription">Subscription</TabsTrigger>
                <TabsTrigger value="activity">Activity ({activity.length})</TabsTrigger>
                <TabsTrigger value="team">Team ({teamMembers.length})</TabsTrigger>
                <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="subscription">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5" /> Subscription
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {subscription ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Plan</span>
                          <span className="font-medium">
                            {subscription.plan}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status</span>
                          <Badge
                            variant={
                              subscription.status === "active"
                                ? "success"
                                : "secondary"
                            }
                          >
                            {subscription.status}
                          </Badge>
                        </div>
                        {subscription.current_period_end && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Current Period Ends
                            </span>
                            <span>
                              {formatDate(subscription.current_period_end)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Created
                          </span>
                          <span>{formatDate(subscription.created_at)}</span>
                        </div>
                      </div>
                    ) : (
                      <EmptyState
                        icon={CreditCard}
                        title="No subscription"
                        description="This user doesn't have an active subscription."
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5" /> Activity Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activity.length === 0 ? (
                      <EmptyState
                        icon={Activity}
                        title="No activity"
                        description="No activity has been recorded for this user."
                      />
                    ) : (
                      <div className="space-y-3">
                        {activity.map((log) => (
                          <div
                            key={log.id}
                            className="flex items-start gap-3 py-2 border-b last:border-0"
                          >
                            <div className="mt-0.5 p-1.5 rounded bg-muted shrink-0">
                              <Activity className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                {log.action}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {log.resource_type} &middot;{" "}
                                <span title={formatDate(log.created_at)}>
                                  {timeAgo(log.created_at)}
                                </span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="team">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <UserPlus className="h-5 w-5" /> Invite Member
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="Email address"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="flex-1"
                        />
                        <Select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value)}
                          className="w-32"
                        >
                          <option value="admin">Admin</option>
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </Select>
                        <Button onClick={handleInviteMember} disabled={!inviteEmail.trim()}>
                          <UserPlus className="h-4 w-4 mr-1" /> Invite
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Team Members ({teamMembers.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {teamMembers.length === 0 ? (
                        <EmptyState
                          icon={UserPlus}
                          title="No team members"
                          description="This user's organization has no other team members."
                        />
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Member</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Joined</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {teamMembers.map((member) => (
                              <TableRow key={member.id}>
                                <TableCell>
                                  {member.profile?.full_name ||
                                    member.profile?.email ||
                                    member.user_id}
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={member.role}
                                    onChange={(e) => handleChangeRole(member.id, e.target.value)}
                                    className="w-28 h-8 text-xs"
                                  >
                                    <option value="owner">Owner</option>
                                    <option value="admin">Admin</option>
                                    <option value="member">Member</option>
                                    <option value="viewer">Viewer</option>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <span title={formatDate(member.joined_at)}>
                                    {timeAgo(member.joined_at)}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setConfirmRemove(member.id)}
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" /> Remove
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>

                  {pendingInvites.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Pending Invitations ({pendingInvites.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Email</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Invited</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingInvites.map((invite) => (
                              <TableRow key={invite.id}>
                                <TableCell>{invite.email}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{invite.role}</Badge>
                                </TableCell>
                                <TableCell>
                                  <span title={formatDate(invite.created_at)}>
                                    {timeAgo(invite.created_at)}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setConfirmRevoke(invite.id)}
                                  >
                                    <XCircle className="h-3 w-3 mr-1" /> Revoke
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="notes">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <StickyNote className="h-5 w-5" /> Admin Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Add a note about this user..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          className="flex-1"
                          rows={2}
                        />
                        <Button
                          onClick={handleAddNote}
                          disabled={!newNote.trim()}
                        >
                          Add
                        </Button>
                      </div>

                      {notes.length === 0 ? (
                        <EmptyState
                          icon={StickyNote}
                          title="No notes"
                          description="No admin notes have been added for this user."
                        />
                      ) : (
                        <div className="space-y-3">
                          {notes.map((note) => (
                            <div
                              key={note.id}
                              className="p-3 rounded-md bg-muted/50 border"
                            >
                              <p className="text-sm">{note.note}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                <span title={formatDate(note.created_at)}>
                                  {timeAgo(note.created_at)}
                                </span>
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmSuspend}
        onConfirm={handleSuspendUser}
        onCancel={() => setConfirmSuspend(false)}
        title="Suspend User"
        message={`Are you sure you want to suspend ${profile.full_name || profile.email}? They will be unable to access the platform.`}
        confirmText="Suspend"
        destructive
      />

      <ConfirmDialog
        open={confirmDelete}
        onConfirm={handleDeleteUser}
        onCancel={() => setConfirmDelete(false)}
        title="Delete User"
        message={`Are you sure you want to permanently delete ${profile.full_name || profile.email}? This action cannot be undone.`}
        confirmText="Delete"
        destructive
      />

      <ConfirmDialog
        open={!!confirmRemove}
        onConfirm={() => confirmRemove && handleRemoveMember(confirmRemove)}
        onCancel={() => setConfirmRemove(null)}
        title="Remove Team Member"
        message="Are you sure you want to remove this team member? They will lose access to the organization."
        confirmText="Remove"
        destructive
      />

      <ConfirmDialog
        open={!!confirmRevoke}
        onConfirm={() => confirmRevoke && handleRevokeInvite(confirmRevoke)}
        onCancel={() => setConfirmRevoke(null)}
        title="Revoke Invitation"
        message="Are you sure you want to revoke this invitation?"
        confirmText="Revoke"
        destructive
      />
    </>
  );
}
