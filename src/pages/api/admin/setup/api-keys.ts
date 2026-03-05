import type { NextApiRequest, NextApiResponse } from "next";
import { createSupabaseAdmin } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";

function maskValue(value: string): string {
  if (!value || value.length <= 8) return "****";
  return value.slice(0, 4) + "*".repeat(Math.min(value.length - 8, 20)) + value.slice(-4);
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
        .from("config_secrets")
        .select("*")
        .order("key_name", { ascending: true });
      if (error) throw error;

      const masked = (data || []).map((key: Record<string, unknown>) => ({
        ...key,
        encrypted_value: key.encrypted_value ? maskValue(key.encrypted_value as string) : "",
      }));

      res.status(200).json({ keys: masked });
    } else if (req.method === "POST") {
      const { id, value, label } = req.body;

      if (id) {
        const { error } = await supabase
          .from("config_secrets")
          .update({
            encrypted_value: value,
            updated_at: new Date().toISOString(),
            updated_by: admin.userId,
          })
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("config_secrets").insert({
          key_name: label,
          encrypted_value: value,
          updated_by: admin.userId,
        });
        if (error) throw error;
      }

      res.status(200).json({ success: true });
    } else if (req.method === "DELETE") {
      const { id } = req.body;
      const { error } = await supabase.from("config_secrets").delete().eq("id", id);
      if (error) throw error;
      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("API keys error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
