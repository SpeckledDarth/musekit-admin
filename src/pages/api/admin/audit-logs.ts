import type { NextApiRequest, NextApiResponse } from "next";
import { createSupabaseAdmin } from "@/lib/supabase";

const PAGE_SIZE = 25;

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
      action = "all",
      resource = "all",
      dateFrom = "",
      dateTo = "",
      page = "0",
    } = req.query;

    const pageNum = parseInt(page as string, 10);

    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" });

    if (search) {
      query = query.or(
        `action.ilike.%${search}%,resource_type.ilike.%${search}%`
      );
    }
    if (action !== "all") {
      query = query.eq("action", action as string);
    }
    if (resource !== "all") {
      query = query.eq("resource_type", resource as string);
    }
    if (dateFrom) {
      query = query.gte(
        "created_at",
        new Date(dateFrom as string).toISOString()
      );
    }
    if (dateTo) {
      const toDate = new Date(dateTo as string);
      toDate.setDate(toDate.getDate() + 1);
      query = query.lt("created_at", toDate.toISOString());
    }

    query = query
      .order("created_at", { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    res.status(200).json({ logs: data || [], totalCount: count || 0 });
  } catch (error) {
    console.error("Audit logs API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
