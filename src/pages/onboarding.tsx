import React, { useEffect, useState, useMemo } from "react";
import Head from "next/head";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Breadcrumb } from "@/layout/Breadcrumb";
import { downloadCSV } from "@/lib/csv-export";
import { toast } from "sonner";
import { TrendingUp, Users, CheckCircle, LogIn, Zap, Download, AlertTriangle } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface FunnelStage {
  stage: string;
  count: number;
}

interface DailySignup {
  date: string;
  count: number;
}

const stageIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Signup: Users,
  Verified: CheckCircle,
  "First Login": LogIn,
  "First Action": Zap,
};

const rangeOptions: { label: string; value: string }[] = [
  { label: "7 Days", value: "7" },
  { label: "30 Days", value: "30" },
  { label: "90 Days", value: "90" },
  { label: "All Time", value: "all" },
];

const dropOffSuggestions: Record<string, string> = {
  "Signup → Verified": "Consider improving the email verification flow — simplify the steps or add reminder emails.",
  "Verified → First Login": "Users verify but don't log in. Try a welcome email with a direct login link.",
  "First Login → First Action": "Users log in but don't take action. Improve onboarding UX with guided tours or prompts.",
};

function getConversionColor(pct: number): string {
  if (pct >= 70) return "bg-green-500";
  if (pct >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

function getConversionTextColor(pct: number): string {
  if (pct >= 70) return "text-green-600";
  if (pct >= 40) return "text-yellow-600";
  return "text-red-600";
}

export default function OnboardingPage() {
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [dailySignups, setDailySignups] = useState<DailySignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/onboarding?range=${range}`);
        if (!res.ok) throw new Error("Failed to fetch onboarding data");
        const data = await res.json();
        setFunnel(data.funnel || []);
        setDailySignups(data.dailySignups || []);
      } catch (error) {
        console.error("Error fetching funnel:", error);
        toast.error("Failed to load onboarding data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [range]);

  const maxCount = Math.max(...funnel.map((s) => s.count), 1);

  const stats = useMemo(() => {
    const signups = funnel.find((f) => f.stage === "Signup")?.count || 0;
    const verified = funnel.find((f) => f.stage === "Verified")?.count || 0;
    const firstLogin = funnel.find((f) => f.stage === "First Login")?.count || 0;
    const firstAction = funnel.find((f) => f.stage === "First Action")?.count || 0;
    const verifiedRate = signups > 0 ? Math.round((verified / signups) * 100) : 0;
    const firstLoginRate = signups > 0 ? Math.round((firstLogin / signups) * 100) : 0;
    const firstActionRate = signups > 0 ? Math.round((firstAction / signups) * 100) : 0;
    const overallConversion = firstActionRate;
    return { signups, verified, firstLogin, firstAction, verifiedRate, firstLoginRate, firstActionRate, overallConversion };
  }, [funnel]);

  const dropOffAnalysis = useMemo(() => {
    if (funnel.length < 2) return null;
    let worstIdx = 1;
    let worstPct = 100;
    for (let i = 1; i < funnel.length; i++) {
      const prev = funnel[i - 1].count;
      const pct = prev > 0 ? (funnel[i].count / prev) * 100 : 100;
      if (pct < worstPct) {
        worstPct = pct;
        worstIdx = i;
      }
    }
    const step1 = funnel[worstIdx - 1].stage;
    const step2 = funnel[worstIdx].stage;
    const dropoffCount = funnel[worstIdx - 1].count - funnel[worstIdx].count;
    const conversion = Math.round(worstPct);
    const key = `${step1} → ${step2}`;
    const suggestion = dropOffSuggestions[key] || "Review the user experience at this step to improve conversion.";
    return { step1, step2, dropoffCount, conversion, suggestion };
  }, [funnel]);

  const handleExportCSV = () => {
    const funnelData = funnel.map((f, i) => ({
      stage: f.stage,
      count: f.count,
      conversionFromSignup: i === 0 || funnel[0].count === 0 ? "100%" : `${Math.round((f.count / funnel[0].count) * 100)}%`,
    }));
    downloadCSV(funnelData, "onboarding-funnel", [
      { key: "stage", label: "Stage" },
      { key: "count", label: "Count" },
      { key: "conversionFromSignup", label: "Conversion from Signup" },
    ]);

    if (dailySignups.length > 0) {
      downloadCSV(dailySignups, "daily-signups", [
        { key: "date", label: "Date" },
        { key: "count", label: "Signups" },
      ]);
    }
  };

  const hasData = funnel.length > 0 && funnel.some((f) => f.count > 0);

  return (
    <>
      <Head>
        <title>Onboarding Funnel - MuseKit Admin</title>
      </Head>

      <div className="space-y-6">
        <Breadcrumb />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="h-8 w-8" /> Onboarding Funnel
            </h1>
            <p className="text-muted-foreground">
              Track user progression from signup to first action.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!hasData}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="flex gap-2">
          {rangeOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={range === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setRange(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : !hasData ? (
          <EmptyState
            icon={Users}
            title="No onboarding data"
            description="No user signups found for the selected date range."
          />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-5">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500 bg-opacity-10">
                      <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Signups</p>
                      <p className="text-2xl font-bold">{stats.signups}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500 bg-opacity-10">
                      <CheckCircle className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Verified Rate</p>
                      <p className="text-2xl font-bold">{stats.verifiedRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500 bg-opacity-10">
                      <LogIn className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">First Login Rate</p>
                      <p className="text-2xl font-bold">{stats.firstLoginRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500 bg-opacity-10">
                      <Zap className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">First Action Rate</p>
                      <p className="text-2xl font-bold">{stats.firstActionRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary bg-opacity-10">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Overall Conversion</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{stats.overallConversion}%</p>
                        <Badge variant={stats.overallConversion >= 50 ? "success" : "destructive"}>
                          {stats.overallConversion >= 50 ? "Good" : "Low"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Funnel Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {funnel.map((stage, index) => {
                    const widthPercent = (stage.count / maxCount) * 100;
                    const conversionFromPrev =
                      index === 0 || funnel[index - 1].count === 0
                        ? 100
                        : Math.round((stage.count / funnel[index - 1].count) * 100);
                    const dropOff =
                      index === 0 ? 0 : funnel[index - 1].count - stage.count;
                    const barColor = index === 0 ? "bg-blue-500" : getConversionColor(conversionFromPrev);

                    return (
                      <div key={stage.stage}>
                        {index > 0 && (
                          <div className="flex items-center gap-2 py-1 pl-4">
                            <span className={`text-xs font-semibold ${getConversionTextColor(conversionFromPrev)}`}>
                              {conversionFromPrev}% &darr;
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({dropOff} users dropped)
                            </span>
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium flex items-center gap-2">
                              {React.createElement(stageIcons[stage.stage] || Users, { className: "h-4 w-4" })}
                              {stage.stage}
                            </span>
                            <span className="text-muted-foreground">
                              {stage.count} users
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-8">
                            <div
                              className={`h-8 rounded-full ${barColor} flex items-center justify-end pr-3 transition-all duration-500`}
                              style={{ width: `${Math.max(widthPercent, 5)}%` }}
                            >
                              <span className="text-white text-xs font-medium">
                                {stage.count}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {dailySignups.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Daily Signups</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailySignups} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(val: string) => {
                            const d = new Date(val + "T00:00:00");
                            return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                          }}
                        />
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip
                          labelFormatter={(val: string) => {
                            const d = new Date(val + "T00:00:00");
                            return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
                          }}
                          formatter={(value: number) => [value, "Signups"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#6366f1"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#signupGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {dropOffAnalysis && dropOffAnalysis.dropoffCount > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Drop-off Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="font-semibold">
                      Biggest drop-off: {dropOffAnalysis.step1} &rarr; {dropOffAnalysis.step2}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {dropOffAnalysis.dropoffCount} users lost &middot; {dropOffAnalysis.conversion}% step conversion
                    </p>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {dropOffAnalysis.suggestion}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </>
  );
}
