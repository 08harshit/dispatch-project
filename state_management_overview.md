# State Management Architecture Overview

## The Strategy
The application has transitioned from local `useState` data fetching to a **Global Cache-First Architecture** utilizing `@tanstack/react-query`.

This explicitly separates "Server State" (data from the database) from "Client State" (dropdowns, UI toggles).

## Key Implementation Pillars

1. **URL-Synchronized UI State**
   - Filters (status, compliance, search) and pagination (page 1, limit 10) are now tethered strictly to the browser's URL via `useSearchParams()`.
   - **Benefit:** Allows dispatchers to share deep links to exact table views. Preserves layout integrity if the page is refreshed.

2. **Zero-GET Mutations (Cache Injection)**
   - When creating, updating, or deleting records, custom mutation hooks (e.g., [useUpdateCourierMutation](file:///home/harshit/workspace/dispatch-project/Admin_Dispatch-main/src/hooks/queries/useCouriers.ts#73-95)) intercept the API response.
   - The response is injected directly into React Query's local paginated cache array (`queryClient.setQueriesData`).
   - **Benefit:** Completely eliminates redundant follow-up `GET` requests, drastically reducing database read-load and preventing N+1 queries.

3. **Optimistic UI Updates**
   - Essential toggle switches (like activating/deactivating users) instantly mutate the UI cache in the [onMutate](file:///home/harshit/workspace/dispatch-project/Admin_Dispatch-main/src/hooks/queries/useCouriers.ts#101-128) lifecycle hook before the server responds.
   - **Benefit:** Provides a 0ms-latency, premium application feel to the end user.

4. **Global Prefetching**
   - A `<GlobalPrefetcher />` component fires on authentication, silently requesting Page 1 of the core dispatch modules (Couriers, Shippers, Loads) while the user looks at the Dashboard.
   - **Benefit:** Navigating to core panels is instantaneous as data is painted from memory, skipping the initial loading spinners.

## Handled Edge Cases & Protections

- **Query Key Mismatches:** Ensured that the default filter parameters (`{ status: "all", compliance: "all" }`) inside the Local page components perfectly mirror the Prefetcher's payload to avoid accidental background refetches.
- **Cache Memory Bloat:** Enforced a global 10-minute Garbage Collection limit (`gcTime: 10 * 60 * 1000`) so historical paginated data drops cleanly if the app runs heavily all day.
- **Optimistic Rollbacks:** If the server rejects a status toggle (e.g., 500 error), the UI reads a rapid snapshot context taken in [onMutate](file:///home/harshit/workspace/dispatch-project/Admin_Dispatch-main/src/hooks/queries/useCouriers.ts#101-128) and seamlessly reverts the toggle switch backward via [onError](file:///home/harshit/workspace/dispatch-project/Admin_Dispatch-main/src/hooks/queries/useCouriers.ts#128-136).
- **Backend ENUM Resiliency:** The backend explicitly strips `"all"` filter parameter values during the query parsing stage, preventing hard PostgreSQL enum casting crashes.
- **Fail-Safe UI Boundaries:** Wrapped the main React tree in an `<ErrorBoundary>` so localized rendering crashes (e.g., a bad table cell) output a clean warning instead of a massive blank screen.
