import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null = null;
let warned = false;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  if (!url || !key) {
    if (!warned && typeof console !== "undefined") {
      warned = true;
      console.warn("[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY not set — falling back to in-memory data.");
    }
    return null;
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export const SUPABASE_CONFIGURED = Boolean(url && key);
