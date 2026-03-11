import type { Load } from "@/components/loads/LoadsTable";
import type { LoadNotification } from "@/hooks/useLoadNotifications";

const STORAGE_KEY = "demo_assigned_loads_v2";

const safeParseJson = (value: string | null): unknown => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

// Default demo assigned loads - always available
const createDefaultDemoAssignedLoads = (): LoadNotification[] => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  return [
    {
      id: "assigned-demo-1",
      matchingRequestId: "match-assigned-1",
      courierId: "demo-courier",
      leadId: "lead-assigned-1",
      shipper: { name: "Michael Brown", company: "Premium Auto LLC", rating: 4.9, totalLoads: 245, phone: "(555) 111-2222" },
      pickup: { address: "500 Harbor Blvd", city: "San Diego", state: "CA", coordinates: [32.7157, -117.1611] as [number, number], date: today.toISOString().split("T")[0], time: "9:00 AM" },
      delivery: { address: "100 Main St", city: "Tucson", state: "AZ", coordinates: [32.2226, -110.9747] as [number, number], date: tomorrow.toISOString().split("T")[0], time: "4:00 PM" },
      vehicle: { year: 2023, make: "BMW", model: "X5", type: "SUV", condition: { runs: true, starts: true, drivable: true, rolls: true } },
      price: 680, distance: 405, createdAt: new Date().toISOString(), expiresIn: 0, status: "accepted",
    },
    {
      id: "assigned-demo-2",
      matchingRequestId: "match-assigned-2",
      courierId: "demo-courier",
      leadId: "lead-assigned-2",
      shipper: { name: "Emily Davis", company: "Fast Track Motors", rating: 4.7, totalLoads: 178, phone: "(555) 333-4444" },
      pickup: { address: "200 Oak Ave", city: "Sacramento", state: "CA", coordinates: [38.5816, -121.4944] as [number, number], date: today.toISOString().split("T")[0], time: "11:00 AM" },
      delivery: { address: "450 Desert Rd", city: "Reno", state: "NV", coordinates: [39.5296, -119.8138] as [number, number], date: today.toISOString().split("T")[0], time: "3:00 PM" },
      vehicle: { year: 2024, make: "Tesla", model: "Model Y", type: "SUV", condition: { runs: true, starts: true, drivable: true, rolls: true } },
      price: 420, distance: 135, createdAt: new Date().toISOString(), expiresIn: 0, status: "accepted",
    },
    {
      id: "assigned-demo-3",
      matchingRequestId: "match-assigned-3",
      courierId: "demo-courier",
      leadId: "lead-assigned-3",
      shipper: { name: "Robert Wilson", company: "Elite Auto Transport", rating: 5.0, totalLoads: 312, phone: "(555) 555-6666" },
      pickup: { address: "789 Beach Blvd", city: "Huntington Beach", state: "CA", coordinates: [33.6595, -117.9988] as [number, number], date: tomorrow.toISOString().split("T")[0], time: "8:00 AM" },
      delivery: { address: "321 Strip Ave", city: "Las Vegas", state: "NV", coordinates: [36.1699, -115.1398] as [number, number], date: tomorrow.toISOString().split("T")[0], time: "2:00 PM" },
      vehicle: { year: 2023, make: "Porsche", model: "Cayenne", type: "SUV", condition: { runs: false, starts: false, drivable: false, rolls: true } },
      price: 750, distance: 270, createdAt: new Date().toISOString(), expiresIn: 0, status: "accepted",
    },
  ];
};

export const getDemoAssignedNotifications = (): LoadNotification[] => {
  const defaults = createDefaultDemoAssignedLoads();
  
  if (!canUseStorage()) return defaults;
  
  const raw = safeParseJson(window.localStorage.getItem(STORAGE_KEY));
  if (!Array.isArray(raw) || raw.length === 0) {
    // Initialize with defaults
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }
  
  return raw.filter((x): x is LoadNotification => !!x && typeof x === "object" && typeof (x as any).id === "string") as LoadNotification[];
};

export const addDemoAssignedNotification = (notification: LoadNotification) => {
  if (!canUseStorage()) return;
  const current = getDemoAssignedNotifications();
  const next = [
    { ...notification, status: "accepted" },
    ...current.filter((n) => n.id !== notification.id),
  ];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
};

export const removeDemoAssignedNotification = (id: string) => {
  if (!canUseStorage()) return;
  const current = getDemoAssignedNotifications();
  const next = current.filter((n) => n.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
};

const yyyyMmDdToMmDdYyyy = (dateStr: string) => {
  const m = /^\d{4}-\d{2}-\d{2}$/.exec(dateStr);
  if (m) {
    const [yyyy, mm, dd] = dateStr.split("-");
    return `${mm}-${dd}-${yyyy}`;
  }
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${mm}-${dd}-${yyyy}`;
};

const mapAssignedStatus = (status: string): Load["status"] => {
  const s = (status || "").toLowerCase();
  if (s.includes("done") || s.includes("deliver") || s.includes("complete")) return "done";
  if (s.includes("late")) return "late";
  return "pickup";
};

export const demoNotificationToAssignedLoad = (n: LoadNotification): Load => {
  return {
    id: n.id,
    loadId: `LD-${n.id.slice(0, 4).toUpperCase()}`,
    vehicleInfo: {
      make: n.vehicle.make,
      model: n.vehicle.model,
      year: n.vehicle.year,
      vin: "1HGBH41JXMN109186",
      stc: "RUN",
      condition: n.vehicle.condition,
    },
    price: n.price,
    paymentMethod: "COD",
    pickup: {
      ampId: "AMP-" + n.pickup.city.slice(0, 3).toUpperCase(),
      city: n.pickup.city,
      state: n.pickup.state,
      zipcode: "90210",
      type: "Dealer",
    },
    delivery: {
      city: n.delivery.city,
      state: n.delivery.state,
      zipcode: "85001",
    },
    pickupCoords: n.pickup.coordinates,
    deliveryCoords: n.delivery.coordinates,
    pickupDate: yyyyMmDdToMmDdYyyy(n.pickup.date),
    deliveryDate: yyyyMmDdToMmDdYyyy(n.delivery.date),
    status: mapAssignedStatus(n.status || "accepted"),
    shipper: {
      name: n.shipper.name,
      company: n.shipper.company,
      phone: n.shipper.phone,
    },
    documents: [],
  };
};
