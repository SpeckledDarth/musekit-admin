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
        .from("email_templates")
        .select("*")
        .order("name");
      if (error) throw error;
      res.status(200).json({ templates: data || [] });
    } else if (req.method === "POST") {
      const { id, subject, body_html, body_text } = req.body;
      const { error } = await supabase
        .from("email_templates")
        .update({
          subject,
          body_html,
          body_text,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Email templates API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
