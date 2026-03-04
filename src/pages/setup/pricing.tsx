import React, { useState } from "react";
import Head from "next/head";
import { SetupLayout } from "@/layout/SetupLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettings";
import { CreditCard, Plus, Trash2 } from "lucide-react";

interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  features: string;
  stripePriceIdMonthly: string;
  stripePriceIdAnnual: string;
}

export default function PricingSetup() {
  const { getSetting, updateSetting, saveSettings, loading, saving } =
    useSettings("pricing");
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [billingToggle, setBillingToggle] = useState<"monthly" | "annual">(
    "monthly"
  );

  React.useEffect(() => {
    if (!loading) {
      const saved = getSetting("plans");
      if (saved) {
        try {
          setPlans(JSON.parse(saved));
          return;
        } catch {}
      }
      setPlans([
        {
          id: "1",
          name: "Free",
          monthlyPrice: "0",
          annualPrice: "0",
          features: "Basic features\n5 projects",
          stripePriceIdMonthly: "",
          stripePriceIdAnnual: "",
        },
        {
          id: "2",
          name: "Pro",
          monthlyPrice: "29",
          annualPrice: "290",
          features: "All features\nUnlimited projects\nPriority support",
          stripePriceIdMonthly: "",
          stripePriceIdAnnual: "",
        },
      ]);
    }
  }, [loading, getSetting]);

  const addPlan = () => {
    setPlans([
      ...plans,
      {
        id: Date.now().toString(),
        name: "",
        monthlyPrice: "0",
        annualPrice: "0",
        features: "",
        stripePriceIdMonthly: "",
        stripePriceIdAnnual: "",
      },
    ]);
  };

  const updatePlan = (
    id: string,
    field: keyof PricingPlan,
    value: string
  ) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const removePlan = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSave = async () => {
    updateSetting("plans", JSON.stringify(plans));
    await saveSettings();
  };

  if (loading) {
    return (
      <SetupLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-60" />
        </div>
      </SetupLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Pricing - Setup - MuseKit Admin</title>
      </Head>
      <SetupLayout>
        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <CreditCard className="h-6 w-6" /> Pricing
              </h1>
              <p className="text-muted-foreground text-sm">
                Configure pricing plans and Stripe integration.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={addPlan}>
                <Plus className="h-4 w-4 mr-1" /> Add Plan
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1 bg-muted rounded-md w-fit">
            <button
              onClick={() => setBillingToggle("monthly")}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                billingToggle === "monthly"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingToggle("annual")}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                billingToggle === "annual"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Annual
            </button>
          </div>

          <div className="grid gap-4">
            {plans.map((plan) => (
              <Card key={plan.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium">Plan Name</label>
                          <Input
                            value={plan.name}
                            onChange={(e) =>
                              updatePlan(plan.id, "name", e.target.value)
                            }
                            placeholder="Plan name"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            {billingToggle === "monthly"
                              ? "Monthly Price ($)"
                              : "Annual Price ($)"}
                          </label>
                          <Input
                            type="number"
                            value={
                              billingToggle === "monthly"
                                ? plan.monthlyPrice
                                : plan.annualPrice
                            }
                            onChange={(e) =>
                              updatePlan(
                                plan.id,
                                billingToggle === "monthly"
                                  ? "monthlyPrice"
                                  : "annualPrice",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Stripe Price ID
                          </label>
                          <Input
                            value={
                              billingToggle === "monthly"
                                ? plan.stripePriceIdMonthly
                                : plan.stripePriceIdAnnual
                            }
                            onChange={(e) =>
                              updatePlan(
                                plan.id,
                                billingToggle === "monthly"
                                  ? "stripePriceIdMonthly"
                                  : "stripePriceIdAnnual",
                                e.target.value
                              )
                            }
                            placeholder="price_..."
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Features (one per line)
                        </label>
                        <Textarea
                          value={plan.features}
                          onChange={(e) =>
                            updatePlan(plan.id, "features", e.target.value)
                          }
                          rows={3}
                          placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePlan(plan.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SetupLayout>
    </>
  );
}
