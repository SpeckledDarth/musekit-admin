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
        .from("feature_toggles")
        .select("*")
        .order("category", { ascending: true });
      if (error) throw error;
      res.status(200).json({ toggles: data || [] });
    } else if (req.method === "POST") {
      const { id, enabled } = req.body;
      const { error } = await supabase
        .from("feature_toggles")
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      res.status(200).json({ success: true });
    } else if (req.method === "PUT") {
      const { name, key, category, enabled, description } = req.body;
      const { data, error } = await supabase
        .from("feature_toggles")
        .insert({
          name,
          key,
          category: category || "general",
          enabled: enabled ?? false,
          description: description || "",
        })
        .select()
        .single();
      if (error) throw error;
      res.status(200).json({ toggle: data });
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Feature toggles API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
