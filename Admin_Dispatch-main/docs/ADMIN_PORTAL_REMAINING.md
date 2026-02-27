# Admin Portal – What Remains

This document lists what is still remaining in the Admin portal after the completion work (Settings fix, Create Contract, Vehicles page, Loads Edit/Delete, Dashboard alerts, Loads stats).

---

## Completed (as of this doc)

- **Settings:** Fixed `handleSave` bug; Company and Security sections show "coming soon" toast.
- **Contracts:** Create Contract UI with form (lead, courier, shipper, amount, times, locations, optional vehicle).
- **Vehicles:** Full page with list, add, edit; filter by courier.
- **Loads:** Edit dialog; Delete (soft cancel via API); stats derive inTransit/delivered from trips.
- **Dashboard:** Alerts from API (`fetchDashboardAlerts`); fallback to mock when API returns empty.
- **Backend:** PUT/DELETE for loads; loads stats use trips for inTransit/delivered.

---

## Remaining (Optional / Future)

### 1. Vehicle Access (read-only)

- **What:** Admin view of active `vehicle_access` records (shipper can view vehicle during trip).
- **Backend:** `GET /api/vehicle-access` exists.
- **Frontend:** No page yet. Could add a simple read-only list under Vehicles or a separate "Vehicle Access" section.
- **Effort:** Small.

### 2. Shipper Status Toggle and Delete

- **What:** Wire Shipper page "toggle status" and "delete" to real backend.
- **Backend:** `PATCH /api/shippers/:id/status` and `DELETE /api/shippers/:id` currently return success without updating DB.
- **Frontend:** `handleToggleStatus` updates local state only; delete action not wired.
- **Effort:** Small (backend + frontend).

### 3. Shipper History and Documents

- **What:** Shipper detail history and documents.
- **Backend:** `GET /api/shippers/:id/history` returns `[]`; documents endpoints are stubs.
- **Frontend:** HistoryDialog and DocumentsDialog may show empty when opened from Shippers.
- **Effort:** Medium (requires `shipper_history` and `shipper_documents` tables or equivalent).

### 4. Admin "Plus" (Impersonation)

- **What:** Admin selects a courier or shipper and views the app as that user (like the reference XSWIFT "Select FO Admin").
- **Backend:** Need `GET /api/admin/couriers` and `GET /api/admin/shippers` (list accounts); support `X-Impersonate-User-Id` header so subsequent APIs return data scoped to that user.
- **Frontend:** Client selector in header; pass impersonation context to API.
- **Effort:** Large.

### 5. Settings – Company and Security

- **What:** Real save for Company (organization details) and Security (2FA, sessions).
- **Backend:** No `company` or `user_settings` table yet; Security section is UI-only.
- **Effort:** Medium (schema + API + UI).

### 6. Loads – Full CRUD and Documents

- **What:** Load documents upload/delete; load history from API.
- **Backend:** `POST /api/loads/:id/documents` and `DELETE /api/loads/:id/documents/:docId` return 501; `GET /api/loads/:id/history` returns empty.
- **Effort:** Medium.

### 7. Trip Events – Add from Admin

- **What:** Admin records pickup_scan and delivery_scan to progress/complete trips.
- **Backend:** `POST /api/trips/:id/events` exists.
- **Frontend:** TripDetail could have "Record pickup scan" / "Record delivery scan" actions.
- **Effort:** Small–Medium.

### 8. Contract Detail Page

- **What:** Dedicated contract detail page (like TripDetail) with full contract info, linked trip, and actions.
- **Current:** Contracts table links to trips; no `/contracts/:id` detail view.
- **Effort:** Small.

---

## Summary Table

| Item                    | Priority | Effort  | Notes                                      |
|-------------------------|----------|---------|--------------------------------------------|
| Vehicle Access view     | Low      | Small   | Backend ready                              |
| Shipper status/delete   | Medium   | Small   | Backend stubs need implementation          |
| Shipper history/docs    | Low      | Medium  | Requires schema                            |
| Admin Plus              | High     | Large   | Per original client requirements           |
| Settings Company/Security | Low    | Medium  | Schema + API                               |
| Loads documents/history | Low      | Medium  | Backend 501                                |
| Trip events from Admin  | Medium   | Small   | Backend ready                              |
| Contract detail page    | Low      | Small   | UX improvement                             |

---

*Last updated after Admin portal completion work (Settings, Create Contract, Vehicles, Loads Edit/Delete, Dashboard alerts, Loads stats).*
