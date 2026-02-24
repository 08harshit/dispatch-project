// ============================================================
// Load Service — mock data shell
// Pattern: types → mock data → async functions (swap for API later)
// ============================================================

export interface Load {
    id: string;
    vehicleYear: string;
    vehicleMake: string;
    vehicleModel: string;
    vin: string;
    stockNumber: string;
    shipperInfo: string;
    pickupDate: string;
    dropOffDate: string;
    status: "pending" | "in-transit" | "delivered" | "cancelled";
    courierInfo: string;
    docs: { name: string; type: string }[];
    history: { date: string; action: string }[];
}

export type LoadStatus = Load["status"];

export interface LoadFilters {
    search?: string;
    status?: string;
}

// --- Mock Data (will be replaced by API responses) ---

const mockLoads: Load[] = [
    {
        id: "LD-001",
        vehicleYear: "2024", vehicleMake: "Toyota", vehicleModel: "Camry",
        vin: "1HGBH41JXMN109186", stockNumber: "TC2024-01",
        shipperInfo: "AutoMax Dealers", pickupDate: "2024-01-20", dropOffDate: "2024-01-25",
        status: "delivered", courierInfo: "Express Logistics LLC",
        docs: [{ name: "BOL", type: "PDF" }, { name: "Inspection Report", type: "PDF" }],
        history: [{ date: "2024-01-25", action: "Delivered" }, { date: "2024-01-20", action: "Picked up" }, { date: "2024-01-18", action: "Load created" }],
    },
    {
        id: "LD-002",
        vehicleYear: "2023", vehicleMake: "Honda", vehicleModel: "Accord",
        vin: "2HGFC2F52MH567234", stockNumber: "HA2023-42",
        shipperInfo: "National Auto Auction", pickupDate: "2024-01-22", dropOffDate: "2024-01-28",
        status: "in-transit", courierInfo: "Swift Delivery Co",
        docs: [{ name: "BOL", type: "PDF" }],
        history: [{ date: "2024-01-22", action: "Picked up" }, { date: "2024-01-21", action: "Load created" }],
    },
    {
        id: "LD-003",
        vehicleYear: "2024", vehicleMake: "Ford", vehicleModel: "F-150",
        vin: "1FTEW1EP9MFC12345", stockNumber: "FF150-88",
        shipperInfo: "Metro Auto Sales", pickupDate: "2024-01-25", dropOffDate: "2024-01-30",
        status: "pending", courierInfo: "Prime Carriers Inc",
        docs: [], history: [{ date: "2024-01-24", action: "Load created" }],
    },
    {
        id: "LD-004",
        vehicleYear: "2023", vehicleMake: "BMW", vehicleModel: "X5",
        vin: "5UXCR6C05N9K78901", stockNumber: "BX5-2301",
        shipperInfo: "Luxury Motors Inc", pickupDate: "2024-01-18", dropOffDate: "2024-01-23",
        status: "delivered", courierInfo: "Express Logistics LLC",
        docs: [{ name: "BOL", type: "PDF" }, { name: "Inspection Report", type: "PDF" }, { name: "Insurance Cert", type: "PDF" }],
        history: [{ date: "2024-01-23", action: "Delivered" }, { date: "2024-01-18", action: "Picked up" }, { date: "2024-01-16", action: "Load created" }],
    },
    {
        id: "LD-005",
        vehicleYear: "2024", vehicleMake: "Tesla", vehicleModel: "Model 3",
        vin: "5YJ3E1EA1NF345678", stockNumber: "TM3-2405",
        shipperInfo: "EV Direct Sales", pickupDate: "2024-01-26", dropOffDate: "2024-02-01",
        status: "cancelled", courierInfo: "FastTrack Transport",
        docs: [{ name: "BOL", type: "PDF" }],
        history: [{ date: "2024-01-25", action: "Load cancelled" }, { date: "2024-01-24", action: "Load created" }],
    },
    {
        id: "LD-006",
        vehicleYear: "2023", vehicleMake: "Chevrolet", vehicleModel: "Silverado",
        vin: "3GCPWDED1NG567890", stockNumber: "CS-2306",
        shipperInfo: "AutoMax Dealers", pickupDate: "2024-01-27", dropOffDate: "2024-02-02",
        status: "pending", courierInfo: "Reliable Freight",
        docs: [], history: [{ date: "2024-01-26", action: "Load created" }],
    },
];

// --- Async service functions (mock → API ready) ---

export async function fetchLoads(
    _filters: LoadFilters = {}
): Promise<Load[]> {
    // TODO: replace with apiGet<Load[]>(`/loads?${params}`)
    return Promise.resolve(mockLoads);
}

export async function fetchLoadStats(): Promise<{
    total: number;
    inTransit: number;
    delivered: number;
    pending: number;
    cancelled: number;
    alerts: number;
}> {
    // TODO: replace with apiGet("/loads/stats")
    const total = mockLoads.length;
    const inTransit = mockLoads.filter((l) => l.status === "in-transit").length;
    const delivered = mockLoads.filter((l) => l.status === "delivered").length;
    const pending = mockLoads.filter((l) => l.status === "pending").length;
    const cancelled = mockLoads.filter((l) => l.status === "cancelled").length;
    return Promise.resolve({
        total,
        inTransit,
        delivered,
        pending,
        cancelled,
        alerts: pending,
    });
}
