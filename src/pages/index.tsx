import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber, timeAgo } from "@/lib/utils";
import {
  Users,
  CreditCard,
  DollarSign,
  Activity,
  ArrowRight,
  ScrollText,
  Settings,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import type { AuditLog } from "@/types";

interface ChartDataPoint {
  month: string;
  mrr?: number;
  users?: number;
  rate?: number;
}

interface OverviewMetrics {
  totalUsers: number;
  activeSubscriptions: number;
  mrr: number;
  recentActivity: AuditLog[];
  mrrTrend: ChartDataPoint[];
  userGrowth: ChartDataPoint[];
  churnData: ChartDataPoint[];
}

export default function OverviewPage() {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch("/admin/api/admin/overview");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setMetrics(data);
      } catch (error) {
        console.error("Error fetching overview metrics:", error);
        setMetrics({
          totalUsers: 0,
          activeSubscriptions: 0,
          mrr: 0,
          recentActivity: [],
          mrrTrend: [],
          userGrowth: [],
          churnData: [],
        });
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  const metricCards = [
    {
      title: "Total Users",
      value: metrics ? formatNumber(metrics.totalUsers) : "0",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Active Subscriptions",
      value: metrics ? formatNumber(metrics.activeSubscriptions) : "0",
      icon: CreditCard,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Monthly Revenue",
      value: metrics ? formatCurrency(metrics.mrr) : "$0",
      icon: DollarSign,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Active Sessions",
      value: "—",
      icon: Activity,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  const quickActions = [
    {
      title: "Manage Users",
      description: "View and manage user accounts",
      href: "/users",
      icon: Users,
    },
    {
      title: "View Audit Logs",
      description: "Review system activity",
      href: "/audit-log",
      icon: ScrollText,
    },
    {
      title: "Settings",
      description: "Configure admin settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <>
      <Head>
        <title>Admin Overview - MuseKit</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">
            Welcome to the MuseKit admin dashboard.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((card) => (
            <Card key={card.title}>
              <CardContent className="p-6">
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {card.title}
                      </p>
                      <p className="text-2xl font-bold mt-1">{card.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${card.bg}`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[250px] w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">MRR Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics?.mrrTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip
                        formatter={(value: number) => [
                          formatCurrency(value),
                          "MRR",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="mrr"
                        stroke="hsl(262, 83%, 58%)"
                        fill="hsl(262, 83%, 58%)"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics?.userGrowth || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="users"
                        stroke="hsl(221.2, 83.2%, 53.3%)"
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
                <CardTitle className="text-lg">Churn Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics?.churnData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} unit="%" />
                      <Tooltip
                        formatter={(value: number) => [
                          `${value}%`,
                          "Churn Rate",
                        ]}
                      />
                      <Bar
                        dataKey="rate"
                        fill="hsl(0, 84%, 60%)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <action.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{action.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : metrics?.recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No recent activity found.
              </p>
            ) : (
              <div className="space-y-3">
                {metrics?.recentActivity.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded bg-muted">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{log.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.resource_type}
                          {log.resource_id
                            ? ` #${log.resource_id.slice(0, 8)}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(log.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
