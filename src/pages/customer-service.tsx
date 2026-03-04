import React, { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatCurrency, timeAgo } from "@/lib/utils";
import { HeadsetIcon, Search, ArrowLeft, CreditCard, StickyNote } from "lucide-react";
import type { Profile, Subscription } from "@/types";

interface AdminNote {
  id: string;
  note: string;
  created_at: string;
}

export default function CustomerServicePage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<{
    profile: Profile;
    subscriptions: Subscription[];
    notes: AdminNote[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/admin/customer-service");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setUsers(data.users || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const loadUserDetail = useCallback(async (userId: string) => {
    setDetailLoading(true);
    setSelectedUser(userId);
    try {
      const res = await fetch(
        `/api/admin/customer-service?userId=${userId}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setUserDetail(data);
    } catch (error) {
      console.error("Error fetching user detail:", error);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Customer Service - MuseKit Admin</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <HeadsetIcon className="h-8 w-8" /> Customer Service
          </h1>
          <p className="text-muted-foreground">
            Track subscriptions, invoices, and manage customer support.
          </p>
        </div>

        {selectedUser && userDetail ? (
          <div className="space-y-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedUser(null);
                setUserDetail(null);
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Users
            </Button>

            {detailLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-40" />
                <Skeleton className="h-60" />
              </div>
            ) : (
              <>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Avatar
                        src={userDetail.profile.avatar_url}
                        fallback={
                          userDetail.profile.full_name ||
                          userDetail.profile.email
                        }
                        size="lg"
                      />
                      <div>
                        <h2 className="text-xl font-bold">
                          {userDetail.profile.full_name || "No Name"}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {userDetail.profile.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            {userDetail.profile.role}
                          </Badge>
                          <Badge
                            variant={
                              userDetail.profile.status === "active"
                                ? "success"
                                : "secondary"
                            }
                          >
                            {userDetail.profile.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5" /> Subscription History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userDetail.subscriptions.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-4">
                        No subscription history.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Plan</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead>Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userDetail.subscriptions.map((sub) => (
                            <TableRow key={sub.id}>
                              <TableCell className="font-medium">
                                {sub.plan}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    sub.status === "active"
                                      ? "success"
                                      : "secondary"
                                  }
                                >
                                  {sub.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {sub.current_period_end
                                  ? `Until ${formatDate(sub.current_period_end)}`
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-sm">
                                {formatDate(sub.created_at)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <StickyNote className="h-5 w-5" /> Admin Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userDetail.notes.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-4">
                        No admin notes for this user.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {userDetail.notes.map((note) => (
                          <div
                            key={note.id}
                            className="p-3 rounded-md bg-muted/50 border"
                          >
                            <p className="text-sm">{note.note}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {timeAgo(note.created_at)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="relative w-72 mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-14" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No customers found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={user.avatar_url}
                                fallback={user.full_name || user.email}
                                size="sm"
                              />
                              <div>
                                <p className="font-medium">
                                  {user.full_name || "No Name"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user.status === "active"
                                  ? "success"
                                  : "secondary"
                              }
                            >
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(user.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => loadUserDetail(user.id)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
