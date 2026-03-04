import type { NextApiRequest, NextApiResponse } from "next";
import { createSupabaseAdmin } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "User ID required" });
  }

  try {
    const supabase = createSupabaseAdmin();

    if (req.method === "GET") {
      const profileRes = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      const profile = profileRes.data;

      const [subRes, activityRes, teamRes, notesRes] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", id)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("audit_logs")
          .select("*")
          .eq("user_id", id)
          .order("created_at", { ascending: false })
          .limit(20),
        profile?.organization_id
          ? supabase
              .from("team_members")
              .select("*")
              .eq("organization_id", profile.organization_id)
              .limit(50)
          : Promise.resolve({ data: [] }),
        supabase
          .from("audit_logs")
          .select("*")
          .eq("resource_type", "admin_note")
          .eq("resource_id", id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      res.status(200).json({
        profile,
        subscription:
          subRes.data && subRes.data.length > 0 ? subRes.data[0] : null,
        activity: activityRes.data || [],
        teamMembers: teamRes.data || [],
        notes: (notesRes.data || []).map(
          (log: Record<string, unknown>) => ({
            id: log.id,
            user_id: id,
            admin_id: log.user_id || "",
            note:
              (log.metadata as Record<string, string>)?.note || log.action,
            created_at: log.created_at,
          })
        ),
      });
    } else if (req.method === "POST") {
      const admin = await verifyAdmin(req, res);
      if (!admin) return;

      const { action, note } = req.body;

      if (action === "add_note") {
        await supabase.from("audit_logs").insert({
          user_id: admin.userId,
          action: "admin_note_added",
          resource_type: "admin_note",
          resource_id: id,
          metadata: { note },
        });
        res.status(200).json({ success: true });
      } else if (action === "impersonate") {
        await supabase.from("audit_logs").insert({
          user_id: admin.userId,
          action: "user_impersonation_started",
          resource_type: "user",
          resource_id: id,
          metadata: {
            admin_id: admin.userId,
            admin_email: admin.email,
            target_user_id: id,
            session_duration_minutes: 30,
          },
        });
        res.status(200).json({ success: true });
      } else {
        res.status(400).json({ error: "Unknown action" });
      }
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("User detail API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
