# API Stubs and Future Work

This document lists API endpoints that return stub/placeholder responses without full database implementation. These are documented for production awareness and future implementation.

## Implemented (Production Ready)

- **Shippers:** `PATCH /:id/status`, `DELETE /:id` - Full DB implementation with soft delete
- **Vehicle Access:** `GET /vehicle-access` - Full implementation
- **Trip Events:** `POST /trips/:id/events` - Full implementation

## Stubs (Return Success Without Full DB Logic)

### Shippers

| Endpoint | Status | Notes |
|---------|--------|-------|
| `GET /:id/history` | Stub | Returns `[]`. Requires `shipper_history` table or equivalent. |
| `POST /:id/documents` | Stub | Returns success. Requires document storage and `shipper_documents` table. |
| `DELETE /:id/documents/:docId` | Stub | Returns success. |
| `POST /:id/password` | Stub | Returns success. Should call Supabase Auth `admin.updateUserById` with shipper's auth user. |

### Couriers

| Endpoint | Status | Notes |
|---------|--------|-------|
| `GET /:id/history` | Stub | Returns `[]`. |
| `POST /:id/documents` | Stub | Returns success. |
| `DELETE /:id/documents/:docId` | Stub | Returns success. |
| `POST /:id/password` | Stub | Returns success. Should call Supabase Auth. |

### Loads

| Endpoint | Status | Notes |
|---------|--------|-------|
| `POST /:id/documents` | 501 | Returns "Document upload not implemented". |
| `DELETE /:id/documents/:docId` | 501 | Returns "Document delete not implemented". |
| `GET /:id/history` | Stub | Returns `[]`. |

### Dashboard

| Endpoint | Status | Notes |
|---------|--------|-------|
| `GET /alerts` | Partial | Returns `[]` when no notification_log rules. Can be extended. |
| `PATCH /alerts/:id/read` | Stub | Returns success. Wire to `notification_log` if schema supports read flag. |
| `DELETE /alerts/:id` | Stub | Returns success. Wire to `notification_log` if schema supports dismiss. |

## Database Connections

All routes use `supabaseAdmin` from `config/supabase.ts`. No raw connections. Health check at `GET /api/health` pings the database.

## Recommendations

1. **Shipper/Courier password:** Implement via `supabaseAdmin.auth.admin.updateUserById` when auth user ID is known (requires `profiles` or similar to map shipper/courier ID to auth user).
2. **Documents:** Add storage (Supabase Storage or S3) and document tables; implement upload/delete.
3. **History:** Add activity/history tables; implement append-on-action pattern.
4. **Dashboard alerts:** Populate from compliance/license/insurance rules; wire read/dismiss to `notification_log` if `read_at` or similar column exists.
