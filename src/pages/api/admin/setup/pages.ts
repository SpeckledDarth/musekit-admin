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

  try {
    const supabase = createSupabaseAdmin();

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("site_pages")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      res.status(200).json({ pages: data || [] });
    } else if (req.method === "POST") {
      const { title, slug, content, meta_title, meta_description, status } = req.body;
      if (!title || !slug) {
        return res.status(400).json({ error: "Title and slug are required" });
      }
      const { data, error } = await supabase
        .from("site_pages")
        .insert({ title, slug, content, meta_title, meta_description, status: status || "draft" })
        .select()
        .single();
      if (error) throw error;
      await logAuditEvent("page.created", admin.userId, {
        resource_type: "site_page",
        resource_id: data.id,
        after: { title, slug, status: status || "draft" },
      });
      res.status(200).json({ page: data });
    } else if (req.method === "PUT") {
      const { id, title, slug, content, meta_title, meta_description, status } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Page ID is required" });
      }
      const { data, error } = await supabase
        .from("site_pages")
        .update({ title, slug, content, meta_title, meta_description, status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await logAuditEvent("page.updated", admin.userId, {
        resource_type: "site_page",
        resource_id: id,
        after: { title, slug, status },
      });
      res.status(200).json({ page: data });
    } else if (req.method === "DELETE") {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Page ID is required" });
      }
      const { error } = await supabase
        .from("site_pages")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await logAuditEvent("page.deleted", admin.userId, {
        resource_type: "site_page",
        resource_id: id,
      });
      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Pages API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
