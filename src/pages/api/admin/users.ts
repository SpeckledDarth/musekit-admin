import type { NextApiRequest, NextApiResponse } from "next";
import { createSupabaseAdmin } from "@/lib/supabase";

const PAGE_SIZE = 20;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
}
