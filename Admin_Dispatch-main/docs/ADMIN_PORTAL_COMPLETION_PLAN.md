# Admin Portal Completion Plan

## Executive Summary

This document outlines what is finished, what is broken, and what remains to deliver a complete Admin portal for the Dispatch project. The goal is client-ready delivery.

---

## 1. Current State Audit

### 1.1 Pages and API Wiring

| Page | API Wired | Status | Notes |
|------|-----------|--------|-------|
| Dashboard (Index) | Yes | Partial | Stats and recent activity from API; notifications/alerts are hardcoded |
| Couriers | Yes | Complete | Full CRUD via API |
| Shippers | Yes | Complete | List, add, edit via API |
| Loads | Yes | Complete | List, create, stats, filters |
| Contracts | Yes | Incomplete | List only; no Create Contract UI |
| Trips | Yes | Complete | List, detail, events |
| TripDetail | Yes | Complete | Trip info, events, link to contract |
| Accounting | Yes | Complete | Stats, transactions, invoice download |
| Analytics | Yes | Complete | Stats, trends, performance from API |
| Tickets | Yes | Complete | List, create, status, comments, delete |
| Settings | Yes | Bug | Profile, notifications, password work; Company and Security sections call undefined `handleSave()` |
| **Vehicles** | **N/A** | **Missing** | No page exists; backend has full API |

### 1.2 Known Bugs

1. **Settings.tsx**
   - Line 385: `onClick={() => handleSave("Company")}` — `handleSave` is not defined. Will throw at runtime.
   - Line 750: `onClick={() => handleSave("Security")}` — same issue.
   - **Fix:** Define `handleSave` (e.g. toast "Coming soon" or wire to a real API if Company/Security endpoints exist), or remove/hide those buttons.

2. **Loads stats**
   - Backend `/api/loads/stats` returns `inTransit: 0` and `delivered: 0` always (leads table uses `open`, `completed`, `cancelled`).
   - **Fix:** Either derive in-transit/delivered from trips (leads with active trips) or map lead statuses correctly in the backend.

3. **Sidebar LogOut** (if still occurring)
   - `LogOut` is the Lucide icon; ensure it is imported. Current code imports it; if error persists, check for typos (e.g. `Logout` vs `LogOut`).

### 1.3 Backend Stubs (No Real Implementation)

These endpoints return placeholder data or no-op:

- `PATCH /api/shippers/:id/status` — returns success message only; does not update DB.
- `DELETE /api/shippers/:id` — returns success only; does not delete.
- `GET /api/shippers/:id/history` — returns empty array.
- `POST /api/shippers/:id/documents` — stub.
- `DELETE /api/shippers/:id/documents/:docId` — stub.
- `POST /api/shippers/:id/password` — stub.

For client delivery, decide: implement these or hide/disable the UI that calls them.

---

## 2. Missing Features for Client Delivery

### 2.1 Critical (Must Have)

| Item | Description | Effort |
|------|-------------|--------|
| **Fix Settings handleSave** | Define or remove `handleSave` for Company and Security sections to prevent runtime error. | Small |
| **Create Contract UI** | Admin needs to create contracts (e.g. when facilitating a deal). Form: select lead, courier, shipper, amount, pickup_time, expected_reach_time, start_location, end_location, optional vehicle_id. Call `POST /api/contracts`. | Medium |
| **Vehicles Page** | New page: list vehicles (by courier), create, edit, view. Use existing `GET/POST/PUT/PATCH /api/vehicles`. Add route and sidebar link. | Medium |

### 2.2 High Value (Should Have)

| Item | Description | Effort |
|------|-------------|--------|
| **Loads: Edit** | Edit load (lead) — backend may need `PUT /api/loads/:id` if not present. | Small–Medium |
| **Loads: Delete** | Delete/cancel load — backend may need `DELETE` or status update. | Small |
| **Dashboard alerts from API** | Replace hardcoded alerts in Index and AlertsCard with `GET /api/dashboard/alerts`. Backend returns empty today; can populate from compliance/license/insurance rules later. | Small |
| **Loads stats: inTransit/delivered** | Map lead status or join trips so stats show meaningful in-transit and delivered counts. | Small |

### 2.3 Nice to Have

| Item | Description | Effort |
|------|-------------|--------|
| **Vehicle Access (read-only)** | Optional Admin view of active vehicle_access records (shipper can view vehicle during trip). Backend has `GET /api/vehicle-access`. | Small |
| **Shipper status toggle** | Wire `handleToggleStatus` to `PATCH /api/shippers/:id/status` and implement backend. | Small |
| **Shipper delete** | Implement `DELETE /api/shippers/:id` and wire UI. | Small |
| **Admin "Plus" (impersonation)** | Client selector to view as courier/shipper. Per original requirements; requires `X-Impersonate-User-Id` and admin-only APIs. | Large |

---

## 3. Implementation Order

### Phase 1: Fix Bugs and Blockers (Day 1)

1. **Settings handleSave**
   - Add `const handleSave = (section: string) => toast.info(`${section} — coming soon`);` or implement real save for Company/Security if APIs exist.
   - Alternatively, hide or disable the Company and Security save buttons until backend is ready.

2. **Verify Sidebar LogOut**
   - Confirm `LogOut` is imported from `lucide-react` and used as icon component only.

### Phase 2: Critical Features (Days 2–3)

3. **Create Contract UI**
   - Add "Create Contract" button on Contracts page.
   - Dialog/form: fetch leads (open), couriers, shippers; fields: lead_id, courier_id, shipper_id, amount, pickup_time, expected_reach_time, start_location, end_location, vehicle_id (optional).
   - On submit: `createContract(payload)`; on success, refresh list and optionally navigate to new trip.

4. **Vehicles Page**
   - Create `src/pages/Vehicles.tsx`.
   - List vehicles with filters (courier_id, is_available).
   - Add vehicle form: courier_id, reg_no, vehicle_type, vin, is_available.
   - Edit: reuse form or inline edit.
   - Add route `/vehicles` and sidebar item "Vehicles".

### Phase 3: Polish (Days 4–5)

5. **Loads Edit**
   - Add `PUT /api/loads/:id` if missing.
   - Loads table: change "Edit coming soon" to open edit dialog; call update API.

6. **Loads Delete**
   - Add `DELETE /api/loads/:id` or `PATCH` to set status cancelled.
   - Wire delete action to API.

7. **Dashboard alerts**
   - Index: replace hardcoded `alerts` with `fetchDashboardAlerts()`.
   - AlertsCard: use API data; show empty state when none.

8. **Loads stats**
   - Backend: derive inTransit (leads with active trips) and delivered (leads with completed trips) or map statuses in `/api/loads/stats`.

### Phase 4: Optional (Post-MVP)

9. Vehicle Access read-only page.
10. Shipper status/delete backend + UI.
11. Admin Plus impersonation.

---

## 4. Pre-Delivery Checklist

- [ ] All pages load without runtime errors.
- [ ] Settings: no undefined function calls.
- [ ] Create Contract works end-to-end (contract + trip created).
- [ ] Vehicles CRUD works.
- [ ] Loads: create, list, filters work.
- [ ] Accounting: invoice download produces valid PDF/HTML.
- [ ] Auth: 401 redirects to `/auth`; session persists.
- [ ] Migrations applied to Supabase; no "table not found" for core entities.
- [ ] Environment: `VITE_API_BASE_URL` points to correct dispatch-server.

---

## 5. File Reference

| Area | Key Files |
|------|-----------|
| Routes | `App.tsx` |
| Sidebar | `src/components/layout/Sidebar.tsx` |
| Settings | `src/pages/Settings.tsx` |
| Contracts | `src/pages/Contracts.tsx`, `src/services/contractService.ts` |
| Loads | `src/pages/Loads.tsx`, `src/services/loadService.ts` |
| Vehicles (new) | `src/pages/Vehicles.tsx`, `src/services/vehicleService.ts` (create) |
| Dashboard | `src/pages/Index.tsx`, `src/components/dashboard/AlertsCard.tsx`, `src/services/dashboardService.ts` |
| API base | `src/services/api.ts` |

---

## 6. Summary

**Must fix:** Settings `handleSave` bug.

**Must build:** Create Contract UI, Vehicles page.

**Should build:** Loads Edit/Delete, Dashboard alerts from API, Loads stats mapping.

**Optional:** Vehicle Access view, Shipper status/delete, Admin Plus.

Estimated effort for critical path: 2–3 days. Full polish: 4–5 days.
