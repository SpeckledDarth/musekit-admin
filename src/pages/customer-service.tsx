import React, { useEffect, useState, useMemo } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate, timeAgo } from "@/lib/utils";
import { downloadCSV } from "@/lib/csv-export";
import {
  HeadsetIcon,
  Search,
  CreditCard,
  StickyNote,
  Ticket,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Users,
} from "lucide-react";
import type { Profile, SupportTicket } from "@/types";

const ROWS_PER_PAGE = 25;

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

type TicketSortColumn = "subject" | "user_email" | "status" | "priority" | "nps_score" | "created_at";
type SortDirection = "asc" | "desc";

function SortIcon({ column, sortColumn, sortDirection }: { column: string; sortColumn: string | null; sortDirection: SortDirection }) {
  if (sortColumn !== column) return <ArrowUpDown className="h-4 w-4 ml-1 inline" />;
  return sortDirection === "asc" ? <ArrowUp className="h-4 w-4 ml-1 inline" /> : <ArrowDown className="h-4 w-4 ml-1 inline" />;
}

function SupportTicketsTab() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortColumn, setSortColumn] = useState<TicketSortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: "", description: "", priority: "medium", user_email: "" });
  const [creating, setCreating] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void; destructive?: boolean }>({ open: false, title: "", message: "", onConfirm: () => {} });
  const [bulkPriorityOpen, setBulkPriorityOpen] = useState(false);

  useEffect(() => {
    async function fetchTickets() {
      try {
        const res = await fetch("/api/admin/customer-service?type=tickets");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setTickets(data.tickets || []);
      } catch (error) {
        console.error("Error fetching tickets:", error);
        toast.error("Failed to load tickets");
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

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        t.subject.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (t.user_email || "").toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        t.description.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, debouncedSearch, statusFilter, priorityFilter]);

  const sortedTickets = useMemo(() => {
    if (!sortColumn) return filteredTickets;
    return [...filteredTickets].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";
      switch (sortColumn) {
        case "subject": aVal = a.subject.toLowerCase(); bVal = b.subject.toLowerCase(); break;
        case "user_email": aVal = (a.user_email || "").toLowerCase(); bVal = (b.user_email || "").toLowerCase(); break;
        case "status": aVal = a.status; bVal = b.status; break;
        case "priority": {
          const order: Record<string, number> = { low: 0, medium: 1, high: 2, urgent: 3 };
          aVal = order[a.priority] ?? 0; bVal = order[b.priority] ?? 0; break;
        }
        case "nps_score": aVal = a.nps_score ?? -1; bVal = b.nps_score ?? -1; break;
        case "created_at": aVal = new Date(a.created_at).getTime(); bVal = new Date(b.created_at).getTime(); break;
      }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredTickets, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedTickets.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedTickets = sortedTickets.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);
  const showingStart = sortedTickets.length === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1;
  const showingEnd = Math.min(currentPage * ROWS_PER_PAGE, sortedTickets.length);

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, priorityFilter]);

  const handleSort = (col: TicketSortColumn) => {
    if (sortColumn === col) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  };

  const allVisibleSelected = paginatedTickets.length > 0 && paginatedTickets.every((t) => selectedIds.has(t.id));
  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedTickets.forEach((t) => next.delete(t.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedTickets.forEach((t) => next.add(t.id));
        return next;
      });
    }
  };
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkClose = () => {
    setConfirmDialog({
      open: true,
      title: "Bulk Close Tickets",
      message: `Are you sure you want to close ${selectedIds.size} ticket(s)?`,
      destructive: true,
      onConfirm: async () => {
        setConfirmDialog((p) => ({ ...p, open: false }));
        try {
          const res = await fetch("/api/admin/customer-service", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "bulk_close", ticketIds: Array.from(selectedIds) }),
          });
          if (!res.ok) throw new Error("Failed");
          setTickets((prev) => prev.map((t) => selectedIds.has(t.id) ? { ...t, status: "closed" as const, closed_at: new Date().toISOString() } : t));
          toast.success(`${selectedIds.size} ticket(s) closed`);
          setSelectedIds(new Set());
        } catch { toast.error("Failed to close tickets"); }
      },
    });
  };

  const handleBulkAssign = async () => {
    try {
      const res = await fetch("/api/admin/customer-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk_assign", ticketIds: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const assignedTo = data.assignedTo || "admin";
      setTickets((prev) => prev.map((t) => selectedIds.has(t.id) ? { ...t, assigned_to: assignedTo } : t));
      toast.success(`${selectedIds.size} ticket(s) assigned to you`);
      setSelectedIds(new Set());
    } catch { toast.error("Failed to assign tickets"); }
  };

  const handleBulkPriority = async (priority: string) => {
    setBulkPriorityOpen(false);
    try {
      const res = await fetch("/api/admin/customer-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk_priority", ticketIds: Array.from(selectedIds), priority }),
      });
      if (!res.ok) throw new Error("Failed");
      setTickets((prev) => prev.map((t) => selectedIds.has(t.id) ? { ...t, priority: priority as SupportTicket["priority"] } : t));
      toast.success(`${selectedIds.size} ticket(s) priority changed to ${priority}`);
      setSelectedIds(new Set());
    } catch { toast.error("Failed to change priority"); }
  };

  const handleExportSelected = () => {
    const selected = tickets.filter((t) => selectedIds.has(t.id));
    downloadCSV(selected, "tickets-selected-export", [
      { key: "id", label: "ID" },
      { key: "subject", label: "Subject" },
      { key: "user_email", label: "User Email" },
      { key: "status", label: "Status" },
      { key: "priority", label: "Priority" },
      { key: "description", label: "Message" },
      { key: "nps_score", label: "NPS Score" },
      { key: "created_at", label: "Created" },
    ]);
    toast.success(`Exported ${selected.length} ticket(s)`);
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      toast.error("Subject and description are required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/customer-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_ticket", ...newTicket }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.ticket) setTickets((prev) => [data.ticket, ...prev]);
      toast.success("Ticket created");
      setShowNewTicketModal(false);
      setNewTicket({ subject: "", description: "", priority: "medium", user_email: "" });
    } catch { toast.error("Failed to create ticket"); } finally { setCreating(false); }
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
            <Button onClick={() => setShowNewTicketModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : sortedTickets.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="No tickets found"
              description="Try adjusting your search or filters."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort("subject")}>
                      Subject <SortIcon column="subject" sortColumn={sortColumn} sortDirection={sortDirection} />
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort("user_email")}>
                      User <SortIcon column="user_email" sortColumn={sortColumn} sortDirection={sortDirection} />
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort("status")}>
                      Status <SortIcon column="status" sortColumn={sortColumn} sortDirection={sortDirection} />
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort("priority")}>
                      Priority <SortIcon column="priority" sortColumn={sortColumn} sortDirection={sortDirection} />
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort("nps_score")}>
                      NPS <SortIcon column="nps_score" sortColumn={sortColumn} sortDirection={sortDirection} />
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort("created_at")}>
                      Created <SortIcon column="created_at" sortColumn={sortColumn} sortDirection={sortDirection} />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/customer-service/${ticket.id}`)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(ticket.id)}
                          onChange={() => toggleSelect(ticket.id)}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{ticket.subject}</TableCell>
                      <TableCell className="text-sm">{ticket.user_email}</TableCell>
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
                        {ticket.nps_score !== undefined && ticket.nps_score !== null ? ticket.nps_score : "—"}
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(ticket.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {showingStart}-{showingEnd} of {sortedTickets.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                  </Button>
                  <span className="text-sm">Page {currentPage} of {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border rounded-lg shadow-lg p-4 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button size="sm" variant="destructive" onClick={handleBulkClose}>Bulk Close</Button>
          <Button size="sm" variant="outline" onClick={handleBulkAssign}>Bulk Assign to Me</Button>
          <div className="relative">
            <Button size="sm" variant="outline" onClick={() => setBulkPriorityOpen(!bulkPriorityOpen)}>
              Bulk Change Priority
            </Button>
            {bulkPriorityOpen && (
              <div className="absolute bottom-full mb-1 left-0 bg-card border rounded-md shadow-lg py-1 min-w-[120px] z-50">
                {["low", "medium", "high", "urgent"].map((p) => (
                  <button
                    key={p}
                    className="block w-full text-left px-3 py-1.5 text-sm hover:bg-muted capitalize"
                    onClick={() => handleBulkPriority(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={handleExportSelected}>
            <Download className="h-4 w-4 mr-1" /> Export Selected CSV
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
        </div>
      )}

      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewTicketModal(false)} />
          <div className="relative z-50 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg space-y-4">
            <h2 className="text-lg font-semibold">New Ticket</h2>
            <div>
              <label className="text-sm font-medium block mb-1">Subject</label>
              <Input value={newTicket.subject} onChange={(e) => setNewTicket((p) => ({ ...p, subject: e.target.value }))} placeholder="Ticket subject" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Description</label>
              <textarea
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px]"
                value={newTicket.description}
                onChange={(e) => setNewTicket((p) => ({ ...p, description: e.target.value }))}
                placeholder="Describe the issue..."
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Priority</label>
              <Select value={newTicket.priority} onChange={(e) => setNewTicket((p) => ({ ...p, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">User Email (optional)</label>
              <Input value={newTicket.user_email} onChange={(e) => setNewTicket((p) => ({ ...p, user_email: e.target.value }))} placeholder="user@example.com" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowNewTicketModal(false)}>Cancel</Button>
              <Button onClick={handleCreateTicket} disabled={creating}>{creating ? "Creating..." : "Create Ticket"}</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((p) => ({ ...p, open: false }))}
        destructive={confirmDialog.destructive}
      />
    </div>
  );
}

type UserSortColumn = "full_name" | "status" | "created_at";

export default function CustomerServicePage() {
  const router = useRouter();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [userSortColumn, setUserSortColumn] = useState<UserSortColumn | null>(null);
  const [userSortDirection, setUserSortDirection] = useState<SortDirection>("asc");
  const [userPage, setUserPage] = useState(1);

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

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

  useEffect(() => {
    async function fetchTicketCount() {
      try {
        const res = await fetch("/api/admin/customer-service?type=tickets");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setTickets(data.tickets || []);
      } catch (error) {
        console.error("Error fetching ticket count:", error);
      } finally {
        setTicketsLoading(false);
      }
    }
    fetchTicketCount();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        (u.full_name || "").toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [users, debouncedSearch]);

  const sortedUsers = useMemo(() => {
    if (!userSortColumn) return filteredUsers;
    return [...filteredUsers].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";
      switch (userSortColumn) {
        case "full_name": aVal = (a.full_name || "").toLowerCase(); bVal = (b.full_name || "").toLowerCase(); break;
        case "status": aVal = a.status; bVal = b.status; break;
        case "created_at": aVal = new Date(a.created_at).getTime(); bVal = new Date(b.created_at).getTime(); break;
      }
      if (aVal < bVal) return userSortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return userSortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, userSortColumn, userSortDirection]);

  const userTotalPages = Math.max(1, Math.ceil(sortedUsers.length / ROWS_PER_PAGE));
  const userCurrentPage = Math.min(userPage, userTotalPages);
  const paginatedUsers = sortedUsers.slice((userCurrentPage - 1) * ROWS_PER_PAGE, userCurrentPage * ROWS_PER_PAGE);
  const userShowingStart = sortedUsers.length === 0 ? 0 : (userCurrentPage - 1) * ROWS_PER_PAGE + 1;
  const userShowingEnd = Math.min(userCurrentPage * ROWS_PER_PAGE, sortedUsers.length);

  useEffect(() => { setUserPage(1); }, [debouncedSearch]);

  const handleUserSort = (col: UserSortColumn) => {
    if (userSortColumn === col) {
      setUserSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setUserSortColumn(col);
      setUserSortDirection("asc");
    }
  };

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
            <TabsTrigger value="profiles">Customer Profiles ({users.length})</TabsTrigger>
            <TabsTrigger value="tickets">Support Tickets ({tickets.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="profiles">
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
                ) : sortedUsers.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No customers found"
                    description="Try adjusting your search."
                  />
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="cursor-pointer select-none" onClick={() => handleUserSort("full_name")}>
                            Customer <SortIcon column="full_name" sortColumn={userSortColumn} sortDirection={userSortDirection} />
                          </TableHead>
                          <TableHead className="cursor-pointer select-none" onClick={() => handleUserSort("status")}>
                            Status <SortIcon column="status" sortColumn={userSortColumn} sortDirection={userSortDirection} />
                          </TableHead>
                          <TableHead className="cursor-pointer select-none" onClick={() => handleUserSort("created_at")}>
                            Joined <SortIcon column="created_at" sortColumn={userSortColumn} sortDirection={userSortDirection} />
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedUsers.map((user) => (
                          <TableRow
                            key={user.id}
                            className="cursor-pointer"
                            onClick={() => router.push(`/users/${user.id}`)}
                          >
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
                                variant={user.status === "active" ? "success" : "secondary"}
                              >
                                {user.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm" title={formatDate(user.created_at)}>
                              {timeAgo(user.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Showing {userShowingStart}-{userShowingEnd} of {sortedUsers.length}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled={userCurrentPage <= 1} onClick={() => setUserPage((p) => p - 1)}>
                          <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                        </Button>
                        <span className="text-sm">Page {userCurrentPage} of {userTotalPages}</span>
                        <Button variant="outline" size="sm" disabled={userCurrentPage >= userTotalPages} onClick={() => setUserPage((p) => p + 1)}>
                          Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets">
            <SupportTicketsTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
