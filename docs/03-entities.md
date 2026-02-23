# Entity Document

One section per entity: purpose, lifecycle, attributes, ownership, and key business rules. Covers both existing tables and target (new) entities.

---

## 1. Users and Profiles

### auth.users (Supabase)
- **Purpose**: Authentication identity (email, password hash).
- **Lifecycle**: Created on sign-up; updated on profile/linking.
- **Ownership**: Supabase Auth; app creates profile on first sign-up via trigger.

### profiles
- **Purpose**: App-level user profile (display name, optional role).
- **Attributes**: `user_id` (PK, FK to auth.users), `display_name`, `role` (optional), `created_at`.
- **Ownership**: System (trigger on auth.users insert); user can update display_name.
- **Rules**: One profile per user; role can be admin, courier, or shipper.

---

## 2. Couriers

- **Purpose**: Courier service entity; receives load notifications and negotiates with shippers.
- **Lifecycle**: Created when user registers as courier or admin creates; updated for compliance, status, contacts.
- **Attributes**: `id`, `user_id` (FK to auth.users), `name`, `contact_email`, `phone`, `address`, `usdot`, `mc`, `compliance`, `status`, `trucks`, `insurance_company`, `equipment_type`, `is_new`, `created_at`, `updated_at`. Normalized extensions: `courier_contacts`, `courier_insurance`, `courier_trucks`, `courier_documents`, `courier_history`.
- **Ownership**: Admin creates/updates; courier can update own profile if allowed.
- **Rules**: Compliance and status drive visibility in admin; linked to negotiations, contracts, vehicle_access.

---

## 3. Shippers

- **Purpose**: Shipper entity; owns vehicles, creates leads, negotiates with couriers.
- **Lifecycle**: Created when user registers as shipper or admin creates; updated for compliance, status.
- **Attributes**: `id`, `user_id` (FK to auth.users), `name`, `contact_email`, `phone`, `address`, `business_type`, `city`, `state`, `compliance`, `status`, `is_new`, `created_at`, `updated_at`. Extensions: `shipper_documents`, `shipper_history`.
- **Ownership**: Admin creates/updates; shipper can update own profile if allowed.
- **Rules**: Linked to vehicles, leads, contracts.

---

## 4. Vehicles (Target – New)

- **Purpose**: Asset owned by a shipper; can be offered for use by couriers under a contract.
- **Lifecycle**: Created by shipper (or admin); updated for availability and details; soft-delete optional.
- **Attributes**: `id`, `shipper_id` (FK), `reg_no`, `vehicle_type`, `goods_type`, `capacity`, `is_available`, `created_at`, `updated_at`.
- **Ownership**: Shipper creates/updates; system may set `is_available` based on contracts/access.
- **Rules**: Only shipper (or admin) can create/edit; vehicle appears in catalog or lead only when available (and not already under active access).

---

## 5. Leads

- **Purpose**: Shipment/vehicle request posted by shipper; pickup, delivery, vehicle details, initial price.
- **Lifecycle**: Created by shipper; status: open → locked (by courier) → closed (negotiation accepted/expired).
- **Attributes**: `id`, `listing_id`, `shipper_id` (implicit or FK), `pickup_address`, `pickup_*`, `delivery_*`, `vehicle_year`, `vehicle_make`, `vehicle_model`, `vehicle_vin`, `vehicle_type`, `initial_price`, `payment_type`, `notes`, `status`, `is_locked`, `locked_by_courier_id`, `created_at`, `updated_at`.
- **Ownership**: Shipper creates/updates; system or courier may lock.
- **Rules**: When negotiation is accepted, lead can be linked to a new contract; one lead can have multiple negotiations but at most one resulting contract.

---

## 6. Negotiations and Offers

### negotiations
- **Purpose**: One negotiation per (lead, courier) for price/terms.
- **Lifecycle**: Created when courier responds to lead (or is matched); status: pending → negotiating → accepted | declined | expired | timeout.
- **Attributes**: `id`, `lead_id`, `courier_id`, `status`, `current_offer`, `counter_count`, `negotiation_started_at`, `negotiation_expires_at`, `courier_response_deadline`, `shipper_response_deadline`, `accepted_at`, `created_at`, `updated_at`. Unique (lead_id, courier_id).
- **Ownership**: Shipper/Courier alternate offers; system enforces deadlines and expiry.
- **Rules**: Negotiation expires at `negotiation_expires_at`; when status = accepted, a contract can be created.

### offers
- **Purpose**: Individual price offers within a negotiation (shipper or courier).
- **Attributes**: `id`, `negotiation_id`, `offered_by` (shipper | courier), `amount`, `response` (pending | accepted | declined | countered | expired), `responded_at`, `created_at`.
- **Ownership**: Shipper or Courier posts; the other responds.
- **Rules**: Ordered by `created_at`; last offer and response drive negotiation state.

---

## 7. Contracts (Target – New)

- **Purpose**: Agreement between courier and shipper for use of a vehicle for a defined period and amount.
- **Lifecycle**: Created when a negotiation is accepted; status: draft → signed → active → completed | cancelled.
- **Attributes**: `id`, `courier_id`, `shipper_id`, `lead_id`, `vehicle_id`, `amount`, `wef_dt`, `exp_dt`, `contract_status`, `signed_at`, `created_at`, `updated_at`.
- **Ownership**: System creates from accepted negotiation; both parties effectively "sign" (e.g. accept in UI); system updates status based on trip and time.
- **Rules**: Vehicle access is granted for [wef_dt, exp_dt]; after exp_dt, access is revoked (see VehicleAccess). One contract typically has one trip; invoice can be generated from contract/trip.

---

## 8. Trips (Target – New)

- **Purpose**: Execution of a contract: one trip per contract (or split into legs for smart planner).
- **Lifecycle**: Created when contract is signed or trip is scheduled; status: scheduled → in_progress → completed | cancelled.
- **Attributes**: `id`, `contract_id`, `trip_status`, `started_at`, `ended_at`, `created_at`, `updated_at`.
- **Ownership**: System or dispatcher starts/ends; notifications fire on start, about-to-end, end.
- **Rules**: Trip start/end can drive VehicleAccess validity or be aligned with wef_dt/exp_dt; when trip ends, invoice can be generated and access revoked.

---

## 9. Trip Legs (Target – New, Smart Planner)

- **Purpose**: One trip split across multiple vehicles (e.g. consignment split).
- **Lifecycle**: Created by planner when assigning segments to vehicles; read for execution.
- **Attributes**: `id`, `trip_id`, `vehicle_id`, `sequence`, `segment_info` (or pickup/drop points), `created_at`.
- **Ownership**: System or "smart planner" creates/updates.
- **Rules**: Order by `sequence`; each leg can have its own vehicle_access window if needed.

---

## 10. VehicleAccess (Target – New)

- **Purpose**: Time-bound grant of vehicle visibility/access to a courier (contract-scoped).
- **Lifecycle**: Created when contract is signed (wef_dt, exp_dt); set inactive or deleted when contract ends or exp_dt passes.
- **Attributes**: `id`, `vehicle_id`, `courier_id`, `contract_id`, `wef_dt`, `exp_dt`, `is_active`, `created_at`, `updated_at`.
- **Ownership**: System creates on contract sign; system revokes when exp_dt passed (cron or Edge Function).
- **Rules**: VehicleAccess is valid only when `is_active = true` and `now() BETWEEN wef_dt AND exp_dt`. Courier can see vehicle location and basic info only within this window.

---

## 11. ChatSession and ChatMessage (Target – New)

### chat_sessions
- **Purpose**: Time-limited chat between courier and shipper (e.g. for bargaining); optional per negotiation/contract.
- **Lifecycle**: Created when negotiation starts or contract is created; expires at `expires_at` (e.g. 30 minutes from creation).
- **Attributes**: `id`, `contract_id` (or `negotiation_id`), `expires_at`, `created_at`.
- **Ownership**: System creates when negotiation/contract opens chat; no new messages after `expires_at`.
- **Rules**: Chat is open only while `now() < expires_at`; enforce in API and UI.

### chat_messages
- **Purpose**: Individual messages in a chat session.
- **Attributes**: `id`, `session_id`, `sender_id` (auth.users), `text`, `created_at`.
- **Ownership**: Courier or Shipper sends; system may enforce rate limits and expiry.
- **Rules**: Only participants of the linked contract/negotiation can read/send.

---

## 12. Invoices (Target – New)

- **Purpose**: Generated document (PDF/HTML) for a contract or trip for payment record.
- **Lifecycle**: Created when trip completes (or on request); stored and downloadable.
- **Attributes**: `id`, `contract_id`, `trip_id`, `amount`, `storage_path` (e.g. Supabase Storage), `generated_at`, `created_at`.
- **Ownership**: System generates (e.g. Edge Function or server job); courier/shipper can download.
- **Rules**: One invoice per trip (or per contract) as defined by product; immutable after generation.

---

## 13. Vehicle Locations (Target – New)

- **Purpose**: Current (or last known) GPS position of a vehicle for map display.
- **Lifecycle**: Updated by device/ingestion; read by courier (only for vehicles they have access to) and admin.
- **Attributes**: `id`, `vehicle_id`, `lat`, `lng`, `updated_at`. (Optional: `heading`, `speed`.)
- **Ownership**: System/device writes; courier reads only if active VehicleAccess exists.
- **Rules**: Single source of truth per vehicle (overwrite or latest row); RLS restricts read by vehicle_access.

---

## 14. Notification Log (Target – New)

- **Purpose**: Audit of lifecycle notifications sent (e.g. agreement in place, trip start in x mins, trip started, about to end, ended).
- **Lifecycle**: Insert-only when a notification is sent.
- **Attributes**: `id`, `event_type`, `contract_id`, `trip_id`, `recipient_id`, `channel` (email | in_app), `sent_at`.
- **Ownership**: Notification service (Edge Function or server) writes.
- **Rules**: Used for idempotency and support; no update/delete.

---

## 15. Loads (Admin)

- **Purpose**: Admin operational load: links shipper, courier, vehicle info, status.
- **Attributes**: `id`, `shipper_id`, `courier_id`, `vehicle_year`, `vehicle_make`, `vehicle_model`, `vin`, `pickup_date`, `dropoff_date`, `status`, `created_at`, `updated_at`. Plus `load_documents`, `load_history`.
- **Ownership**: Admin creates/updates.
- **Rules**: Can be aligned with contracts/trips in target design or kept as separate operational view.

---

## 16. Load Notifications and Load Offers (Courier App)

- **Purpose**: Shipper-posted load notifications and courier offers (alternative or parallel to leads/negotiations).
- **Attributes**: `load_notifications`: shipper_id, pickup_*, delivery_*, vehicle_*, price, status, expires_at. `load_offers`: notification_id, courier_id, offer_price, status.
- **Ownership**: Shipper creates notifications; Courier creates/updates offers.
- **Rules**: Can be consolidated with leads/negotiations/offers in target schema or kept for backward compatibility; document overlap in migration.

---

## 17. Tickets and Ticket Comments

- **Purpose**: Support tickets (admin and optionally courier/shipper).
- **Attributes**: `tickets`: title, description, priority, status. `ticket_comments`: ticket_id, author, text, created_at.
- **Ownership**: Any role can create (if allowed); admin manages.
- **Rules**: No change in target; keep as-is for support.
