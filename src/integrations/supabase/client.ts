import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const url =
  (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) ||
  "https://imtujarnhlrcjenhtlge.supabase.co";

const key =
  (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined) ||
  "sb_publishable_ibY0gbzurGZpnluYtLoZrA_072vqUrt";

function createSupabaseClient() {
  return createClient<Database>(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

let client: ReturnType<typeof createSupabaseClient> | undefined;

export const supabase = new Proxy(
  {} as ReturnType<typeof createSupabaseClient>,
  {
    get(_, prop, receiver) {
      client ??= createSupabaseClient();
      return Reflect.get(client, prop, receiver);
    },
  },
);
