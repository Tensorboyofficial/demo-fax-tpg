import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Env-only config so projects can be swapped via Vercel envs without code changes.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null = null;
let warned = false;

/**
 * Returns a Supabase client, or null if env is unconfigured. Callers must
 * handle the null case and fall back to in-memory seed data — this keeps the
 * demo resilient if the DB is unreachable.
 */
export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  if (!url || !key) {
    if (!warned && typeof console !== "undefined") {
      warned = true;
      console.warn(
        "[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY not set — falling back to in-memory data.",
      );
    }
    return null;
  }
  client = createClient(url, key, {
    auth: { persistSession: false },
  });
  return client;
}

export const SUPABASE_CONFIGURED = Boolean(url && key);
