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
    const { userId } = req.query;

    if (userId) {
      const [profileRes, subsRes, notesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", userId as string)
          .single(),
        supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId as string)
          .order("created_at", { ascending: false }),
        supabase
          .from("audit_logs")
          .select("*")
          .eq("resource_type", "admin_note")
          .eq("resource_id", userId as string)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (profileRes.error) throw profileRes.error;

      res.status(200).json({
        profile: profileRes.data,
        subscriptions: subsRes.data || [],
        notes: (notesRes.data || []).map(
          (log: Record<string, unknown>) => ({
            id: log.id,
            note:
              (log.metadata as Record<string, string>)?.note || log.action,
            created_at: log.created_at,
          })
        ),
      });
    } else {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      res.status(200).json({ users: data || [] });
    }
  } catch (error) {
    console.error("Customer service API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
