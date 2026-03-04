import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getSupabaseClient() {
  return supabase;
}

export function createSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not available");
  }
  return createClient(supabaseUrl, serviceKey);
}

export const supabaseAdmin =
  typeof window === "undefined" ? createSupabaseAdmin() : null;

export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error("supabaseAdmin is only available on the server");
  }
  return supabaseAdmin;
}
