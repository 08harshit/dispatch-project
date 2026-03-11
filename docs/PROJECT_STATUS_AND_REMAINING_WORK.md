# Dispatch Project: Status and Remaining Work

A comprehensive document of what has been completed across the project and what remains, including the smallest details.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [What Has Been Done](#2-what-has-been-done)
3. [What Remains](#3-what-remains)

---

## 1. Project Overview

The Dispatch project consists of:

| Module | Path | Purpose |
|--------|------|---------|
| **Admin Portal** | `Admin_Dispatch-main/` | Admin dashboard for managing couriers, shippers, loads, trips, tickets |
| **Courier Portal** | `courier_Dispatch-main/` | Courier app for loads, saved loads, accounting, analytics |
| **Shipper Portal** | `Shipper_Dispatch-main/` | Shipper app for posting loads, accounting, communication |
| **Backend API** | `dispatch-server/` | Express API with Supabase |

---

## 2. What Has Been Done

### 2.1 Authentication

| Item | Admin | Courier | Shipper |
|------|-------|---------|---------|
| Login / Sign up | Done | Done | Done |
| Forgot password | Done | Done | Done |
| Password reset flow | Done | Done | Done |
| Auth error handling (OTP expiry, hash params) | Done | Done | Done |
| Protected routes | Done | Done | Done |
| 401 redirect to login | Done | Done | Done |
| Offline overlay | Done | Done | Done |
| Logout wired to signOut + redirect | Done | Done | Done |

### 2.2 Shipper Module (Recent Audit)

| Item | Status |
|------|--------|
| Sidebar logout wired to `signOut()` and redirect to `/landing` | Done |
| Status change uses `PATCH /loads/:id/status` instead of direct Supabase `activity_log` | Done |
| Backend handles `in-transit` status (sets `is_locked: true`) | Done |
| `performed_by` in Accounting uses `user?.email ?? "Shipper"` | Done |
| `currentPickupCoords` initialized to null; derived from form when available | Done |
| VehicleSelector: mock inventory removed; only "Add New Vehicle" | Done |
| `mockVehicles.ts` deleted | Done |
| ViewDocsModal: mock docs removed; empty state when no documents | Done |
| Hardcoded badges removed (Sidebar, Home, Communication) | Done |
| Placeholder year uses `new Date().getFullYear()` | Done |
| index.html TODOs removed; title set to "Shipper Dispatch" | Done |
| Home dashboard uses `GET /dashboard/shipper-overview` | Done |
| Shipping page uses `GET /loads?shipper_id=X` via `useShipperLoads` | Done |
| Post Vehicle creates load via `POST /loads` | Done |

### 2.3 Backend API

| Area | Status |
|------|--------|
| Health check, `/me` | Done |
| Couriers CRUD, stats, verify FMCSA, documents, compliance, password | Done |
| Shippers CRUD, stats, documents, compliance, password | Done |
| Loads CRUD, stats, status, history, documents | Done |
| Contracts list, create, get by ID | Done |
| Trips list, get, cancel, events | Done |
| Dashboard: courier-overview, shipper-overview, admin overview, stats, recent-activity, alerts | Done |
| Accounting stats, transactions | Done |
| Analytics stats, delivery-trends, courier-performance | Done |
| Invoices list, get by ID | Done |
| Saved loads (courier) | Done |
| Settings profile, password, notifications | Done |
| Tickets, ticket comments | Done |
| Cron: expire vehicle access, process notifications | Done |

### 2.4 Admin Portal

| Item | Status |
|------|--------|
| Couriers page with list, create, edit, FMCSA verify | Done |
| Shippers page with list, create, edit | Done |
| Loads page | Done |
| Trips page, TripDetail with scan recording, cancel | Done |
| Communication page | Done |
| Analytics page | Done |
| Tickets page | Done |
| Settings page (partial) | Done |
| Dashboard with overview, stats, recent activity | Done |
| Address autocomplete (Supabase function) | Done |

### 2.5 Courier Portal

| Item | Status |
|------|--------|
| Dashboard via `GET /dashboard/courier-overview` | Done |
| Loads page (assigned loads) | Done |
| Saved loads via `GET /saved-loads` | Done |
| Accounting via `/accounting/stats`, `/accounting/transactions` | Done |
| Analytics via `/analytics/*` | Done |
| Load notifications (shipper Supabase or demo fallback) | Done |
| Auth, forgot password | Done |

---

## 3. What Remains

### 3.1 Shipper Module – Remaining

#### 3.1.1 Mock/Stub Data to Replace

| File | Lines | Description |
|------|-------|-------------|
| `src/pages/Communication.tsx` | 32–59, 75–76, 105 | `mockConversations` and `mockMessages` – entire Messages tab is mock |
| `src/components/communication/CallsTab.tsx` | 7–15, 38, 52 | `mockCalls` – Calls tab is mock |
| `src/components/communication/EmailsTab.tsx` | 10–16, 20 | `mockEmails` – Emails tab is mock |
| `src/data/exampleConditionReport.ts` | 1–224 | `createExampleConditionReport()` – used when no DB report exists |
| `src/components/shipping/ConditionReportModal.tsx` | 66–68 | Uses `createExampleConditionReport(vehicleId)` as initial state |
| `src/pages/Analytics.tsx` | 22–117 | Hardcoded `weeklyData`, `monthlyData`, `quarterlyData`, `yearlyData`, `routeDistribution`, `keyMetrics`, `topRoutes` |
| `src/hooks/useSettings.ts` | 38–61 | `defaultSettings` – hardcoded profile ("John Smith", "john@shipperdispatch.com") |

#### 3.1.2 Direct Supabase Calls to Migrate to Backend API

| File | Usage |
|------|-------|
| `src/pages/Accounting.tsx` | Direct `accounting_records`, `accounting_history` CRUD and realtime subscription |
| `src/hooks/useNegotiations.ts` | `negotiations`, `offers`, `leads`, `supabase.functions.invoke('negotiate')` |
| `src/hooks/useShipmentDocuments.ts` | `shipment_documents` table, `supabase.storage` for uploads |
| `src/hooks/useConditionReports.ts` | `condition_reports` table |
| `src/hooks/useCouriers.ts` | `couriers` table |
| `src/hooks/useDriverNotifications.ts` | `driver_notifications`, `find-closest-driver` invoke |
| `src/hooks/useAutoMatching.ts` | `couriers`, `driver_notifications`, `find-closest-driver` invoke |
| `src/components/shipping/MatchingHistoryModal.tsx` | `activity_log`, `driver_notifications`, `negotiations`, `matching_requests` |
| `src/components/shipping/DriverMapView.tsx` | `couriers` for nearby drivers |
| `src/components/dashboard/AssignVehicleModal.tsx` | `verify-carrier` invoke |
| `src/components/shipping/CourierMatchingModal.tsx` | `verify-carrier` invoke |

#### 3.1.3 Hardcoded Values

| File | Value | Notes |
|------|-------|-------|
| `src/services/api.ts` | `"http://localhost:4000/api"` | Fallback API base URL |
| `src/components/shipping/AutoMatchingModal.tsx` | `pickupLatitude = 36.29`, `pickupLongitude = 6.73` | Default coordinates when not provided |
| `src/components/shipping/DriverMapView.tsx` | `50000` | "Nearby" drivers threshold (50 km in meters) |
| `src/components/shipping/DriverNotificationCard.tsx` | `120` | Timer max seconds |
| `src/components/shipping/AutoMatchingModal.tsx` | `120` | Same timer constant |
| `src/hooks/useNegotiations.ts` | `30 * 60 * 1000`, `10 * 60 * 1000` | Negotiation expiry (30 min), courier deadline (10 min) |
| `src/data/exampleConditionReport.ts` | `'https://www.carfax.com/vehicle/example'` | Example Carfax URL |
| `src/hooks/useSettings.ts` | `500` | Simulated save delay (ms) |
| `src/components/post-vehicle/AddressMapPicker.tsx` | `[39.8283, -98.5795]` | US center for map init |

#### 3.1.4 UI/Localization

| File | Issue |
|------|-------|
| `src/components/shipping/MatchingHistoryModal.tsx` | French labels: "Historique des modifications", "Aucun historique disponible" |
| `src/components/accounting/AccountingHistoryModal.tsx` | Same French labels |

#### 3.1.5 Incomplete Features

| Feature | Location | Notes |
|---------|----------|-------|
| Communication (Messages, Calls, Emails) | `Communication.tsx`, `CallsTab`, `EmailsTab` | Fully mock; no real messaging/calls/email |
| Analytics | `Analytics.tsx` | All data hardcoded; no backend |
| Settings | `useSettings.ts` | LocalStorage only; no backend sync |
| Condition report PDF upload | `ConditionReportModal.tsx` | Uses `URL.createObjectURL`; no storage upload |
| Chain action | `Shipping.tsx` | `onChain` handler is `console.log` only |
| Toggle active | `Shipping.tsx` | `onToggleActive` only updates local state; no API |

#### 3.1.6 Error Handling Gaps

| File | Issue |
|------|-------|
| `useAutoMatching.ts` | `driver_notifications` query has no error handling |
| `useAutoMatching.ts` | `cancelMatching` errors only logged; no user feedback |
| `DriverMapView.tsx` | `fetchDrivers` errors logged; no UI feedback |
| `MatchingHistoryModal.tsx` | `fetchHistory` errors logged; no UI feedback |
| `useShipmentDocuments.ts` | Delete mutation: storage remove not awaited; failure not handled |
| `useGeocodeLocation.ts` | Geocoding errors set state; no retry or fallback |

#### 3.1.7 Dead/Debug Code

| File | Issue |
|------|-------|
| `Shipping.tsx` | `onChain={(v) => console.log("Chain:", v)}` – no real behavior |
| `PostVehicle.tsx` | `console.log("Form submitted:", formData)` – debug log |
| `ConditionReportModal.tsx` | Comment: "In a real app, upload to storage and get URL" |

---

### 3.2 Courier Module – Remaining

#### 3.2.1 Mock/Stub Data

| File | Description |
|------|-------------|
| `src/lib/demoAssignedLoads.ts` | Demo assigned loads in localStorage; 3 default loads |
| `src/data/mockNotifications.ts` | `mockNotifications`, `mockSimilarRoutes` |
| `src/data/mockLoads.ts` | `mockLoads` (not imported) |
| `src/data/mockRevenue.ts` | `mockRevenue` (not imported) |
| `src/data/mockCosts.ts` | `mockCosts` (not imported) |
| `src/hooks/useLoadNotifications.ts` | `createMockNotifications()` – 15 demo notifications when shipper Supabase returns nothing |
| `src/components/accounting/AccountingTable.tsx` | `mockRecords` – 6 hardcoded records (SHP-001–SHP-006) |
| `src/components/accounting/AccountingDocsDialog.tsx` | `getMockDocs()` – mock BOL/Invoice/VCR; mock download creates text blob |
| `src/components/loads/BOLViewerDialog.tsx` | Mock inspection data for pickup/delivery |
| `src/pages/CommunicationPage.tsx` | `initialMessages`, `initialEmails`, `initialCalls` – static data |
| `src/pages/Index.tsx` | `UNREAD_MESSAGES=3`, `UNREAD_EMAILS=2`, `MISSED_CALLS=1` – mock badge counts |
| `src/pages/AnalyticsPage.tsx` | Fallback `monthlyData`, `topRoutes` when API returns no trend data |

#### 3.2.2 Direct Supabase (Non-Auth)

| File | Usage |
|------|-------|
| `src/integrations/supabase/shipperClient.ts` | Shipper Supabase – load notifications from shipper project |
| `src/hooks/useLoadNotifications.ts` | `shipperSupabase.from("load_notifications")`, `load_offers`, realtime |
| `src/components/accounting/AddCostDialog.tsx` | `supabase.storage` – upload receipts |

#### 3.2.3 Hardcoded Values

| File | Value |
|------|-------|
| `src/integrations/supabase/shipperClient.ts` | `SHIPPER_SUPABASE_URL`, `SHIPPER_SUPABASE_ANON_KEY` fallbacks |
| `src/lib/demoAssignedLoads.ts` | VIN `"1HGBH41JXMN109186"`, zipcodes `"90210"`, `"85001"` |
| `src/components/loads/BOLViewerDialog.tsx` | OSRM URL |
| `src/components/loads/SmartRouteGuide.tsx` | Google Maps URL |
| `src/components/loads/RoutePickerMap.tsx` | Nominatim, OSRM, Leaflet URLs |
| `src/components/loads/LocationPicker.tsx` | OSRM, Nominatim URLs |
| `src/components/loads/RouteDayPlanner.tsx` | Nominatim reverse geocode URL |
| `src/components/loads/MultiLoadRouteMap.tsx` | Leaflet CDN URLs |
| `src/components/notifications/RouteMap.tsx` | Leaflet CDN URLs |

#### 3.2.4 Incomplete Features

| Feature | Notes |
|---------|-------|
| Assigned loads fallback | Uses demo loads when API returns none |
| Demo load acceptance | Accepts demo loads without auth |
| Accounting table | Uses `mockRecords` instead of API |
| Communication | All data from `initialMessages/Emails/Calls` |
| Analytics fallback | Hardcoded `monthlyData`, `topRoutes` when API empty |
| SmartRouteGuide | "Quick Skip Options (for demo/testing)" |
| SmartRouteNotifications | "Demo: Simulate arrival for testing" |

#### 3.2.5 TODO Comment

| File | Comment |
|------|---------|
| `src/lib/contractToLoad.ts` | `ampId: "AMP-" + (pickup.city.slice(0, 3) \|\| "XXX").toUpperCase()` – fallback `"XXX"` |

---

### 3.3 Admin Module – Remaining

#### 3.3.1 Mock/Stub Data

| File | Description |
|------|-------------|
| `index.html` | TODO comments for document title and og:title; title is "Lovable App" |
| `src/components/dashboard/AlertsCard.tsx` | `mockAlerts` – fallback when API returns empty |
| `src/components/dashboard/RecentActivityTable.tsx` | `mockActivities` – fallback when API returns empty |
| `src/services/ticketService.ts` | `mockTickets` – fallback when API fails |
| `src/services/analyticsService.ts` | `mockCourierPerformance` – fallback when API returns non-array |
| `src/components/AccountPasswordDialog.tsx` | Mock data |
| `src/components/communication/EmailsPanel.tsx` | Stub: `loadSignature`; stub: recipient search returns empty |

#### 3.3.2 Disabled Modules

| Module | Status |
|--------|--------|
| Contracts page | Route commented out (`MODULE DISABLED`) |
| Vehicles page | Route commented out (`MODULE DISABLED`) |
| Vehicle Access page | Route commented out (`MODULE DISABLED`) |

#### 3.3.3 Incomplete Features

| Feature | Notes |
|---------|-------|
| Settings – Company | `handleSave("Company")` → toast "coming soon" |
| Settings – Security | `handleSave("Security")` → toast "coming soon" |
| Accounting | `/accounting` redirects to `/analytics?tab=accounting` |
| Contracts | List only; no Create Contract UI |
| Vehicles | No page; backend API exists |
| Dashboard alerts | Hardcoded fallback; backend returns empty |
| Loads stats | `inTransit`/`delivered` always 0 |
| Settings page | French label "Historique" in one place |

#### 3.3.4 Hardcoded Values

| File | Value |
|------|-------|
| `src/services/api.ts` | `http://localhost:4000/api` |
| `src/pages/Couriers.tsx` | FMCSA URL |
| `src/utils/generateAccountingReport.ts` | Google Fonts URL |

---

### 3.4 Backend – Remaining

#### 3.4.1 Stub/Placeholder Endpoints

| Endpoint | Notes |
|----------|-------|
| `POST /couriers/:id/documents/:docId/upload` | Returns hardcoded success; no S3 upload |
| `GET /couriers/:id/documents/:docId/download` | Returns hardcoded presigned URL |
| `POST /loads/:id/documents` | Saves metadata only; file upload not implemented |
| `GET /accounting/report` | Returns `{ success: true, data: null }` |
| `PATCH /dashboard/alerts/:id/read` | Stub |
| `DELETE /dashboard/alerts/:id` | Stub |
| `GET /loads/:id/history` | Returns `[]` (lead_history may be empty) |

#### 3.4.2 Shipper vs Courier Support Gaps

| Route | Issue |
|-------|-------|
| `GET /contracts` | Only auto-resolves `courier_id`; no `shipper_id` for shipper users |
| `GET /trips` | `courier_id` only; no `shipper_id` filter |
| `GET /accounting/stats` | `courier_id` only; no shipper-scoped stats |
| `GET /accounting/transactions` | Same |
| `GET /analytics/stats` | Same |
| `GET /analytics/delivery-trends` | Same |
| `/saved-loads` | Courier-only; no shipper equivalent |
| `GET /invoices` | No role-based filtering |

#### 3.4.3 Disabled Routes

| Route | Status |
|-------|--------|
| `/vehicles` | Disabled in `routes/index.ts` |
| `/vehicle-access` | Disabled in `routes/index.ts` |

#### 3.4.4 TODO Comment

| File | Comment |
|------|---------|
| `src/services/courierService.ts:514` | `// TODO Phase 6: also delete from S3 using doc.s3_key` |

#### 3.4.5 Shipper Stubs (from REMAINING_WORK.md)

| Endpoint | Status |
|----------|--------|
| `PATCH /shippers/:id/status` | Stub – returns success but may not update DB |
| `DELETE /shippers/:id` | Stub |
| `GET /shippers/:id/history` | Returns `[]` |
| `POST /shippers/:id/documents` | Stub |
| `POST /shippers/:id/password` | Stub |

---

### 3.5 Cross-Cutting – Remaining

#### 3.5.1 Role-Based Access

| Item | Status |
|------|--------|
| Enforce role at API | Not done – no `requireRole` middleware |
| Prevent cross-portal access | Not done – courier can log in at Admin URL |
| Single portal with role routing | Not done |

#### 3.5.2 Document Storage

| Item | Status |
|------|--------|
| S3 or Supabase Storage for documents | Not implemented |
| Real file upload for loads, couriers, shippers | Metadata only |
| Document download presigned URLs | Stub |

#### 3.5.3 GPS / Live Tracking

| Item | Status |
|------|--------|
| `vehicle_locations` table | Not started |
| Location API | Not started |
| Map integration for live tracking | Not started |

#### 3.5.4 Future Work (from FUTURE_WORK.md)

| Item | Status |
|------|--------|
| Vehicle Access: modal instead of page nav | Not done |
| Client-side filtering | Not done |
| Chat / bidding window | Not started |
| Smart planner (split load across vehicles) | Not started |

#### 3.5.5 Trips Page Removal (Client Request)

| Item | Notes |
|------|-------|
| Shipper: Trips page | Not added (per client) |
| Admin: Trips page removal | Future exercise – client wants removed |

---

### 3.6 Environment and Config

| Item | Notes |
|------|-------|
| `.env` files | Not committed; ensure `.env.example` exists and is complete |
| `VITE_API_BASE_URL` | All frontends use fallback `http://localhost:4000/api` |
| Node version | Shipper build requires Node 20.19+ or 22.12+ |

---

## Summary Table

| Category | Done | Remaining |
|----------|------|-----------|
| Auth (login, forgot, reset, logout) | All 3 portals | Role enforcement |
| Shipper audit (logout, status API, stubs, badges, year) | Done | Communication, Analytics, Settings, Condition reports, Matching |
| Backend core APIs | Loads, contracts, trips, dashboard, accounting, analytics | Shipper-scoped accounting/analytics, document storage, vehicles |
| Admin | Couriers, Shippers, Loads, Trips, Analytics, Tickets | Contracts, Vehicles, Vehicle Access, Settings Company/Security |
| Courier | Dashboard, loads, saved, accounting, analytics | Mock fallbacks, demo loads, communication |
| Document storage | None | S3/Supabase for all document types |
| GPS tracking | None | Schema, API, map |

---

*Last updated: After Shipper module audit (PR #13).*
