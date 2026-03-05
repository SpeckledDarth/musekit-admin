import type { NextApiRequest, NextApiResponse } from "next";
import { createSupabaseAdmin } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";
import { logAuditEvent } from "@/lib/audit-log";

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
      const supabase = createSupabaseAdmin();
      const { action } = req.body;

      if (action === "update_ticket") {
        const { id, status, admin_response } = req.body;
        if (!id) {
          return res.status(400).json({ error: "Ticket ID is required" });
        }

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

        await logAuditEvent("ticket_updated", admin.userId, {
          resource_type: "ticket",
          resource_id: id,
          after: { status },
        });

        return res.status(200).json({ ticket: data });
      }

      if (action === "create_ticket") {
        const { subject, description, priority, user_email } = req.body;
        if (!subject || !description) {
          return res.status(400).json({ error: "Subject and description are required" });
        }

        const now = new Date().toISOString();
        const insertData: Record<string, unknown> = {
          subject,
          description,
          priority: priority || "medium",
          status: "open",
          created_at: now,
          updated_at: now,
        };
        if (user_email) insertData.user_email = user_email;

        const { data, error } = await supabase
          .from("tickets")
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;

        await logAuditEvent("ticket_created", admin.userId, {
          resource_type: "ticket",
          resource_id: data.id,
          after: { subject, priority: priority || "medium" },
        });

        return res.status(200).json({ ticket: data });
      }

      if (action === "bulk_close") {
        const { ticketIds } = req.body;
        if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
          return res.status(400).json({ error: "ticketIds array is required" });
        }

        const now = new Date().toISOString();
        const { error } = await supabase
          .from("tickets")
          .update({ status: "closed", closed_at: now, updated_at: now })
          .in("id", ticketIds);

        if (error) throw error;

        await logAuditEvent("tickets_bulk_closed", admin.userId, {
          resource_type: "ticket",
          after: { ticketIds, count: ticketIds.length },
        });

        return res.status(200).json({ success: true });
      }

      if (action === "bulk_assign") {
        const { ticketIds, assignTo } = req.body;
        if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
          return res.status(400).json({ error: "ticketIds array is required" });
        }

        const now = new Date().toISOString();
        const { error } = await supabase
          .from("tickets")
          .update({ assigned_to: assignTo || admin.userId, updated_at: now })
          .in("id", ticketIds);

        if (error) throw error;

        const actualAssignee = assignTo || admin.userId;
        await logAuditEvent("tickets_bulk_assigned", admin.userId, {
          resource_type: "ticket",
          after: { ticketIds, assignTo: actualAssignee, count: ticketIds.length },
        });

        return res.status(200).json({ success: true, assignedTo: actualAssignee });
      }

      if (action === "bulk_priority") {
        const { ticketIds, priority } = req.body;
        if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0 || !priority) {
          return res.status(400).json({ error: "ticketIds and priority are required" });
        }

        const now = new Date().toISOString();
        const { error } = await supabase
          .from("tickets")
          .update({ priority, updated_at: now })
          .in("id", ticketIds);

        if (error) throw error;

        await logAuditEvent("tickets_bulk_priority_changed", admin.userId, {
          resource_type: "ticket",
          after: { ticketIds, priority, count: ticketIds.length },
        });

        return res.status(200).json({ success: true });
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
