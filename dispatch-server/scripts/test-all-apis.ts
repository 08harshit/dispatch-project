/**
 * API Test Script: Exercises all protected endpoints.
 * Run: npx ts-node scripts/test-all-apis.ts
 * Requires: dispatch-server running, seed data, test user (admin-test@dispatch.local / TestPassword123!)
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const API_BASE = process.env.API_BASE_URL || "http://localhost:4000/api";
const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;

interface TestResult {
  method: string;
  path: string;
  status: "pass" | "fail";
  statusCode?: number;
  message: string;
  error?: string;
}

const results: TestResult[] = [];
let token: string;
let courierId: string;
let shipperId: string;
let leadId: string;
let contractId: string;
let tripId: string;
let ticketId: string;
let vehicleId: string;

function log(method: string, path: string, status: "pass" | "fail", message: string, statusCode?: number, error?: string) {
  results.push({ method, path, status, statusCode, message, error });
  const icon = status === "pass" ? "[PASS]" : "[FAIL]";
  console.log(`${icon} ${method} ${path} - ${message}${statusCode ? ` (${statusCode})` : ""}${error ? ` - ${error}` : ""}`);
}

async function fetchApi(method: string, path: string, body?: unknown): Promise<{ ok: boolean; status: number; data: any }> {
  const opts: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  console.log("\n=== API Test Suite ===\n");
  console.log("API Base:", API_BASE);

  // Get auth token
  const supabase = createClient(url, anonKey);
  const { data: signIn, error: signErr } = await supabase.auth.signInWithPassword({
    email: "admin-test@dispatch.local",
    password: "TestPassword123!",
  });

  if (signErr || !signIn.session?.access_token) {
    console.error("Auth failed:", signErr?.message || "No session");
    console.log("Ensure seed script created the test user and you have correct Supabase credentials.");
    process.exit(1);
  }
  token = signIn.session.access_token;
  console.log("Auth: OK\n");

  // --- Health (no auth) ---
  const healthRes = await fetch(`${API_BASE.replace("/api", "")}/api/health`);
  log("GET", "/health", healthRes.ok ? "pass" : "fail", healthRes.ok ? "Healthy" : "Unhealthy", healthRes.status);

  // --- Couriers ---
  const cList = await fetchApi("GET", "/couriers");
  if (cList.ok && cList.data?.data?.length) {
    courierId = cList.data.data[0].id;
    log("GET", "/couriers", "pass", `${cList.data.data.length} couriers`, cList.status);
  } else log("GET", "/couriers", "fail", cList.data?.error || "No data", cList.status, cList.data?.error);

  const cStats = await fetchApi("GET", "/couriers/stats");
  log("GET", "/couriers/stats", cStats.ok ? "pass" : "fail", cStats.ok ? "OK" : "Failed", cStats.status, cStats.data?.error);

  if (courierId) {
    const cOne = await fetchApi("GET", `/couriers/${courierId}`);
    log("GET", "/couriers/:id", cOne.ok ? "pass" : "fail", cOne.ok ? "OK" : "Failed", cOne.status);
  }

  // --- Shippers ---
  const sList = await fetchApi("GET", "/shippers");
  if (sList.ok && sList.data?.data?.length) {
    shipperId = sList.data.data[0].id;
    log("GET", "/shippers", "pass", `${sList.data.data.length} shippers`, sList.status);
  } else log("GET", "/shippers", "fail", sList.data?.error || "No data", sList.status);

  const sStats = await fetchApi("GET", "/shippers/stats");
  log("GET", "/shippers/stats", sStats.ok ? "pass" : "fail", sStats.ok ? "OK" : "Failed", sStats.status);

  if (shipperId) {
    const sOne = await fetchApi("GET", `/shippers/${shipperId}`);
    log("GET", "/shippers/:id", sOne.ok ? "pass" : "fail", sOne.ok ? "OK" : "Failed", sOne.status);
    const sHist = await fetchApi("GET", `/shippers/${shipperId}/history`);
    log("GET", "/shippers/:id/history", sHist.ok ? "pass" : "fail", sHist.ok ? "OK" : "Failed", sHist.status);
    const sDocs = await fetchApi("GET", `/shippers/${shipperId}/documents`);
    log("GET", "/shippers/:id/documents", sDocs.ok ? "pass" : "fail", sDocs.ok ? "OK" : "Failed", sDocs.status);
  }

  // --- Loads (leads) ---
  const lList = await fetchApi("GET", "/loads");
  if (lList.ok && lList.data?.data?.length) {
    leadId = lList.data.data[0].id;
    log("GET", "/loads", "pass", `${lList.data.data.length} loads`, lList.status);
  } else log("GET", "/loads", "fail", lList.data?.error || "No data", lList.status);

  const lStats = await fetchApi("GET", "/loads/stats");
  log("GET", "/loads/stats", lStats.ok ? "pass" : "fail", lStats.ok ? "OK" : "Failed", lStats.status);

  if (leadId) {
    const lOne = await fetchApi("GET", `/loads/${leadId}`);
    log("GET", "/loads/:id", lOne.ok ? "pass" : "fail", lOne.ok ? "OK" : "Failed", lOne.status);
  }

  // --- Contracts ---
  const contractList = await fetchApi("GET", "/contracts");
  if (contractList.ok && contractList.data?.data?.length) {
    contractId = contractList.data.data[0].id;
    log("GET", "/contracts", "pass", `${contractList.data.data.length} contracts`, contractList.status);
  } else log("GET", "/contracts", "fail", contractList.data?.error || "No data", contractList.status);

  if (contractId) {
    const contractOne = await fetchApi("GET", `/contracts/${contractId}`);
    log("GET", "/contracts/:id", contractOne.ok ? "pass" : "fail", contractOne.ok ? "OK" : "Failed", contractOne.status);
  }

  // --- Trips ---
  const tripList = await fetchApi("GET", "/trips");
  if (tripList.ok && tripList.data?.data?.length) {
    tripId = tripList.data.data[0].id;
    log("GET", "/trips", "pass", `${tripList.data.data.length} trips`, tripList.status);
  } else log("GET", "/trips", "fail", tripList.data?.error || "No data", tripList.status);

  if (tripId) {
    const tripOne = await fetchApi("GET", `/trips/${tripId}`);
    log("GET", "/trips/:id", tripOne.ok ? "pass" : "fail", tripOne.ok ? "OK" : "Failed", tripOne.status);
  }

  // --- Vehicles ---
  const vList = await fetchApi("GET", courierId ? `/vehicles?courier_id=${courierId}` : "/vehicles");
  if (vList.ok && vList.data?.data?.length) {
    vehicleId = vList.data.data[0].id;
    log("GET", "/vehicles", "pass", `${vList.data.data.length} vehicles`, vList.status);
  } else if (vList.ok && Array.isArray(vList.data?.data)) {
    log("GET", "/vehicles", "pass", "OK (0 vehicles)", vList.status);
  } else log("GET", "/vehicles", "fail", vList.data?.error || "No data", vList.status);

  if (vehicleId) {
    const vOne = await fetchApi("GET", `/vehicles/${vehicleId}`);
    log("GET", "/vehicles/:id", vOne.ok ? "pass" : "fail", vOne.ok ? "OK" : "Failed", vOne.status);
  }

  // --- Vehicle access ---
  const vaList = await fetchApi("GET", "/vehicle-access");
  log("GET", "/vehicle-access", vaList.ok ? "pass" : "fail", vaList.ok ? "OK" : "Failed", vaList.status);

  // --- Dashboard ---
  const dStats = await fetchApi("GET", "/dashboard/stats");
  log("GET", "/dashboard/stats", dStats.ok ? "pass" : "fail", dStats.ok ? "OK" : "Failed", dStats.status);
  const dActivity = await fetchApi("GET", "/dashboard/recent-activity");
  log("GET", "/dashboard/recent-activity", dActivity.ok ? "pass" : "fail", dActivity.ok ? "OK" : "Failed", dActivity.status);
  const dAlerts = await fetchApi("GET", "/dashboard/alerts");
  log("GET", "/dashboard/alerts", dAlerts.ok ? "pass" : "fail", dAlerts.ok ? "OK" : "Failed", dAlerts.status);

  // --- Accounting ---
  const aStats = await fetchApi("GET", "/accounting/stats");
  log("GET", "/accounting/stats", aStats.ok ? "pass" : "fail", aStats.ok ? "OK" : "Failed", aStats.status);
  const aTx = await fetchApi("GET", "/accounting/transactions");
  log("GET", "/accounting/transactions", aTx.ok ? "pass" : "fail", aTx.ok ? "OK" : "Failed", aTx.status);

  // --- Analytics ---
  const anStats = await fetchApi("GET", "/analytics/stats");
  log("GET", "/analytics/stats", anStats.ok ? "pass" : "fail", anStats.ok ? "OK" : "Failed", anStats.status);
  const anTrends = await fetchApi("GET", "/analytics/delivery-trends");
  log("GET", "/analytics/delivery-trends", anTrends.ok ? "pass" : "fail", anTrends.ok ? "OK" : "Failed", anTrends.status);
  const anPerf = await fetchApi("GET", "/analytics/courier-performance");
  log("GET", "/analytics/courier-performance", anPerf.ok ? "pass" : "fail", anPerf.ok ? "OK" : "Failed", anPerf.status);

  // --- Invoices ---
  const invList = await fetchApi("GET", "/invoices");
  log("GET", "/invoices", invList.ok ? "pass" : "fail", invList.ok ? "OK" : "Failed", invList.status);

  // --- Tickets ---
  const tList = await fetchApi("GET", "/tickets");
  if (tList.ok && tList.data?.data?.length) {
    ticketId = tList.data.data[0].id;
    log("GET", "/tickets", "pass", `${tList.data.data.length} tickets`, tList.status);
  } else log("GET", "/tickets", "fail", tList.data?.error || "No data", tList.status);

  const tStats = await fetchApi("GET", "/tickets/stats");
  log("GET", "/tickets/stats", tStats.ok ? "pass" : "fail", tStats.ok ? "OK" : "Failed", tStats.status);

  if (ticketId) {
    const tOne = await fetchApi("GET", `/tickets/${ticketId}`);
    log("GET", "/tickets/:id", tOne.ok ? "pass" : "fail", tOne.ok ? "OK" : "Failed", tOne.status);
  }

  // --- Settings (requires user in session - may fail if profile missing) ---
  const prof = await fetchApi("GET", "/settings/profile");
  log("GET", "/settings/profile", prof.ok ? "pass" : "fail", prof.ok ? "OK" : "Failed", prof.status, prof.data?.error);
  const notif = await fetchApi("GET", "/settings/notifications");
  log("GET", "/settings/notifications", notif.ok ? "pass" : "fail", notif.ok ? "OK" : "Failed", notif.status);

  // --- Stub/501 endpoints (expected to fail or return 501) ---
  if (leadId) {
    const lHist = await fetchApi("GET", `/loads/${leadId}/history`);
    log("GET", "/loads/:id/history", lHist.status === 501 || lHist.ok ? "pass" : "fail", lHist.status === 501 ? "501 (stub)" : lHist.ok ? "OK" : "Unexpected", lHist.status);
    const lDocPost = await fetchApi("POST", `/loads/${leadId}/documents`, { name: "Test", type: "Doc" });
    log("POST", "/loads/:id/documents", lDocPost.status === 501 || lDocPost.ok ? "pass" : "fail", lDocPost.status === 501 ? "501 (stub)" : lDocPost.ok ? "OK" : "Unexpected", lDocPost.status);
  }

  // Summary
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  console.log("\n=== Summary ===");
  console.log(`Passed: ${passed}, Failed: ${failed}`);
  if (failed > 0) {
    console.log("\nFailed:");
    results.filter((r) => r.status === "fail").forEach((r) => console.log(`  ${r.method} ${r.path}: ${r.error || r.message}`));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
