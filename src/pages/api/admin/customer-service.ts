import type { NextApiRequest, NextApiResponse } from "next";
import { createSupabaseAdmin } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await verifyAdmin(req, res);
  if (!admin) return;

  if (req.method === "GET") {
    try {
      const supabase = createSupabaseAdmin();
      const { userId, type } = req.query;

      if (type === "tickets") {
        const { data, error } = await supabase
          .from("tickets")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return res.status(200).json({ tickets: data || [] });
      }

      if (userId) {
        const [profileRes, subsRes, notesRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("id", userId as string)
            .single(),
          supabase
            .from("muse_product_subscriptions")
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
  } else if (req.method === "POST") {
    try {
      const { action, id, status, admin_response } = req.body;

      if (action === "update_ticket") {
        if (!id) {
          return res.status(400).json({ error: "Ticket ID is required" });
        }

        const supabase = createSupabaseAdmin();
        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        if (status) {
          updateData.status = status;
          if (status === "resolved") {
            updateData.resolved_at = new Date().toISOString();
          }
          if (status === "closed") {
            updateData.closed_at = new Date().toISOString();
          }
        }

        const { data, error } = await supabase
          .from("tickets")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        if (admin_response) {
          await supabase.from("ticket_comments").insert({
            ticket_id: id,
            user_id: admin.userId,
            body: admin_response,
            is_internal: true,
            created_at: new Date().toISOString(),
          });
        }

        return res.status(200).json({ ticket: data });
      }

      return res.status(400).json({ error: "Unknown action" });
    } catch (error) {
      console.error("Customer service POST error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
