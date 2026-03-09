import { createBrowserClient, createAdminClient } from "@musekit/database";
import { createClient } from "@supabase/supabase-js";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (browserClient) return browserClient;
  try {
    browserClient = createBrowserClient();
    return browserClient;
  } catch {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    if (!url || !key) {
      console.error("Missing Supabase environment variables for admin client");
    }
    return createClient(url, key);
  }
}

export const supabase = getSupabaseClient();

export function createSupabaseAdmin() {
  try {
    return createAdminClient();
  } catch (error) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not available");
  }
}

export const supabaseAdmin =
  typeof window === "undefined" ? createSupabaseAdmin() : null;

export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error("supabaseAdmin is only available on the server");
  }
  return supabaseAdmin;
}
