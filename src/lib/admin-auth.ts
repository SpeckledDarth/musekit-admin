import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function verifyAdmin(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{ userId: string; email: string; role: string } | null> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    const cookieHeader = req.headers.cookie || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const sbAccessToken = extractCookieValue(
      cookieHeader,
      "sb-access-token"
    );

    if (!sbAccessToken) {
      res.status(401).json({ error: "Unauthorized" });
      return null;
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(sbAccessToken);

    if (error || !user) {
      res.status(401).json({ error: "Unauthorized" });
      return null;
    }

    const { createSupabaseAdmin } = await import("@/lib/supabase");
    const adminClient = createSupabaseAdmin();
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role, email")
      .eq("id", user.id)
      .single();

    if (
      !profile ||
      (profile.role !== "admin" && profile.role !== "super_admin")
    ) {
      res.status(403).json({ error: "Forbidden: Admin access required" });
      return null;
    }

    return { userId: user.id, email: profile.email, role: profile.role };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  const { createSupabaseAdmin } = await import("@/lib/supabase");
  const adminClient = createSupabaseAdmin();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    (profile.role !== "admin" && profile.role !== "super_admin")
  ) {
    res.status(403).json({ error: "Forbidden: Admin access required" });
    return null;
  }

  return { userId: user.id, email: profile.email, role: profile.role };
}

function extractCookieValue(
  cookieHeader: string,
  name: string
): string | null {
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}
