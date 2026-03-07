# Future Work

This document tracks planned improvements and features for later implementation.

---

## 1. Vehicle Access: Modal Instead of Page Navigation

**Current behavior:** Clicking a vehicle or shipper link on the Vehicle Access page navigates to `/vehicles/:vehicleId` or `/shippers/:shipperId`, which shows the list and scrolls to/highlights the row.

**Planned behavior:** Replace navigation with an in-page modal that shows the entity details. This avoids full page loads and reduces API calls.

### Requirements

1. **getVehicleById API**
   - Endpoint: `GET /vehicles/:id` (already exists)
   - Returns a single vehicle with courier info
   - Use for modal content

2. **getShipperById API**
   - Endpoint: `GET /shippers/:id` (already exists)
   - Returns a single shipper with history/documents
   - Use for modal content

3. **Vehicle Access page changes**
   - Remove hyperlinks to `/vehicles/:id` and `/shippers/:id`
   - Add click handler that opens a modal
   - Modal fetches single entity via `GET /vehicles/:id` or `GET /shippers/:id`
   - Display entity details in the modal (no page navigation)

### Benefits

- Saves a full page load and list API call when admin only needs to view one vehicle/shipper
- Admin stays on Vehicle Access page; context is preserved
- Single targeted API call instead of loading full list + navigating

### Implementation notes

- Create `VehicleDetailModal` component (or reuse/adapt from Vehicles page)
- Create `ShipperDetailModal` component (or reuse/adapt from Shippers page)
- Wire Vehicle Access table cells to open modal on click instead of `<Link>`
- Consider caching modal data to avoid repeated fetches if user opens same entity twice

---

## 2. Client-Side Filtering Instead of API-Based Filtering

**Current behavior:** When the user applies filters (e.g., compliant/non-compliant tabs on Shippers, or similar filters on other pages), the frontend calls the API again with filter parameters. Each filter change triggers a new API request.

**Planned behavior:** Load all data once on initial page load. Apply filters entirely in the frontend. No additional API calls when switching between filter tabs or changing filter values.

### Requirements

1. **Initial load:** Fetch full dataset for the page (e.g., all shippers, all vehicles, all couriers).
2. **Filtering:** When user selects a filter (compliant, non-compliant, new, etc.), filter the already-loaded data in memory.
3. **Scope:** Apply this pattern across every page in the project that has filters (Shippers, Vehicles, Couriers, Loads, Contracts, Trips, etc.).

### Benefits

- Fewer API calls: one load per page instead of one per filter change
- Faster UX: filter changes are instant when data is already in memory
- Reduced server load and bandwidth

### Implementation notes

- Refactor each page to fetch all data once (or paginated full set) on mount
- Move filter logic from API query params to client-side `.filter()` on the loaded array
- Consider pagination: if datasets are large, may need to load in chunks or keep server-side pagination for initial load, then client-side filter within the visible page

---

## 3. Dashboard Metric Cards: Link to Respective Pages

**Current behavior:** The dashboard metric cards (TOTAL COURIERS, TOTAL SHIPPERS, TOTAL TRANSACTIONS, ACTIVE ALERTS, COURIERS IN COMPLIANCE, COURIERS OUT OF COMPLIANCE, SHIPPERS IN COMPLIANCE, SHIPPERS OUT OF COMPLIANCE) are display-only. Clicking them does nothing.

**Planned behavior:** Make each metric card clickable and navigate to the corresponding page. Users expect to drill down from a summary to the underlying data.

**Scope:** Apply this pattern across all three frontends: Admin, Courier, and Shipper. Each app has its own dashboard with metric cards; every card should link to the relevant page within that app.

### Requirements

1. **Top-row cards:**
   - TOTAL COURIERS -> `/couriers`
   - TOTAL SHIPPERS -> `/shippers`
   - TOTAL TRANSACTIONS -> `/accounting` (or appropriate transactions page)
   - ACTIVE ALERTS -> alerts/tickets page or section

2. **Compliance Overview cards:**
   - COURIERS IN COMPLIANCE -> `/couriers?compliance=compliant` (or equivalent filter)
   - COURIERS OUT OF COMPLIANCE -> `/couriers?compliance=non-compliant`
   - SHIPPERS IN COMPLIANCE -> `/shippers?compliance=compliant` (or equivalent filter)
   - SHIPPERS OUT OF COMPLIANCE -> `/shippers?compliance=non-compliant`

3. **UI:** Add cursor pointer, hover state, and optional visual cue (e.g., "View" or chevron) so users know the cards are clickable.

### Benefits

- Intuitive navigation from dashboard overview to detailed lists
- Fewer steps for admins to reach the data they care about

### Implementation notes

- Wrap each card (or its content) in a `Link` or `useNavigate` click handler
- For compliance cards, pass query params so the target page can auto-select the matching filter tab
- Ensure cards remain accessible (keyboard, screen readers)
- Implement in all three frontends: Admin_Dispatch-main, courier_Dispatch-main, Shipper_Dispatch-main. Each app will have different cards and target routes; map each dashboard's cards to that app's navigation structure.

---

## 4. Other Future Items

(Add additional future work items here as they are identified.)
