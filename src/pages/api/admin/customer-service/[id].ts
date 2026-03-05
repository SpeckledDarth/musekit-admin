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

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Ticket ID is required" });
  }

  const supabase = createSupabaseAdmin();

  if (req.method === "GET") {
    try {
      const [ticketRes, commentsRes] = await Promise.all([
        supabase.from("tickets").select("*").eq("id", id).single(),
        supabase
          .from("ticket_comments")
          .select("*")
          .eq("ticket_id", id)
          .order("created_at", { ascending: true }),
      ]);

      if (ticketRes.error || !ticketRes.data) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      return res.status(200).json({
        ticket: ticketRes.data,
        comments: commentsRes.data || [],
      });
    } catch (error) {
      console.error("Ticket detail GET error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else if (req.method === "PUT") {
    try {
      const { status, priority, assigned_to } = req.body;
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (status) {
        updateData.status = status;
        if (status === "resolved") {
          updateData.resolved_at = new Date().toISOString();
        } else if (status === "closed") {
          updateData.closed_at = new Date().toISOString();
        } else if (status === "open") {
          updateData.resolved_at = null;
          updateData.closed_at = null;
        }
      }

      if (priority) {
        updateData.priority = priority;
      }

      if (assigned_to !== undefined) {
        updateData.assigned_to = assigned_to;
      }

      const { data, error } = await supabase
        .from("tickets")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      await logAuditEvent("ticket.updated", admin.userId, {
        resource_type: "ticket",
        resource_id: id,
        after: updateData,
      });

      return res.status(200).json({ ticket: data });
    } catch (error) {
      console.error("Ticket detail PUT error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else if (req.method === "POST") {
    try {
      const { action, body, is_internal } = req.body;

      if (action === "add_comment") {
        if (!body) {
          return res.status(400).json({ error: "Comment body is required" });
        }

        const { data, error } = await supabase
          .from("ticket_comments")
          .insert({
            ticket_id: id,
            user_id: admin.userId,
            body,
            is_internal: is_internal || false,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        await supabase
          .from("tickets")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", id);

        await logAuditEvent("ticket.comment_added", admin.userId, {
          resource_type: "ticket",
          resource_id: id,
          after: { comment_id: data.id, is_internal },
        });

        return res.status(200).json({ comment: data });
      }

      return res.status(400).json({ error: "Unknown action" });
    } catch (error) {
      console.error("Ticket detail POST error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else if (req.method === "DELETE") {
    try {
      const { error } = await supabase.from("tickets").delete().eq("id", id);

      if (error) throw error;

      await logAuditEvent("ticket.deleted", admin.userId, {
        resource_type: "ticket",
        resource_id: id,
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Ticket detail DELETE error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
