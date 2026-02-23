# Roles and Access

Defines what **Admin**, **Courier**, and **Shipper** can do, and how to enforce it (API and RLS). Includes Admin impersonation ("Plus" / view as).

---

## 1. Roles

| Role | Description | Identity |
|------|-------------|----------|
| **Admin** | Full visibility; can list all couriers and shippers and "view as" any of them. | `user_metadata.role === 'admin'` (or equivalent) |
| **Courier** | Courier service; sees own profile, contracts, trips, vehicle access, load notifications/offers, chat with shippers. | `user_metadata.role === 'courier'`; linked to `couriers.id` via `couriers.user_id = auth.uid()` |
| **Shipper** | Shipper; sees own profile, vehicles, leads, negotiations, contracts, chat with couriers. | `user_metadata.role === 'shipper'`; linked to `shippers.id` via `shippers.user_id = auth.uid()` |

---

## 2. Admin

### 2.1 Capabilities

- List all couriers and shippers (for support and for impersonation).
- **Impersonate** (view as): Select a courier or shipper and see the app as that user (same data that user would see). Implement via "view as" context (e.g. `X-Impersonate-User-Id` or `impersonated_user_id` in session).
- See all contracts, trips, invoices, and support tickets.
- Create/update couriers, shippers, loads (admin operational data).
- No need to see other admins' "view as" sessions; each admin uses their own impersonation context.

### 2.2 Implementation

- **Admin-only APIs**: e.g. `GET /api/admin/couriers`, `GET /api/admin/shippers` (list accounts for Plus selector). Require `role === 'admin'`.
- **View-as context**: When admin selects a user in the Plus UI, frontend stores `impersonated_user_id` (and optionally `impersonated_role`) and sends it on subsequent requests (e.g. header `X-Impersonate-User-Id`). Backend uses this only when the caller is admin; then data is scoped as if the request were from that user (e.g. filter contracts by `courier_id = impersonated_user_id` or `shipper_id = impersonated_user_id`).
- **RLS**: Admin can either use a service role / bypass RLS for admin routes, or have a policy that allows `auth.uid()` when the user is admin. For impersonation, server-side logic should query as the impersonated user (e.g. set a JWT or context with that user id for the request) or explicitly apply filters by `impersonated_user_id` when returning data.

---

## 3. Courier

### 3.1 Capabilities

- See and update **own profile** (if allowed).
- See **own contracts** (where `courier_id` = self).
- See **own trips** (trips of contracts where courier_id = self).
- See **vehicle access** records where `courier_id` = self and access is active (`is_active = true`, `now()` between `wef_dt` and `exp_dt`).
- See **vehicle location** only for vehicles they have active access to.
- See **load notifications / load offers** (current flow) and **negotiations/offers** where they are the courier.
- See and send messages in **chat sessions** for their contracts (and only while session not expired).
- Download **invoices** for their contracts/trips.
- Cannot see other couriers' data or shippers' internal data (e.g. other leads) except as implied by shared contract/chat.

### 3.2 Enforcement

- **API**: All courier-scoped endpoints resolve "current user" from JWT (or impersonated id when admin is viewing as this courier). Filter by `courier_id = current_user_id` (or equivalent link via `couriers.user_id`).
- **RLS**: Policies on `contracts`, `trips`, `vehicle_access`, `chat_*`, `invoices` allow SELECT (and allowed mutations) where `courier_id` matches the user's courier id (derived from `auth.uid()` via `couriers.user_id`). For `vehicle_locations`, allow SELECT only if there exists an active `vehicle_access` for this courier and that vehicle.

---

## 4. Shipper

### 4.1 Capabilities

- See and update **own profile** (if allowed).
- See and manage **own vehicles**.
- Create and manage **own leads** (shipment/vehicle requests).
- See **negotiations/offers** where the lead belongs to them.
- See **own contracts** (where `shipper_id` = self).
- See **trips** for their contracts.
- See and send messages in **chat sessions** for their contracts (and only while session not expired).
- Download **invoices** for their contracts/trips.
- Cannot see other shippers' data or couriers' private data (e.g. other couriers' contracts) except as implied by shared contract/chat.

### 4.2 Enforcement

- **API**: All shipper-scoped endpoints resolve "current user" from JWT (or impersonated id when admin is viewing as this shipper). Filter by `shipper_id = current_user_id` (or equivalent link via `shippers.user_id`).
- **RLS**: Policies on `vehicles`, `leads`, `negotiations` (via lead), `contracts`, `trips`, `chat_*`, `invoices` allow SELECT (and allowed mutations) where `shipper_id` (or lead.shipper_id) matches the user's shipper id (derived from `auth.uid()` via `shippers.user_id`).

---

## 5. RLS Policy Patterns

### 5.1 Resolving role and entity id from auth

- **profiles**: `user_id = auth.uid()`.
- **couriers**: `user_id = auth.uid()`; then `couriers.id` is the "courier id" for this user.
- **shippers**: `user_id = auth.uid()`; then `shippers.id` is the "shipper id" for this user.

Use these in policies, e.g.:

- Contracts (courier): `courier_id IN (SELECT id FROM couriers WHERE user_id = auth.uid())`.
- Contracts (shipper): `shipper_id IN (SELECT id FROM shippers WHERE user_id = auth.uid())`.
- Vehicle access (courier): `courier_id IN (SELECT id FROM couriers WHERE user_id = auth.uid())` and `is_active = true` and `now() BETWEEN wef_dt AND exp_dt`.

### 5.2 Admin override

- Option A: Admin uses **service role** key for server-side API (bypass RLS) and server enforces "admin or impersonated user" in code.
- Option B: RLS policies include a condition: `OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')` so admin can read all rows. Impersonation is then a UX filter (show data as if that user) applied in API layer.

Prefer **Option A** for admin APIs (server uses service role and applies filters for impersonation) so RLS stays simple for courier/shipper.

### 5.3 Vehicle locations

- Allow SELECT for a row in `vehicle_locations` only if there exists an active `vehicle_access` for that `vehicle_id` and the current user is the courier (or admin). Example:

  `EXISTS (SELECT 1 FROM vehicle_access va JOIN couriers c ON c.id = va.courier_id WHERE va.vehicle_id = vehicle_locations.vehicle_id AND c.user_id = auth.uid() AND va.is_active AND now() BETWEEN va.wef_dt AND va.exp_dt)`

---

## 6. API Summary by Role

| Resource | Admin | Courier | Shipper |
|----------|-------|---------|---------|
| List couriers | Yes (all) | No | No |
| List shippers | Yes (all) | No | No |
| Impersonate | Yes (set context) | No | No |
| Own profile | Yes | Yes (own) | Yes (own) |
| Couriers CRUD | Yes | No | No |
| Shippers CRUD | Yes | No | No |
| Vehicles | Yes (all) | No | Yes (own) |
| Leads | Yes (all) | Read (for notifications) | Yes (own) |
| Negotiations/offers | Yes (all) | Yes (own) | Yes (own) |
| Contracts | Yes (all) | Yes (own) | Yes (own) |
| Trips | Yes (all) | Yes (own) | Yes (own) |
| Vehicle access | Yes (all) | Yes (own, active) | Yes (own vehicles) |
| Vehicle location | Yes (all) | Yes (if access) | No (or own vehicles only) |
| Chat | Yes (all) | Yes (own) | Yes (own) |
| Invoices | Yes (all) | Yes (own) | Yes (own) |
| Loads (admin) | Yes | No | No |
| Tickets | Yes | Yes (own if allowed) | Yes (own if allowed) |

"Own" means scoped by `courier_id` or `shipper_id` equal to the identity of the current user (or impersonated user when admin uses view-as).
