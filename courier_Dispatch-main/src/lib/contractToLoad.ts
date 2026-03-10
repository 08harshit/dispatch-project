import type { Load } from "@/components/loads/LoadsTable";
import type { Contract } from "@/services/contractsService";
import type { CourierContract } from "@/services/courierDashboardService";

function parseLocation(loc: string): { city: string; state: string } {
  if (!loc || typeof loc !== "string") return { city: "", state: "" };
  const parts = loc.split(",").map((p) => p.trim());
  if (parts.length >= 2) return { city: parts[0], state: parts[1].slice(0, 2) };
  return { city: loc, state: "" };
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${mm}-${dd}-${yyyy}`;
}

function mapStatus(s: string): Load["status"] {
  const lower = (s || "").toLowerCase();
  if (lower.includes("completed") || lower.includes("done")) return "done";
  if (lower.includes("late")) return "late";
  return "pickup";
}

export function contractToLoad(c: Contract | CourierContract): Load {
  const lead = "leads" in c ? c.leads : (c as Contract).lead;
  const pickup = parseLocation(lead?.pickup_address || c.start_location || "");
  const delivery = parseLocation(lead?.delivery_address || c.end_location || "");
  const created = c.created_at ? new Date(c.created_at) : new Date();
  return {
    id: c.id,
    loadId: `LD-${c.id.slice(0, 8).toUpperCase().replace(/-/g, "")}`,
    vehicleInfo: {
      make: lead?.vehicle_make || "Vehicle",
      model: lead?.vehicle_model || "",
      year: lead?.vehicle_year || new Date().getFullYear(),
      vin: lead?.vehicle_vin || "N/A",
      stc: "RUN",
    },
    price: Number(c.amount) || 0,
    paymentMethod: "COD",
    pickup: {
      ampId: "AMP-" + (pickup.city.slice(0, 3) || "XXX").toUpperCase(),
      city: pickup.city || "Origin",
      state: pickup.state || "",
      zipcode: "00000",
      type: "Dealer",
    },
    delivery: {
      city: delivery.city || "Destination",
      state: delivery.state || "",
      zipcode: "00000",
    },
    pickupDate: formatDate(c.created_at),
    deliveryDate: formatDate(c.created_at),
    status: mapStatus(c.status),
    shipper: {
      name: (c as Contract).shipperName || "Shipper",
      company: "",
      phone: "",
    },
    documents: [],
  };
}
