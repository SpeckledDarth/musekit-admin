import React, { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
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
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useDebounce } from "@/hooks/useDebounce";
import { useSortable } from "@/hooks/useSortable";
import { formatDate, formatDateTime, timeAgo } from "@/lib/utils";
import { downloadCSV } from "@/lib/csv-export";
import { toast } from "sonner";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserPlus,
  X,
} from "lucide-react";
import type { Profile } from "@/types";

const PAGE_SIZE = 25;

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

type SortableUser = Profile & { _healthScore: number };

function SortableColumnHeader({
  label,
  column,
  currentColumn,
  currentDirection,
  onSort,
  className,
}: {
  label: string;
  column: keyof SortableUser;
  currentColumn: keyof SortableUser | null;
  currentDirection: "asc" | "desc" | null;
  onSort: (column: keyof SortableUser) => void;
  className?: string;
}) {
  const isActive = currentColumn === column;
  const Icon = isActive
    ? currentDirection === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <TableHead className={className}>
      <button
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        onClick={() => onSort(column)}
      >
        {label}
        <Icon className="h-3.5 w-3.5" />
      </button>
    </TableHead>
  );
}

export default function UserListPage() {
  const router = useRouter();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [unfilteredTotal, setUnfilteredTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviteLoading, setInviteLoading] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmText: string;
    destructive: boolean;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", confirmText: "Confirm", destructive: false, onConfirm: () => {} });

  const usersWithHealth: SortableUser[] = users.map((u) => ({
    ...u,
    _healthScore: computeHealthScore(u),
  }));

  const { sortedData, sortColumn, sortDirection, requestSort } = useSortable<SortableUser>(usersWithHealth);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: debouncedSearch,
        role: roleFilter,
        status: statusFilter,
        page: page.toString(),
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setUsers(data.users);
      setTotalCount(data.totalCount);
      const hasFilters = debouncedSearch !== "" || roleFilter !== "all" || statusFilter !== "all";
      if (!hasFilters) {
        setUnfilteredTotal(data.totalCount);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, statusFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [users]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const isFiltered = debouncedSearch !== "" || roleFilter !== "all" || statusFilter !== "all";

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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedData.map((u) => u.id)));
    }
  };

  const handleBulkSuspend = () => {
    setConfirmDialog({
      open: true,
      title: "Bulk Suspend Users",
      message: `Are you sure you want to suspend ${selectedIds.size} user(s)? They will lose access immediately.`,
      confirmText: "Suspend",
      destructive: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          const res = await fetch("/api/admin/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "bulk_suspend", userIds: Array.from(selectedIds) }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to suspend users");
          toast.success(data.message);
          setSelectedIds(new Set());
          fetchUsers();
        } catch (error: any) {
          toast.error(error.message || "Failed to suspend users");
        }
      },
    });
  };

  const handleBulkDelete = () => {
    setConfirmDialog({
      open: true,
      title: "Bulk Delete Users",
      message: `Are you sure you want to permanently delete ${selectedIds.size} user(s)? This action cannot be undone.`,
      confirmText: "Delete",
      destructive: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          const res = await fetch("/api/admin/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "bulk_delete", userIds: Array.from(selectedIds) }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to delete users");
          toast.success(data.message);
          setSelectedIds(new Set());
          fetchUsers();
        } catch (error: any) {
          toast.error(error.message || "Failed to delete users");
        }
      },
    });
  };

  const handleBulkExportCSV = () => {
    const selectedUsers = sortedData.filter((u) => selectedIds.has(u.id));
    downloadCSV(selectedUsers, "users-bulk-export", [
      { key: "id", label: "ID" },
      { key: "full_name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "role", label: "Role" },
      { key: "status", label: "Status" },
      { key: "created_at", label: "Created" },
      { key: "last_sign_in_at", label: "Last Sign In" },
    ]);
    toast.success(`Exported ${selectedUsers.length} user(s) to CSV`);
  };

  const handleExportAllFiltered = async () => {
    try {
      const params = new URLSearchParams({
        search: debouncedSearch,
        role: roleFilter,
        status: statusFilter,
        page: "0",
      });
      let allUsers: Profile[] = [...users];
      if (totalCount > PAGE_SIZE) {
        const totalPagesToFetch = Math.ceil(totalCount / PAGE_SIZE);
        const promises = [];
        for (let p = 0; p < totalPagesToFetch; p++) {
          const pParams = new URLSearchParams({
            search: debouncedSearch,
            role: roleFilter,
            status: statusFilter,
            page: p.toString(),
          });
          promises.push(fetch(`/api/admin/users?${pParams}`).then((r) => r.json()));
        }
        const results = await Promise.all(promises);
        allUsers = results.flatMap((r) => r.users || []);
      }
      downloadCSV(allUsers, "users-export", [
        { key: "id", label: "ID" },
        { key: "full_name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "role", label: "Role" },
        { key: "status", label: "Status" },
        { key: "created_at", label: "Created" },
        { key: "last_sign_in_at", label: "Last Sign In" },
      ]);
    } catch {
      toast.error("Failed to export CSV");
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "invite", email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invitation");
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("user");
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation");
    } finally {
      setInviteLoading(false);
    }
  };

  const titleText = isFiltered && unfilteredTotal > 0 && totalCount !== unfilteredTotal
    ? `Users (${totalCount} of ${unfilteredTotal})`
    : `Users (${totalCount})`;

  return (
    <>
      <Head>
        <title>User Management - MuseKit Admin</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{titleText}</h1>
            <p className="text-muted-foreground">
              Manage user accounts and permissions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setInviteOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
            <Button
              onClick={handleExportAllFiltered}
              disabled={loading || totalCount === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
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
            ) : sortedData.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No users found"
                description="Try adjusting your search or filter criteria."
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === sortedData.length && sortedData.length > 0}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </TableHead>
                      <SortableColumnHeader
                        label="User"
                        column="full_name"
                        currentColumn={sortColumn}
                        currentDirection={sortDirection}
                        onSort={requestSort}
                      />
                      <SortableColumnHeader
                        label="Role"
                        column="role"
                        currentColumn={sortColumn}
                        currentDirection={sortDirection}
                        onSort={requestSort}
                      />
                      <SortableColumnHeader
                        label="Status"
                        column="status"
                        currentColumn={sortColumn}
                        currentDirection={sortDirection}
                        onSort={requestSort}
                      />
                      <SortableColumnHeader
                        label="Health"
                        column="_healthScore"
                        currentColumn={sortColumn}
                        currentDirection={sortDirection}
                        onSort={requestSort}
                      />
                      <SortableColumnHeader
                        label="Created"
                        column="created_at"
                        currentColumn={sortColumn}
                        currentDirection={sortDirection}
                        onSort={requestSort}
                      />
                      <SortableColumnHeader
                        label="Last Sign In"
                        column="last_sign_in_at"
                        currentColumn={sortColumn}
                        currentDirection={sortDirection}
                        onSort={requestSort}
                      />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedData.map((user) => (
                      <TableRow
                        key={user.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/users/${user.id}`)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(user.id)}
                            onChange={() => toggleSelect(user.id)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </TableCell>
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
                          <HealthScoreBadge score={user._healthScore} />
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(user.created_at)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {user.last_sign_in_at ? (
                            <span title={formatDateTime(user.last_sign_in_at)}>
                              {timeAgo(user.last_sign_in_at)}
                            </span>
                          ) : (
                            "Never"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {page * PAGE_SIZE + 1} to{" "}
                      {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}{" "}
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

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border rounded-lg shadow-lg px-6 py-3 flex items-center gap-4">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button size="sm" variant="outline" onClick={handleBulkSuspend}>
            Bulk Suspend
          </Button>
          <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
            Bulk Delete
          </Button>
          <Button size="sm" variant="outline" onClick={handleBulkExportCSV}>
            Bulk Export CSV
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      )}

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setInviteOpen(false)}
          />
          <div className="relative z-50 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg animate-in fade-in-0 zoom-in-95">
            <h2 className="text-lg font-semibold">Invite User</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Send an invitation email to a new user.
            </p>
            <form onSubmit={handleInviteSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="mt-1"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </Select>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInviteOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={inviteLoading}>
                  {inviteLoading ? "Sending..." : "Send Invite"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        destructive={confirmDialog.destructive}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
}
