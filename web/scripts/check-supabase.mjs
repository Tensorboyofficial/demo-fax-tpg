#!/usr/bin/env node
// Sanity-check the Supabase connection and show whether tables exist.
// Run: `node scripts/check-supabase.mjs`  (after .env.local is populated)

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const envPath = resolve(process.cwd(), ".env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  );
  process.exit(1);
}

const s = createClient(url, key, { auth: { persistSession: false } });
console.log(`Probing ${url}...\n`);

const tables = ["user_faxes", "user_fax_events", "critical_ack", "patient_messages"];
let allOk = true;

for (const t of tables) {
  // Use a direct SELECT + limit(0) — this is the cheapest query that will
  // surface "table does not exist" errors. count/head:true returns {count: null,
  // error: null} for missing tables in some SDK versions, which is a false positive.
  const { error } = await s.from(t).select("id").limit(0);
  if (error) {
    console.log(`  ${t.padEnd(22)} ✗  ${error.message}`);
    allOk = false;
  } else {
    console.log(`  ${t.padEnd(22)} ✓  reachable`);
  }
}

console.log("");
if (!allOk) {
  console.log("Schema not applied yet. To fix:");
  console.log("  1. Open the Supabase dashboard → SQL Editor → New query");
  console.log(`     ${url.replace(".supabase.co", "")}.supabase.com/project/_/sql/new`);
  console.log("  2. Paste the contents of web/supabase/schema.sql");
  console.log("  3. Click Run");
  console.log("  4. Re-run this script to confirm.\n");
  process.exit(2);
}
console.log("All tables reachable. You're good to go.\n");
