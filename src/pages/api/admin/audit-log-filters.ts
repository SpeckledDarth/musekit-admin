import type { NextApiRequest, NextApiResponse } from "next";
import { createSupabaseAdmin } from "@/lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = createSupabaseAdmin();

    const [actionData, resourceData] = await Promise.all([
      supabase.from("audit_logs").select("action").limit(1000),
      supabase.from("audit_logs").select("resource_type").limit(1000),
    ]);

    const actions = actionData.data
      ? Array.from(new Set(actionData.data.map((d: { action: string }) => d.action))).sort()
      : [];

    const resourceTypes = resourceData.data
      ? Array.from(
          new Set(
            resourceData.data.map(
              (d: { resource_type: string }) => d.resource_type
            )
          )
        ).sort()
      : [];

    res.status(200).json({ actions, resourceTypes });
  } catch (error) {
    console.error("Audit log filters API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
