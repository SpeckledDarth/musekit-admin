import React, { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatCurrency, timeAgo } from "@/lib/utils";
import { downloadCSV } from "@/lib/csv-export";
import {
  HeadsetIcon,
  Search,
  ArrowLeft,
  CreditCard,
  StickyNote,
  Ticket,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Save,
  Download,
} from "lucide-react";
import type { Profile, Subscription, SupportTicket } from "@/types";

interface AdminNote {
  id: string;
  note: string;
  created_at: string;
}

const priorityVariant: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  low: "secondary",
  medium: "outline",
  high: "warning",
  urgent: "destructive",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  open: "warning",
  in_progress: "default",
  resolved: "success",
  closed: "secondary",
};

function SupportTicketsTab() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [editingResponse, setEditingResponse] = useState<Record<string, string>>({});
  const [editingStatus, setEditingStatus] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchTickets() {
      try {
        const res = await fetch("/api/admin/customer-service?type=tickets");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setTickets(data.tickets || []);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTickets();
  }, []);

  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;
  const avgResponseTime = tickets.length > 0
    ? tickets.reduce((sum, t) => {
        if (t.admin_response && t.updated_at && t.created_at) {
          const diff = new Date(t.updated_at).getTime() - new Date(t.created_at).getTime();
          return sum + diff / (1000 * 60 * 60);
        }
        return sum;
      }, 0) / Math.max(tickets.filter((t) => t.admin_response).length, 1)
    : 0;

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      (t.user_email || "").toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleSaveTicket = async (ticketId: string) => {
    setSaving((prev) => ({ ...prev, [ticketId]: true }));
    try {
      const res = await fetch("/api/admin/customer-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_ticket",
          id: ticketId,
          status: editingStatus[ticketId],
          admin_response: editingResponse[ticketId],
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, ...data.ticket } : t))
      );
    } catch (error) {
      console.error("Error updating ticket:", error);
    } finally {
      setSaving((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  const toggleExpand = (ticketId: string, ticket: SupportTicket) => {
    if (expandedTicket === ticketId) {
      setExpandedTicket(null);
    } else {
      setExpandedTicket(ticketId);
      if (!editingResponse[ticketId]) {
        setEditingResponse((prev) => ({ ...prev, [ticketId]: ticket.admin_response || "" }));
      }
      if (!editingStatus[ticketId]) {
        setEditingStatus((prev) => ({ ...prev, [ticketId]: ticket.status }));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-yellow-100">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold">{openCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-100">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{inProgressCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold">{resolvedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-purple-100">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">{avgResponseTime.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </Select>
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-40"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
            <Button
              variant="outline"
              onClick={() =>
                downloadCSV(filteredTickets, "tickets-export", [
                  { key: "id", label: "ID" },
                  { key: "subject", label: "Subject" },
                  { key: "user_email", label: "User Email" },
                  { key: "status", label: "Status" },
                  { key: "priority", label: "Priority" },
                  { key: "description", label: "Message" },
                  { key: "nps_score", label: "NPS Score" },
                  { key: "created_at", label: "Created" },
                ])
              }
              disabled={loading || filteredTickets.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
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
                  <TableHead>Subject</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>NPS</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No tickets found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTickets.map((ticket) => (
                    <React.Fragment key={ticket.id}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => toggleExpand(ticket.id, ticket)}
                      >
                        <TableCell className="font-medium">
                          {ticket.subject}
                        </TableCell>
                        <TableCell className="text-sm">
                          {ticket.user_email}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[ticket.status]}>
                            {ticket.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={priorityVariant[ticket.priority]}>
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {ticket.nps_score !== undefined && ticket.nps_score !== null
                            ? ticket.nps_score
                            : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(ticket.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            {expandedTicket === ticket.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedTicket === ticket.id && (
                        <TableRow>
                          <TableCell colSpan={7}>
                            <div className="p-4 space-y-4 bg-muted/30 rounded-md">
                              <div>
                                <p className="text-sm font-medium mb-1">User Message</p>
                                <p className="text-sm text-muted-foreground bg-background p-3 rounded-md border">
                                  {ticket.description}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {timeAgo(ticket.created_at)}
                                </p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium mb-1 block">
                                    Status
                                  </label>
                                  <Select
                                    value={editingStatus[ticket.id] || ticket.status}
                                    onChange={(e) =>
                                      setEditingStatus((prev) => ({
                                        ...prev,
                                        [ticket.id]: e.target.value,
                                      }))
                                    }
                                  >
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                  </Select>
                                </div>
                                <div>
                                  <p className="text-sm font-medium mb-1">Priority</p>
                                  <Badge variant={priorityVariant[ticket.priority]}>
                                    {ticket.priority}
                                  </Badge>
                                  {ticket.nps_score !== undefined && ticket.nps_score !== null && (
                                    <span className="ml-3 text-sm text-muted-foreground">
                                      NPS: {ticket.nps_score}/10
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-medium mb-1 block">
                                  Admin Response
                                </label>
                                <Textarea
                                  value={editingResponse[ticket.id] || ""}
                                  onChange={(e) =>
                                    setEditingResponse((prev) => ({
                                      ...prev,
                                      [ticket.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Type your response..."
                                  rows={3}
                                />
                              </div>

                              <div className="flex justify-end">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveTicket(ticket.id);
                                  }}
                                  disabled={saving[ticket.id]}
                                >
                                  <Save className="h-4 w-4 mr-1" />
                                  {saving[ticket.id] ? "Saving..." : "Save"}
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
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

        <Tabs defaultValue="profiles">
          <TabsList>
            <TabsTrigger value="profiles">Customer Profiles</TabsTrigger>
            <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          </TabsList>

          <TabsContent value="profiles">
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
          </TabsContent>

          <TabsContent value="tickets">
            <SupportTicketsTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
