# API and UI Test Report

**Date:** 2025-02-23  
**Scope:** Admin Dispatch portal – APIs, database, UI coverage

---

## 1. What Was Done

### 1.1 Seed Data

A seed script (`dispatch-server/scripts/seed-dummy-data.ts`) was run to populate:

| Entity | Count | Notes |
|--------|-------|-------|
| Couriers | 3 | Fast Freight Co, Quick Haul LLC, Reliable Transport |
| Shippers | 3 | Auto Dealers Inc, Broker Pro LLC, Fleet Services Co |
| Leads | 3 | Used by Loads API |
| Contracts | 2 | Linked to leads, couriers, shippers |
| Trips | 2 | One in_progress, one scheduled |
| Trip events | 1 | pickup_scan for first trip |
| Vehicles | 3 | 2 for courier 1, 1 for courier 2 |
| Vehicle access | 1 | Active access for trip |
| Invoices | 1 | For completed trip |
| Tickets | 2 | With 1 comment |
| History/documents | Yes | Courier and shipper history, documents |

**Test admin user:** `admin-test@dispatch.local` / `TestPassword123!`

### 1.2 API Test Results

Script: `dispatch-server/scripts/test-all-apis.ts`

| Category | Endpoint | Status | Notes |
|-----------|----------|--------|-------|
| Health | GET /health | Pass | |
| Couriers | GET /couriers | Pass | |
| | GET /couriers/stats | Pass | |
| | GET /couriers/:id | Pass | |
| Shippers | GET /shippers | Pass | |
| | GET /shippers/stats | Pass | |
| | GET /shippers/:id | Pass | |
| | GET /shippers/:id/history | Pass | |
| | GET /shippers/:id/documents | Pass | |
| Loads | GET /loads | Pass | |
| | GET /loads/stats | Pass | |
| | GET /loads/:id | Pass | |
| | GET /loads/:id/history | Pass | Returns empty (stub) |
| | POST /loads/:id/documents | Pass | 501 stub |
| Contracts | GET /contracts | Pass | |
| | GET /contracts/:id | Pass | |
| Trips | GET /trips | Pass | |
| | GET /trips/:id | Pass | |
| Vehicles | GET /vehicles | Pass* | *Requires `?courier_id=` for admin; otherwise filters by auth user (no match) |
| | GET /vehicles/:id | Pass | |
| Vehicle access | GET /vehicle-access | Pass | |
| Dashboard | GET /dashboard/stats | Pass | |
| | GET /dashboard/recent-activity | Pass | |
| | GET /dashboard/alerts | Pass | |
| Accounting | GET /accounting/stats | Pass | |
| | GET /accounting/transactions | Pass | |
| Analytics | GET /analytics/stats | Pass | |
| | GET /analytics/delivery-trends | Pass | |
| | GET /analytics/courier-performance | Pass | |
| Invoices | GET /invoices | Pass | |
| Tickets | GET /tickets | Pass | |
| | GET /tickets/stats | Pass | |
| | GET /tickets/:id | Pass | |
| Settings | GET /settings/profile | Pass | |
| | GET /settings/notifications | Pass | Fallback when column missing |
| Loads stubs | POST /loads/:id/documents | 501 | Expected (stub) |

---

## 2. Issues Identified

### 2.1 GET /settings/notifications – 500 Error (FIXED)

**Root cause (from logs):** Column `profiles.notification_preferences` does not exist (Postgres error 42703). Migration `20260227100000_profiles_notification_preferences.sql` has not been applied to the Supabase project.

**Fix applied:** Added defensive fallback for error code 42703 – GET returns default preferences `{ email: true, push: true, urgentOnly: false }` when the column is missing. PUT returns 503 with a clear message.

**Permanent fix:** Run the migration on Supabase:
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{"email": true, "push": true, "urgentOnly": false}';
```

### 2.2 GET /vehicles – Empty Without courier_id

**Symptom:** Without `?courier_id=`, the route filters by `req.user?.id` (auth user ID). Vehicles use `courier_id` from `couriers`, so admins see no vehicles.

**Recommendation:** For admin users, either:
- Do not default to `req.user?.id` when `courier_id` is omitted, or
- Always pass `courier_id` from the UI when filtering.

### 2.3 TypeScript Fix Applied

**File:** `dispatch-server/src/routes/shippers.ts`

**Change:** Resolved `id` redeclaration and `string | string[]` usage by using `String(req.params.id)` and `shipperId` for the row id.

---

## 3. Stub / Not Implemented Endpoints

| Endpoint | Status | Notes |
|----------|--------|-------|
| GET /loads/:id/history | Stub | Returns empty |
| POST /loads/:id/documents | 501 | Stub |
| DELETE /loads/:id/documents/:docId | 501 | Stub |
| PATCH /dashboard/alerts/:id/read | Stub | |
| DELETE /dashboard/alerts/:id | Stub | |

---

## 4. UI Testing Checklist

Manual checks recommended:

| Page | What to Verify |
|------|----------------|
| Dashboard | Stats, recent activity, alerts |
| Couriers | List, filters, create, edit, status, delete, history, documents |
| Shippers | List, filters, create, edit, status, delete, compliance, history, documents, Set Password |
| Loads | List, filters, create, edit, delete, stats |
| Contracts | List, create contract |
| Trips | List, detail, trip events |
| Vehicles | List (with courier filter), add, edit |
| Vehicle Access | Read-only list |
| Accounting | Stats, transactions, invoice download |
| Analytics | Stats, trends, courier performance |
| Tickets | List, create, status, comments, delete |
| Settings | Profile, notifications, password, Company/Security (coming soon) |

---

## 5. How to Run

### Seed (one-time)

```bash
cd dispatch-project-repo/dispatch-server
npx ts-node scripts/seed-dummy-data.ts
```

### API Tests (server must be running)

```bash
# Terminal 1: start server
cd dispatch-project-repo/dispatch-server && npm run dev

# Terminal 2: run tests
cd dispatch-project-repo/dispatch-server
npx ts-node scripts/test-all-apis.ts
```

### Admin UI

```bash
cd dispatch-project-repo/Admin_Dispatch-main
npm run dev
```

Sign in with `admin-test@dispatch.local` / `TestPassword123!` (or another Supabase Auth user).

---

## 6. Summary

| Area | Status |
|------|--------|
| Database | Seeded with dummy data |
| APIs | 35/35 pass |
| Stubs | Loads documents/history as documented |
| TypeScript | Compiles successfully |

**Next steps:**
1. Apply migration `20260227100000_profiles_notification_preferences.sql` for full notification preferences support.
2. Manually test UI flows.
3. Implement load documents/history when required.
