import type { Vehicle, LocationType, PaymentMethod } from "@/components/dashboard/VehicleTable";
import type { LoadListItem } from "@/services/loadService";

function parseAddress(address: string): { city: string; state: string; zip: string } {
  const parts = address.split(",").map((p) => p.trim());
  const lastPart = parts[parts.length - 1] || "";
  const stateZipMatch = lastPart.match(/([A-Z]{2})\s*(\d{5})?/);
  return {
    city: parts[0] || address,
    state: stateZipMatch?.[1] || "",
    zip: stateZipMatch?.[2] || "",
  };
}

function mapLocationType(type: string | null | undefined): LocationType {
  if (type === "auction" || type === "dealer" || type === "private") return type;
  return "dealer";
}

function mapPaymentMethod(type: string | null | undefined): PaymentMethod {
  if (type === "cod" || type === "ach" || type === "wire" || type === "check") return type;
  return "cod";
}

function mapLoadStatusToVehicleStatus(load: LoadListItem): Vehicle["status"] {
  switch (load.status) {
    case "cancelled":
      return "canceled";
    case "delivered":
      return "delivered";
    case "in-transit":
      return "picked_up";
    case "open":
    case "pending":
      return load.courierInfo ? "assigned" : "not_assigned";
    default:
      return "not_assigned";
  }
}

export function loadToVehicle(load: LoadListItem): Vehicle {
  const pickupParsed = parseAddress(load.pickup_address);
  const deliveryParsed = parseAddress(load.delivery_address);
  const year = parseInt(load.vehicleYear || "0", 10) || new Date().getFullYear();

  return {
    id: load.id,
    listingId: load.stockNumber || load.id,
    make: load.vehicleMake || "Unknown",
    model: load.vehicleModel || "Unknown",
    year,
    vin: load.vin || "",
    stockNumber: load.stockNumber || load.id,
    pickupLocation: load.pickup_address,
    pickupCity: pickupParsed.city,
    pickupState: pickupParsed.state,
    pickupZip: pickupParsed.zip,
    pickupType: mapLocationType(load.vehicle_type as string | null),
    deliveryLocation: load.delivery_address,
    deliveryCity: deliveryParsed.city,
    deliveryState: deliveryParsed.state,
    deliveryZip: deliveryParsed.zip,
    deliveryType: mapLocationType(null),
    pickupDate: load.pickupDate,
    deliveryDate: load.dropOffDate,
    status: mapLoadStatusToVehicleStatus(load),
    isActive: true,
    cost: load.initial_price ?? 0,
    paymentMethod: mapPaymentMethod(load.payment_type as string | null),
  };
}
