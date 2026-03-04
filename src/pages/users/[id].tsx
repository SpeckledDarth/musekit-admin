import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
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
} from "lucide-react";
import type {
  Profile,
  Subscription,
  AuditLog,
  TeamMember,
  AdminNote,
} from "@/types";

export default function UserDetailPage() {
  const router = useRouter();
  const { id } = router.query;
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
        setNotes(data.notes || []);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [id]);

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
    } catch (error) {
      console.error("Error adding note:", error);
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
      console.error("Error starting impersonation:", error);
    }
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
      <div className="text-center py-12">
        <p className="text-muted-foreground">User not found.</p>
        <Link href="/users">
          <Button variant="outline" className="mt-4">
            Back to Users
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{profile.full_name || profile.email} - MuseKit Admin</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/users">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">User Detail</h1>
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
                    profile.status === "active" ? "success" : "secondary"
                  }
                >
                  {profile.status}
                </Badge>
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
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
                <TabsTrigger value="notes">Admin Notes</TabsTrigger>
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
                      <p className="text-muted-foreground text-sm">
                        No active subscription found.
                      </p>
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
                      <p className="text-muted-foreground text-sm">
                        No activity found.
                      </p>
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
                                {timeAgo(log.created_at)}
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
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Team Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {teamMembers.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        No team members found.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
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
                                <Badge variant="outline">{member.role}</Badge>
                              </TableCell>
                              <TableCell>
                                {formatDate(member.joined_at)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
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
                        <p className="text-muted-foreground text-sm">
                          No admin notes yet.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {notes.map((note) => (
                            <div
                              key={note.id}
                              className="p-3 rounded-md bg-muted/50 border"
                            >
                              <p className="text-sm">{note.note}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {timeAgo(note.created_at)}
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
    </>
  );
}
