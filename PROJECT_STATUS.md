# Dispatch Project – Status: Finished vs Remaining

This document summarizes what is implemented as of the current state and what remains to be done.

---

## 1. What Is Finished

### 1.1 Database schema (migrations only; must be applied)

- **Admin_Dispatch-main/supabase/migrations/**  
  Defines: `couriers`, `shippers`, `leads`, `contracts`, `trips`, `trip_events`, `vehicles`, `vehicle_access`, `invoices`, `notification_log`. Triggers for trip completion, invoice creation, and vehicle access expiry.
- **courier_Dispatch-main/supabase/migrations/**  
  Defines: `saved_loads` (courier_id, lead_id).
- **MIGRATIONS.md** at repo root describes how to apply these migrations to the Supabase project used by the server.

Migrations are **not** applied automatically; they must be run against the project pointed to by `dispatch-server/.env` (see “What Needs to Be Done” below).

### 1.2 Backend (dispatch-server)

- **Real Supabase-backed routes**
  - **Loads (leads):** `GET /api/loads`, `GET /api/loads/stats`, `GET /api/loads/:id`, `POST /api/loads`.
  - **Contracts:** `GET /api/contracts`, `GET /api/contracts/:id`, `POST /api/contracts`.
  - **Trips:** `GET /api/trips`, `GET /api/trips/:id`, `POST /api/trips/:id/events`.
  - **Accounting:** `GET /api/accounting/stats`, `GET /api/accounting/transactions` (from `invoices`).
  - **Invoices:** `GET /api/invoices`, `GET /api/invoices/:id`.
  - **Saved loads:** `GET /api/saved-loads`, `POST /api/saved-loads`, `DELETE /api/saved-loads/:id`.
  - **Couriers:** `GET /api/couriers`, `GET /api/couriers/stats`, `GET /api/couriers/:id`, `POST /api/couriers` (and related endpoints from refacto-code merge).
  - **Shippers:** `GET /api/shippers`, `GET /api/shippers/stats`, `GET /api/shippers/:id`.
  - **Dashboard:** `GET /api/dashboard/stats`, `GET /api/dashboard/recent-activity`, `GET /api/dashboard/alerts`.
  - **Analytics:** `GET /api/analytics/stats`, `GET /api/analytics/delivery-trends`, `GET /api/analytics/courier-performance`.
  - **Tickets:** `GET /api/tickets`, `GET /api/tickets/stats`, `GET /api/tickets/:id`, `POST /api/tickets`, `PUT /api/tickets/:id`, `PATCH /api/tickets/:id/status`, `DELETE /api/tickets/:id`, `POST /api/tickets/:id/comments`.

- **Graceful degradation**  
  When tables are missing (migrations not applied), contracts, trips, accounting, invoices, shippers, dashboard, analytics, and tickets return **200 with empty or default data** instead of 500 (see `dispatch-server/src/utils/dbError.ts`).

- **Auth**  
  `authenticate` middleware is applied to all routes except `GET /api` (health). Protected routes require `Authorization: Bearer <token>`; invalid/missing token returns 401.

- **Backend-only (single source of truth)**  
  - **Leads:** Created **only** via dispatch-server. Admin or Shipper must call `POST /api/loads` with auth to create leads in the shared DB. No direct Supabase insert from frontends for leads in this DB.  
  - **Accept bid:** When Shipper accepts a bid, the app must call `POST /api/contracts` with `lead_id`, `courier_id`, `shipper_id`, `amount`, `pickup_time`, `expected_reach_time`, `start_location`, `end_location`, and optional `vehicle_id`. The server creates the contract, trip, and (when `vehicle_id` is provided) `vehicle_access`; no duplicate logic in Shipper app or Edge Functions.  
  - **Cron:** `POST /api/cron/expire-vehicle-access` (and `POST /api/cron/process-notifications`) are mounted under `/api/cron`; when `CRON_SECRET` is set, callers must send `X-Cron-Secret` or `Authorization: Bearer <CRON_SECRET>`.  
  - **Vehicle access expiry:** Service `vehicleAccessExpiry` runs every 10 minutes in-process and sets `vehicle_access.is_active = false` where `exp_dt < now()`.  
  - **Notification worker:** Processes `notification_log` (unsent rows), sends lifecycle emails via Resend (config: `RESEND_API_KEY`, `NOTIFICATION_FROM_EMAIL`), sets `sent_at`. Runs every 2 minutes in-process; cron endpoint `POST /api/cron/process-notifications` also available.  
  - **Vehicles:** `GET /api/vehicles`, `GET /api/vehicles/:id`, `POST /api/vehicles`, `PUT /api/vehicles/:id`, `PATCH /api/vehicles/:id` (table `public.vehicles`).  
  - **Vehicle access (read-only):** `GET /api/vehicle-access` with query params `shipper_id`, `vehicle_id`, `active_only`.

### 1.3 Admin app (Admin_Dispatch-main)

- **Wired to API**
  - **Loads:** Uses `loadService` → `/api/loads` and `/api/loads/stats`.
  - **Contracts:** Contracts page and `contractService` → `/api/contracts`.
  - **Trips:** Trips page, Trip detail page, `tripService` → `/api/trips`.
  - **Accounting:** Stats and transactions from `/api/accounting/*`; invoice download uses real invoice row (data for PDF generated at runtime).
  - **Couriers:** Full CRUD via `/api/couriers`.
  - **Shippers:** List and stats via `shipperService` → `/api/shippers`; loading/error and empty states.
  - **Dashboard:** Stats and recent activity from `/api/dashboard/stats` and `/api/dashboard/recent-activity`; alerts from API (currently empty).
  - **Analytics:** Stats, delivery trends, and courier performance from `/api/analytics/*`.
  - **Tickets:** List, stats, create, update status, add comment, delete via `ticketService` and `/api/tickets/*`; loading/error states.

- **Auth**  
  Supabase Auth; `api.ts` sends `Authorization: Bearer <session.access_token>` on every request; 401 triggers redirect to `/auth`.

### 1.4 Courier app (courier_Dispatch-main)

- **Saved loads:** UI and API integration with `/api/saved-loads` (or Supabase `saved_loads` when using same DB).
- **Load notifications / lead data:** Notifications can use lead data where available.
- **Optional:** Trip-level invoice view (using invoice data from API).

### 1.5 Shipper app (Shipper_Dispatch-main)

- Separate codebase and (in current setup) its own Supabase project; manages leads, negotiations, matching. Contract/trip creation after “accept bid” is not yet wired to the shared Admin/Courier DB or dispatch-server.

---

## 2. What Needs to Be Done

### 2.1 Must-do

1. **Apply migrations**  
   - Ensure `dispatch-server/.env` points to the Supabase project that should hold Admin/Courier data.  
   - Run all migrations from `Admin_Dispatch-main/supabase/migrations/` and `courier_Dispatch-main/supabase/migrations/20260224100001_saved_loads.sql` in timestamp order (see **MIGRATIONS.md**).  
   - Until this is done, APIs that depend on `leads`, `contracts`, `trips`, `invoices`, `shippers`, etc. will return empty data (by design) or rely on tables that already exist (e.g. `couriers`).

### 2.2 Lead source and Shipper integration

- **Leads:** Created only via `POST /api/loads` (dispatch-server). Shipper app should create leads by calling this API with auth (no direct Supabase insert into the shared DB).
- **Shipper accept bid:** Shipper app must call `POST /api/contracts` with the agreed terms; the server creates contract, trip, and vehicle_access. Frontend wiring (Shipper app calling this API) can be done in a later phase.

### 2.3 Optional / later

- **Settings API:** `/api/settings` is still stub; Admin Settings page is UI-only. Replace with real profile/notification APIs if needed.
- **Courier/Shipper calling dispatch-server:** Courier and Shipper currently use Supabase (and possibly Edge Functions) directly. Decide whether to move more flows (e.g. saved loads, contracts, trips) to dispatch-server for a single API surface.
- **Admin “Plus” (impersonation):** Per original client ask, Admin should be able to “see everything as any courier/shipper” (e.g. client selector in header like the reference image). Not implemented: no `X-Impersonate-User-Id` (or similar) or admin-only APIs to list/switch context yet.

### 2.4 Future features (from client requirements, not yet implemented)

- **Notifications (email):** Trip-completed emails are sent by the dispatch-server notification worker; other lifecycle events (agreement in place, trip starting, about to end) can be added when those events are written to `notification_log`.
- **Chat / bidding window:** In-app chat between courier and shipper; time-limited bidding (e.g. 30 minutes). No `chat_sessions` / `chat_messages` or time-bound offer logic yet.
- **GPS and map:** Current vehicle location and map view (e.g. Google Maps). Requires `vehicle_locations` (or similar) and a single “current location” API; not implemented.
- **Smart planner:** Split a load across multiple vehicles (trip_legs or similar). Documented as a concept; not implemented.
- **Invoice PDF:** Invoices table stores columns only; PDF is generated at runtime from that data. Download/PDF generation in Admin is wired to invoice row; any additional format or template work is optional.

---

## 3. Quick reference

| Area              | Status        | Notes                                                                 |
|-------------------|---------------|-----------------------------------------------------------------------|
| DB migrations     | Defined       | Apply via MIGRATIONS.md to Supabase project used by dispatch-server.  |
| dispatch-server   | Implemented   | Leads, contracts, trips, accounting, invoices, saved-loads, couriers, shippers, dashboard, analytics, tickets; auth on routes. |
| Admin app        | Implemented   | All main pages wired to API; auth with Bearer token; 401 → /auth.     |
| Courier app      | Partial       | Saved loads + API; notifications/lead data; trip invoice view optional. |
| Shipper app      | Separate      | Own DB; contract/trip creation not wired to shared backend.           |
| Vehicle access   | Implemented   | Expiry job in dispatch-server; GET /api/vehicle-access.               |
| Notifications    | Implemented   | notification_log + sent_at; worker in dispatch-server (Resend).     |
| Chat / GPS / Map | Not started   | As per client requirements document.                                  |
| Admin impersonation | Not started | “Plus” client selector and impersonation API not implemented.         |

---

*Last updated to reflect the state after completion of the “Dispatch project completion” plan (Shippers, Dashboard, Analytics, Tickets APIs + Admin wiring, API auth, MIGRATIONS.md). Later: backend-forward plan (vehicle access expiry, notification worker, vehicles/vehicle-access APIs, leads and accept bid via dispatch-server only).*
