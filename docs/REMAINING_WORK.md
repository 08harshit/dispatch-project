# Dispatch Project – Remaining Work

This document tracks what is completed, in progress, and remaining across the Dispatch project (Admin, Courier, Shipper portals and dispatch-server).

---

## 1. Authentication and Portals

### 1.1 Separate Portals (Current State)

**There are three separate portals**, each a distinct app with its own URL:

| Portal | App Path | Auth Entry | Typical Port (dev) |
|--------|----------|------------|-------------------|
| **Admin** | `Admin_Dispatch-main/` | `/auth` | 8080 |
| **Courier** | `courier_Dispatch-main/` | Auth page (e.g. `/auth`) | 8080 |
| **Shipper** | `Shipper_Dispatch-main/` | `/landing` (AuthForm in section) | 8080 |

**Differentiation today:**
- Users reach the correct portal by URL (admin.example.com vs courier.example.com vs shipper.example.com).
- Role is set when Admin creates a courier/shipper (Supabase `app_metadata: { role: "courier" }` or `{ role: "shipper" }`).
- Admin users: typically created via seed or manual Supabase setup (`user_metadata: { role: "admin" }`).
- **No enforcement:** A courier can log in at the Admin URL and see the Admin UI. The API does not enforce role-based access; all authenticated users can call all routes.

### 1.2 Remaining: Role-Based Access and Single vs Multi-Portal

| Item | Status | Notes |
|------|--------|-------|
| **Enforce role at API** | Not done | Add `requireRole(["admin"])` for admin-only routes; `requireRole(["courier"])` for courier-scoped routes, etc. |
| **Single portal with role routing** | Not done | If consolidating to one URL: after login, redirect to `/admin`, `/courier`, or `/shipper` based on `user.role`. |
| **Prevent cross-portal access** | Not done | Admin app could check `role === "admin"` and redirect others; same for Courier/Shipper. |

---

## 2. Forgot Password

| Portal | Status | Notes |
|--------|--------|-------|
| **Admin** | Done, pushed | Commit `b16f5da` on `feature/forgot-password` |
| **Courier** | Done, not pushed | Implemented in `AuthPage.tsx` |
| **Shipper** | Done, not pushed | Implemented in `AuthForm.tsx` |

**Action:** Commit and push Courier and Shipper forgot password.

**Supabase:** Add redirect URLs for password reset in Supabase dashboard, e.g.:
- Admin: `http://localhost:8080/auth`, production URL
- Courier: `http://localhost:8081/auth` (or Courier port)
- Shipper: `http://localhost:8082/landing` (or Shipper port)

---

## 3. State Management

| Item | Status | Notes |
|------|--------|-------|
| **Global state** | In development | Partner is implementing. Current apps use React state, TanStack Query, and Supabase for data. |

---

## 4. Contracts

| Item | Status | Notes |
|------|--------|-------|
| **Contracts API** | Enabled | `GET /api/contracts`, `GET /api/contracts/:id`, `POST /api/contracts` |
| **Shipper accept bid** | Done | Shipper `useNegotiations` calls `POST /api/contracts` when accepting an offer |
| **Contract detail page** | Not done | No `/contracts/:id` detail view; only list and create |

---

## 5. Trips and Trip Events

| Item | Status | Notes |
|------|--------|-------|
| **Trips API** | Disabled | `tripRoutes` commented out in `dispatch-server/src/routes/index.ts` |
| **Trip events API** | Exists | `POST /api/trips/:id/events` in trips router (not reachable while trips disabled) |
| **Admin: record pickup/delivery scan** | Not done | TripDetail has no "Record pickup scan" / "Record delivery scan" actions |
| **Enable trips route** | Pending | Uncomment `tripRoutes` in routes index |

---

## 6. GPS Tracking

| Item | Status | Notes |
|------|--------|-------|
| **Current vehicle location** | Not started | No `vehicle_locations` table or equivalent |
| **Location API** | Not started | No "current location" or location history endpoint |
| **Map integration** | Not started | No Google Maps or similar for live tracking |

**Possible approach:**
1. **Schema:** Add `vehicle_locations` (vehicle_id, lat, lng, recorded_at) or use a real-time service.
2. **Data source:** Courier mobile/web app sends location (e.g. periodic POST or WebSocket).
3. **API:** `GET /api/trips/:id/location` or `GET /api/vehicles/:id/location` for latest position.
4. **Frontend:** Map component (e.g. Leaflet, Google Maps) to show trip/vehicle on map.
5. **Privacy:** Only expose location to shipper during active trip (vehicle_access).

---

## 7. Other Remaining Items

### 7.1 Backend

| Item | Status | Notes |
|------|--------|-------|
| **Vehicles route** | Disabled | Uncomment to enable vehicle CRUD |
| **Vehicle access route** | Disabled | Uncomment for read-only vehicle access list |
| **Shipper status/delete** | Stub | `PATCH /shippers/:id/status` and `DELETE /shippers/:id` return success but do not update DB |
| **Shipper history/documents** | Stub/empty | `GET /api/shippers/:id/history` returns `[]`; documents endpoints are stubs |
| **Load documents/history** | Stub | `POST /api/loads/:id/documents` returns 501; `GET /api/loads/:id/history` returns empty |
| **Settings API** | Stub | `/api/settings` is placeholder; no company/user_settings schema |

### 7.2 Admin Portal

| Item | Status | Notes |
|------|--------|-------|
| **Vehicle Access page** | Not done | Backend ready; no Admin UI for active vehicle_access records |
| **Trip events from Admin** | Not done | Add "Record pickup scan" / "Record delivery scan" in TripDetail |
| **Admin Plus (impersonation)** | Not done | Client selector to view as courier/shipper; `X-Impersonate-User-Id` |
| **Settings Company/Security** | UI only | No real save; no schema |

### 7.3 Future Work (from FUTURE_WORK.md)

| Item | Status |
|------|--------|
| Vehicle Access modal (instead of page nav) | Not done |
| Client-side filtering | Not done |
| Dashboard metric card links | Admin done; Courier/Shipper have links |

### 7.4 Not Started

| Item | Notes |
|------|-------|
| **Chat / bidding window** | In-app chat; time-limited bidding |
| **Smart planner** | Split load across multiple vehicles |
| **Notifications (lifecycle)** | Agreement, trip starting, about to end (beyond trip-completed) |

---

## 8. Summary Table

| Category | Item | Status |
|----------|------|--------|
| Auth | Forgot password (Courier, Shipper) | Done, not pushed |
| Auth | Role-based API enforcement | Not done |
| Auth | Single vs multi-portal clarity | Documented; no enforcement |
| State | Global state management | In development (partner) |
| Contracts | API + Shipper accept bid | Done |
| Contracts | Contract detail page | Not done |
| Trips | Enable trips route | Pending |
| Trips | Admin record pickup/delivery scan | Not done |
| GPS | Schema, API, map integration | Not started |
| Backend | Vehicles, vehicle-access routes | Disabled |
| Backend | Shipper status/delete, history/docs | Stub |
| Admin | Vehicle Access page, Trip events, Admin Plus | Not done |

---

*Last updated: reflects current codebase state including Courier/Shipper completion plan work.*
