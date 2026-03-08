import React, { useEffect, useState, useMemo, useCallback } from "react";
import Head from "next/head";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency, formatNumber, formatDate, formatDateTime, timeAgo } from "@/lib/utils";
import { downloadCSV } from "@/lib/csv-export";
import { DollarSign, Download, Search, TrendingUp, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RevenueSummary {
  mrr: number;
  arr: number;
  arpu: number;
  totalRevenue: number;
}

interface MrrTrendPoint {
  month: string;
  mrr: number;
}

interface RevenueByPlan {
  plan: string;
  revenue: number;
  count: number;
}

interface Transaction {
  id: string;
  user_id: string;
  plan: string;
  amount: number;
  status: string;
  created_at: string;
  stripe_subscription_id: string | null;
}

interface RevenueData {
  summary: RevenueSummary;
  mrrTrend: MrrTrendPoint[];
  revenueByPlan: RevenueByPlan[];
  transactions: Transaction[];
}

type SortKey = "user_id" | "plan" | "amount" | "status" | "created_at";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 25;

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailTransaction, setDetailTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    async function fetchRevenue() {
      try {
        const res = await fetch("/api/admin/revenue");
        if (!res.ok) throw new Error("Failed to fetch");
        const json: RevenueData = await res.json();
        setData(json);
      } catch (error) {
        console.error("Error fetching revenue:", error);
        setData({
          summary: { mrr: 0, arr: 0, arpu: 0, totalRevenue: 0 },
          mrrTrend: [],
          revenueByPlan: [],
          transactions: [],
        });
      } finally {
        setLoading(false);
      }
    }
    fetchRevenue();
  }, []);

  const uniquePlans = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.transactions.map((t) => t.plan))).sort();
  }, [data]);

  const filteredTransactions = useMemo(() => {
    if (!data) return [];
    return data.transactions.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        t.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.plan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.status.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDate =
        !dateFilter || t.created_at.startsWith(dateFilter);
      const matchesPlan = !planFilter || t.plan === planFilter;
      const matchesStatus = !statusFilter || t.status === statusFilter;
      return matchesSearch && matchesDate && matchesPlan && matchesStatus;
    });
  }, [data, searchQuery, dateFilter, planFilter, statusFilter]);

  const sortedTransactions = useMemo(() => {
    if (!sortKey) return filteredTransactions;
    const sorted = [...filteredTransactions].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal ?? "");
      const bStr = String(bVal ?? "");
      return sortDir === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
    return sorted;
  }, [filteredTransactions, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginatedTransactions = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return sortedTransactions.slice(start, start + PAGE_SIZE);
  }, [sortedTransactions, safePage]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, dateFilter, planFilter, statusFilter, sortKey, sortDir]);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return key;
      }
      setSortDir("asc");
      return key;
    });
  }, []);

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="h-3 w-3 ml-1 inline" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 ml-1 inline" /> : <ArrowDown className="h-3 w-3 ml-1 inline" />;
  };

  const visibleIds = useMemo(() => new Set(paginatedTransactions.map((t) => t.id)), [paginatedTransactions]);
  const allVisibleSelected = paginatedTransactions.length > 0 && paginatedTransactions.every((t) => selectedIds.has(t.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportCSV = () => {
    if (!data) return;
    downloadCSV(filteredTransactions, "revenue-export", [
      { key: "id", label: "ID" },
      { key: "user_id", label: "User ID" },
      { key: "plan", label: "Plan" },
      { key: "amount", label: "Amount" },
      { key: "status", label: "Status" },
      { key: "created_at", label: "Date" },
    ]);
  };

  const exportSelectedCSV = () => {
    const selected = data?.transactions.filter((t) => selectedIds.has(t.id)) || [];
    if (selected.length === 0) return;
    downloadCSV(selected, "revenue-selected-export", [
      { key: "id", label: "ID" },
      { key: "user_id", label: "User ID" },
      { key: "plan", label: "Plan" },
      { key: "amount", label: "Amount" },
      { key: "status", label: "Status" },
      { key: "created_at", label: "Date" },
    ]);
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "success" as const;
      case "trialing":
        return "warning" as const;
      case "canceled":
      case "past_due":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  const summaryCards = data
    ? [
        {
          label: "MRR",
          value: formatCurrency(data.summary.mrr),
          icon: DollarSign,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
        },
        {
          label: "ARR",
          value: formatCurrency(data.summary.arr),
          icon: TrendingUp,
          color: "text-blue-600",
          bg: "bg-blue-50",
        },
        {
          label: "ARPU",
          value: formatCurrency(data.summary.arpu),
          icon: DollarSign,
          color: "text-purple-600",
          bg: "bg-purple-50",
        },
        {
          label: "Total Revenue",
          value: formatCurrency(data.summary.totalRevenue),
          icon: DollarSign,
          color: "text-green-600",
          bg: "bg-green-50",
        },
      ]
    : [];

  const showStart = sortedTransactions.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const showEnd = Math.min(safePage * PAGE_SIZE, sortedTransactions.length);

  return (
    <>
      <Head>
        <title>Revenue - MuseKit Admin</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Revenue</h1>
            <p className="text-muted-foreground">
              Revenue analytics, MRR trends, and transaction history.
            </p>
          </div>
          <Button onClick={exportCSV} disabled={loading || !data}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Skeleton className="h-[380px]" />
              <Skeleton className="h-[380px]" />
            </div>
            <Skeleton className="h-[400px]" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {summaryCards.map((card) => (
                <Card key={card.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          {card.label}
                        </p>
                        <p className="text-xl font-bold mt-1">{card.value}</p>
                      </div>
                      <div className={`p-2 rounded-lg ${card.bg}`}>
                        <card.icon className={`h-4 w-4 ${card.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">MRR Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data?.mrrTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip
                          formatter={(value: number) => [
                            formatCurrency(value),
                            "MRR",
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="mrr"
                          stroke="hsl(142, 76%, 36%)"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Revenue by Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.revenueByPlan || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="plan" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip
                          formatter={(value: number) => [
                            formatCurrency(value),
                            "Revenue",
                          ]}
                        />
                        <Bar
                          dataKey="revenue"
                          fill="hsl(221.2, 83.2%, 53.3%)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transaction History ({filteredTransactions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by user, plan, or status..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    className="w-40"
                  >
                    <option value="">All Plans</option>
                    {uniquePlans.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </Select>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-40"
                  >
                    <option value="">All Status</option>
                    <option value="active">active</option>
                    <option value="trialing">trialing</option>
                    <option value="canceled">canceled</option>
                    <option value="past_due">past_due</option>
                  </Select>
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-44"
                  />
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort("user_id")}>
                        User ID <SortIcon column="user_id" />
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort("plan")}>
                        Plan <SortIcon column="plan" />
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort("amount")}>
                        Amount <SortIcon column="amount" />
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort("status")}>
                        Status <SortIcon column="status" />
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort("created_at")}>
                        Date <SortIcon column="created_at" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No transactions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedTransactions.map((t) => (
                        <TableRow
                          key={t.id}
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => setDetailTransaction(t)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(t.id)}
                              onChange={() => toggleSelect(t.id)}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {t.user_id.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="capitalize">{t.plan}</TableCell>
                          <TableCell>{formatCurrency(t.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(t.status)}>
                              {t.status}
                            </Badge>
                          </TableCell>
                          <TableCell title={formatDateTime(t.created_at)}>{timeAgo(t.created_at)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-muted-foreground">
                    Showing {showStart}-{showEnd} of {sortedTransactions.length} transactions
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Prev
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {safePage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={safePage >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-background border rounded-lg shadow-lg px-6 py-3">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button size="sm" onClick={exportSelectedCSV}>
            <Download className="h-4 w-4 mr-1" />
            Export Selected CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
            <X className="h-4 w-4 mr-1" />
            Clear Selection
          </Button>
        </div>
      )}

      {detailTransaction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setDetailTransaction(null)}
        >
          <Card className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Transaction Detail</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setDetailTransaction(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
                <dt className="font-medium text-muted-foreground">ID</dt>
                <dd className="font-mono text-xs break-all">{detailTransaction.id}</dd>
                <dt className="font-medium text-muted-foreground">User ID</dt>
                <dd className="font-mono text-xs break-all">{detailTransaction.user_id}</dd>
                <dt className="font-medium text-muted-foreground">Plan</dt>
                <dd className="capitalize">{detailTransaction.plan}</dd>
                <dt className="font-medium text-muted-foreground">Amount</dt>
                <dd>{formatCurrency(detailTransaction.amount)}</dd>
                <dt className="font-medium text-muted-foreground">Status</dt>
                <dd>
                  <Badge variant={statusVariant(detailTransaction.status)}>
                    {detailTransaction.status}
                  </Badge>
                </dd>
                <dt className="font-medium text-muted-foreground">Created At</dt>
                <dd>{formatDateTime(detailTransaction.created_at)}</dd>
                <dt className="font-medium text-muted-foreground">Stripe Subscription ID</dt>
                <dd className="font-mono text-xs break-all">{detailTransaction.stripe_subscription_id || "—"}</dd>
              </dl>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
