/**
 * Supabase Project Validation Script
 *
 * Purpose: Verify Supabase project accessibility, database structure, CRUD operations,
 * and RLS. Does NOT modify keys, auth, billing, or production data.
 *
 * Usage: npx ts-node scripts/validate-supabase.ts
 * Requires: .env with SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 */

import "dotenv/config";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Expected tables from Admin_Dispatch-main migrations
const EXPECTED_TABLES = [
  "couriers",
  "shippers",
  "loads",
  "load_documents",
  "load_history",
  "courier_documents",
  "courier_history",
  "shipper_documents",
  "shipper_history",
  "tickets",
  "ticket_comments",
  "leads",
  "contracts",
  "trips",
  "trip_events",
  "vehicles",
  "vehicle_access",
  "invoices",
  "profiles",
  "notification_log",
];

interface ValidationResult {
  step: string;
  status: "pass" | "fail";
  message: string;
  details?: unknown;
}

const results: ValidationResult[] = [];

function log(step: string, status: "pass" | "fail", message: string, details?: unknown) {
  results.push({ step, status, message, details });
  const icon = status === "pass" ? "[PASS]" : "[FAIL]";
  console.log(`${icon} ${step}: ${message}`);
  if (details) console.log("    ", JSON.stringify(details, null, 2).split("\n").join("\n     "));
}

async function main() {
  console.log("\n=== Supabase Project Validation ===\n");

  // 1. Credentials check
  if (!url || !anonKey || !serviceRoleKey) {
    log("Credentials", "fail", "Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY in .env");
    printSummary();
    process.exit(1);
  }
  log("Credentials", "pass", "All required env vars present");
  log("Project URL", "pass", url);

  // 2. API connectivity - anon key
  const supabaseAnon = createClient(url, anonKey);
  try {
    const { data, error } = await supabaseAnon.from("shippers").select("id").limit(1);
    if (error) throw error;
    log("API (anon key)", "pass", "Anon key works", { rowCount: data?.length ?? 0 });
  } catch (e: unknown) {
    const err = e as { message?: string };
    log("API (anon key)", "fail", err?.message ?? String(e));
  }

  // 3. API connectivity - service role key
  const supabaseAdmin = createClient(url, serviceRoleKey);
  try {
    const { data, error } = await supabaseAdmin.from("shippers").select("id").limit(1);
    if (error) throw error;
    log("API (service role)", "pass", "Service role key works", { rowCount: data?.length ?? 0 });
  } catch (e: unknown) {
    const err = e as { message?: string };
    log("API (service role)", "fail", err?.message ?? String(e));
  }

  // 4. Database structure - check each expected table
  const missingTables: string[] = [];
  const existingTables: string[] = [];

  for (const table of EXPECTED_TABLES) {
    try {
      const { error } = await supabaseAdmin.from(table).select("*").limit(0);
      if (error) {
        if (error.message?.includes("relation") || error.code === "42P01") {
          missingTables.push(table);
        } else {
          log(`Table: ${table}`, "fail", error.message);
        }
      } else {
        existingTables.push(table);
      }
    } catch (e: unknown) {
      missingTables.push(table);
    }
  }

  if (missingTables.length > 0) {
    log("Database structure", "fail", `Missing tables: ${missingTables.join(", ")}`, { missing: missingTables });
  } else {
    log("Database structure", "pass", `All ${EXPECTED_TABLES.length} expected tables exist`);
  }

  // 5. CRUD test on shippers (temporary test row)
  const testId = crypto.randomUUID();
  const testName = `_validation_test_${Date.now()}`;

  try {
    // INSERT
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("shippers")
      .insert({ id: testId, name: testName })
      .select("id, name")
      .single();

    if (insertErr) throw insertErr;
    log("CRUD: INSERT", "pass", "Insert succeeded", inserted);

    // SELECT
    const { data: selected, error: selectErr } = await supabaseAdmin
      .from("shippers")
      .select("id, name, status, compliance")
      .eq("id", testId)
      .single();

    if (selectErr) throw selectErr;
    log("CRUD: SELECT", "pass", "Select succeeded", selected);

    // UPDATE
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from("shippers")
      .update({ name: `${testName}_updated` })
      .eq("id", testId)
      .select("id, name")
      .single();

    if (updateErr) throw updateErr;
    log("CRUD: UPDATE", "pass", "Update succeeded", updated);

    // DELETE (hard delete for test row - we use a test ID so no production data)
    const { error: deleteErr } = await supabaseAdmin.from("shippers").delete().eq("id", testId);

    if (deleteErr) throw deleteErr;
    log("CRUD: DELETE", "pass", "Delete succeeded (test row removed)");
  } catch (e: unknown) {
    const err = e as { message?: string };
    log("CRUD", "fail", err?.message ?? String(e));
  }

  // 6. RLS - verify policies allow service role (bypass) and anon can read
  try {
    const { data: anonData, error: anonErr } = await supabaseAnon.from("shippers").select("id").limit(1);
    if (anonErr) throw anonErr;
    log("RLS (anon read)", "pass", "Anon key can read shippers", { rows: anonData?.length ?? 0 });
  } catch (e: unknown) {
    const err = e as { message?: string };
    log("RLS (anon read)", "fail", err?.message ?? String(e));
  }

  // 7. Auth - verify auth API is reachable (listUsers requires service role)
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 });
    if (error) throw error;
    log("Auth API", "pass", "Auth admin API reachable", { userCount: data?.users?.length ?? 0 });
  } catch (e: unknown) {
    const err = e as { message?: string };
    log("Auth API", "fail", err?.message ?? String(e));
  }

  printSummary();
}

function printSummary() {
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  console.log("\n=== Summary ===");
  console.log(`Passed: ${passed}, Failed: ${failed}`);
  if (failed > 0) {
    console.log("\nFailed steps:");
    results.filter((r) => r.status === "fail").forEach((r) => console.log(`  - ${r.step}: ${r.message}`));
  }
}

main().catch((e) => {
  console.error("Validation script error:", e);
  process.exit(1);
});
