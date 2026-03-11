/**
 * Seed script: Insert dummy data for testing Admin portal.
 * Run: npx ts-node scripts/seed-dummy-data.ts
 * Requires: .env with Supabase credentials
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function seed() {
  console.log("Seeding dummy data...\n");

  // 1. Couriers
  const { data: couriers, error: ec } = await supabase
    .from("couriers")
    .insert([
      { name: "Fast Freight Co", contact_email: "dispatch@fastfreight.com", phone: "555-0101", compliance: "compliant", status: "active" },
      { name: "Quick Haul LLC", contact_email: "ops@quickhaul.com", phone: "555-0102", compliance: "non-compliant", status: "active" },
      { name: "Reliable Transport", contact_email: "info@reliable.com", phone: "555-0103", compliance: "compliant", status: "inactive" },
    ])
    .select("id, name");

  if (ec) {
    console.error("Couriers error:", ec.message);
    return;
  }
  const courierIds = (couriers || []).map((c: any) => c.id);
  console.log("Couriers:", courierIds.length);

  // 2. Shippers
  const { data: shippers, error: es } = await supabase
    .from("shippers")
    .insert([
      { name: "Auto Dealers Inc", contact_email: "shipping@autodealers.com", business_type: "dealer", state: "CA", compliance: "compliant", status: "active" },
      { name: "Broker Pro LLC", contact_email: "ops@brokerpro.com", business_type: "broker", state: "TX", compliance: "non-compliant", status: "active" },
      { name: "Fleet Services Co", contact_email: "logistics@fleetservices.com", business_type: "dealer", state: "FL", compliance: "compliant", status: "active" },
    ])
    .select("id, name");

  if (es) {
    console.error("Shippers error:", es.message);
    return;
  }
  const shipperIds = (shippers || []).map((s: any) => s.id);
  console.log("Shippers:", shipperIds.length);

  // 3. Leads (used by Loads API)
  const { data: leads, error: el } = await supabase
    .from("leads")
    .insert([
      { listing_id: "L001", shipper_id: shipperIds[0], pickup_address: "123 Main St, LA", delivery_address: "456 Oak Ave, SF", status: "open", vehicle_year: "2022", vehicle_make: "Toyota", vehicle_model: "Camry" },
      { listing_id: "L002", shipper_id: shipperIds[1], pickup_address: "789 Elm St, Dallas", delivery_address: "321 Pine Rd, Houston", status: "open", vehicle_year: "2021", vehicle_make: "Honda", vehicle_model: "Accord" },
      { listing_id: "L003", shipper_id: shipperIds[0], pickup_address: "555 Beach Blvd, Miami", delivery_address: "777 Harbor Dr, Tampa", status: "completed", vehicle_year: "2023", vehicle_make: "Ford", vehicle_model: "F-150" },
    ])
    .select("id, listing_id");

  if (el) {
    console.error("Leads error:", el.message);
    return;
  }
  const leadIds = (leads || []).map((l: any) => l.id);
  console.log("Leads:", leadIds.length);

  // 4. Contracts
  const pickupTime = new Date().toISOString();
  const reachTime = new Date(Date.now() + 86400000).toISOString();
  const { data: contracts, error: econtract } = await supabase
    .from("contracts")
    .insert([
      { lead_id: leadIds[0], courier_id: courierIds[0], shipper_id: shipperIds[0], amount: 450, pickup_time: pickupTime, expected_reach_time: reachTime, start_location: "LA", end_location: "SF", status: "signed" },
      { lead_id: leadIds[1], courier_id: courierIds[1], shipper_id: shipperIds[1], amount: 520, pickup_time: pickupTime, expected_reach_time: reachTime, start_location: "Dallas", end_location: "Houston", status: "draft" },
    ])
    .select("id");

  if (econtract) {
    console.error("Contracts error:", econtract.message);
    return;
  }
  const contractIds = (contracts || []).map((c: any) => c.id);
  console.log("Contracts:", contractIds.length);

  // 5. Trips
  const { data: trips, error: etrips } = await supabase
    .from("trips")
    .insert([
      { contract_id: contractIds[0], status: "in_progress", vehicle_state: "in_transit" },
      { contract_id: contractIds[1], status: "scheduled", vehicle_state: "contract_made_will_pickup" },
    ])
    .select("id");

  if (etrips) {
    console.error("Trips error:", etrips.message);
    return;
  }
  const tripIds = (trips || []).map((t: any) => t.id);
  console.log("Trips:", tripIds.length);

  // 6. Trip events (for first trip)
  await supabase.from("trip_events").insert([
    { trip_id: tripIds[0], event_type: "pickup_scan", scanned_value: "SCAN001" },
  ]);
  console.log("Trip events: 1");

  // 7. Vehicles
  const { data: vehicles, error: ev } = await supabase
    .from("vehicles")
    .insert([
      { courier_id: courierIds[0], reg_no: "VH-001", vehicle_type: "flatbed", is_available: true },
      { courier_id: courierIds[0], reg_no: "VH-002", vehicle_type: "enclosed", is_available: false },
      { courier_id: courierIds[1], reg_no: "VH-003", vehicle_type: "flatbed", is_available: true },
    ])
    .select("id");

  if (ev) {
    console.error("Vehicles error:", ev.message);
    return;
  }
  const vehicleIds = (vehicles || []).map((v: any) => v.id);
  console.log("Vehicles:", vehicleIds.length);

  // 8. Vehicle access (optional - needs valid trip)
  const wef = new Date().toISOString();
  const exp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from("vehicle_access").insert({
    vehicle_id: vehicleIds[0],
    shipper_id: shipperIds[0],
    trip_id: tripIds[0],
    wef_dt: wef,
    exp_dt: exp,
    is_active: true,
  });
  console.log("Vehicle access: 1");

  // 9. Invoices (for completed trip - we need a completed trip)
  const { data: completedTrip } = await supabase
    .from("trips")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", tripIds[0])
    .select("id, contract_id")
    .single();

  if (completedTrip) {
    await supabase.from("invoices").insert({
      trip_id: (completedTrip as any).id,
      contract_id: (completedTrip as any).contract_id,
      amount: 450,
      start_location: "LA",
      end_location: "SF",
      courier_name: "Fast Freight Co",
      shipper_name: "Auto Dealers Inc",
      load_description: "2022 Toyota Camry",
    });
    console.log("Invoices: 1");
  }

  // 10. Tickets
  const { data: tickets } = await supabase
    .from("tickets")
    .insert([
      { title: "Delivery delay", description: "Customer reported late delivery", priority: "high", status: "open" },
      { title: "Document request", description: "Need updated insurance cert", priority: "medium", status: "in-progress" },
    ])
    .select("id");

  if (tickets?.length) {
    await supabase.from("ticket_comments").insert([
      { ticket_id: (tickets as any[])[0].id, author: "Admin", text: "Investigating the delay." },
    ]);
    console.log("Tickets: 2, Comments: 1");
  }

  // 11. History and documents for courier/shipper
  await supabase.from("courier_history").insert([
    { courier_id: courierIds[0], action: "Courier created" },
    { courier_id: courierIds[0], action: "Status changed to active" },
  ]);
  await supabase.from("shipper_history").insert([
    { shipper_id: shipperIds[0], action: "Shipper created" },
    { shipper_id: shipperIds[0], action: "Compliance changed to compliant" },
  ]);
  await supabase.from("courier_documents").insert([
    { courier_id: courierIds[0], name: "USDOT Certificate", type: "License", date: "2024-01-15" },
  ]);
  await supabase.from("shipper_documents").insert([
    { shipper_id: shipperIds[0], name: "Business License", type: "License", date: "2024-02-01" },
  ]);
  console.log("History and documents: added");

  // 12. Create test admin user for API testing (optional)
  const testEmail = "admin-test@dispatch.local";
  const testPassword = "TestPassword123!";
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const exists = (existingUsers?.users || []).some((u) => u.email === testEmail);

  if (!exists) {
    const { data: newUser, error: userErr } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { role: "admin" },
    });
    if (userErr) {
      console.log("Test user creation skipped:", userErr.message);
    } else {
      console.log("\nTest admin user created:");
      console.log("  Email:", testEmail);
      console.log("  Password:", testPassword);
      console.log("  Use this to sign in and test the Admin UI / API.");
    }
  } else {
    console.log("\nTest user already exists:", testEmail);
  }

  console.log("\nSeed complete.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
