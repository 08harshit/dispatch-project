# Microservices Document

Current architecture, options (monolith vs split), and recommendation for Dispatche-Project.

---

## 1. Current State

- **Backend**: Single **Express** server (`dispatch-server`): one codebase, one process. Routes: `/api/couriers`, `/api/shippers`, `/api/loads`, `/api/tickets`, `/api/dashboard`, `/api/accounting`, `/api/analytics`, `/api/settings`.
- **Database**: **Postgres** in **Supabase** (single DB). Supabase provides Auth, Realtime, Storage.
- **Frontends**: Three apps (Admin, Shipper, Courier). Admin talks to dispatch-server only; Shipper and Courier talk to **Supabase** directly (client SDK + Realtime) for their flows.
- **Effective shape**: **Monolith + Supabase**. No separate microservices; no service-to-service calls; no event bus.

---

## 2. Option A: Keep Monolith + Supabase (Recommended)

- **Description**: One backend (Express, or Supabase Edge Functions for specific jobs). All APIs and business logic in one place or in a small set of Edge Functions. Single Postgres, single Auth, single Realtime.
- **Pros**:
  - Simpler deployment and operations (one server, one DB).
  - Easier consistency: contracts, vehicle access, trips share the same DB; no distributed transactions.
  - Fits freelancing scope and single team; faster to build and debug.
  - Supabase already provides Auth, Realtime, and DB; no extra infra.
- **Cons**:
  - No independent scaling per domain (e.g. cannot scale only "notifications").
  - All domains in one codebase (mitigated by clear modules and route groups).

**Recommendation**: Use this for Dispatche-Project. Add **logical modules** inside the monolith (e.g. `routes/contracts.ts`, `routes/vehicle-access.ts`, `services/notificationService.ts`) and optionally one or two **Supabase Edge Functions** for notification worker (e.g. send emails on contract/trip events). If the product grows, the doc can describe how to extract e.g. "notification service" or "location service" later.

---

## 3. Option B: Split by Domain (Not Recommended for Now)

- **Description**: Separate services, e.g. "contracts service," "notification service," "location service," each with its own deployment and possibly its own DB or schema.
- **Pros**: Clear boundaries; can scale or deploy domains independently; team ownership per service.
- **Cons**: More infra (multiple deployments, discovery, logging); eventual consistency and distributed transactions; overkill for a single product at this stage; higher cost for a freelancing project.

**Recommendation**: Do not adopt for v1. Revisit only if criteria in [07-architecture-decision.md](07-architecture-decision.md) are met.

---

## 4. Logical Modules Within the Monolith (Target)

Without splitting into separate services, the codebase can be organized as:

| Module | Responsibility | Routes / entry points |
|--------|----------------|------------------------|
| **Auth** | JWT validation, role, impersonation | Middleware; `/api/admin/*` guards |
| **Couriers** | CRUD, list, filters | `/api/couriers` |
| **Shippers** | CRUD, list, filters | `/api/shippers` |
| **Loads** | Admin load CRUD | `/api/loads` |
| **Contracts** | Create from negotiation, read, update status | `/api/contracts` (new) |
| **Vehicle access** | Grant/revoke, list active | `/api/vehicle-access` (new) |
| **Trips** | Create, start, end, list | `/api/trips` (new) |
| **Location** | Current vehicle location for map | `/api/vehicles/:id/location` or `/api/location/current` (new) |
| **Chat** | Sessions, messages, expiry | `/api/chat/*` (new) |
| **Invoices** | Generate, store, download | `/api/invoices` (new) |
| **Notifications** | Lifecycle emails (or call Edge Function) | Internal service or Edge Function |
| **Tickets** | Support tickets | `/api/tickets` |
| **Admin** | List couriers/shippers for impersonation | `/api/admin/couriers`, `/api/admin/shippers` (new) |

Shipper and Courier apps may continue to call Supabase directly for Realtime (negotiations, offers, chat) while also calling dispatch-server for contract, trip, vehicle-access, and invoice APIs if desired. Alternatively, all can go through the server with Realtime still via Supabase subscriptions.

---

## 5. Optional Edge Functions (Supabase)

- **Notification worker**: Triggered by DB events (e.g. `contracts` row inserted/updated, `trips` status changed) or by cron. Sends emails (e.g. via Resend/SendGrid): agreement in place, trip start in x mins, trip started, about to end, trip ended.
- **Vehicle access revoker**: Cron (e.g. pg_cron + Edge Function) that sets `vehicle_access.is_active = false` where `exp_dt < now()`.

This keeps the main app as a monolith while offloading async jobs to Edge Functions if needed.
