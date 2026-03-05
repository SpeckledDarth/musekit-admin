import type { NextApiRequest, NextApiResponse } from "next";
import { createSupabaseAdmin } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";
import { logAuditEvent } from "@/lib/audit-log";

interface ToggleData {
  name: string;
  category: string;
  enabled: boolean;
  description: string;
}

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
        .select("*")
        .like("key", "feature.%")
        .order("key");
      if (error) throw error;

      const toggles = (data || []).map((row: { key: string; value: string }) => {
        const key = row.key.replace("feature.", "");
        let parsed: ToggleData;
        try {
          parsed = JSON.parse(row.value);
        } catch {
          parsed = { name: key, category: "general", enabled: row.value === "true", description: "" };
        }
        return {
          id: row.key,
          key,
          name: parsed.name || key,
          category: parsed.category || "general",
          enabled: parsed.enabled ?? false,
          description: parsed.description || "",
          updated_at: new Date().toISOString(),
        };
      });

      res.status(200).json({ toggles });
    } else if (req.method === "POST") {
      const { id, enabled } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Toggle ID is required" });
      }

      const { data: existing } = await supabase
        .from("settings")
        .select("value")
        .eq("key", id)
        .single();

      let parsed: ToggleData = { name: "", category: "general", enabled: false, description: "" };
      if (existing?.value) {
        try {
          parsed = JSON.parse(existing.value);
        } catch {
          parsed = { name: id.replace("feature.", ""), category: "general", enabled: false, description: "" };
        }
      }
      const previousEnabled = parsed.enabled;
      parsed.enabled = enabled;

      const { error } = await supabase
        .from("settings")
        .upsert({ key: id, value: JSON.stringify(parsed) }, { onConflict: "key" });
      if (error) throw error;

      await logAuditEvent("feature_toggle.toggle", admin.userId, {
        resource_type: "feature_toggle",
        resource_id: id,
        before: { enabled: previousEnabled },
        after: { enabled },
      });

      res.status(200).json({ success: true });
    } else if (req.method === "PUT") {
      const { name, key, category, enabled, description } = req.body;
      if (!key) {
        return res.status(400).json({ error: "Toggle key is required" });
      }

      const settingKey = `feature.${key}`;
      const toggleData: ToggleData = {
        name: name || key,
        category: category || "general",
        enabled: enabled ?? false,
        description: description || "",
      };

      const { error } = await supabase
        .from("settings")
        .upsert({ key: settingKey, value: JSON.stringify(toggleData) }, { onConflict: "key" });
      if (error) throw error;

      await logAuditEvent("feature_toggle.create", admin.userId, {
        resource_type: "feature_toggle",
        resource_id: settingKey,
        after: toggleData,
      });

      res.status(200).json({
        toggle: {
          id: settingKey,
          key,
          ...toggleData,
          updated_at: new Date().toISOString(),
        },
      });
    } else if (req.method === "PATCH") {
      const { key, name, category, description } = req.body;
      if (!key) {
        return res.status(400).json({ error: "Toggle key is required" });
      }

      const settingKey = `feature.${key}`;
      const { data: existing } = await supabase
        .from("settings")
        .select("value")
        .eq("key", settingKey)
        .single();

      if (!existing) {
        return res.status(404).json({ error: "Toggle not found" });
      }

      let parsed: ToggleData = { name: key, category: "general", enabled: false, description: "" };
      try {
        parsed = JSON.parse(existing.value);
      } catch {
        // keep defaults
      }

      const before = { ...parsed };
      parsed.name = name ?? parsed.name;
      parsed.category = category ?? parsed.category;
      parsed.description = description ?? parsed.description;

      const { error } = await supabase
        .from("settings")
        .update({ value: JSON.stringify(parsed) })
        .eq("key", settingKey);
      if (error) throw error;

      await logAuditEvent("feature_toggle.edit", admin.userId, {
        resource_type: "feature_toggle",
        resource_id: settingKey,
        before,
        after: parsed,
      });

      res.status(200).json({
        toggle: {
          id: settingKey,
          key,
          name: parsed.name,
          category: parsed.category,
          enabled: parsed.enabled,
          description: parsed.description,
          updated_at: new Date().toISOString(),
        },
      });
    } else if (req.method === "DELETE") {
      const { key } = req.body;
      if (!key) {
        return res.status(400).json({ error: "Toggle key is required" });
      }

      const settingKey = `feature.${key}`;
      const { error } = await supabase
        .from("settings")
        .delete()
        .eq("key", settingKey);
      if (error) throw error;

      await logAuditEvent("feature_toggle.delete", admin.userId, {
        resource_type: "feature_toggle",
        resource_id: settingKey,
      });

      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Feature toggles API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
