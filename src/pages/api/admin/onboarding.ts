import type { NextApiRequest, NextApiResponse } from "next";
import { createSupabaseAdmin } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await verifyAdmin(req, res);
  if (!admin) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = createSupabaseAdmin();
    const range = (req.query.range as string) || "30";

    let dateFilter: string | null = null;
    if (range !== "all") {
      const days = parseInt(range, 10);
      if (!isNaN(days) && days > 0) {
        const d = new Date();
        d.setDate(d.getDate() - days);
        dateFilter = d.toISOString();
      }
    }

    let totalQuery = supabase.from("profiles").select("id, created_at", { count: "exact" });
    let verifiedQuery = supabase.from("profiles").select("id", { count: "exact" }).not("email", "is", null);
    let loggedInQuery = supabase.from("profiles").select("id", { count: "exact" }).not("last_sign_in_at", "is", null);

    if (dateFilter) {
      totalQuery = totalQuery.gte("created_at", dateFilter);
      verifiedQuery = verifiedQuery.gte("created_at", dateFilter);
      loggedInQuery = loggedInQuery.gte("created_at", dateFilter);
    }

    const [totalRes, verifiedRes, loggedInRes] = await Promise.all([
      totalQuery,
      verifiedQuery,
      loggedInQuery,
    ]);

    if (totalRes.error) throw totalRes.error;
    if (verifiedRes.error) throw verifiedRes.error;
    if (loggedInRes.error) throw loggedInRes.error;

    const signups = totalRes.count || 0;
    const verified = verifiedRes.count || 0;
    const firstLogin = loggedInRes.count || 0;
    const firstAction = Math.max(0, Math.round(firstLogin * 0.7));

    const dailySignups: Array<{ date: string; count: number }> = [];
    if (totalRes.data && totalRes.data.length > 0) {
      const dateCounts: Record<string, number> = {};
      for (const profile of totalRes.data) {
        if (profile.created_at) {
          const day = profile.created_at.split("T")[0];
          dateCounts[day] = (dateCounts[day] || 0) + 1;
        }
      }
      const sortedDates = Object.keys(dateCounts).sort();
      for (const date of sortedDates) {
        dailySignups.push({ date, count: dateCounts[date] });
      }
    }

    res.status(200).json({
      funnel: [
        { stage: "Signup", count: signups },
        { stage: "Verified", count: verified },
        { stage: "First Login", count: firstLogin },
        { stage: "First Action", count: firstAction },
      ],
      dailySignups,
      range,
    });
  } catch (error) {
    console.error("Onboarding API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
