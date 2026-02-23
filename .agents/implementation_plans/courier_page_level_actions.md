# Courier Page-Level Actions — Implementation Plan

> **Scope:** Strictly page-level actions (#1–#6) in `Admin_Dispatch-main/src/pages/Couriers.tsx`  
> **Goal:** Replace all mock/static data with real server requests via `dispatch-server` → Supabase

---

## Current Architecture

```
Frontend (Couriers.tsx)     →  NO API calls  →  Uses hardcoded mockCouriers[]
Server (couriers.ts routes) →  Stub responses →  No Supabase integration
Server has supabaseAdmin client ready at dispatch-server/src/config/supabase.ts
```

## Target Architecture

```
Frontend (Couriers.tsx)
  ↓ fetch() via API service
dispatch-server (localhost:4000/api/couriers)
  ↓ supabaseAdmin queries
Supabase DB (couriers + normalized tables)
  ↓
Response → Frontend state → UI renders
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `dispatch-server/src/routes/couriers.ts` | **MODIFY** | Replace stub handlers with real Supabase queries |
| `Admin_Dispatch-main/src/services/api.ts` | **CREATE** | Centralized API client (fetch wrapper with base URL) |
| `Admin_Dispatch-main/src/services/courierService.ts` | **CREATE** | Courier-specific API functions |
| `Admin_Dispatch-main/src/pages/Couriers.tsx` | **MODIFY** | Replace mockCouriers + local state with API calls |
| `Admin_Dispatch-main/.env` | **MODIFY** | Add `VITE_API_BASE_URL=http://localhost:4000/api` |

---

## PHASE 1: Backend — Implement Server Routes

### Step 1.1: `GET /api/couriers` — List couriers with filters

**File:** `dispatch-server/src/routes/couriers.ts` — Line 49  
**Currently:** `res.json({ success: true, data: [], message: "List couriers" })`

**Replace with:**
- Read query params: `search`, `compliance`, `status`, `equipmentType`, `isNew`
- Query `supabaseAdmin.from("couriers").select(...)` with dynamic filters
- For each courier, also fetch related data from normalized tables:
  - `courier_trucks` → to compute total trucks count & equipment types
  - `courier_insurance` → to get latest insurance company name
  - `courier_contacts` → for primary contact email
  - `courier_documents` → document list
  - `courier_history` → from `courier_history` table
- Return the joined/shaped data matching the frontend `Courier` interface

**Query structure:**
```sql
-- Base query
SELECT c.*, 
  (SELECT SUM(count) FROM courier_trucks WHERE courier_id = c.id) AS trucks,
  (SELECT company_name FROM courier_insurance WHERE courier_id = c.id ORDER BY created_at DESC LIMIT 1) AS insurance_company
FROM couriers c
WHERE 1=1
  AND (search IS NULL OR c.name ILIKE '%search%' OR c.usdot ILIKE '%search%' OR c.mc ILIKE '%search%' OR c.contact_email ILIKE '%search%')
  AND (compliance_filter IS NULL OR c.compliance = compliance_filter)
  AND (status_filter IS NULL OR c.status = status_filter)
  AND (is_new_filter IS NULL OR c.is_new = is_new_filter)
ORDER BY c.created_at DESC
```

**For equipment type filter:** Since equipment_type is now in `courier_trucks`, filter with:
```sql
AND (equipmentType IS NULL OR c.id IN (
  SELECT courier_id FROM courier_trucks WHERE equipment_type = equipmentType
))
```

**Response shape** (must match frontend `Courier` interface):
```typescript
{
  success: true,
  data: [{
    id: string,            // couriers.id
    name: string,          // couriers.name
    contact: string,       // couriers.contact_email
    phone: string,         // couriers.phone
    compliance: string,    // couriers.compliance
    address: string,       // couriers.address
    usdot: string,         // couriers.usdot
    mc: string,            // couriers.mc
    status: string,        // couriers.status
    trucks: number,        // SUM(courier_trucks.count)
    insuranceCompany: string, // latest courier_insurance.company_name
    equipmentType: string, // comma-joined from courier_trucks or first type
    isNew: boolean,        // couriers.is_new
    history: [],           // from courier_history
    documents: [],         // from courier_documents
  }]
}
```

### Step 1.2: `GET /api/couriers/stats` — Stats for cards

**File:** `dispatch-server/src/routes/couriers.ts` — Line 63  
**Currently:** `res.json({ success: true, data: { total: 0, compliant: 0, ... } })`

**Replace with:**
```sql
SELECT 
  COUNT(*)::int AS total,
  COUNT(*) FILTER (WHERE status = 'active')::int AS active,
  COUNT(*) FILTER (WHERE compliance = 'compliant')::int AS compliant,
  COUNT(*) FILTER (WHERE compliance = 'non-compliant')::int AS non_compliant,
  COUNT(*) FILTER (WHERE is_new = true)::int AS new
FROM couriers
```

**Response shape:**
```typescript
{
  success: true,
  data: {
    total: number,
    active: number,
    compliant: number,
    nonCompliant: number,
    new: number,
  }
}
```

### Step 1.3: `POST /api/couriers` — Create courier

**File:** `dispatch-server/src/routes/couriers.ts` — Line 110  
**Currently:** `res.json({ success: true, data: null, message: "Courier created" })`

**Replace with:**
- Accept request body matching `CourierFormData` from the frontend form
- Split the incoming flat form data into normalized inserts:
  1. `INSERT INTO couriers (name, address, city, state, ...)` → get back `courier_id`
  2. `INSERT INTO courier_contacts (courier_id, name, position, phone, ...)` 
  3. `INSERT INTO courier_insurance (courier_id, company_name, agent_name, ...)`
  4. `INSERT INTO courier_trucks (courier_id, equipment_type, count)`
  5. `INSERT INTO courier_routes (courier_id, route_name)` → split comma-separated routes string
- Use a transaction (supabaseAdmin doesn't support native transactions, so use sequential inserts with error rollback)
- Return the created courier with its ID

**Request body mapping (CourierFormData → tables):**
```
CourierFormData field        → Table.column
─────────────────────────────────────────────
courierName                 → couriers.name
address                     → couriers.address
city                        → couriers.city
state                       → couriers.state
zipCode                     → couriers.zip_code
businessType                → couriers.business_type
businessPhone               → couriers.business_phone
fax                         → couriers.fax
businessEmail               → couriers.business_email
website                     → couriers.website
hours                       → couriers.business_hours
timezone                    → couriers.timezone
usdot                       → couriers.usdot
usdotLink                   → couriers.usdot_link
mcNumber                    → couriers.mc
mcLink                      → couriers.mc_link
operatingStatus             → couriers.operating_status
mcs150Status                → couriers.mcs150_status
outOfServiceDate            → couriers.out_of_service_date
authorityStatus             → couriers.authority_status
contactName                 → courier_contacts.name
contactPosition             → courier_contacts.position
contactPhone                → courier_contacts.phone
deskPhone                   → courier_contacts.desk_phone
contactEmail                → courier_contacts.email
contactHours                → courier_contacts.hours
insuranceCompany            → courier_insurance.company_name
insuranceAgent              → courier_insurance.agent_name
insurancePhone              → courier_insurance.agent_phone
insuranceEmail              → courier_insurance.agent_email
physicalDamageLimit         → courier_insurance.physical_damage_limit
numTrucks                   → courier_trucks.count
equipmentType               → courier_trucks.equipment_type
routes (comma-separated)    → courier_routes.route_name (one per value)
```

---

## PHASE 2: Frontend — API Service Layer

### Step 2.1: Add API base URL to `.env`

**File:** `Admin_Dispatch-main/.env`
```
VITE_API_BASE_URL=http://localhost:4000/api
```

### Step 2.2: Create `src/services/api.ts`

**File:** `Admin_Dispatch-main/src/services/api.ts` (NEW)

```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
```

### Step 2.3: Create `src/services/courierService.ts`

**File:** `Admin_Dispatch-main/src/services/courierService.ts` (NEW)

```typescript
import { apiGet, apiPost } from "./api";

// --- Types matching server response ---
export interface CourierListItem {
  id: string;
  name: string;
  contact: string;
  phone: string;
  compliance: "compliant" | "non-compliant";
  address: string;
  usdot: string;
  mc: string;
  status: "active" | "inactive";
  trucks: number;
  insuranceCompany: string;
  equipmentType: string;
  isNew?: boolean;
  history: { date: string; action: string }[];
  documents: { name: string; type: string; date: string }[];
}

export interface CourierStats {
  total: number;
  active: number;
  compliant: number;
  nonCompliant: number;
  new: number;
}

export interface CourierFilters {
  search?: string;
  compliance?: string;
  status?: string;
  equipmentType?: string;
  isNew?: boolean;
}

// --- API Functions ---

export async function fetchCouriers(filters: CourierFilters): Promise<CourierListItem[]> {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.compliance) params.set("compliance", filters.compliance);
  if (filters.status) params.set("status", filters.status);
  if (filters.equipmentType) params.set("equipmentType", filters.equipmentType);
  if (filters.isNew !== undefined) params.set("isNew", String(filters.isNew));
  const query = params.toString() ? `?${params}` : "";
  const res = await apiGet<CourierListItem[]>(`/couriers${query}`);
  return res.data;
}

export async function fetchCourierStats(): Promise<CourierStats> {
  const res = await apiGet<CourierStats>("/couriers/stats");
  return res.data;
}

export async function createCourier(formData: Record<string, string>): Promise<CourierListItem> {
  const res = await apiPost<CourierListItem>("/couriers", formData);
  return res.data;
}
```

---

## PHASE 3: Frontend — Replace Static Code in Couriers.tsx

### Step 3.1: Remove mock data

**What to remove:**
- Lines 56–165: The entire `mockCouriers` array (110 lines of hardcoded data)

### Step 3.2: Replace useState initialization with API fetch

**What to change:**

BEFORE (lines 168-183):
```typescript
const [couriers, setCouriers] = useState<Courier[]>(mockCouriers);
const [searchTerm, setSearchTerm] = useState("");
const [activeTab, setActiveTab] = useState<FilterTab>("all");
const [equipmentTypeFilter, setEquipmentTypeFilter] = useState<string>("all");
const [statusFilter, setStatusFilter] = useState<string>("all");
```

AFTER:
```typescript
const [couriers, setCouriers] = useState<Courier[]>([]);
const [stats, setStats] = useState<CourierStats>({ total: 0, active: 0, compliant: 0, nonCompliant: 0, new: 0 });
const [loading, setLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState("");
const [activeTab, setActiveTab] = useState<FilterTab>("all");
const [equipmentTypeFilter, setEquipmentTypeFilter] = useState<string>("all");
const [statusFilter, setStatusFilter] = useState<string>("all");
```

### Step 3.3: Add useEffect to fetch data on mount & filter change

**Add after state declarations:**
```typescript
// Build server-side filters based on current UI state
const serverFilters: CourierFilters = {};
if (activeTab === "compliant") serverFilters.compliance = "compliant";
if (activeTab === "non-compliant") serverFilters.compliance = "non-compliant";
if (activeTab === "new") serverFilters.isNew = true;
if (equipmentTypeFilter !== "all") serverFilters.equipmentType = equipmentTypeFilter;
if (statusFilter !== "all") serverFilters.status = statusFilter;

useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    try {
      const [courierData, statsData] = await Promise.all([
        fetchCouriers(serverFilters),
        fetchCourierStats(),
      ]);
      setCouriers(courierData);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to load couriers:", err);
      toast.error("Failed to load couriers");
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, [activeTab, equipmentTypeFilter, statusFilter]);
```

### Step 3.4: Keep client-side search filtering (debounced)

Search stays client-side for instant UX — it filters the already-fetched `couriers` array.

BEFORE (lines 185-200):
```typescript
const filteredCouriers = couriers.filter((courier) => {
  const matchesSearch = ...
  const matchesTab = ...
  const matchesEquipment = ...
  const matchesStatus = ...
  return matchesSearch && matchesTab && matchesEquipment && matchesStatus;
});
```

AFTER:
```typescript
// Tab/Equipment/Status filters are now server-side (via useEffect above)
// Only search remains client-side for instant filtering
const filteredCouriers = couriers.filter((courier) => {
  if (!searchTerm) return true;
  const term = searchTerm.toLowerCase();
  return (
    courier.name.toLowerCase().includes(term) ||
    courier.contact.toLowerCase().includes(term) ||
    courier.phone.includes(term) ||
    courier.usdot.includes(term) ||
    courier.mc.toLowerCase().includes(term)
  );
});
```

### Step 3.5: Replace computed stats with server stats

BEFORE (lines 202-206):
```typescript
const totalCouriers = couriers.length;
const compliantCount = couriers.filter((c) => c.compliance === "compliant").length;
const nonCompliantCount = couriers.filter((c) => c.compliance === "non-compliant").length;
const newCouriersCount = couriers.filter((c) => c.isNew).length;
const alertsCount = nonCompliantCount;
```

AFTER:
```typescript
const totalCouriers = stats.total;
const compliantCount = stats.compliant;
const nonCompliantCount = stats.nonCompliant;
const newCouriersCount = stats.new;
const alertsCount = nonCompliantCount;
```

### Step 3.6: Replace local equipment type list with server-derived

BEFORE (line 182):
```typescript
const uniqueEquipmentTypes = [...new Set(couriers.map(c => c.equipmentType))];
```

AFTER:
```typescript
// After normalization, equipment types are known enum values
const uniqueEquipmentTypes = [
  "Open Transport",
  "Enclosed Transport",
  "Flatbed",
  "Hotshot",
  "Multi-Car Carrier",
];
```

### Step 3.7: Wire up "Add Courier" form submission

BEFORE (form onSubmit in AddCourierForm):
```typescript
// Currently just logs to console and closes dialog
```

AFTER:
```typescript
const handleAddCourier = async (formData: CourierFormData) => {
  try {
    await createCourier(formData as unknown as Record<string, string>);
    toast.success("Courier added successfully!");
    setIsAddDialogOpen(false);
    // Re-fetch data to reflect the new courier
    const [courierData, statsData] = await Promise.all([
      fetchCouriers(serverFilters),
      fetchCourierStats(),
    ]);
    setCouriers(courierData);
    setStats(statsData);
  } catch (err) {
    toast.error("Failed to create courier");
  }
};
```

### Step 3.8: Add loading state to UI

Add a loading spinner/skeleton when `loading` is true, before the courier cards list renders.

---

## Execution Order

```
Step    What                                             Depends On
───────────────────────────────────────────────────────────────────
1.1     Server: GET /couriers (list + filters)           Migration (done ✅)
1.2     Server: GET /couriers/stats                      Migration (done ✅)
1.3     Server: POST /couriers (create)                  Migration (done ✅)
2.1     Frontend: Add VITE_API_BASE_URL to .env          None
2.2     Frontend: Create api.ts service                  None
2.3     Frontend: Create courierService.ts               2.2
3.1     Frontend: Remove mockCouriers                    1.1, 2.3
3.2     Frontend: Replace state initialization           3.1
3.3     Frontend: Add useEffect with API fetch           3.2
3.4     Frontend: Simplify filtering to search-only      3.3
3.5     Frontend: Use server stats                       3.3
3.6     Frontend: Static equipment type list             3.1
3.7     Frontend: Wire Add Courier form                  1.3, 2.3
3.8     Frontend: Add loading state                      3.3
```

---

## Verification Checklist

- [ ] Server `GET /couriers` returns real data from Supabase
- [ ] Server `GET /couriers?search=express` filters correctly
- [ ] Server `GET /couriers?compliance=compliant` filters correctly
- [ ] Server `GET /couriers?status=active` filters correctly
- [ ] Server `GET /couriers?equipmentType=Flatbed` filters correctly
- [ ] Server `GET /couriers?isNew=true` filters correctly
- [ ] Server `GET /couriers/stats` returns correct counts
- [ ] Server `POST /couriers` creates courier + contact + insurance + trucks + routes
- [ ] Frontend loads couriers from server on page mount
- [ ] Frontend stats cards show server stats
- [ ] Frontend tab switching triggers re-fetch with correct filter
- [ ] Frontend dropdown filters trigger re-fetch
- [ ] Frontend search filters client-side instantly
- [ ] Frontend "Add Courier" creates via server and refreshes list
- [ ] Loading spinner shows during fetch
- [ ] Error toast shows on API failure
