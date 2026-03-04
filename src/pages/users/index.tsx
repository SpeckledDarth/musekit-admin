import React, { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
import { formatDate } from "@/lib/utils";
import { Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import type { Profile } from "@/types";

function computeHealthScore(profile: Profile): number {
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

  if (profile.status === "active") score += 25;

  score += 10;

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

function HealthScoreBadge({ score }: { score: number }) {
  const dotColor = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${dotColor}`} />
      <span className="text-sm">{score}</span>
    </div>
  );
}

export default function UserListPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        role: roleFilter,
        status: statusFilter,
        page: page.toString(),
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setUsers(data.users);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(0);
  }, [search, roleFilter, statusFilter]);

  const totalPages = Math.ceil(totalCount / 20);

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "success" as const;
      case "inactive":
        return "secondary" as const;
      case "suspended":
        return "destructive" as const;
      case "pending":
        return "warning" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <>
      <Head>
        <title>User Management - MuseKit Admin</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-[150px]"
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </Select>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-[150px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </Select>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Health</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Sign In</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No users found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
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
                            <Badge variant="outline">{user.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadgeVariant(user.status)}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <HealthScoreBadge score={computeHealthScore(user)} />
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(user.created_at)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {user.last_sign_in_at
                              ? formatDate(user.last_sign_in_at)
                              : "Never"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/users/${user.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4 mr-1" /> View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {page * 20 + 1} to{" "}
                      {Math.min((page + 1) * 20, totalCount)} of {totalCount}{" "}
                      users
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm">
                        Page {page + 1} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPage((p) => Math.min(totalPages - 1, p + 1))
                        }
                        disabled={page >= totalPages - 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
