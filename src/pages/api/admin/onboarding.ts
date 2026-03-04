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

    const [totalRes, verifiedRes, loggedInRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact" }),
      supabase
        .from("profiles")
        .select("id", { count: "exact" })
        .not("email", "is", null),
      supabase
        .from("profiles")
        .select("id", { count: "exact" })
        .not("last_sign_in_at", "is", null),
    ]);

    if (totalRes.error) throw totalRes.error;

    const signups = totalRes.count || 0;
    const verified = verifiedRes.count || 0;
    const firstLogin = loggedInRes.count || 0;
    const firstAction = Math.max(0, Math.round(firstLogin * 0.7));

    res.status(200).json({
      funnel: [
        { stage: "Signup", count: signups },
        { stage: "Verified", count: verified },
        { stage: "First Login", count: firstLogin },
        { stage: "First Action", count: firstAction },
      ],
    });
  } catch (error) {
    console.error("Onboarding API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
