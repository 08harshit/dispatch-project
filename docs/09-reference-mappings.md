# Reference Mappings: Company Features to Dispatche

How existing company features map to Dispatche-Project requirements. Use these as implementation references.

---

## 1. vehicle-info: VehicleCrossAccess

**Company**: Manual or trip-wise vehicle cross access (vFo, gFo, wef_dt, exp_dt, visibleType); insert/expire/delete via VehicleCrossAccessOpsService.

**Dispatche**: Time-based **vehicle_access** table:
- `shipper_id` (owner), `courier_id` (granted to), `vehicle_id`, `wef_dt`, `exp_dt`, `is_active`.
- **Grant**: When contract is signed, insert row with wef_dt/exp_dt from contract.
- **Revoke**: Cron or Supabase Edge Function sets `is_active = false` (or deletes) when `exp_dt` has passed.
- **Simpler**: No FO hierarchy, no manual "shift"; single "contract-based" access type. No trip_id/visibility type matrix; one active window per (vehicle, courier, contract).

---

## 2. vehicle_master_and_alert_creation: Alerts / Notifications

**Company**: Scheduled custom alerts (e.g. site detention, deviation, documentation); email/notify pattern.

**Dispatche**: **Notification service** for trip lifecycle:
- Events: agreement in place, trip start in x mins, trip started, trip about to end, trip ended.
- Recipients: both courier and shipper (email and optionally in-app).
- Implementation: Supabase Edge Function (triggered by DB change or cron) + Resend/SendGrid (or similar). Log sent events in `notification_log` for audit and idempotency.

---

## 3. LocationDataSwitching: Vehicle Location

**Company**: Complex: multiple sources, priorities, void-filling, merging.

**Dispatche**: **Single responsibility** only:
- One table or feed: e.g. `vehicle_locations` (vehicle_id, lat, lng, updated_at).
- One API: e.g. `GET /api/vehicles/:id/location` or `GET /api/location/current?vehicle_ids=...` for current position. Used by map (e.g. Google Maps).
- No multi-source merging; single source (device/ingestion) writes; courier reads only when they have active vehicle_access.

---

## 4. master_trip_report: Trip Report / Invoice

**Company**: Trip report by trip id or date range; PDF/structured output.

**Dispatche**: **Invoice** per contract or trip:
- Generate PDF/HTML from contract and trip data (parties, amounts, dates, vehicle).
- Store file in Supabase Storage; store metadata in `invoices` (contract_id, trip_id, amount, storage_path, generated_at).
- Endpoint to generate and download (e.g. `GET /api/invoices/:id/download`). No need for the full MTR pipeline; keep logic simple and single-purpose.

---

## 5. Onboarding / customer-selection (Plus)

**Company**: xswift header "Select FO Admin"; modal to search and select FO Admin; API e.g. `installer/getAllFoAdminListwithCustomer`.

**Dispatche**: **Admin Plus** (impersonation):
- **API**: From dispatch-server, e.g. `GET /api/admin/couriers` and `GET /api/admin/shippers` to list accounts (id, name, email, etc.) for the Plus selector.
- **Frontend**: Admin selects a courier or shipper; store `impersonated_user_id` (and role); send header e.g. `X-Impersonate-User-Id` on API requests.
- **Backend**: When caller is admin and header is set, scope all data as that user (e.g. filter by courier_id or shipper_id). No Feign/Java; REST from dispatch-server only.

---

## Summary Table

| Company feature | Dispatche usage |
|-----------------|-----------------|
| vehicle-info VehicleCrossAccess | vehicle_access table; time-based grant/revoke by exp_dt; single contract-based type |
| vehicle_master_and_alert_creation | Notification service: lifecycle emails (agreement, trip start/end); Edge Function + email provider |
| LocationDataSwitching | Single table + one "current location" API for map; no multi-source logic |
| master_trip_report | Invoice: generate PDF/HTML per contract/trip; store in Storage + invoices table |
| Onboarding / customer-selection | Admin Plus: list couriers/shippers API; impersonation via X-Impersonate-User-Id |
