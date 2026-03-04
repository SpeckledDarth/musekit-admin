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

    const [usersRes, subsRes, activityRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact" }),
      supabase
        .from("subscriptions")
        .select("id, plan", { count: "exact" })
        .eq("status", "active"),
      supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const totalUsers = usersRes.count || 0;
    const activeSubscriptions = subsRes.count || 0;
    const mrr = activeSubscriptions * 29;

    res.status(200).json({
      totalUsers,
      activeSubscriptions,
      mrr,
      recentActivity: activityRes.data || [],
    });
  } catch (error) {
    console.error("Overview API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
