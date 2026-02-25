# Applying database migrations

The dispatch server reads from a Supabase project. For real data (loads, contracts, trips, accounting, shippers, etc.) you must apply the migrations to that project.

## 1. Confirm which Supabase project is used

- Open `dispatch-server/.env` and check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- They must point to the **same** Supabase project that should hold Admin/Courier data (leads, contracts, trips, shippers, couriers, invoices, etc.).

## 2. Apply Admin migrations

Run the SQL migrations in **timestamp order** against that project.

**Option A – Supabase CLI (recommended)**

If the repo is linked to the project:

```bash
cd Admin_Dispatch-main
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

**Option B – SQL Editor**

In Supabase Dashboard → SQL Editor, run each file in this order:

1. `Admin_Dispatch-main/supabase/migrations/20260209184858_693ca769-c4f7-4959-884d-37fa3de4c3bb.sql`
2. `Admin_Dispatch-main/supabase/migrations/20260219110619_7bff0305-5ad1-4159-aea8-0fdec3cf458e.sql`
3. `Admin_Dispatch-main/supabase/migrations/20260221170000_courier_module_normalization.sql`
4. `Admin_Dispatch-main/supabase/migrations/20260223100000_leads.sql`
5. `Admin_Dispatch-main/supabase/migrations/20260224100000_contracts_trips_events.sql`
6. `Admin_Dispatch-main/supabase/migrations/20260225100000_vehicles_vehicle_access_invoices.sql`
7. `Admin_Dispatch-main/supabase/migrations/20260225100001_trip_events_trigger.sql`
8. `Admin_Dispatch-main/supabase/migrations/20260225100002_notification_log_and_invoice_on_complete.sql`

## 3. Apply Courier migration (saved_loads)

If the same Supabase project is used by the Courier app:

1. `courier_Dispatch-main/supabase/migrations/20260224100001_saved_loads.sql`

Or run it via CLI from the Courier app folder if linked.

## 4. Restart the server

After migrations are applied, restart the dispatch server so it uses the new schema. The API will then return real data instead of empty arrays.
