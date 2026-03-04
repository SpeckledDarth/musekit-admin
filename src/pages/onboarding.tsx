import React, { useEffect, useState } from "react";
import Head from "next/head";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, CheckCircle, LogIn, Zap } from "lucide-react";

interface FunnelStage {
  stage: string;
  count: number;
}

const stageIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Signup: Users,
  Verified: CheckCircle,
  "First Login": LogIn,
  "First Action": Zap,
};

const stageColors = [
  "bg-blue-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-green-500",
];

export default function OnboardingPage() {
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFunnel() {
      try {
        const res = await fetch("/api/admin/onboarding");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setFunnel(data.funnel || []);
      } catch (error) {
        console.error("Error fetching funnel:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFunnel();
  }, []);

  const maxCount = Math.max(...funnel.map((s) => s.count), 1);

  return (
    <>
      <Head>
        <title>Onboarding Funnel - MuseKit Admin</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-8 w-8" /> Onboarding Funnel
          </h1>
          <p className="text-muted-foreground">
            Track user progression from signup to first action.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              {funnel.map((stage, index) => {
                const Icon = stageIcons[stage.stage] || Users;
                const conversionRate =
                  index === 0 || funnel[0].count === 0
                    ? 100
                    : Math.round((stage.count / funnel[0].count) * 100);
                const dropOff =
                  index === 0
                    ? 0
                    : funnel[index - 1].count - stage.count;

                return (
                  <Card key={stage.stage}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`p-2 rounded-lg ${stageColors[index]} bg-opacity-10`}
                        >
                          <Icon
                            className={`h-5 w-5 ${stageColors[index].replace("bg-", "text-")}`}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{stage.stage}</p>
                          <p className="text-2xl font-bold">{stage.count}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {conversionRate}% of signups
                        </span>
                        {dropOff > 0 && (
                          <span className="text-red-500">
                            -{dropOff} dropped
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Funnel Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {funnel.map((stage, index) => {
                    const widthPercent = (stage.count / maxCount) * 100;
                    const conversionFromPrev =
                      index === 0 || funnel[index - 1].count === 0
                        ? 100
                        : Math.round(
                            (stage.count / funnel[index - 1].count) * 100
                          );

                    return (
                      <div key={stage.stage} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{stage.stage}</span>
                          <span className="text-muted-foreground">
                            {stage.count} users
                            {index > 0 && (
                              <span className="ml-2">
                                ({conversionFromPrev}% from previous)
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-8">
                          <div
                            className={`h-8 rounded-full ${stageColors[index]} flex items-center justify-end pr-3 transition-all duration-500`}
                            style={{ width: `${Math.max(widthPercent, 5)}%` }}
                          >
                            <span className="text-white text-xs font-medium">
                              {stage.count}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
