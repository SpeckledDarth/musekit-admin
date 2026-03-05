import type { NextApiRequest, NextApiResponse } from "next";
import { createSupabaseAdmin } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";

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
        .order("key");
      if (error) throw error;
      res.status(200).json({ settings: data || [] });
    } else if (req.method === "POST") {
      const { settings } = req.body;

      if (Array.isArray(settings)) {
        for (const s of settings) {
          const { error } = await supabase
            .from("settings")
            .upsert(
              { key: s.key, value: s.value },
              { onConflict: "key" }
            );
          if (error) throw error;
        }
      } else {
        const { key: settingKey, value } = req.body;
        const { error } = await supabase
          .from("settings")
          .upsert(
            { key: settingKey, value },
            { onConflict: "key" }
          );
        if (error) throw error;
      }

      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Settings API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
