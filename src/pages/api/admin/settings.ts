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
        .from("settings")
        .select("key, value")
        .like("key", "admin.%");
      if (error) throw error;

      const settings: Record<string, string> = {};
      if (data) {
        for (const row of data) {
          settings[row.key] = row.value;
        }
      }
      res.status(200).json({ settings });
    } else if (req.method === "PUT") {
      const { settings } = req.body as { settings: Record<string, string> };

      if (!settings || typeof settings !== "object") {
        return res.status(400).json({ error: "Invalid settings object" });
      }

      for (const [key, value] of Object.entries(settings)) {
        if (!key.startsWith("admin.")) continue;
        const { error } = await supabase
          .from("settings")
          .upsert({ key, value }, { onConflict: "key" });
        if (error) throw error;
      }

      await logAuditEvent(
        "settings.updated",
        admin.userId,
        { resource_type: "settings", after: settings },
        req.headers["x-forwarded-for"] as string || req.socket.remoteAddress
      );

      res.status(200).json({ success: true });
    } else if (req.method === "POST") {
      const { action, olderThanDays } = req.body;

      if (action === "purge_audit_logs") {
        const days = parseInt(olderThanDays, 10);
        if (isNaN(days) || days < 1) {
          return res.status(400).json({ error: "Invalid olderThanDays value" });
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const { error, count } = await supabase
          .from("audit_logs")
          .delete()
          .lt("created_at", cutoffDate.toISOString());
        if (error) throw error;

        await logAuditEvent(
          "audit_logs.purged",
          admin.userId,
          { resource_type: "audit_logs", olderThanDays: days, deletedCount: count },
          req.headers["x-forwarded-for"] as string || req.socket.remoteAddress
        );

        res.status(200).json({ success: true, deletedCount: count });
      } else if (action === "reset_settings") {
        const { error } = await supabase
          .from("settings")
          .delete()
          .like("key", "admin.%");
        if (error) throw error;

        await logAuditEvent(
          "settings.reset",
          admin.userId,
          { resource_type: "settings" },
          req.headers["x-forwarded-for"] as string || req.socket.remoteAddress
        );

        res.status(200).json({ success: true });
      } else if (action === "export_data") {
        const [profilesRes, auditRes, settingsRes] = await Promise.all([
          supabase.from("profiles").select("*"),
          supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(10000),
          supabase.from("settings").select("*"),
        ]);

        if (profilesRes.error) throw profilesRes.error;
        if (auditRes.error) throw auditRes.error;
        if (settingsRes.error) throw settingsRes.error;

        await logAuditEvent(
          "data.exported",
          admin.userId,
          { resource_type: "export" },
          req.headers["x-forwarded-for"] as string || req.socket.remoteAddress
        );

        res.status(200).json({
          exportedAt: new Date().toISOString(),
          profiles: profilesRes.data,
          audit_logs: auditRes.data,
          settings: settingsRes.data,
        });
      } else {
        res.status(400).json({ error: "Unknown action" });
      }
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Admin settings API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
