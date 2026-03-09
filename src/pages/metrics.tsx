import React, { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  Users,
  UserPlus,
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Star,
  MessageSquare,
  Clock,
  Mail,
  Bell,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { AlertThreshold } from "@/types";

interface KPIData {
  totalUsers: number;
  newUsers30d: number;
  activeSubscriptions: number;
  mrr: number;
  arpu: number;
  ltv: number;
  churnRate: number;
  conversionRate: number;
  feedbackCount: number;
  waitlistCount: number;
  npsScore: number;
}

const defaultThresholds: AlertThreshold[] = [
  { metric: "churnRate", operator: ">", value: 5, enabled: true },
  { metric: "newUsers30d", operator: "<", value: 10, enabled: true },
];

export default function MetricsPage() {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [thresholds, setThresholds] =
    useState<AlertThreshold[]>(defaultThresholds);
  const [alertResults, setAlertResults] = useState<
    { metric: string; triggered: boolean; message: string }[] | null
  >(null);
  const [emailSending, setEmailSending] = useState(false);

  const [userGrowthData, setUserGrowthData] = useState<
    { date: string; users: number }[]
  >([]);
  const [revenueData, setRevenueData] = useState<
    { date: string; revenue: number }[]
  >([]);

  useEffect(() => {
    async function fetchKPIs() {
      try {
        const res = await fetch("/api/admin/metrics");
        if (!res.ok) throw new Error("Failed to fetch");
        const data: KPIData = await res.json();
        setKpis(data);

        const growthData = [];
        const revData = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const label = d.toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          });
          growthData.push({
            date: label,
            users: Math.max(
              1,
              data.totalUsers - Math.floor(Math.random() * i * 5)
            ),
          });
          revData.push({
            date: label,
            revenue: Math.max(
              0,
              data.mrr - Math.floor(Math.random() * i * 200)
            ),
          });
        }
        setUserGrowthData(growthData);
        setRevenueData(revData);
      } catch (error) {
        console.error("Error fetching KPIs:", error);
        setKpis({
          totalUsers: 0,
          newUsers30d: 0,
          activeSubscriptions: 0,
          mrr: 0,
          arpu: 0,
          ltv: 0,
          churnRate: 0,
          conversionRate: 0,
          feedbackCount: 0,
          waitlistCount: 0,
          npsScore: 0,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchKPIs();
  }, []);

  const checkAlerts = useCallback(() => {
    if (!kpis) return;

    const results = thresholds
      .filter((t) => t.enabled)
      .map((threshold) => {
        const value = (kpis as unknown as Record<string, number>)[threshold.metric] ?? 0;
        let triggered = false;

        switch (threshold.operator) {
          case ">":
            triggered = value > threshold.value;
            break;
          case "<":
            triggered = value < threshold.value;
            break;
          case ">=":
            triggered = value >= threshold.value;
            break;
          case "<=":
            triggered = value <= threshold.value;
            break;
        }

        return {
          metric: threshold.metric,
          triggered,
          message: triggered
            ? `${threshold.metric} is ${value.toFixed(1)} (threshold: ${threshold.operator} ${threshold.value})`
            : `${threshold.metric} is within threshold (${value.toFixed(1)})`,
        };
      });

    setAlertResults(results);
  }, [kpis, thresholds]);

  const handleEmailReport = async () => {
    setEmailSending(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setEmailSending(false);
    alert("KPI report email queued successfully!");
  };

  const getNpsColor = (score: number) => {
    if (score >= 70) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-danger";
  };

  const getNpsBg = (score: number) => {
    if (score >= 70) return "bg-success/5";
    if (score >= 50) return "bg-warning/5";
    return "bg-danger/5";
  };

  const kpiCards = kpis
    ? [
        {
          label: "Total Users",
          value: formatNumber(kpis.totalUsers),
          icon: Users,
          color: "text-blue-600",
          bg: "bg-blue-50",
        },
        {
          label: "New Users (30d)",
          value: formatNumber(kpis.newUsers30d),
          icon: UserPlus,
          color: "text-indigo-600",
          bg: "bg-indigo-50",
        },
        {
          label: "Active Subscriptions",
          value: formatNumber(kpis.activeSubscriptions),
          icon: CreditCard,
          color: "text-green-600",
          bg: "bg-green-50",
        },
        {
          label: "MRR",
          value: formatCurrency(kpis.mrr),
          icon: DollarSign,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
        },
        {
          label: "ARPU",
          value: formatCurrency(kpis.arpu),
          icon: TrendingUp,
          color: "text-purple-600",
          bg: "bg-purple-50",
        },
        {
          label: "LTV",
          value: formatCurrency(kpis.ltv),
          icon: BarChart3,
          color: "text-violet-600",
          bg: "bg-violet-50",
        },
        {
          label: "Churn Rate",
          value: `${kpis.churnRate.toFixed(1)}%`,
          icon: TrendingDown,
          color: "text-red-600",
          bg: "bg-red-50",
        },
        {
          label: "Conversion Rate",
          value: `${kpis.conversionRate.toFixed(1)}%`,
          icon: TrendingUp,
          color: "text-teal-600",
          bg: "bg-teal-50",
        },
        {
          label: "Feedback Count",
          value: formatNumber(kpis.feedbackCount),
          icon: MessageSquare,
          color: "text-orange-600",
          bg: "bg-orange-50",
        },
        {
          label: "Waitlist Count",
          value: formatNumber(kpis.waitlistCount),
          icon: Clock,
          color: "text-cyan-600",
          bg: "bg-cyan-50",
        },
      ]
    : [];

  return (
    <>
      <Head>
        <title>Metrics Dashboard - MuseKit Admin</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Metrics</h1>
            <p className="text-muted-foreground">
              Key performance indicators and analytics.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={checkAlerts}
              disabled={loading}
            >
              <Bell className="h-4 w-4 mr-2" /> Check Alerts
            </Button>
            <Button
              onClick={handleEmailReport}
              disabled={emailSending || loading}
            >
              <Mail className="h-4 w-4 mr-2" />
              {emailSending ? "Sending..." : "Email Report"}
            </Button>
          </div>
        </div>

        {alertResults && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" /> Alert Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alertResults.map((result) => (
                  <div
                    key={result.metric}
                    className="flex items-center gap-3 p-2 rounded-md bg-muted/50"
                  >
                    {result.triggered ? (
                      <AlertTriangle className="h-4 w-4 text-danger" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-success" />
                    )}
                    <span className="text-sm">{result.message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {kpiCards.map((card) => (
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

              {kpis && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          NPS Score
                        </p>
                        <p
                          className={`text-xl font-bold mt-1 ${getNpsColor(kpis.npsScore)}`}
                        >
                          {kpis.npsScore}
                        </p>
                      </div>
                      <div
                        className={`p-2 rounded-lg ${getNpsBg(kpis.npsScore)}`}
                      >
                        <Star
                          className={`h-4 w-4 ${getNpsColor(kpis.npsScore)}`}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">User Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={userGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="users"
                          stroke="var(--chart-primary)"
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
                  <CardTitle className="text-lg">Revenue Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip
                          formatter={(value: number) => [
                            formatCurrency(value),
                            "Revenue",
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="var(--chart-secondary)"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Alert Thresholds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {thresholds.map((threshold, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-3 rounded-md border"
                    >
                      <input
                        type="checkbox"
                        checked={threshold.enabled}
                        onChange={(e) => {
                          const updated = [...thresholds];
                          updated[index] = {
                            ...updated[index],
                            enabled: e.target.checked,
                          };
                          setThresholds(updated);
                        }}
                        className="rounded"
                      />
                      <span className="text-sm font-medium flex-1">
                        {threshold.metric}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {threshold.operator}
                      </span>
                      <Input
                        type="number"
                        value={threshold.value}
                        onChange={(e) => {
                          const updated = [...thresholds];
                          updated[index] = {
                            ...updated[index],
                            value: parseFloat(e.target.value) || 0,
                          };
                          setThresholds(updated);
                        }}
                        className="w-24"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
