import React, { useEffect, useState, useMemo } from "react";
import Head from "next/head";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import { downloadCSV } from "@/lib/csv-export";
import { DollarSign, Download, Search, TrendingUp } from "lucide-react";
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

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");

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
      return matchesSearch && matchesDate;
    });
  }, [data, searchQuery, dateFilter]);

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
                <CardTitle className="text-lg">Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by user, plan, or status..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
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
                      <TableHead>User ID</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No transactions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((t) => (
                        <TableRow key={t.id}>
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
                          <TableCell>{formatDate(t.created_at)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                <p className="text-xs text-muted-foreground mt-3">
                  Showing {filteredTransactions.length} of {data?.transactions.length || 0} transactions
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
