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
        .from("affiliate_testimonials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      res.status(200).json({ testimonials: data || [] });
    } else if (req.method === "POST") {
      const { id, ...fields } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Testimonial ID is required" });
      }

      const { error } = await supabase
        .from("affiliate_testimonials")
        .update(fields)
        .eq("id", id);
      if (error) throw error;
      res.status(200).json({ success: true });
    } else if (req.method === "PUT") {
      const { data, error } = await supabase
        .from("affiliate_testimonials")
        .insert(req.body)
        .select()
        .single();
      if (error) throw error;
      res.status(200).json({ testimonial: data });
    } else if (req.method === "DELETE") {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Testimonial ID is required" });
      }
      const { error } = await supabase
        .from("affiliate_testimonials")
        .delete()
        .eq("id", id);
      if (error) throw error;
      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Testimonials API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
