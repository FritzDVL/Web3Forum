/**
 * Verify Supabase tables exist and have data.
 * Run: npx tsx scripts/verify-supabase.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Parse .env.local manually
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
}

const url = envVars.SUPABASE_URL;
const key = envVars.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

async function checkTable(name: string) {
  const { data, error, count } = await supabase.from(name).select("*", { count: "exact", head: true });
  if (error) {
    console.log(`  ❌ ${name} — ${error.message}`);
    return false;
  }
  console.log(`  ✅ ${name} — ${count} rows`);
  return true;
}

async function main() {
  console.log(`\n🔍 Supabase: ${url}\n`);
  console.log("── Tables ──");

  const tables = [
    "forum_boards",
    "forum_threads",
    "forum_replies",
    "research_categories",
    "research_publications",
    "communities",
    "community_threads",
  ];

  let allOk = true;
  for (const t of tables) {
    const ok = await checkTable(t);
    if (!ok) allOk = false;
  }

  // Check if forum_boards has seed data
  console.log("\n── Seed Data ──");
  const { data: boards } = await supabase.from("forum_boards").select("slug, name, section").limit(5);
  if (boards && boards.length > 0) {
    console.log(`  ✅ forum_boards has seed data. First 5:`);
    boards.forEach((b: any) => console.log(`     ${b.section}/${b.slug} — ${b.name}`));
  } else {
    console.log("  ❌ forum_boards is empty — run fresh-schema.sql");
    allOk = false;
  }

  const { data: cats } = await supabase.from("research_categories").select("slug, name").limit(5);
  if (cats && cats.length > 0) {
    console.log(`  ✅ research_categories has seed data. ${cats.length} categories.`);
  } else {
    console.log("  ❌ research_categories is empty — run fresh-schema.sql");
    allOk = false;
  }

  // Check for any forum_threads
  const { count: threadCount } = await supabase.from("forum_threads").select("*", { count: "exact", head: true });
  console.log(`\n── Forum Threads: ${threadCount || 0} ──`);

  console.log(allOk ? "\n✅ All tables verified." : "\n⚠️ Some tables missing or empty.");
}

main().catch(console.error);
