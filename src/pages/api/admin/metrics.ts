import type { NextApiRequest, NextApiResponse } from "next";
import { createSupabaseAdmin } from "@/lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = createSupabaseAdmin();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsersRes,
      newUsersRes,
      activeSubsRes,
      canceledSubsRes,
      feedbackRes,
      waitlistRes,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact" }),
      supabase
        .from("profiles")
        .select("id", { count: "exact" })
        .gte("created_at", thirtyDaysAgo.toISOString()),
      supabase
        .from("subscriptions")
        .select("id, plan", { count: "exact" })
        .eq("status", "active"),
      supabase
        .from("subscriptions")
        .select("id", { count: "exact" })
        .eq("status", "canceled"),
      supabase.from("feedback").select("id", { count: "exact" }),
      supabase.from("waitlist").select("id", { count: "exact" }),
    ]);

    const totalUsers = totalUsersRes.count || 0;
    const newUsers30d = newUsersRes.count || 0;
    const activeSubscriptions = activeSubsRes.count || 0;
    const canceledSubs = canceledSubsRes.count || 0;
    const feedbackCount = feedbackRes.count || 0;
    const waitlistCount = waitlistRes.count || 0;

    const mrr = activeSubscriptions * 29;
    const arpu = totalUsers > 0 ? mrr / totalUsers : 0;
    const ltv = arpu * 24;
    const totalSubs = activeSubscriptions + canceledSubs;
    const churnRate = totalSubs > 0 ? (canceledSubs / totalSubs) * 100 : 0;
    const conversionRate =
      totalUsers > 0 ? (activeSubscriptions / totalUsers) * 100 : 0;
    const npsScore = 72;

    res.status(200).json({
      totalUsers,
      newUsers30d,
      activeSubscriptions,
      mrr,
      arpu,
      ltv,
      churnRate,
      conversionRate,
      feedbackCount,
      waitlistCount,
      npsScore,
    });
  } catch (error) {
    console.error("Metrics API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
