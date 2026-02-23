# Dispatche-Project: Current State

This document captures the current codebase: business flow, entities, architecture, and auth/roles. It serves as the baseline for the target state and implementation plan.

---

## 1. Project Layout

| Component | Path | Tech |
|-----------|------|------|
| **Courier app** | `courier_Dispatch-main/` | Vite + React, Supabase client, load notifications and offers UI |
| **Shipper app** | `Shipper_Dispatch-main/` | React, Supabase client; posts leads, matching, negotiations, offers |
| **Admin app** | `Admin_Dispatch-main/` | React, calls `dispatch-server` REST API; Couriers, Shippers, Loads, Tickets |
| **Backend** | `dispatch-server/` | Express monolith; Supabase admin client; JWT auth |

**Server routes**: `/api/couriers`, `/api/shippers`, `/api/loads`, `/api/tickets`, `/api/dashboard`, `/api/accounting`, `/api/analytics`, `/api/settings`.

**Auth**: Supabase JWT; role from `user_metadata?.role`. See `dispatch-server/src/middleware/auth.ts`.

---

## 2. Current Business Flow

**Flow: Shipper posts, Courier bids.**

- **Shipper**: Creates **leads** (vehicle/shipment requests: pickup, delivery, vehicle details, price). System performs **matching** (`matching_requests`, `driver_notifications`) and notifies couriers. **Negotiation** uses `negotiations` and `offers` (shipper/courier counter-offers; statuses: pending, negotiating, accepted, declined, expired).
- **Courier**: Sees **load notifications** / **driver notifications** (from `load_notifications`, `load_offers`, or `driver_notifications` + `matching_requests`). Can accept, decline, or counter.

There is no "courier browses available shippers/vehicles and picks one" as the main flow. The **shipper dashboard** (post and manage leads/negotiations) and **courier dashboard** (see and bid on loads) already exist.

---

## 3. Current Entities (from migrations)

### Shipper schema
- `couriers`, `leads`, `negotiations`, `offers`
- Later: `matching_requests`, `driver_notifications`, `condition_reports`, `shipment_documents`, `accounting_*`, `activity_log`

### Courier schema
- `load_notifications`, `load_offers` (shipper_id / courier_id reference `auth.users`)

### Admin schema
- `couriers`, `shippers`, `loads`, `load_documents`, `load_history`
- `courier_*`, `shipper_*` (contacts, insurance, trucks, documents, history)
- `tickets`, `ticket_comments`

### Auth
- `profiles` (from Admin migration), created via trigger on `auth.users`

### Missing today
- No dedicated `vehicles` or `trips` table (vehicle info lives in leads/loads)
- No `contracts`
- No chat (only support `tickets` / `ticket_comments`)
- No `vehicle_cross_access` or time-based access
- No alerts/notifications table
- No invoice entity
- No GPS/location table

---

## 4. Architecture and Data Access

- **Admin**: Frontend → `dispatch-server` (REST) → Supabase.
- **Shipper / Courier**: Frontend → Supabase client (and Realtime for negotiations, offers, load_notifications, load_offers).
- **RLS**: Enabled on all tables; policies vary (e.g. some public read in early Shipper migrations; authenticated + owner in Courier).
- **Roles**: Taken from `user_metadata?.role`. No admin impersonation or "Plus" client selector in dispatch-project yet.

---

## 5. Auth and Coding Practices

- **Auth**: Supabase Auth (email + password), session in localStorage, `AuthContext` + `ProtectedRoute` in Admin.
- **Server**: `Authorization: Bearer <token>`; `supabaseAdmin.auth.getUser(token)`; `req.user.role` from `user_metadata?.role`.

---

## 6. Related Documentation

- [Class diagram (current + target)](01-class-diagram.md)
- [ER diagram and migration map](02-er-diagram.md)
- [Entity document](03-entities.md)
- [Flows (current + optional)](04-flows.md)
- [Microservices and architecture](05-microservices.md)
- [Module connectivity](06-module-connectivity.md)
- [Architecture decision: microservices](07-architecture-decision.md)
- [Roles and access](08-roles-and-access.md)
