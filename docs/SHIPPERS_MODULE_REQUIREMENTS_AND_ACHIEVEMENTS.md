# Shippers Module: Requirements and Achievements

## Document Purpose

This document provides an in-depth record of the original requirements for the Shippers module in the Admin portal, the implementation status at each stage, and what has been achieved to date. It serves as a reference for stakeholders, developers, and future maintenance.

---

## 1. Entity Definitions

This section defines all entities used in the Shippers module: database tables, enums, and frontend/API types.

### 1.1 Shippers (Core Entity)

**Definition:** A shipper is a business or organization that ships goods. The shipper entity holds the primary business and contact information for each shipper account.

**Database table:** `public.shippers`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `name` | TEXT | NOT NULL | Business or organization name |
| `contact_email` | TEXT | — | Primary contact email |
| `phone` | TEXT | — | Contact phone number |
| `address` | TEXT | — | Physical address |
| `business_type` | TEXT | — | Type of business (e.g. dealer, broker) |
| `city` | TEXT | — | City |
| `state` | TEXT | — | State or region |
| `tax_exempt` | BOOLEAN | DEFAULT false | Whether the shipper is tax exempt |
| `ein` | TEXT | — | Employer Identification Number |
| `hours_pickup` | TEXT | — | Pickup hours (e.g. "9am-5pm") |
| `hours_dropoff` | TEXT | — | Dropoff hours |
| `principal_name` | TEXT | — | Name of principal/owner |
| `compliance` | shipper_compliance | NOT NULL, DEFAULT 'non-compliant' | Compliance status |
| `status` | shipper_status | NOT NULL, DEFAULT 'active' | Account status (active/inactive) |
| `is_new` | BOOLEAN | DEFAULT true | Flag for newly added shippers |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update timestamp |
| `deleted_at` | TIMESTAMPTZ | — | Soft delete timestamp (NULL = not deleted) |

**Frontend type:** `Shipper` (in `shipperService.ts`) – camelCase mapping of DB columns; includes `history` and `documents` arrays populated from related tables.

---

### 1.2 Shipper History (Audit Log)

**Definition:** An immutable log of actions performed on a shipper. Each row represents a single event (create, update, status change, compliance change, delete, document add/delete, password update).

**Database table:** `public.shipper_history`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `shipper_id` | UUID | NOT NULL, FK → shippers(id) ON DELETE CASCADE | Parent shipper |
| `action` | TEXT | NOT NULL | Human-readable action description |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | When the action occurred |

**Example actions:** "Shipper created", "Shipper updated", "Status changed to inactive", "Compliance changed to compliant", "Shipper deleted (soft)", "Document added: License", "Document deleted: Insurance", "Password updated by Admin".

**Frontend shape:** `{ date: string; action: string }` – `date` is derived from `created_at` (YYYY-MM-DD).

---

### 1.3 Shipper Documents (Metadata)

**Definition:** Document metadata associated with a shipper. Stores name, type, and date only – no file storage. Used for licenses, insurance certificates, tax documents, etc.

**Database table:** `public.shipper_documents`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `shipper_id` | UUID | NOT NULL, FK → shippers(id) ON DELETE CASCADE | Parent shipper |
| `name` | TEXT | NOT NULL | Document name (e.g. "Business License") |
| `type` | TEXT | — | Document type (e.g. "License", "Insurance") |
| `date` | DATE | — | Document date |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | When the record was created |

**Note:** No `url`, `s3_key`, or file path – metadata only. File storage (S3/Supabase Storage) is out of scope.

**Frontend shape:** `{ id?: string; name: string; type: string; date: string }` – `id` required for delete operations.

---

### 1.4 Enums

| Enum | Values | Used By |
|------|--------|---------|
| `shipper_status` | `'active'`, `'inactive'` | `shippers.status` |
| `shipper_compliance` | `'compliant'`, `'non-compliant'` | `shippers.compliance` |

---

### 1.5 Derived / API Types

| Type | Purpose | Definition |
|------|---------|------------|
| **ShipperStats** | Aggregated counts for dashboard | `{ total, compliant, nonCompliant, new, alerts }` – computed from `shippers` where `deleted_at IS NULL` |
| **ShipperFilters** | Query parameters for list API | `{ search?, compliance?, status?, businessType?, state?, isNew? }` |
| **CreateShipperPayload** | Body for POST /shippers | `{ name, contact_email?, phone?, address?, business_type?, city?, state?, tax_exempt?, ein?, hours_pickup?, hours_dropoff?, principal_name? }` |

---

## 2. Original Requirements (Source)

The requirements were derived from a status overview comparing the Shippers module with the Couriers module and identifying gaps. The goal was to bring Shippers to feature parity with Couriers where applicable.

### 2.1 Completed (Fully Wired End-to-End) – Target State

| # | Functionality | Frontend (UI) | Service Layer | Backend Route | DB Tables | Status |
|---|--------------|---------------|---------------|--------------|-----------|--------|
| 1 | **List + Filter** | Tabs (All/Compliant/Non-compliant/New), dropdowns (business type, state), search bar | `fetchShippers(filters)` | `GET /shippers` with soft-delete + filter params | `shippers` | Required |
| 2 | **Stats Dashboard** | StatsGrid with 5 stats | `fetchShipperStats()` | `GET /shippers/stats` | `shippers` | Required |
| 3 | **Create Shipper** | AddShipperForm (4-tab) | `createShipper(payload)` | `POST /shippers` | `shippers` | Required |
| 4 | **Edit / Update Shipper** | AddShipperForm (edit mode) | `updateShipper(id, payload)` | `PUT /shippers/:id` | `shippers` | Required |
| 5 | **Toggle Active / Inactive** | Inline status pill | `updateShipperStatus(id, status)` | `PATCH /shippers/:id/status` | `shippers` | Required |
| 6 | **Delete Shipper** | Dropdown -> AlertDialog | `deleteShipper(id)` | `DELETE /shippers/:id` (soft delete) | `shippers` | Required |
| 7 | **View Details** | Dialog with business type, compliance, etc. | In-memory from list | Data from `GET /shippers` | — | Required |
| 8 | **Client-side Search** | Instant filter by name & ID | Local filter | — | — | Required |
| 9 | **Empty State** | EmptyState component | — | — | — | Required |
| 10 | **Error Handling** | Error banner | `setError()` on fetch failure | — | — | Required |
| 11 | **Delete Confirmation** | AlertDialog with "Deleting..." | Deleting state | — | — | Required |

### 2.2 Stub / Partially Implemented – Target State

| # | Functionality | What Was Missing | Target |
|---|--------------|------------------|--------|
| 12 | **View History** | No `shipper_history` table; always empty | Real data from `shipper_history` |
| 13 | **View Documents** | No `shipper_documents` table; always empty | Real data from `shipper_documents` |
| 14 | **Document Upload** | Returns success but no file storage | Metadata-only add (name, type, date) |
| 15 | **Document Delete** | Returns success but no logic | Real delete from `shipper_documents` |
| 16 | **Password Management** | No DB op; no Supabase Auth | Create/update auth user via Supabase Auth |
| 17 | **Stats – Server-side** | Stats computed client-side | Use `fetchShipperStats()` from server |

### 2.3 Not Implemented – Target State

| # | Functionality | Target |
|---|--------------|--------|
| 18 | **History Tracking** | Log on create/update/status changes |
| 19 | **Document Storage** | Metadata table for documents |
| 20 | **Compliance Management** | Toggle compliance (Mark Compliant / Non-Compliant) |
| 21 | **Server-side Filtering** | Pass filters to API instead of client-side only |
| 22 | **Bulk Actions** | No bulk select/delete/toggle (out of scope) |
| 23 | **Pagination** | No server-side pagination (out of scope) |
| 24 | **Export** | No export (out of scope) |

### 2.4 Side-by-Side Comparison: Couriers vs Shippers (Target)

| Feature | Couriers | Shippers Target |
|---------|----------|-----------------|
| List + Filters | Server-side | Server-side |
| Stats | Server-computed | Server-computed |
| Create | Multi-table | Single table |
| Edit | Upsert | Single table update |
| Toggle Status | DB + history | DB + history |
| Delete | Hard delete | Soft delete |
| History | Real data | Real data |
| Documents | Real data | Real data (metadata) |
| Password | Auth integration | Auth integration |
| Compliance | Toggle in dropdown | Toggle in dropdown |
| Input Validation | — | Zod on backend |

---

## 3. What Has Been Achieved

### 3.1 Database Schema

| Table | Purpose | Migration |
|-------|---------|-----------|
| `shippers` | Core shipper data (name, contact, compliance, status, etc.) | `20260209184858_*.sql` |
| `shipper_history` | Audit log of actions (create, update, status change, delete, etc.) | `20260209184858_*.sql` |
| `shipper_documents` | Document metadata (name, type, date) – no file storage | `20260209184858_*.sql` |
| `shippers.deleted_at` | Soft delete support | `20260228100000_shippers_deleted_at.sql` |

### 3.2 Backend (dispatch-server)

| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/shippers` | GET | List shippers with filters (search, compliance, status, businessType, state, isNew); batch-fetches history and documents | Implemented |
| `/shippers/stats` | GET | Aggregate stats (total, compliant, nonCompliant, new, alerts) from DB | Implemented |
| `/shippers` | POST | Create shipper; logs "Shipper created" to history | Implemented |
| `/shippers/:id` | PUT | Update shipper; logs "Shipper updated" | Implemented |
| `/shippers/:id/status` | PATCH | Toggle active/inactive; logs status change | Implemented |
| `/shippers/:id/compliance` | PATCH | Toggle compliant/non-compliant; logs compliance change | Implemented |
| `/shippers/:id` | DELETE | Soft delete (sets `deleted_at`); logs "Shipper deleted (soft)" | Implemented |
| `/shippers/:id/history` | GET | Fetch history for specific shipper | Implemented |
| `/shippers/:id/documents` | GET | Fetch documents for specific shipper | Implemented |
| `/shippers/:id/documents` | POST | Add document metadata (name, type, date); logs to history | Implemented |
| `/shippers/:id/documents/:docId` | DELETE | Delete document; logs to history | Implemented |
| `/shippers/:id/password` | POST | Create/update Supabase Auth user; logs "Password updated by Admin" | Implemented |

**Repositories:**
- `shipperHistoryRepo.ts`: `findByShipperId`, `findByShipperIds`, `addEntry`
- `shipperDocumentRepo.ts`: `findByShipperId`, `findByShipperIds`, `findById`, `create`, `deleteById`

**Backend service:**
- `shipperService.ts`: `updateShipperStatus`, `softDeleteShipper`, `updateShipperCompliance`

**Validation:**
- Zod schemas for PATCH status, PATCH compliance, POST documents, POST password
- UUID validation for path params

### 3.3 Frontend (Admin_Dispatch-main)

| Component / Service | Purpose | Status |
|--------------------|---------|--------|
| `Shippers.tsx` | Main page with list, filters, stats, dialogs | Implemented |
| `shipperService.ts` | API calls: fetchShippers, fetchShipperStats, createShipper, updateShipper, updateShipperStatus, updateShipperCompliance, deleteShipper, setShipperPassword, addShipperDocument, deleteShipperDocument | Implemented |
| `AddShipperForm` | 4-tab form (Business, Contact, Hours, Licenses/Tax) | Implemented |
| `StatsGrid` | Stats from server (total, compliant, nonCompliant, new, alerts) | Implemented |
| `HistoryDialog` | Shows history from `dialogs.selected.history` | Implemented |
| `DocumentsDialog` | Shows documents; add/delete wired with `onUpload` and `onDelete` | Implemented |
| `AccountPasswordDialog` | Supports `accountType="shipper"` and calls `setShipperPassword` | Implemented |
| `EmptyState` | Shown when no shippers or no matches | Implemented |
| `AlertDialog` | Delete confirmation with "Deleting..." state | Implemented |

**Server-side filtering:**
- `buildFilters()` maps activeTab, businessTypeFilter, stateFilter to API params
- `loadShippers()` calls `fetchShippers(buildFilters())` and `fetchShipperStats()`
- Client-side search filters by name, id, contact for instant UX

**Compliance:**
- Dropdown item "Mark Compliant" / "Mark Non-Compliant"
- `handleToggleCompliance` calls `updateShipperCompliance` and refreshes

### 3.4 Code Quality Improvements

| Item | Change |
|------|--------|
| `bodyToShipperRow` | Replaced `body as any` with `ShipperBody` interface |
| Password menu label | Changed "Mot de passe" to "Set Password" (Shippers) |
| Couriers setOpen | Changed `dialogs.setOpen.bind(null, "edit")(false)` to `dialogs.setOpen("edit", false)` |

---

## 4. Feature-by-Feature Achievement Matrix

| # | Requirement | Achieved | Notes |
|---|-------------|----------|-------|
| 1 | List + Filter | Yes | Tabs, dropdowns, search; server-side filters for compliance, businessType, state, isNew |
| 2 | Stats Dashboard | Yes | Server-computed stats; StatsGrid |
| 3 | Create Shipper | Yes | POST /shippers; AddShipperForm |
| 4 | Edit Shipper | Yes | PUT /shippers/:id |
| 5 | Toggle Active/Inactive | Yes | PATCH /shippers/:id/status |
| 6 | Delete Shipper | Yes | Soft delete; AlertDialog |
| 7 | View Details | Yes | Dialog with full details |
| 8 | Client-side Search | Yes | Filter by name, id, contact |
| 9 | Empty State | Yes | EmptyState component |
| 10 | Error Handling | Yes | setError, toast |

| 11 | Delete Confirmation | Yes | AlertDialog |
| 12 | View History | Yes | shipper_history table; HistoryDialog; batch-fetched in list |
| 13 | View Documents | Yes | shipper_documents table; DocumentsDialog |
| 14 | Document Upload | Yes | Metadata only (name, type, date); POST /shippers/:id/documents |
| 15 | Document Delete | Yes | DELETE /shippers/:id/documents/:docId |
| 16 | Password Management | Yes | Supabase Auth; create/update user by email |
| 17 | Server-side Stats | Yes | fetchShipperStats() used in Shippers page |
| 18 | History Tracking | Yes | Logged on create, update, status, compliance, delete, document add/delete, password |
| 19 | Document Storage | Yes | Metadata in shipper_documents (no file storage) |
| 20 | Compliance Management | Yes | PATCH /shippers/:id/compliance; dropdown toggle |
| 21 | Server-side Filtering | Yes | buildFilters passed to fetchShippers |
| 22 | Bulk Actions | No | Out of scope |
| 23 | Pagination | No | Out of scope |
| 24 | Export | No | Out of scope |

---

## 5. Architecture Summary

```
Admin Frontend (Shippers.tsx)
    |
    | apiGet, apiPost, apiPut, apiPatch, apiDelete
    v
shipperService.ts (Admin_Dispatch-main)
    |
    | fetchShippers, fetchShipperStats, createShipper, updateShipper,
    | updateShipperStatus, updateShipperCompliance, deleteShipper,
    | setShipperPassword, addShipperDocument, deleteShipperDocument
    v
dispatch-server (Express)
    |
    | routes/shippers.ts
    | services/shipperService.ts (backend)
    | repos/shipperHistoryRepo.ts, shipperDocumentRepo.ts
    v
Supabase (Postgres)
    |
    | shippers, shipper_history, shipper_documents
    v
Supabase Auth (for password)
```

---

## 6. Out of Scope (Not Implemented)

- **Bulk Actions** (22): Multi-select, bulk delete, bulk toggle
- **Pagination** (23): Server-side pagination
- **Export** (24): CSV/Excel export
- **Document file storage** (19): S3 or Supabase Storage for actual files; only metadata stored
- **Server-side search** (21): Search is client-side for instant UX; backend supports `search` param if needed

---

## 7. Files Reference

| Layer | File | Purpose |
|-------|------|---------|
| Backend | `dispatch-server/src/routes/shippers.ts` | All shipper routes |
| Backend | `dispatch-server/src/services/shipperService.ts` | Status, delete, compliance |
| Backend | `dispatch-server/src/repos/shipperHistoryRepo.ts` | History CRUD |
| Backend | `dispatch-server/src/repos/shipperDocumentRepo.ts` | Documents CRUD |
| Frontend | `Admin_Dispatch-main/src/pages/Shippers.tsx` | Shippers page |
| Frontend | `Admin_Dispatch-main/src/services/shipperService.ts` | API calls |
| Frontend | `Admin_Dispatch-main/src/components/AccountPasswordDialog.tsx` | Password with accountType |
| Frontend | `Admin_Dispatch-main/src/components/common/DocumentsDialog.tsx` | Documents with onUpload/onDelete |
| DB | `Admin_Dispatch-main/supabase/migrations/20260209184858_*.sql` | shippers, shipper_history, shipper_documents |
| DB | `Admin_Dispatch-main/supabase/migrations/20260228100000_shippers_deleted_at.sql` | Soft delete |

---

## 8. What Remains in the Admin Module

This section defines work still remaining across the Admin portal (beyond the Shippers module). The Shippers module is complete for its defined scope; the items below apply to other areas.

### 8.1 Vehicle Access (Read-Only)

| Attribute | Value |
|-----------|-------|
| **Definition** | Admin view of active `vehicle_access` records (shipper can view vehicle location during trip). |
| **Backend** | `GET /api/vehicle-access` exists. |
| **Frontend** | No page yet. Could add a read-only list under Vehicles or a separate "Vehicle Access" section. |
| **Effort** | Small |

### 8.2 Admin "Plus" (Impersonation)

| Attribute | Value |
|-----------|-------|
| **Definition** | Admin selects a courier or shipper and views the app as that user (e.g. "Select FO Admin" pattern). |
| **Backend** | Need `GET /api/admin/couriers` and `GET /api/admin/shippers`; support `X-Impersonate-User-Id` header for user-scoped APIs. |
| **Frontend** | Client selector in header; pass impersonation context to API. |
| **Effort** | Large |

### 8.3 Settings – Company and Security

| Attribute | Value |
|-----------|-------|
| **Definition** | Real save for Company (organization details) and Security (2FA, sessions). Currently shows "coming soon" toast. |
| **Backend** | No `company` or `user_settings` table yet; Security section is UI-only. |
| **Effort** | Medium (schema + API + UI) |

### 8.4 Loads – Documents and History

| Attribute | Value |
|-----------|-------|
| **Definition** | Load documents upload/delete; load history from API. |
| **Backend** | `POST /api/loads/:id/documents` and `DELETE /api/loads/:id/documents/:docId` return 501; `GET /api/loads/:id/history` returns empty. |
| **Effort** | Medium |

### 8.5 Trip Events – Add from Admin

| Attribute | Value |
|-----------|-------|
| **Definition** | Admin records pickup_scan and delivery_scan to progress/complete trips. |
| **Backend** | `POST /api/trips/:id/events` exists. |
| **Frontend** | TripDetail could add "Record pickup scan" / "Record delivery scan" actions. |
| **Effort** | Small–Medium |

### 8.6 Contract Detail Page

| Attribute | Value |
|-----------|-------|
| **Definition** | Dedicated contract detail page (like TripDetail) with full contract info, linked trip, and actions. |
| **Current** | Contracts table links to trips; no `/contracts/:id` detail view. |
| **Effort** | Small |

### 8.7 Summary Table

| Item | Priority | Effort | Notes |
|------|----------|--------|-------|
| Vehicle Access view | Low | Small | Backend ready |
| Admin Plus (impersonation) | High | Large | Per original client requirements |
| Settings Company/Security | Low | Medium | Schema + API |
| Loads documents/history | Low | Medium | Backend 501 |
| Trip events from Admin | Medium | Small–Medium | Backend ready |
| Contract detail page | Low | Small | UX improvement |

**Note:** Shipper status toggle, delete, history, and documents were previously listed as remaining; these are now implemented and complete.

---

## 9. Conclusion

The Shippers module has been brought to parity with the Couriers module for all in-scope features. History, documents (metadata), password management, compliance management, server-side stats, and server-side filtering are fully implemented. The codebase follows existing patterns (repos, services, Zod validation) and is production-ready for the defined scope.
