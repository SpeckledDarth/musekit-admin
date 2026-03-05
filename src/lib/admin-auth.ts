import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function verifyAdmin(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{ userId: string; email: string; role: string } | null> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  let user: { id: string; email?: string } | null = null;

  if (token) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ error: "Unauthorized" });
      return null;
    }
    user = data.user;
  } else {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          const cookieHeader = req.headers.cookie || "";
          return cookieHeader
            .split(";")
            .filter((c) => c.trim())
            .map((c) => {
              const [name, ...rest] = c.trim().split("=");
              return { name, value: rest.join("=") };
            });
        },
        setAll() {},
      },
    });

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      res.status(401).json({ error: "Unauthorized" });
      return null;
    }
    user = data.user;
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
