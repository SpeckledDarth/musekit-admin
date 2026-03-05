import type { NextApiRequest, NextApiResponse } from "next";
import { createSupabaseAdmin } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";
import { logAuditEvent } from "@/lib/audit-log";
import crypto from "crypto";

const PAGE_SIZE = 25;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await verifyAdmin(req, res);
  if (!admin) return;

  if (req.method === "GET") {
    try {
      const supabase = createSupabaseAdmin();
      const {
        search = "",
        role = "all",
        status = "all",
        page = "0",
      } = req.query;

      const pageNum = parseInt(page as string, 10);

      let query = supabase.from("profiles").select("*", { count: "exact" });

      if (search) {
        query = query.or(
          `full_name.ilike.%${search}%,email.ilike.%${search}%`
        );
      }
      if (role !== "all") {
        query = query.eq("role", role as string);
      }
      if (status !== "all") {
        query = query.eq("status", status as string);
      }

      query = query
        .order("created_at", { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      const { data, count, error } = await query;

      if (error) throw error;

      res.status(200).json({ users: data || [], totalCount: count || 0 });
    } catch (error) {
      console.error("Users API error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else if (req.method === "POST") {
    try {
      const supabase = createSupabaseAdmin();
      const { action } = req.body;

      if (action === "invite") {
        const { email, role } = req.body;
        if (!email || !role) {
          return res.status(400).json({ error: "Email and role are required" });
        }

        const token = crypto.randomUUID();
        const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const { error } = await supabase.from("invitations").insert({
          email,
          role,
          token,
          expires_at,
          status: "pending",
          invited_by: admin.userId,
        });

        if (error) throw error;

        await logAuditEvent("user.invite", admin.userId, {
          resource_type: "invitation",
          after: { email, role },
        });

        return res.status(200).json({ success: true, message: "Invitation sent" });
      }

      if (action === "bulk_suspend") {
        const { userIds } = req.body;
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
          return res.status(400).json({ error: "userIds array is required" });
        }

        const { error } = await supabase
          .from("profiles")
          .update({ status: "suspended" })
          .in("id", userIds);

        if (error) throw error;

        for (const userId of userIds) {
          await logAuditEvent("user.suspend", admin.userId, {
            resource_type: "profile",
            resource_id: userId,
            after: { status: "suspended" },
          });
        }

        return res.status(200).json({ success: true, message: `${userIds.length} user(s) suspended` });
      }

      if (action === "bulk_delete") {
        const { userIds } = req.body;
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
          return res.status(400).json({ error: "userIds array is required" });
        }

        const { error } = await supabase
          .from("profiles")
          .delete()
          .in("id", userIds);

        if (error) throw error;

        for (const userId of userIds) {
          await logAuditEvent("user.delete", admin.userId, {
            resource_type: "profile",
            resource_id: userId,
          });
        }

        return res.status(200).json({ success: true, message: `${userIds.length} user(s) deleted` });
      }

      return res.status(400).json({ error: "Invalid action" });
    } catch (error) {
      console.error("Users POST API error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
