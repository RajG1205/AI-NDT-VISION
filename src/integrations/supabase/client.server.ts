import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export function createServerSupabaseClient(accessToken?: string) {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) throw new Error("Missing server Supabase configuration.");
  return createClient<Database>(
    url,
    key,
    accessToken ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } } : undefined,
  );
}
