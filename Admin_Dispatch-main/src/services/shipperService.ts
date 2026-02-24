// ============================================================
// Shipper Service — mock data shell
// Pattern: types → mock data → async functions (swap for API later)
// ============================================================

export interface Shipper {
    id: string;
    name: string;
    contact: string;
    phone: string;
    compliance: "compliant" | "non-compliant";
    address: string;
    businessType: string;
    city: string;
    state: string;
    taxExempt: boolean;
    ein: string;
    hoursPickup: string;
    hoursDropoff: string;
    principalName: string;
    status: "active" | "inactive";
    isNew?: boolean;
    history: { date: string; action: string }[];
    documents: { name: string; type: string; date: string }[];
}

export interface ShipperStats {
    total: number;
    compliant: number;
    nonCompliant: number;
    new: number;
    alerts: number;
}

export interface ShipperFilters {
    search?: string;
    compliance?: string;
    status?: string;
    businessType?: string;
    isNew?: boolean;
}

// --- Mock Data (will be replaced by API responses) ---

const mockShippers: Shipper[] = [
    {
        id: "S001",
        name: "ABC Manufacturing",
        contact: "orders@abc.com",
        phone: "(555) 111-2222",
        compliance: "compliant",
        address: "100 Industrial Pkwy, Chicago, IL 60601",
        businessType: "Dealer",
        city: "Chicago",
        state: "IL",
        taxExempt: true,
        ein: "12-3456789",
        hoursPickup: "Mon-Fri 8AM-5PM",
        hoursDropoff: "Mon-Fri 8AM-5PM",
        principalName: "John Smith",
        status: "active",
        history: [
            { date: "2024-01-15", action: "License renewed" },
            { date: "2024-01-02", action: "Compliance verified" },
            { date: "2023-11-15", action: "Account created" },
        ],
        documents: [
            { name: "Business License (City)", type: "PDF", date: "2024-01-15" },
            { name: "Business License (State)", type: "PDF", date: "2024-01-15" },
            { name: "Tax Exempt Certificate", type: "PDF", date: "2023-11-15" },
        ],
    },
    {
        id: "S002",
        name: "Global Freight Inc",
        contact: "ship@global.com",
        phone: "(555) 222-3333",
        compliance: "compliant",
        address: "200 Commerce Blvd, Detroit, MI 48201",
        businessType: "Auction",
        city: "Detroit",
        state: "MI",
        taxExempt: false,
        ein: "23-4567890",
        hoursPickup: "Mon-Sat 7AM-6PM",
        hoursDropoff: "Mon-Sat 7AM-6PM",
        principalName: "Sarah Johnson",
        status: "active",
        isNew: true,
        history: [{ date: "2024-01-20", action: "Account created" }],
        documents: [
            { name: "Business License (State)", type: "PDF", date: "2024-01-20" },
        ],
    },
    {
        id: "S003",
        name: "Premium Auto Parts",
        contact: "logistics@premium.com",
        phone: "(555) 333-4444",
        compliance: "non-compliant",
        address: "300 Auto Row, Los Angeles, CA 90001",
        businessType: "Dealer",
        city: "Los Angeles",
        state: "CA",
        taxExempt: true,
        ein: "34-5678901",
        hoursPickup: "Mon-Fri 9AM-5PM",
        hoursDropoff: "Mon-Fri 9AM-5PM",
        principalName: "Mike Williams",
        status: "inactive",
        history: [
            { date: "2024-01-18", action: "City license expired - needs renewal" },
            { date: "2023-10-01", action: "Account created" },
        ],
        documents: [
            {
                name: "Business License (City) - EXPIRED",
                type: "PDF",
                date: "2023-01-18",
            },
            { name: "Tax Exempt Certificate", type: "PDF", date: "2023-10-01" },
        ],
    },
    {
        id: "S004",
        name: "Interstate Motors",
        contact: "transport@interstate.com",
        phone: "(555) 444-5555",
        compliance: "compliant",
        address: "400 Motor Ave, Miami, FL 33101",
        businessType: "Dealer",
        city: "Miami",
        state: "FL",
        taxExempt: false,
        ein: "45-6789012",
        hoursPickup: "Mon-Fri 8AM-6PM",
        hoursDropoff: "Mon-Fri 8AM-6PM",
        principalName: "Lisa Brown",
        status: "active",
        history: [
            { date: "2024-01-10", action: "Compliance verified" },
            { date: "2023-09-01", action: "Account created" },
        ],
        documents: [
            { name: "Business License (City)", type: "PDF", date: "2024-01-10" },
            { name: "Business License (State)", type: "PDF", date: "2024-01-10" },
        ],
    },
    {
        id: "S005",
        name: "Midwest Auctions",
        contact: "shipping@midwest.com",
        phone: "(555) 555-6666",
        compliance: "non-compliant",
        address: "500 Auction Ln, Dallas, TX 75201",
        businessType: "Auction",
        city: "Dallas",
        state: "TX",
        taxExempt: true,
        ein: "56-7890123",
        hoursPickup: "Tue-Sat 10AM-4PM",
        hoursDropoff: "Tue-Sat 10AM-4PM",
        principalName: "Tom Davis",
        status: "active",
        isNew: true,
        history: [
            { date: "2024-01-22", action: "State license pending review" },
            { date: "2024-01-15", action: "Account created" },
        ],
        documents: [
            { name: "Business License (City)", type: "PDF", date: "2024-01-15" },
        ],
    },
];

// --- Async service functions (mock → API ready) ---

export async function fetchShippers(
    _filters: ShipperFilters = {}
): Promise<Shipper[]> {
    // TODO: replace with apiGet<Shipper[]>(`/shippers?${params}`)
    return Promise.resolve(mockShippers);
}

export async function fetchShipperStats(): Promise<ShipperStats> {
    // TODO: replace with apiGet<ShipperStats>("/shippers/stats")
    const total = mockShippers.length;
    const compliant = mockShippers.filter(
        (s) => s.compliance === "compliant"
    ).length;
    const nonCompliant = total - compliant;
    const newCount = mockShippers.filter((s) => s.isNew).length;
    return Promise.resolve({
        total,
        compliant,
        nonCompliant,
        new: newCount,
        alerts: nonCompliant,
    });
}
