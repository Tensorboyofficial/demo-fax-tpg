import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let client: SupabaseClient | null = null;
let warned = false;

/** Returns a Supabase client using the service role key (bypasses RLS) if available, else anon key. */
export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  const key = serviceKey || anonKey;
  if (!url || !key) {
    if (!warned && typeof console !== "undefined") {
      warned = true;
      console.warn("[supabase] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — falling back to in-memory data.");
    }
    return null;
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export const SUPABASE_CONFIGURED = Boolean(url && (serviceKey || anonKey));
